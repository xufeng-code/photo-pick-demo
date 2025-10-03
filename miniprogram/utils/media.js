// utils/media.js
/**
 * 处理图片压缩与base64转换
 */

/**
 * 压缩图片并转换为base64
 * @param {string} tempFilePath - 临时文件路径
 * @param {number} maxWidth - 最大宽度
 * @param {number} quality - 质量参数 (0-1)
 * @param {number} maxSize - 最大文件大小（字节），默认1MB
 * @returns {Promise<string>} base64字符串
 */
const compressAndToBase64 = (tempFilePath, maxWidth = 1600, quality = 0.8, maxSize = 1024 * 1024) => {
  return new Promise((resolve, reject) => {
    wx.getImageInfo({
      src: tempFilePath,
      success: (res) => {
        let canvasWidth = res.width;
        let canvasHeight = res.height;
        
        // 计算压缩后的尺寸，保持比例
        if (canvasWidth > maxWidth) {
          const ratio = maxWidth / canvasWidth;
          canvasWidth = maxWidth;
          canvasHeight = Math.floor(res.height * ratio);
        }
        
        const query = wx.createSelectorQuery();
        query.select('#compress-canvas').fields({
          node: true,
          size: true
        }).exec((res) => {
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          
          // 设置canvas尺寸
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          
          const image = canvas.createImage();
          image.onload = () => {
            ctx.drawImage(image, 0, 0, canvasWidth, canvasHeight);
            // 将canvas内容转换为base64
            const base64 = canvas.toDataURL('image/jpeg', quality);
            
            // 检查base64大小是否超过限制
            const base64Size = base64.length * 0.75; // base64大小约为原始大小的4/3
            if (base64Size > maxSize && quality > 0.3) {
              // 如果文件仍然太大且质量还可以降低，递归压缩
              const newQuality = Math.max(0.3, quality - 0.2);
              const newMaxWidth = Math.max(400, maxWidth * 0.8);
              compressAndToBase64(tempFilePath, newMaxWidth, newQuality, maxSize)
                .then(resolve)
                .catch(reject);
            } else {
              resolve(base64);
            }
          };
          image.onerror = (err) => {
            reject(err);
          };
          image.src = tempFilePath;
        });
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
};

/**
 * 智能压缩图片（根据原始大小自动调整参数）
 * @param {string} tempFilePath - 临时文件路径
 * @param {number} originalSize - 原始文件大小
 * @returns {Promise<string>} base64字符串
 */
const smartCompressToBase64 = (tempFilePath, originalSize) => {
  // 根据原始大小智能选择压缩参数
  let maxWidth, quality, maxSize;
  
  if (originalSize > 10 * 1024 * 1024) { // 大于10MB
    maxWidth = 600;
    quality = 0.5;
    maxSize = 800 * 1024; // 800KB
  } else if (originalSize > 5 * 1024 * 1024) { // 大于5MB
    maxWidth = 700;
    quality = 0.6;
    maxSize = 1024 * 1024; // 1MB
  } else if (originalSize > 2 * 1024 * 1024) { // 大于2MB
    maxWidth = 800;
    quality = 0.7;
    maxSize = 1.5 * 1024 * 1024; // 1.5MB
  } else {
    maxWidth = 1200;
    quality = 0.8;
    maxSize = 1024 * 1024; // 1MB
  }
  
  return compressAndToBase64(tempFilePath, maxWidth, quality, maxSize);
};

/**
 * 批量处理图片转换为base64负载
 * @param {Array} photos - 照片数组
 * @returns {Promise<Object>} 包含base64数据的负载
 */
const toBase64Payload = async (photos) => {
  const processedPhotos = [];
  
  for (const photo of photos) {
    try {
      // 使用智能压缩，根据原始文件大小自动调整参数
      const base64 = await smartCompressToBase64(photo.tempFilePath, photo.size);
      processedPhotos.push({
        id: photo.id,
        base64: base64,
        width: photo.width,
        height: photo.height,
        size: photo.size,
        orientation: photo.orientation
      });
    } catch (error) {
      console.error('处理照片失败:', photo.id, error);
      // 如果智能压缩失败，尝试使用默认压缩
      try {
        const base64 = await compressAndToBase64(photo.tempFilePath, 600, 0.5);
        processedPhotos.push({
          id: photo.id,
          base64: base64,
          width: photo.width,
          height: photo.height,
          size: photo.size,
          orientation: photo.orientation
        });
      } catch (fallbackError) {
        console.error('备用压缩也失败:', photo.id, fallbackError);
        // 跳过失败的照片，继续处理其他照片
      }
    }
  }
  
  return {
    photos: processedPhotos
  };
};

/**
 * 生成会话ID
 * @returns {string} 会话ID
 */
const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * 判断图片方向
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @returns {string} 方向类型
 */
const getOrientation = (width, height) => {
  return width > height ? 'landscape' : (width < height ? 'portrait' : 'square');
};

/**
 * 本地启发式评分（降级策略）
 * @param {Array} photos - 照片数组
 * @returns {Object} AI结果结构
 */
const localHeuristicPick = (photos) => {
  if (!photos || photos.length === 0) {
    return {
      bestPhoto: null,
      bestTag: '构图',
      description: '没有可选照片'
    };
  }
  
  // 简单策略：选择第一张作为最佳
  // 实际项目中可以实现更复杂的图像分析算法
  const bestPhoto = photos[0];
  
  const reasons = [
    '构图表现优秀，整体氛围完成度高，光线表现优秀，非常适合分享',
    '画质清晰，色彩饱和度适中，构图平衡感良好',
    '光线柔和自然，人物表情生动，背景层次丰富',
    '角度独特，视觉冲击力强，细节处理到位'
  ];
  
  const tags = ['构图', '画质', '光线', '色彩', '氛围'];
  
  return {
    bestPhoto: bestPhoto,
    bestTag: tags[Math.floor(Math.random() * tags.length)],
    description: reasons[Math.floor(Math.random() * reasons.length)],
    scored: photos.map(photo => ({
      id: photo.id,
      score: Math.random() * 0.4 + 0.6, // 随机分数在0.6-1.0之间
      details: {
        light: Math.random() * 0.5 + 0.5,
        composition: Math.random() * 0.5 + 0.5,
        clarity: Math.random() * 0.5 + 0.5,
        face: 0,
        mood: Math.random() * 0.5 + 0.5
      }
    }))
  };
};

/**
 * 创建UUID
 * @returns {string} UUID
 */
const createUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// 导出所有函数
module.exports = {
  compressAndToBase64,
  smartCompressToBase64,
  toBase64Payload,
  generateSessionId,
  getOrientation,
  localHeuristicPick,
  createUUID
};