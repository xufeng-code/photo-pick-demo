// pages/album/index.js
const config = require('../../utils/config.js');

Page({
  data: {
    photos: [],
    bestPhoto: null
  },

  onLoad() {
    console.log('=== 相册页面开始加载 ===');
    
    const app = getApp();
    // 确保globalData存在
    app.globalData = app.globalData || {};
    
    // 获取全局数据并提供默认值
    const compareResult = app.globalData.compareResult || {};
    const photos = app.globalData.photos || [];
    const compareDecisions = app.globalData.compareDecisions || {};

    // 调试信息
    console.log('相册页面 - 全局数据:', {
      photos: photos.length,
      compareResult,
      compareDecisions
    });
    
    console.log('=== 开始处理照片数据 ===');

    // 优化：即使没有完整的compareResult，也能显示已选择的照片
    let selectedPhotos = [];
    let bestPhoto = null;

    if (photos.length > 0) {
      // 如果有compareDecisions，则筛选照片
      if (Object.keys(compareDecisions).length > 0) {
        // 筛选出保留的照片 - 只显示用户明确暂存的照片
        selectedPhotos = photos.filter(photo => {
          // 如果有bestPhoto且当前照片是bestPhoto，则保留
          const isBestPhoto = compareResult.bestPhoto && photo.id === compareResult.bestPhoto.id;
          
          // 其他照片只有在用户明确选择保留时才显示
          const compareDecision = compareDecisions[photo.id];
          const shouldKeep = isBestPhoto || compareDecision === 'keep' || compareDecision === 'better';
          
          console.log(`照片 ${photo.id}: 决策=${compareDecision}, 是否保留=${shouldKeep}`);
          return shouldKeep;
        });
      } else {
        // 如果没有compareDecisions，显示所有照片
        console.log('没有比较决策数据，显示所有照片');
        selectedPhotos = [...photos];
      }

      console.log('筛选后的照片数量:', selectedPhotos.length);

      // 如果有bestPhoto，则设置
      bestPhoto = compareResult.bestPhoto || (selectedPhotos.length > 0 ? selectedPhotos[0] : null);
      
      // 为每张照片添加点赞数据
      const photosWithLikes = selectedPhotos.map(photo => ({
        ...photo,
        likeCount: photo.likeCount || 0, // 默认为0，如果没有点赞数据
        comments: photo.comments || [] // 评论列表，默认为空数组
      }));

      this.setData({
        photos: photosWithLikes,
        bestPhoto: bestPhoto
      });
      
      console.log('=== 设置了照片数据 ===', {
        photosCount: photosWithLikes.length,
        bestPhoto: bestPhoto?.id
      });
    } else {
      // 没有照片数据时，显示空状态
      console.log('没有照片数据，显示空状态');
      
      // 强制设置空状态数据
      this.setData({
        photos: [],
        bestPhoto: null
      });
      
      // 延迟一下再检查数据
      setTimeout(() => {
        console.log('=== 延迟检查数据 ===', {
          photos: this.data.photos,
          photosLength: this.data.photos.length
        });
      }, 100);
    }

    // 开始轮询同步分享数据
    this.startSyncPolling();
  },

  // 微信分享回调
  onShareAppMessage() {
    const app = getApp();
    const shareData = app.globalData.shareData;
    
    if (shareData) {
      return shareData;
    }
    
    // 默认分享数据
    return {
      title: `我的精选相册 (${this.data.photos.length}张照片)`,
      path: `/pages/album/index`,
      imageUrl: this.data.bestPhoto ? this.data.bestPhoto.path : '/assets/icons/crown.png'
    };
  },

  // 分享到朋友圈回调
  onShareTimeline() {
    const app = getApp();
    const shareData = app.globalData.shareData;
    
    if (shareData) {
      return {
        title: shareData.title,
        imageUrl: shareData.imageUrl
      };
    }
    
    // 默认分享数据
    return {
      title: `我的精选相册 (${this.data.photos.length}张照片)`,
      imageUrl: this.data.bestPhoto ? this.data.bestPhoto.path : '/assets/icons/crown.png'
    };
  },

  onPhotoTap(e) {
    const { photo, index } = e.currentTarget.dataset;
    
    // 跳转到照片详情页面
    wx.navigateTo({
      url: `/pages/photo-detail/index?photoId=${photo.id}&index=${index}`,
      fail: (err) => {
        console.error('跳转详情页失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  goToHome() {
    // 跳转到首页开始选择照片
    wx.navigateTo({
      url: '/pages/home/index',
      fail: (err) => {
        console.error('跳转首页失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  async onShare() {
    console.log('分享按钮被点击');
    
    // 检查是否有照片可分享
    if (!this.data.photos || this.data.photos.length === 0) {
      this.showToast('暂无照片可分享');
      return;
    }

    try {
      // 检查是否在微信环境中
      const isWechat = typeof wx !== 'undefined' && wx.showShareMenu;
      
      if (isWechat) {
        // 微信环境中的分享逻辑
        const app = getApp();
        app.globalData.shareData = {
          title: `我的精选相册 (${this.data.photos.length}张照片)`,
          path: `/pages/album/index`,
          imageUrl: this.data.bestPhoto ? this.data.bestPhoto.path : '/assets/icons/crown.png'
        };

        // 显示分享菜单
        wx.showShareMenu({
          withShareTicket: true,
          menus: ['shareAppMessage', 'shareTimeline']
        });
        
        // 直接调用微信分享
        if (wx.shareAppMessage) {
          wx.shareAppMessage({
            title: `我的精选相册 (${this.data.photos.length}张照片)`,
            path: `/pages/album/index`,
            imageUrl: this.data.bestPhoto ? this.data.bestPhoto.path : '/assets/icons/crown.png'
          });
        } else {
          this.showToast('请点击右上角分享');
        }
      } else {
        // 测试环境中直接创建并显示分享链接
        this.createAndShareLink();
      }
      
    } catch (error) {
      console.error('分享设置失败:', error);
      this.showToast('分享功能暂时不可用');
    }
  },

  // 模拟分享功能（用于测试环境）
  simulateShare() {
    const shareData = {
      title: `我的精选相册 (${this.data.photos.length}张照片)`,
      desc: '来看看我的精选照片吧！',
      photos: this.data.photos.length,
      bestPhoto: this.data.bestPhoto?.path || ''
    };
    
    console.log('模拟分享数据:', shareData);
    
    // 显示分享信息
    this.showModal('分享预览', 
      `标题: ${shareData.title}\n` +
      `描述: ${shareData.desc}\n` +
      `照片数量: ${shareData.photos}张\n` +
      `在真实微信环境中，这些内容将被分享给好友。`
    );
  },

  // 统一的Toast显示方法
  showToast(title) {
    if (typeof wx !== 'undefined' && wx.showToast) {
      wx.showToast({
        title: title,
        icon: 'none',
        duration: 2000
      });
    } else {
      console.log('Toast:', title);
      alert(title);
    }
  },

  // 统一的Modal显示方法
  showModal(title, content) {
    if (typeof wx !== 'undefined' && wx.showModal) {
      wx.showModal({
        title: title,
        content: content,
        showCancel: false
      });
    } else {
      console.log('Modal:', title, content);
      alert(`${title}\n\n${content}`);
    }
  },

  // 一键生成分享链接并转发
  async createAndShareLink() {
    try {
      // 检查是否在微信环境中
      const isWechat = typeof wx !== 'undefined' && wx.showLoading;
      
      if (isWechat) {
        wx.showLoading({
          title: '生成分享链接中...',
          mask: true
        });
      } else {
        console.log('生成分享链接中...');
      }

      // 调用后端API创建分享
      const shareData = await this.callCreateShareAPI();
      
      if (isWechat) {
        // 微信环境中的分享逻辑
        const app = getApp();
        app.globalData.shareData = {
          title: `我的精选相册 (${this.data.photos.length}张照片)`,
          path: shareData.shareUrl ? `/pages/share/index?shareId=${shareData.shareId}` : `/pages/album/index`,
          imageUrl: this.data.bestPhoto ? this.data.bestPhoto.path : '/assets/icons/crown.png'
        };

        wx.hideLoading();
        
        // 显示分享菜单
        wx.showShareMenu({
          withShareTicket: true,
          menus: ['shareAppMessage', 'shareTimeline']
        });
        
        this.showToast('请点击右上角分享');
      } else {
        // 测试环境中的分享模拟
        const mockShareData = {
          title: `我的精选相册 (${this.data.photos.length}张照片)`,
          shareUrl: shareData.shareUrl || `${config.CURRENT_CONFIG.BASE_URL}/share/mock-id`,
          shareId: shareData.shareId || 'mock-share-id'
        };
        
        console.log('模拟分享链接创建成功:', mockShareData);
        this.showModal('分享链接已创建', 
          `分享链接: ${mockShareData.shareUrl}\n` +
          `分享ID: ${mockShareData.shareId}\n` +
          `在真实微信环境中，此链接可以分享给好友。`
        );
      }
      
    } catch (error) {
      if (typeof wx !== 'undefined' && wx.hideLoading) {
        wx.hideLoading();
      }
      console.error('创建分享链接失败:', error);
      this.showToast('分享失败，请重试');
    }
  },



  async callCreateShareAPI() {
    try {
      const app = getApp();
      const sessionId = app.globalData.sessionId || 'session_' + Date.now();
      
      // 准备要上传的照片数据
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('bestPhotoId', this.data.bestPhoto?.id || '');
      
      // 添加照片文件（这里简化处理，实际应该上传图片文件）
      const photosData = {
        photos: this.data.photos,
        bestPhoto: this.data.bestPhoto,
        sessionId: sessionId
      };
      
      const response = await fetch(`${config.CURRENT_CONFIG.BASE_URL}/share/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(photosData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.message || '创建分享失败');
      }
    } catch (error) {
      console.error('调用分享API失败:', error);
      // 如果后端API失败，使用本地模拟
      return this.createLocalShare();
    }
  },

  createLocalShare() {
    // 本地模拟分享数据
    const shareId = 'share_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    return {
      shareId: shareId,
      shareUrl: `${config.CURRENT_CONFIG.BASE_URL}/share/${shareId}`,
      photos: this.data.photos,
      bestPhoto: this.data.bestPhoto
    };
  },

  startSyncPolling() {
    // 模拟轮询同步分享数据
    this.syncTimer = setInterval(() => {
      this.syncShareData();
    }, 5000); // 每5秒同步一次
  },

  async syncShareData() {
    try {
      // 模拟调用 /share/sync 接口
      const syncResult = await this.callSyncAPI();
      
      if (syncResult && syncResult.updates) {
        // 更新照片的点赞和评论数据
        const updatedPhotos = this.data.photos.map(photo => {
          const update = syncResult.updates.find(u => u.photoId === photo.id);
          if (update) {
            return {
              ...photo,
              likeCount: update.likeCount !== undefined ? update.likeCount : (photo.likeCount || 0),
              comments: update.comments || photo.comments || []
            };
          }
          return {
            ...photo,
            likeCount: photo.likeCount || 0,
            comments: photo.comments || []
          };
        });

        this.setData({
          photos: updatedPhotos
        });
      }
    } catch (error) {
      console.error('同步数据失败:', error);
    }
  },

  async callSyncAPI() {
    // 模拟API调用
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟随机更新一些照片的点赞数
        const updates = this.data.photos.map(photo => ({
          photoId: photo.id,
          likeCount: photo.likeCount + Math.floor(Math.random() * 3), // 随机增加0-2个点赞
          comments: photo.comments
        }));
        
        resolve({
          updates: updates
        });
      }, 500);
    });
  },

  onUnload() {
    // 清理定时器
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  },

  // 自定义返回事件处理
  onBackTap() {
    console.log('精选相册页面 - 返回按钮被点击');
    
    // 清理当前页面的定时器
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    
    // 返回到暂存页面并刷新
    wx.navigateBack({
      delta: 1,
      success: () => {
        console.log('成功返回到暂存页面');
        // 通过事件通知暂存页面刷新
        const pages = getCurrentPages();
        if (pages.length > 1) {
          const prevPage = pages[pages.length - 2];
          if (prevPage && prevPage.refreshFromAlbum) {
            prevPage.refreshFromAlbum();
          }
        }
      },
      fail: (err) => {
        console.error('返回失败:', err);
      }
    });
  },

  // 页面转发功能
  onShareAppMessage() {
    const photos = this.data.photos || [];
    const bestPhoto = this.data.bestPhoto;
    
    return {
      title: `我的精选相册 (${photos.length}张照片)`,
      path: `/pages/share/index?photos=${encodeURIComponent(JSON.stringify(photos))}&bestPhoto=${encodeURIComponent(JSON.stringify(bestPhoto))}`,
      imageUrl: bestPhoto && bestPhoto.path ? bestPhoto.path : '/assets/icons/crown.png'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const photos = this.data.photos || [];
    const bestPhoto = this.data.bestPhoto;
    
    return {
      title: `我的精选相册 (${photos.length}张照片)`,
      query: `photos=${encodeURIComponent(JSON.stringify(photos))}&bestPhoto=${encodeURIComponent(JSON.stringify(bestPhoto))}`,
      imageUrl: bestPhoto && bestPhoto.path ? bestPhoto.path : '/assets/icons/crown.png'
    };
  }
});