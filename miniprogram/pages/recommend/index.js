// pages/recommend/index.js
const request = require('../../utils/request');
const config = require('../../utils/config.js');
const { normalizeUrl, safeStringUrl } = require('../../utils/url.js');

Page({
  data: {
    imageUrl: '',
    bestTag: '',
    description: '',
    loading: true,
    showFullscreen: false
  },

  async onLoad() {
    console.log('推荐页面加载，检查AI分析结果...');
    const app = getApp();
    const photos = app.globalData.photos || [];
    const aiResult = app.globalData.aiResult;

    console.log('照片数量:', photos.length);
    console.log('AI分析结果:', JSON.stringify(aiResult, null, 2));

    if (!photos.length) {
      console.error('数据异常 - 照片缺失');
      wx.showModal({
        title: '数据异常',
        content: '照片数据缺失，请重新选择照片',
        confirmText: '重新选择',
        cancelText: '返回',
        success: (res) => {
          if (res.confirm) {
            wx.redirectTo({
              url: '/pages/home/index'
            });
          } else {
            wx.navigateBack();
          }
        }
      });
      return;
    }

    // 获取AI推荐的最佳照片
    let bestPhoto = photos[0];
    let bestTag = '构图';
    let description = '这张照片表现优秀，值得分享。';
    let isDemoData = false;

    // 处理AI分析结果
    if (aiResult) {
      console.log('处理AI结果:', aiResult);
      
      try {
        // 兼容本地分析结果格式 (bestPhoto, bestTag, description)
        if (aiResult.bestPhoto && typeof aiResult.bestPhoto === 'object') {
          console.log('检测到本地分析结果格式');
          isDemoData = aiResult.isDemoData || false;
          const foundPhoto = photos.find(p => p.id === aiResult.bestPhoto.id);
          if (foundPhoto) {
            bestPhoto = foundPhoto;
            bestTag = aiResult.bestTag || bestTag;
            description = aiResult.description || description;
            console.log('使用本地分析结果:', { bestPhoto: bestPhoto.id, bestTag, description, isDemoData });
          }
        }
        // 兼容服务器AI分析结果格式 (bestPhotoIndex, bestPhotoId, reason, tags)
        else {
          console.log('检测到服务器AI分析结果格式');
          
          // 优先处理bestPhotoId（AI分析返回的格式）
          if (aiResult.bestPhotoId || aiResult.bestId) {
            const photoId = aiResult.bestPhotoId || aiResult.bestId;
            const foundPhoto = photos.find(p => p.fileKey === photoId || p.id === photoId);
            if (foundPhoto) {
              bestPhoto = foundPhoto;
              console.log('找到最佳照片 (ID):', bestPhoto.fileKey || bestPhoto.id);
            } else {
              console.warn('未找到对应ID的照片:', photoId);
            }
          } else if (typeof aiResult.bestPhotoIndex === 'number' && aiResult.bestPhotoIndex >= 0 && aiResult.bestPhotoIndex < photos.length) {
            bestPhoto = photos[aiResult.bestPhotoIndex];
            console.log('找到最佳照片 (索引', aiResult.bestPhotoIndex, '):', bestPhoto.fileKey || bestPhoto.id);
          }

          // 处理标签和描述
          if (aiResult.tags && Array.isArray(aiResult.tags) && aiResult.tags.length > 0) {
            bestTag = aiResult.tags[0];
          }
          if (aiResult.reason && typeof aiResult.reason === 'string') {
            description = aiResult.reason;
          }
        }
      } catch (error) {
        console.error('处理AI结果时出错:', error);
        console.log('回退到默认推荐逻辑');
      }
    }

    // 处理图片数据 - 使用base64
    let imageUrl = '';
    
    console.log('🔍 开始处理图片数据，bestPhoto对象:', JSON.stringify(bestPhoto, null, 2));
    
    // 优先使用base64数据
    if (bestPhoto.base64) {
      imageUrl = bestPhoto.base64;
      console.log('✅ 使用base64数据');
    }
    // 如果没有base64，使用tempFilePath作为fallback
    else if (bestPhoto.tempFilePath) {
      imageUrl = bestPhoto.tempFilePath;
      console.log('✅ 使用tempFilePath:', imageUrl);
    }
    
    if (!imageUrl) {
      console.error('❌ 无法获取有效的图片数据');
      console.error('❌ bestPhoto完整对象:', JSON.stringify(bestPhoto, null, 2));
      
      wx.showToast({
        title: '图片加载失败',
        icon: 'none'
      });
      return;
    }
    
    console.log('🎯 最终图片数据类型:', imageUrl.startsWith('data:') ? 'base64' : 'file path');

    this.setData({
      imageUrl,
      bestTag,
      description,
      loading: false,
      isDemoData
    });
  },

  onCompare() {
    wx.navigateTo({
      url: '/pages/compare/index',
      fail: (err) => {
        console.error('跳转失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 点击照片进入全屏模式
  onPhotoTap() {
    console.log('点击照片，进入全屏模式');
    console.log('当前图片URL:', this.data.imageUrl);
    this.setData({
      showFullscreen: true
    });
  },

  // 图片加载成功
  onImageLoad(e) {
    console.log('图片加载成功:', e.detail);
  },

  // 图片加载失败
  onImageError(e) {
    console.error('图片加载失败:', e.detail);
    const currentUrl = safeStringUrl(this.data.imageUrl);
    console.error('当前图片URL:', currentUrl);
    
    // 获取当前照片数据
    const app = getApp();
    const photos = app.globalData.photos || [];
    const aiResult = app.globalData.aiResult;
    
    if (photos.length > 0 && aiResult && typeof aiResult.bestPhotoIndex === 'number') {
      const bestPhoto = photos[aiResult.bestPhotoIndex];
      
      // 尝试使用 thumb 兜底
      if (bestPhoto && bestPhoto.urls && bestPhoto.urls.thumb) {
        const thumbUrl = bestPhoto.urls.thumb;
        
        if (thumbUrl && !currentUrl.includes('thumb/')) {
          console.log('🔄 尝试使用 thumb 兜底:', thumbUrl);
          const fallbackUrl = normalizeUrl(thumbUrl);
          this.setData({
            imageUrl: fallbackUrl
          });
          return;
        }
      }
      
      // 如果是签名URL失败，尝试重新获取
      if (currentUrl && currentUrl.includes('token=') && currentUrl.includes('expires=')) {
        console.log('🔄 签名URL加载失败，尝试重新获取...');
        
        if (bestPhoto) {
          console.log('🔄 重新获取签名URL...');
          this.getSignedUrlForPhoto(bestPhoto).catch(retryError => {
            console.error('重新获取签名URL也失败了:', retryError);
            wx.showToast({
              title: '图片加载失败，请重试',
              icon: 'none',
              duration: 3000
            });
          });
          return;
        }
      }
    }
    
    wx.showToast({
      title: '图片加载失败',
      icon: 'none'
    });
  },

  // 关闭全屏模式
  onCloseFullscreen() {
    console.log('关闭全屏模式');
    this.setData({
      showFullscreen: false
    });
  },



  // 阻止事件冒泡
  onStopPropagation() {
    // 阻止点击全屏内容时关闭全屏
  }
});