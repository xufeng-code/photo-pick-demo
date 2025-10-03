export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许 POST 方法
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { photos } = req.body;

    // 验证输入
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid input: photos array is required and cannot be empty' 
      });
    }

    // 验证每个照片对象
    for (const photo of photos) {
      if (!photo.id || !photo.previewUrl) {
        return res.status(400).json({ 
          error: 'Invalid photo object: id and previewUrl are required' 
        });
      }
    }

    // Mock AI 分析逻辑
    const mockAnalysis = generateMockAnalysis(photos);

    res.status(200).json(mockAnalysis);

  } catch (error) {
    console.error('AI pick error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

function generateMockAnalysis(photos) {
  // 随机选择最佳照片
  const randomIndex = Math.floor(Math.random() * photos.length);
  const bestPhoto = photos[randomIndex];

  // 生成四维评分 (0-100)
  const scores = {
    portrait: Math.floor(Math.random() * 30) + 70,    // 70-100
    quality: Math.floor(Math.random() * 25) + 75,     // 75-100
    composition: Math.floor(Math.random() * 35) + 65, // 65-100
    mood: Math.floor(Math.random() * 40) + 60,        // 60-100
  };

  // 计算综合评分
  scores.overall = Math.floor(
    (scores.portrait * 0.3 + 
     scores.quality * 0.3 + 
     scores.composition * 0.25 + 
     scores.mood * 0.15)
  );

  // 生成随机选择理由
  const reasons = [
    '这张照片的人物表情自然，光线柔和，构图平衡，整体氛围温馨。',
    '照片清晰度高，色彩饱和度适中，人物神态生动，背景简洁不抢夺主体。',
    '拍摄角度恰到好处，人物姿态优雅，面部光影层次丰富，情感表达到位。',
    '构图符合三分法则，焦点突出，景深运用得当，整体画面和谐统一。',
    '人物眼神有神，微笑真诚，服装搭配协调，照片传达出积极正面的情绪。',
    '光线运用巧妙，突出了人物轮廓，背景虚化效果好，主体突出明显。',
    '照片色调温暖，人物肌肤质感好，整体曝光准确，没有过曝或欠曝现象。',
    '人物动作自然流畅，表情丰富有感染力，照片具有很强的视觉冲击力。'
  ];

  const randomReason = reasons[Math.floor(Math.random() * reasons.length)];

  return {
    bestId: bestPhoto.id,
    scores,
    reason: randomReason
  };
}