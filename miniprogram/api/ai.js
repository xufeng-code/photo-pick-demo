module.exports = async function handler(req, res) {
  // 设置CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持POST请求' });
  }

  try {
    console.log('🤖 AI分析接口收到请求');
    
    const { images, photos, criteria } = req.body;
    const imageData = images || photos || [];

    if (!Array.isArray(imageData) || imageData.length === 0) {
      return res.status(400).json({
        error: '无效的图片数据',
        message: '请提供有效的图片数组'
      });
    }

    // 模拟AI分析处理
    const analysisResults = imageData.map((image, index) => {
      const score = Math.random() * 100; // 随机评分
      const isRecommended = score > 70;
      
      return {
        id: image.id || `image_${index}`,
        filename: image.filename || image.name || `image_${index + 1}.jpg`,
        score: Math.round(score * 100) / 100,
        isRecommended,
        analysis: {
          composition: Math.round(Math.random() * 100),
          lighting: Math.round(Math.random() * 100),
          clarity: Math.round(Math.random() * 100),
          aesthetics: Math.round(Math.random() * 100)
        },
        tags: ['人像', '风景', '清晰', '构图良好'].slice(0, Math.floor(Math.random() * 4) + 1),
        recommendation: isRecommended ? '推荐保留' : '建议删除',
        reason: isRecommended ? '照片质量优秀，构图和光线都很好' : '照片质量一般，建议优化'
      };
    });

    // 按评分排序
    analysisResults.sort((a, b) => b.score - a.score);

    const recommendedCount = analysisResults.filter(r => r.isRecommended).length;

    return res.status(200).json({
      success: true,
      message: `AI分析完成，共分析 ${analysisResults.length} 张照片`,
      results: analysisResults,
      summary: {
        total: analysisResults.length,
        recommended: recommendedCount,
        toDelete: analysisResults.length - recommendedCount,
        averageScore: Math.round(analysisResults.reduce((sum, r) => sum + r.score, 0) / analysisResults.length * 100) / 100
      },
      criteria: criteria || 'default',
      processTime: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI分析错误:', error);
    return res.status(500).json({
      error: '服务器内部错误',
      message: process.env.NODE_ENV === 'development' ? error.message : '请稍后重试'
    });
  }
};