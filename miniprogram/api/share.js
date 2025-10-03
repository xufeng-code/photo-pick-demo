// 使用 Node.js 内置的 crypto.randomUUID() 替代 uuid 包

module.exports = async function handler(req, res) {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      // 创建分享链接
      console.log('📤 创建分享链接');
      
      const { photos, title, description } = req.body;

      if (!photos || !Array.isArray(photos) || photos.length === 0) {
        return res.status(400).json({
          error: '无效的照片数据',
          message: '请提供要分享的照片'
        });
      }

      const shareId = crypto.randomUUID();
      const shareData = {
        id: shareId,
        title: title || '我的照片分享',
        description: description || '通过选照片AI整理的精选照片',
        photos: photos,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天后过期
        viewCount: 0
      };

      // 在实际应用中，这里应该保存到数据库
      // 现在只是模拟返回分享链接

      return res.status(200).json({
        success: true,
        message: '分享链接创建成功',
        shareId: shareId,
        shareUrl: `https://your-domain.vercel.app/share/${shareId}`,
        qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://your-domain.vercel.app/share/${shareId}`,
        expiresAt: shareData.expiresAt,
        photoCount: photos.length
      });

    } else if (req.method === 'GET') {
      // 获取分享内容
      const { shareId } = req.query;

      if (!shareId) {
        return res.status(400).json({
          error: '缺少分享ID',
          message: '请提供有效的分享链接'
        });
      }

      // 模拟从数据库获取分享数据
      const mockShareData = {
        id: shareId,
        title: '我的照片分享',
        description: '通过选照片AI整理的精选照片',
        photos: [
          {
            id: '1',
            url: '/api/placeholder/400/300',
            thumbnail: '/api/placeholder/200/150',
            filename: 'photo1.jpg'
          },
          {
            id: '2',
            url: '/api/placeholder/400/300',
            thumbnail: '/api/placeholder/200/150',
            filename: 'photo2.jpg'
          }
        ],
        createdAt: new Date().toISOString(),
        viewCount: Math.floor(Math.random() * 100)
      };

      return res.status(200).json({
        success: true,
        data: mockShareData
      });

    } else {
      return res.status(405).json({ error: '不支持的请求方法' });
    }

  } catch (error) {
    console.error('分享处理错误:', error);
    return res.status(500).json({
      error: '服务器内部错误',
      message: process.env.NODE_ENV === 'development' ? error.message : '请稍后重试'
    });
  }
};