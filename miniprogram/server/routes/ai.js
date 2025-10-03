const express = require('express');
const router = express.Router();
const { uploadMultiple } = require('../utils/upload');
const aiService = require('../services/aiService');

// AI照片分析接口 - 支持JSON格式的base64数据
router.post('/pick', async (req, res) => {
  try {
    console.log('🔍 AI接口收到请求');
    console.log('📋 请求头:', req.headers);
    console.log('📋 请求体:', JSON.stringify(req.body, null, 2));
    
    // 检查是否是JSON格式的请求
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      return handleJsonRequest(req, res);
    }
    
    // 处理multipart/form-data格式的请求
    uploadMultiple(req, res, async (err) => {
      if (err) {
        console.error('文件上传错误:', err);
        return res.status(400).json({
          error: '文件上传失败',
          message: err.message
        });
      }
      
      await handleMultipartRequest(req, res);
    });
  } catch (error) {
    console.error('AI照片分析失败:', error);
    res.status(500).json({
      error: 'AI分析失败',
      message: error.message
    });
  }
});

// 处理JSON格式的请求
async function handleJsonRequest(req, res) {
  try {
    const { sessionId, photos, fileKeys } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: '参数错误',
        message: 'sessionId 是必需的'
      });
    }

    let files = [];

    // 支持两种模式：base64数据或文件URL列表
    if (fileKeys && Array.isArray(fileKeys) && fileKeys.length > 0) {
      // 模式1：通过文件URL列表
      if (fileKeys.length < 2) {
        return res.status(400).json({
          error: '参数错误',
          message: '至少需要2张照片才能进行AI分析'
        });
      }

      if (fileKeys.length > 10) {
        return res.status(400).json({
          error: '参数错误',
          message: '最多支持10张照片'
        });
      }

      // 从文件系统读取图片
      const fs = require('fs');
      const path = require('path');
      
      files = fileKeys.map((fileKey, index) => {
        // 尝试不同的文件扩展名
        const possibleExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
        let filePath = null;
        let actualExtension = '.jpg';
        
        for (const ext of possibleExtensions) {
          const testPath = path.join(__dirname, '../uploads/original', `${fileKey}${ext}`);
          if (fs.existsSync(testPath)) {
            filePath = testPath;
            actualExtension = ext;
            break;
          }
        }
        
        if (!filePath) {
          console.error(`❌ 文件不存在，尝试的路径:`, possibleExtensions.map(ext => 
            path.join(__dirname, '../uploads/original', `${fileKey}${ext}`)
          ));
          throw new Error(`文件不存在: ${fileKey}`);
        }
        
        console.log(`✅ 找到文件: ${filePath}`);
        const buffer = fs.readFileSync(filePath);
        
        return {
          buffer: buffer,
          originalname: `photo_${fileKey}${actualExtension}`,
          mimetype: actualExtension === '.png' ? 'image/png' : 'image/jpeg',
          size: buffer.length,
          metadata: {
            id: fileKey,
            fileKey: fileKey
          }
        };
      });

    } else if (photos && Array.isArray(photos) && photos.length > 0) {
      // 模式2：base64数据（向后兼容）
      if (photos.length < 2) {
        return res.status(400).json({
          error: '参数错误',
          message: '至少需要2张照片才能进行AI分析'
        });
      }

      if (photos.length > 10) {
        return res.status(400).json({
          error: '参数错误',
          message: '最多支持10张照片'
        });
      }

      // 将base64数据转换为Buffer格式，模拟文件上传
      files = photos.map((photo, index) => {
        if (!photo.base64 || !photo.id) {
          throw new Error(`照片 ${index + 1} 缺少必要的数据`);
        }
        
        // 移除base64前缀
        const base64Data = photo.base64.replace(/^data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        return {
          buffer: buffer,
          originalname: `photo_${photo.id}.jpg`,
          mimetype: 'image/jpeg',
          size: buffer.length,
          metadata: {
            id: photo.id,
            width: photo.width,
            height: photo.height,
            orientation: photo.orientation
          }
        };
      });
    } else {
      return res.status(400).json({
        error: '参数错误',
        message: '需要提供 photos (base64数据) 或 fileKeys (文件URL列表)'
      });
    }

    const result = await aiService.analyzePhotos({
      sessionId,
      files
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('JSON请求处理失败:', error);
    res.status(500).json({
      error: 'AI分析失败',
      message: error.message
    });
  }
}

// 处理multipart/form-data格式的请求
async function handleMultipartRequest(req, res) {
  try {
    const { sessionId } = req.body;
    const files = req.files;

    if (!sessionId) {
      return res.status(400).json({
        error: '参数错误',
        message: 'sessionId 是必需的'
      });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({
        error: '参数错误',
        message: '至少需要上传一张照片'
      });
    }

    if (files.length < 2) {
      return res.status(400).json({
        error: '参数错误',
        message: '至少需要2张照片才能进行AI分析'
      });
    }

    if (files.length > 10) {
      return res.status(400).json({
        error: '参数错误',
        message: '最多支持10张照片'
      });
    }

    const result = await aiService.analyzePhotos({
      sessionId,
      files
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('AI照片分析失败:', error);
    
    // 根据错误类型返回不同的状态码
    if (error.message.includes('API密钥')) {
      return res.status(500).json({
        error: 'AI服务配置错误',
        message: '请检查AI服务配置'
      });
    }
    
    if (error.message.includes('网络')) {
      return res.status(503).json({
        error: 'AI服务暂时不可用',
        message: '请稍后重试'
      });
    }

    res.status(500).json({
      error: 'AI分析失败',
      message: error.message
    });
  }
}

// 获取AI分析历史记录
router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        error: '参数错误',
        message: 'sessionId 是必需的'
      });
    }

    const result = await aiService.getAnalysisHistory(sessionId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取AI分析历史失败:', error);
    res.status(500).json({
      error: '获取历史记录失败',
      message: error.message
    });
  }
});

module.exports = router;