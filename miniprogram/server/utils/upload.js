const multer = require('multer');
const path = require('path');

// 配置multer内存存储
const storage = multer.memoryStorage();

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 检查文件类型
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型，仅支持 JPEG、PNG、WebP'), false);
  }
};

// 创建multer实例
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 默认50MB
    files: 10 // 最多10个文件
  },
  fileFilter: fileFilter
});

// 单文件上传
const uploadSingle = upload.single('photo');

// 多文件上传
const uploadMultiple = upload.array('photos', 10);

// 错误处理中间件
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: '文件过大',
        message: '文件大小不能超过50MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: '文件数量过多',
        message: '最多只能上传10个文件'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        error: '意外的文件字段',
        message: '请检查文件字段名称'
      });
    }
  }
  
  if (err.message.includes('不支持的文件类型')) {
    return res.status(400).json({ 
      error: '文件类型错误',
      message: err.message
    });
  }
  
  next(err);
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  handleUploadError
};