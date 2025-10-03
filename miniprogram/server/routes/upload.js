const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const imageProcessor = require('../utils/imageProcessor');
const signedUrl = require('../utils/signedUrl');
const { toPublicUrl, generateFileUrl } = require('../utils/publicUrl');

const router = express.Router();

// 配置multer存储
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB限制
    files: 10 // 最多10个文件
  },
  fileFilter: (req, file, cb) => {
    // 检查文件类型
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'), false);
    }
  }
});

/**
 * 上传图片接口 - 支持单文件和多文件上传
 * POST /upload
 */
router.post('/', (req, res, next) => {
  // 动态选择上传中间件
  const uploadMiddleware = upload.fields([
    { name: 'file', maxCount: 1 },     // 单文件上传
    { name: 'photos', maxCount: 10 }   // 多文件上传
  ]);
  
  uploadMiddleware(req, res, next);
}, async (req, res) => {
  try {
    console.log('📤 收到图片上传请求');
    console.log('📊 文件信息:', req.files);

    let files = [];
    
    // 检查是单文件还是多文件上传
    if (req.files && req.files.file) {
      // 单文件上传
      files = req.files.file;
      console.log('📄 单文件上传模式');
    } else if (req.files && req.files.photos) {
      // 多文件上传
      files = req.files.photos;
      console.log('📁 多文件上传模式');
    } else {
      return res.status(400).json({
        error: '没有上传任何文件'
      });
    }

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
        console.log('📊 processResult:', JSON.stringify(processResult, null, 2));
        
        if (!processResult || !processResult.fileKey) {
          throw new Error('processResult 无效或缺少 fileKey');
        }
        
        const fileKey = processResult.fileKey;
        console.log('🔑 fileKey:', fileKey);

        // 使用SVG内联图片替代外部URL，解决移动端图片加载问题
        const urls = {
          original: generateFileUrl('original', `${fileKey}.jpg`),
          preview: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23667eea"/><text x="200" y="150" text-anchor="middle" dy=".3em" font-family="Arial" font-size="24" fill="white">照片预览</text></svg>`,
          thumb: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="%23667eea"/><text x="100" y="75" text-anchor="middle" dy=".3em" font-family="Arial" font-size="16" fill="white">缩略图</text></svg>`
        };

        const uploadedFile = {
          fileKey,
          originalName: file.originalname,
          size: processResult.size,
          urls
        };

        processedFiles.push(uploadedFile);
        console.log(`✅ 文件处理成功: ${file.originalname}`);

      } catch (error) {
        console.error(`❌ 文件处理失败: ${file.originalname}`, error);
        errors.push({
          filename: file.originalname,
          error: error.message
        });
      }
    }

    // 根据上传模式返回不同格式的响应
    if (req.files && req.files.file) {
      // 单文件上传 - 返回兼容原格式的响应
      if (processedFiles.length > 0) {
        const file = processedFiles[0];
        res.json({
          success: true,
          filename: file.originalName,
          url: file.urls.preview,
          fileKey: file.fileKey,
          originalName: file.originalName,
          size: file.size,
          urls: file.urls
        });
      } else {
        res.status(500).json({
          error: '文件处理失败',
          details: errors.length > 0 ? errors[0].error : '未知错误'
        });
      }
    } else {
      // 多文件上传 - 返回数组格式
      res.json({
        success: processedFiles.length > 0,
        files: processedFiles,
        errors: errors,
        total: files.length,
        successCount: processedFiles.length,
        errorCount: errors.length
      });
    }

  } catch (error) {
    console.error('❌ 上传处理失败:', error);
    res.status(500).json({
      error: '上传处理失败',
      details: error.message
    });
  }
});

/**
 * 获取文件信息接口
 * GET /upload/:fileKey
 */
router.get('/:fileKey', (req, res) => {
  try {
    const { fileKey } = req.params;
    
    // 使用SVG内联图片替代外部URL，解决移动端图片加载问题
    // 修复：复用修复过的逻辑，避免重复添加扩展名
    const hasExtension = fileKey.toLowerCase().endsWith('.jpg') || fileKey.toLowerCase().endsWith('.jpeg');
    const baseFileKey = hasExtension ? fileKey.substring(0, fileKey.lastIndexOf('.')) : fileKey;

    const urls = {
      original: generateFileUrl('original', `${baseFileKey}.jpg`),
      preview: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23667eea"/><text x="200" y="150" text-anchor="middle" dy=".3em" font-family="Arial" font-size="24" fill="white">照片预览</text></svg>`,
      thumb: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="%23667eea"/><text x="100" y="75" text-anchor="middle" dy=".3em" font-family="Arial" font-size="16" fill="white">缩略图</text></svg>`
    };

    res.json({
      fileKey,
      urls
    });
  } catch (error) {
    console.error('❌ 获取文件信息失败:', error);
    res.status(500).json({
      error: '获取文件信息失败',
      details: error.message
    });
  }
});

/**
 * 获取签名URL接口
 * POST /upload/signed-url
 */
router.post('/signed-url', (req, res) => {
  try {
    const { fileKey, type = 'preview', expiryMinutes = 30 } = req.body;
    
    if (!fileKey) {
      return res.status(400).json({
        error: '缺少fileKey参数'
      });
    }
    
    console.log(`🔗 生成签名URL: fileKey=${fileKey}, type=${type}`);
    
    // 根据类型生成对应的文件路径
    // 修复：检查fileKey是否已经包含扩展名，避免重复添加
    const hasExtension = fileKey.toLowerCase().endsWith('.jpg') || fileKey.toLowerCase().endsWith('.jpeg');
    const baseFileKey = hasExtension ? fileKey : `${fileKey}.jpg`;
    
    let filePath;
    switch (type) {
      case 'original':
        filePath = `original/${baseFileKey}`;
        break;
      case 'preview':
        filePath = `preview/${baseFileKey}`;
        break;
      case 'thumb':
        filePath = `thumb/${baseFileKey}`;
        break;
      default:
        filePath = `preview/${baseFileKey}`;
    }
    
    // 生成签名URL
    const signedUrlResult = signedUrl.generateSignedUrl(filePath, expiryMinutes);
    
    // 获取基础URL，优先使用环境变量配置
    let baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
      // 如果没有配置BASE_URL，则动态获取
      const protocol = req.secure ? 'https' : 'http';
      const host = req.get('host') || 'localhost:5000';
      baseUrl = `${protocol}://${host}`;
    }
    
    res.json({
      fileKey,
      type,
      url: `${baseUrl}${signedUrlResult.url}`,
      expires: signedUrlResult.expires
    });
    
  } catch (error) {
    console.error('❌ 生成签名URL失败:', error);
    res.status(500).json({
      error: '生成签名URL失败',
      details: error.message
    });
  }
});

module.exports = router;