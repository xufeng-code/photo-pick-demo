// server/index.js
// 首先加载环境变量
require('dotenv').config();

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 导入路由
const uploadRoutes = require('./routes/upload');
const aiRoutes = require('./routes/ai');
const shareRoutes = require('./routes/share');

const app = express();
const PORT = process.env.PORT || 5000;

// 添加JSON解析中间件
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 添加CORS支持
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 添加请求日志
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url} - ${new Date().toISOString()}`);
  next();
});

// 确保 uploads 目录存在
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// 配置 multer：保存到 /server/uploads
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname || ".jpg"));
  },
});
const upload = multer({ storage });

// 允许静态访问上传后的文件
app.use("/uploads", express.static(uploadDir));

// 配置签名URL访问的静态文件服务
const signedUrl = require('./utils/signedUrl');
app.use('/files', signedUrl.verifyMiddleware(), express.static(uploadDir));

// 配置静态文件服务 - 为 H5 Demo 提供静态资源
app.use(express.static(path.join(__dirname, '../public')));

// 配置API路由
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/share', shareRoutes);

// 添加 /api/pick 路由，转发到 /api/ai/pick
app.use('/api/pick', (req, res, next) => {
  // 修改请求路径
  req.url = '/pick';
  // 转发到 AI 路由
  aiRoutes(req, res, next);
});

// 健康检查
app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/api/health", (_req, res) => res.json({ 
  ok: true, 
  timestamp: new Date().toISOString(),
  service: "xuanzhaopian-ai-server",
  version: "1.0.0"
}));

// 添加多文件上传路由（小程序使用）
const { uploadMultiple } = require('./utils/upload');
const imageProcessor = require('./utils/imageProcessor');
const { generateFileUrl } = require('./utils/publicUrl');

app.post('/upload', uploadMultiple, async (req, res) => {
  try {
    console.log('📤 收到多文件上传请求');
    console.log('📊 文件数量:', req.files ? req.files.length : 0);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: '没有上传任何文件'
      });
    }

    const files = req.files;
    console.log(`📸 处理 ${files.length} 个文件`);

    // 处理所有文件
    const processedFiles = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`🔄 处理文件 ${i + 1}/${files.length}: ${file.originalname} (${file.size} bytes)`);

      try {
        // 处理图片（生成不同尺寸）
        const processResult = await imageProcessor.processImage(file.buffer, file.originalname);
        
        if (!processResult || !processResult.fileKey) {
          throw new Error('processResult 无效或缺少 fileKey');
        }
        
        const fileKey = processResult.fileKey;
        console.log(`🔑 文件 ${i + 1} fileKey:`, fileKey);

        // 生成绝对HTTPS URL
        const urls = {
          original: generateFileUrl('original', `${fileKey}.jpg`),
          preview: generateFileUrl('preview', `${fileKey}.jpg`),
          thumb: generateFileUrl('thumb', `${fileKey}.jpg`)
        };

        const uploadedFile = {
          fileKey,
          originalName: file.originalname,
          size: processResult.size,
          urls
        };

        processedFiles.push(uploadedFile);
        console.log(`✅ 文件 ${i + 1} 处理成功: ${file.originalname}`);

      } catch (error) {
        console.error(`❌ 文件 ${i + 1} 处理失败: ${file.originalname}`, error);
        errors.push({
          file: file.originalname,
          error: error.message
        });
      }
    }

    if (processedFiles.length === 0) {
      return res.status(500).json({
        error: '所有文件处理失败',
        details: errors
      });
    }

    console.log(`✅ 多文件上传完成，成功: ${processedFiles.length}, 失败: ${errors.length}`);

    res.json({
      success: true,
      files: processedFiles,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ 多文件上传处理失败:', error);
    res.status(500).json({
      error: '多文件上传处理失败',
      details: error.message
    });
  }
});

// Custom error handler
app.use((err, req, res, next) => {
  console.error("❌ An unexpected error occurred:", err);
  res.status(500).json({
    success: false,
    message: "An internal server error occurred.",
    error: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});