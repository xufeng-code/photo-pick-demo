// pages/home/index.js
const { createUUID, smartCompressToBase64 } = require('../../utils/media');
const { readFileToBase64, analyzePhotosDirectly } = require('../../utils/upload');

Page({
  data: {
    uploadedUrl: "",   // 相对路径
    previewUrl: "",    // 可直接预览的完整 URL
  },

  onLoad() {
    // 确保全局数据已初始化
    const app = getApp();
    console.log('首页加载，当前session:', app.globalData.session);
  },

  onChoosePhotos() {
    console.log('🎯 开始选择照片流程（新版本：直接base64）');
    
    // 显示加载提示
    wx.showLoading({
      title: '选择照片中...',
      mask: true
    });

    // 使用 chooseImage 选择照片
    console.log('📱 调用wx.chooseImage');
    wx.chooseImage({
      count: 8, // 限制最多8张照片
      sizeType: ['compressed'], // 使用压缩图
      sourceType: ['album'],
      success: async (res) => {
        try {
          console.log('✅ 照片选择成功:', res);
          
          if (!res.tempFilePaths || res.tempFilePaths.length === 0) {
            wx.hideLoading();
            wx.showToast({ title: '未选择照片', icon: 'none' });
            return;
          }

          console.log(`选择了 ${res.tempFilePaths.length} 张照片`);
          
          // 检查照片数量
          if (res.tempFilePaths.length < 2) {
            wx.hideLoading();
            wx.showModal({
              title: '照片数量不足',
              content: '请至少选择2张照片进行分析',
              confirmText: '重新选择',
              cancelText: '取消',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  setTimeout(() => {
                    this.onChoosePhotos();
                  }, 100);
                }
              }
            });
            return;
          }

          // 更新加载提示
          wx.showLoading({
            title: '处理照片中...',
            mask: true
          });

          // 限制照片数量到8张
          const paths = res.tempFilePaths.slice(0, 8);
          const photos = [];
          
          console.log('🔄 开始转换照片为base64...');
          
          // 逐个转换照片为base64
          for (let i = 0; i < paths.length; i++) {
            const filePath = paths[i];
            
            wx.showLoading({
              title: `处理照片 ${i + 1}/${paths.length}...`,
              mask: true
            });
            
            try {
              // 可选：先压缩再读取（如果文件过大）
              let processedPath = filePath;
              if (res.tempFiles && res.tempFiles[i] && res.tempFiles[i].size > 5 * 1024 * 1024) {
                console.log(`🗜️ 文件过大，开始压缩: ${filePath}`);
                wx.compressImage({
                  src: filePath,
                  quality: 80,
                  success: (compressRes) => {
                    processedPath = compressRes.tempFilePath;
                    console.log(`✅ 压缩完成: ${processedPath}`);
                  },
                  fail: (compressError) => {
                    console.warn(`⚠️ 压缩失败，使用原文件: ${compressError}`);
                  }
                });
              }
              
              // 转换为base64
              const base64 = await readFileToBase64(processedPath, 'image/jpeg');
              console.log(`✅ 第${i + 1}张照片转换完成`);
              
              photos.push({
                id: `p${i + 1}`,
                base64: base64
              });
              
            } catch (error) {
              console.error(`❌ 第${i + 1}张照片处理失败:`, error);
              throw new Error(`第${i + 1}张照片处理失败: ${error.message}`);
            }
          }
          
          console.log('📊 所有照片转换完成，开始AI分析...');
          console.log('📸 照片数据:', photos.map(p => ({ id: p.id, base64: p.base64.substring(0, 50) + '...' })));
          
          // 添加数组保护逻辑
          const validPhotos = Array.isArray(photos) ? photos.filter(p => !!p && !!p.base64) : [];
          if (validPhotos.length === 0) {
            wx.hideLoading();
            wx.showToast({ title: '没有可分析的照片', icon: 'none' });
            return;
          }
          
          if (validPhotos.length < 2) {
            wx.hideLoading();
            wx.showToast({ title: '至少需要2张照片进行分析', icon: 'none' });
            return;
          }
          
          wx.showLoading({
            title: 'AI分析中...',
            mask: true
          });
          
          // 生成sessionId
          const sessionId = `session_${Date.now()}_${createUUID().substring(0, 8)}`;
          console.log('🔑 生成sessionId:', sessionId);
          
          // 直接发送到AI分析接口（修复参数格式）
          const analysisResult = await analyzePhotosDirectly({ 
            photos: validPhotos, 
            sessionId: sessionId 
          });
          console.log('🎉 AI分析完成，结果:', analysisResult);
          
          // 构建照片数据用于显示
          const displayPhotos = validPhotos.map((photo, index) => ({
            id: photo.id,
            base64: photo.base64,
            tempFilePath: paths[index],
            size: res.tempFiles && res.tempFiles[index] ? res.tempFiles[index].size : 0,
            width: res.tempFiles && res.tempFiles[index] ? (res.tempFiles[index].width || 0) : 0,
            height: res.tempFiles && res.tempFiles[index] ? (res.tempFiles[index].height || 0) : 0
          }));
          
          // 保存到全局数据
          const app = getApp();
          console.log('💾 保存数据到globalData...');
          app.globalData.photos = displayPhotos;
          app.globalData.analysisResult = analysisResult;
          
          console.log('💾 数据保存完成:');
          console.log('- photos数量:', displayPhotos.length);
          console.log('- 分析结果:', analysisResult);
          
          wx.hideLoading();
          
          // 跳转到分析页面
          console.log('🚀 跳转到分析页面...');
          wx.navigateTo({
            url: '/pages/analyze/index',
            success: () => {
              console.log('✅ 页面跳转成功');
            },
            fail: (err) => {
              console.error('❌ 页面跳转失败:', err);
              wx.showToast({ title: '页面跳转失败', icon: 'none' });
            }
          });
          
        } catch (error) {
          wx.hideLoading();
          console.error('❌ 照片处理失败:', error);
          
          // 提供友好的错误信息
          let userFriendlyMessage = '照片处理失败，请重试';
          const errorMsg = error.message || error.errMsg || '';
          
          if (errorMsg.includes('网络') || errorMsg.includes('network') || errorMsg.includes('timeout')) {
            userFriendlyMessage = '网络连接异常，请检查网络后重试';
          } else if (errorMsg.includes('base64') || errorMsg.includes('格式')) {
            userFriendlyMessage = '照片格式处理失败，请选择其他照片';
          } else if (errorMsg.includes('大小') || errorMsg.includes('size')) {
            userFriendlyMessage = '照片文件过大，请选择较小的照片';
          } else if (errorMsg.includes('AI分析失败')) {
            userFriendlyMessage = 'AI分析服务暂时不可用，请稍后重试';
          }
          
          wx.showModal({
            title: '处理失败',
            content: userFriendlyMessage,
            confirmText: '重试',
            cancelText: '取消',
            success: (res) => {
              if (res.confirm) {
                setTimeout(() => {
                  this.onChoosePhotos();
                }, 500);
              }
            }
          });
        }
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('❌ 照片选择失败:', error);
        
        // 检查是否是用户取消
        if (error.errMsg && error.errMsg.includes('cancel')) {
          console.log('用户取消选择照片');
          return;
        }
        
        wx.showToast({ title: '选择照片失败', icon: 'none' });
      }
    });
  }
});