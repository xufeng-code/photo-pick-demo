const express = require('express');
const path = require('path');
const router = express.Router();
const { uploadMultiple, uploadSingle } = require('../utils/upload');
const shareService = require('../services/shareService');

// 分享页面路由
router.get('/:shareId', async (req, res) => {
    try {
        const { shareId } = req.params;
        
        // 验证分享是否存在
        const shareDetails = await shareService.getShareDetails(shareId);
        if (!shareDetails) {
            return res.status(404).send('分享不存在或已过期');
        }
        
        // 返回分享页面
        res.sendFile(path.join(__dirname, '../views/share.html'));
    } catch (error) {
        console.error('获取分享页面失败:', error);
        res.status(500).send('服务器错误');
    }
});

// 创建分享
router.post('/create', uploadMultiple, async (req, res) => {
  try {
    const { sessionId, bestPhotoId } = req.body;
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

    const result = await shareService.createShare({
      sessionId,
      bestPhotoId,
      files
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('创建分享失败:', error);
    res.status(500).json({
      error: '创建分享失败',
      message: error.message
    });
  }
});

// 点赞
router.post('/like', async (req, res) => {
  try {
    const { shareId, photoId, userId = 'anonymous' } = req.body;

    if (!shareId || !photoId) {
      return res.status(400).json({
        error: '参数错误',
        message: 'shareId 和 photoId 是必需的'
      });
    }

    const result = await shareService.toggleLike({
      shareId,
      photoId,
      userId
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json({
      error: '点赞失败',
      message: error.message
    });
  }
});

// 添加评论
router.post('/comment', async (req, res) => {
  try {
    const { shareId, photoId, author, content } = req.body;

    if (!shareId || !photoId || !author || !content) {
      return res.status(400).json({
        error: '参数错误',
        message: 'shareId、photoId、author 和 content 都是必需的'
      });
    }

    if (content.trim().length === 0) {
      return res.status(400).json({
        error: '参数错误',
        message: '评论内容不能为空'
      });
    }

    if (content.length > 500) {
      return res.status(400).json({
        error: '参数错误',
        message: '评论内容不能超过500字符'
      });
    }

    const result = await shareService.addComment({
      shareId,
      photoId,
      author: author.trim(),
      content: content.trim()
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('添加评论失败:', error);
    res.status(500).json({
      error: '添加评论失败',
      message: error.message
    });
  }
});

// 同步分享数据
router.get('/sync/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;

    if (!shareId) {
      return res.status(400).json({
        error: '参数错误',
        message: 'shareId 是必需的'
      });
    }

    const result = await shareService.getShareData(shareId);

    if (!result) {
      return res.status(404).json({
        error: '分享不存在',
        message: '找不到指定的分享内容'
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('同步分享数据失败:', error);
    res.status(500).json({
      error: '同步分享数据失败',
      message: error.message
    });
  }
});

// 生成分享链接
router.post('/generate', uploadSingle, async (req, res) => {
  try {
    const { sessionId, title, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: '请上传照片' });
    }
    
    if (!sessionId) {
      return res.status(400).json({ error: '缺少sessionId参数' });
    }

    const result = await shareService.generateShareLink({
      sessionId,
      file: req.file,
      title: title || '我的精选照片',
      description: description || '快来看看这张照片！'
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('生成分享链接失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取分享详情（API接口）
router.get('/api/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    const shareDetails = await shareService.getShareDetails(shareId);
    
    res.json({
      success: true,
      data: shareDetails
    });
  } catch (error) {
    console.error('获取分享详情失败:', error);
    res.status(404).json({
      error: '获取失败',
      message: error.message
    });
  }
});

// 点赞/取消点赞
router.post('/:shareId/like', async (req, res) => {
  try {
    const { shareId } = req.params;
    const { userIdentifier } = req.body;
    
    if (!userIdentifier) {
      return res.status(400).json({
        error: '参数错误',
        message: '用户标识符是必需的'
      });
    }
    
    const result = await shareService.toggleLike(shareId, userIdentifier);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('点赞操作失败:', error);
    res.status(500).json({
      error: '操作失败',
      message: error.message
    });
  }
});

// 添加评论
router.post('/:shareId/comment', async (req, res) => {
  try {
    const { shareId } = req.params;
    const { content, authorName } = req.body;
    
    if (!content || !authorName) {
      return res.status(400).json({
        error: '参数错误',
        message: '评论内容和作者姓名是必需的'
      });
    }
    
    const newComment = await shareService.addComment(shareId, { content, authorName });
    
    res.json({
      success: true,
      data: newComment
    });
  } catch (error) {
    console.error('添加评论失败:', error);
    res.status(500).json({
      error: '添加评论失败',
      message: error.message
    });
  }
});

module.exports = router;