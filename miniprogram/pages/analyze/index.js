// pages/analyze/index.js
const { toBase64Payload, localHeuristicPick } = require('../../utils/media');
const { post } = require('../../utils/request');
const { API_PATHS } = require('../../utils/config');

Page({
  data: {
    percent: 0,
    loadingText: '光线、构图、画质、五官、氛围……'
  },

  onLoad: function (options) {
    console.log('🔍 分析页面加载，开始检查数据...');
    
    // 获取全局应用实例
    const app = getApp();
    
    // 详细调试全局数据
    console.log('📊 全局数据检查:');
    console.log('- app.globalData:', app.globalData);
    console.log('- app.globalData.photos:', app.globalData.photos);
    console.log('- app.globalData.fileKeys:', app.globalData.fileKeys);
    console.log('- app.globalData.analysisResult:', app.globalData.analysisResult);
    
    // 检查照片数据
    const photos = app.globalData.photos || [];
    const fileKeys = app.globalData.fileKeys || [];
    
    console.log(`📸 照片数据检查: 数量=${photos.length}`);
    console.log(`🔑 文件键检查: 数量=${fileKeys.length}`);
    
    if (photos.length === 0 && fileKeys.length === 0) {
      console.error('❌ 没有照片数据和文件键，显示错误并返回');
      wx.showToast({
        title: '没有选择照片',
        icon: 'none',
        duration: 2000
      });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
      return;
    }
    
    if (photos.length === 0 && fileKeys.length > 0) {
      console.log('⚠️ 有文件键但没有照片数据，尝试重建照片数据');
      // 这里可以添加重建照片数据的逻辑
    }
    
    console.log('✅ 数据检查通过，开始AI分析流程');
    this.startAnalysis(photos);
  },

  startAnalysis(photos) {
    // 启动进度条动画
    this.startProgressAnimation();
    // 开始AI分析
    this.analyzePhotos(photos);
  },

  startProgressAnimation() {
    let progress = 5;
    this.progressTimer = setInterval(() => {
      progress = Math.min(95, progress + Math.random() * 5);
      this.setData({
        percent: Math.floor(progress)
      });
    }, 300);

    // 启动加载文本动画
    const loadingTexts = ['光线', '构图', '画质', '五官', '氛围'];
    let textIndex = 0;
    this.textTimer = setInterval(() => {
      textIndex = (textIndex + 1) % loadingTexts.length;
      const text = loadingTexts.slice(0, textIndex + 1).join('、') + '……';
      this.setData({ loadingText: text });
    }, 800);
  },

  async analyzePhotos(photos) {
    try {
      console.log('开始AI分析，照片数量:', photos.length);
      
      // 获取会话ID
      const app = getApp();
      const sessionId = app.globalData.session.id;
      
      let payload;
      
      // 检查是否有fileKeys（新的上传方式）
      if (app.globalData.fileKeys && app.globalData.fileKeys.length > 0) {
        console.log('✅ 使用新的上传方式，fileKeys:', app.globalData.fileKeys);
        payload = {
          sessionId,
          fileKeys: app.globalData.fileKeys
        };
        console.log('📦 fileKeys payload:', payload);
      } else {
        console.log('⚠️ fileKeys不存在，使用传统base64方式');
        console.log('🔍 globalData.fileKeys:', app.globalData.fileKeys);
        console.log('📸 photos数据:', photos);
        // 准备照片数据（传统方式）
        payload = await toBase64Payload(photos);
        payload.sessionId = sessionId;
        console.log('📦 base64 payload大小:', JSON.stringify(payload).length);
      }
      
      console.log('照片数据准备完成');
      
      // 调用AI分析接口
      console.log('准备调用AI接口:', API_PATHS.AI_PICK);
      console.log('请求payload结构:', Object.keys(payload));
      
      const response = await post(API_PATHS.AI_PICK, payload).catch(err => {
        console.error('❌ AI分析失败，错误详情:', err);
        console.error('错误类型:', typeof err);
        console.error('错误消息:', err.message);
        console.error('错误状态码:', err.statusCode);
        console.error('错误响应:', err.data);
        console.error('错误堆栈:', err.stack);
        
        // 根据错误类型提供友好的错误信息
        let userFriendlyMessage = 'AI分析失败，请重试';
        const errorMsg = err.message || err.errMsg || '';
        
        if (errorMsg.includes('timeout') || errorMsg.includes('超时')) {
          userFriendlyMessage = '请求超时，请检查网络连接后重试';
        } else if (errorMsg.includes('network') || errorMsg.includes('网络')) {
          userFriendlyMessage = '网络连接异常，请检查网络后重试';
        } else if (errorMsg.includes('500') || errorMsg.includes('服务器')) {
          userFriendlyMessage = '服务器暂时繁忙，请稍后重试';
        } else if (errorMsg.includes('401') || errorMsg.includes('403')) {
          userFriendlyMessage = '服务认证失败，请联系管理员';
        } else if (errorMsg.includes('404')) {
          userFriendlyMessage = '服务暂时不可用，请稍后重试';
        }
        
        console.error('🔍 具体错误原因:', errorMsg);
        
        // 显示友好的错误对话框，提供重试选项
        wx.showModal({
          title: '处理失败',
          content: userFriendlyMessage,
          confirmText: '重试',
          cancelText: '使用本地分析',
          success: (res) => {
            if (res.confirm) {
              // 用户选择重试，重新开始分析
              setTimeout(() => {
                this.analyzePhotos(photos);
              }, 1000);
            } else {
              // 用户选择使用本地分析，继续使用mock数据
              const mockResult = localHeuristicPick(photos);
              mockResult.isDemoData = true;
              this.handleAnalysisResult({ data: mockResult }, photos);
            }
          }
        });
        
        // 抛出错误以阻止后续处理
        throw err;
      });

      console.log('API响应:', response);
      this.handleAnalysisResult(response, photos);

    } catch (error) {
      console.error('照片分析失败:', error);
      this.clearTimers();
      wx.showToast({
        title: '分析失败，请重试',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  handleAnalysisResult(response, photos) {
    const app = getApp();
    
    // 提取真实的AI分析结果
    const result = response.data || response;
    console.log('AI分析完成，结果:', result);

    // 保存分析结果
    app.globalData.aiResult = result;
    
    console.log('AI结果已保存到globalData:', app.globalData.aiResult);

    // 清理定时器
    this.clearTimers();
    
    // 设置100%进度
    this.setData({ percent: 100 });

    // 延迟跳转，让用户看到100%
    setTimeout(() => {
      wx.redirectTo({
        url: '/pages/recommend/index',
        fail: (err) => {
          console.error('跳转失败:', err);
          wx.showToast({
            title: '页面跳转失败',
            icon: 'none'
          });
        }
      });
    }, 500);
  },

  clearTimers() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
    if (this.textTimer) {
      clearInterval(this.textTimer);
      this.textTimer = null;
    }
  },

  onUnload() {
    this.clearTimers();
  }
});