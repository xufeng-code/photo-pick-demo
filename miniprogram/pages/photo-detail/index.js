// pages/photo-detail/index.js
Page({
  data: {
    photo: null,
    bestPhoto: null,
    comments: [],
    index: 0
  },

  onLoad(options) {
    const { photoId, index } = options;
    
    if (!photoId) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    const app = getApp();
    const photos = app.globalData.photos || [];
    const compareResult = app.globalData.compareResult;

    // 查找对应的照片
    const photo = photos.find(p => p.id === photoId);
    
    if (!photo) {
      wx.showToast({
        title: '照片不存在',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    // 模拟评论数据
    const mockComments = [
      {
        id: 1,
        username: '小明',
        avatar: '/assets/icons/default-avatar.svg',
        content: '这张照片拍得真好看！',
        time: '2小时前'
      },
      {
        id: 2,
        username: '小红',
        avatar: '/assets/icons/default-avatar.svg',
        content: '构图很棒，光线也很好',
        time: '1小时前'
      }
    ];

    const photoData = {
      ...photo,
      likeCount: photo.likeCount || Math.floor(Math.random() * 20) + 1,
      createTime: this.formatDate(new Date()),
      size: this.formatFileSize(Math.floor(Math.random() * 5000000) + 1000000) // 1-6MB
    };
    
    this.setData({
      photo: photoData,
      photoUrl: this.getPhotoUrl(photoData),
      bestPhoto: compareResult?.bestPhoto,
      comments: Math.random() > 0.5 ? mockComments : [], // 50%概率显示评论
      index: parseInt(index) || 0
    });
  },

  onDelete() {
    console.log('删除按钮被点击');
    
    // 添加触觉反馈
    wx.vibrateShort({
      type: 'light'
    });
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张照片吗？删除后无法恢复。',
      confirmText: '删除',
      confirmColor: '#FF3B30',
      success: (res) => {
        if (res.confirm) {
          console.log('用户确认删除');
          this.deletePhoto();
        } else {
          console.log('用户取消删除');
        }
      }
    });
  },

  deletePhoto() {
    console.log('开始删除照片:', this.data.photo.id);
    
    // 显示加载提示
    wx.showLoading({
      title: '删除中...',
      mask: true
    });
    
    try {
      const app = getApp();
      const photos = app.globalData.photos || [];
      
      console.log('删除前照片数量:', photos.length);
      
      // 模拟删除操作的延迟，让用户看到加载状态
      setTimeout(() => {
        try {
          // 从全局数据中移除这张照片
          const updatedPhotos = photos.filter(p => p.id !== this.data.photo.id);
          app.globalData.photos = updatedPhotos;
          
          console.log('删除后照片数量:', updatedPhotos.length);

          // 如果删除的是最佳照片，需要重新选择最佳照片
          if (this.data.photo.id === this.data.bestPhoto?.id) {
            console.log('删除的是最佳照片，需要重新选择');
            if (updatedPhotos.length > 0) {
              app.globalData.compareResult.bestPhoto = updatedPhotos[0];
              console.log('新的最佳照片:', updatedPhotos[0].id);
            } else {
              app.globalData.compareResult = null;
              console.log('没有照片了，清空比较结果');
            }
          }

          // 隐藏加载提示
          wx.hideLoading();

          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });

          // 返回上一页并刷新
          setTimeout(() => {
            const pages = getCurrentPages();
            const prevPage = pages[pages.length - 2];
            
            console.log('准备返回上一页，页面路由:', prevPage?.route);
            
            if (prevPage && prevPage.route === 'pages/album/index') {
              // 通知相册页面刷新数据
              console.log('刷新相册页面数据');
              prevPage.onLoad();
            }
            
            wx.navigateBack();
          }, 1000);

        } catch (error) {
          wx.hideLoading();
          console.error('删除照片失败:', error);
          wx.showToast({
            title: '删除失败: ' + error.message,
            icon: 'none',
            duration: 3000
          });
        }
      }, 500);

    } catch (error) {
      wx.hideLoading();
      console.error('删除照片失败:', error);
      wx.showToast({
        title: '删除失败: ' + error.message,
        icon: 'none',
        duration: 3000
      });
    }
  },

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  getPhotoUrl(photo) {
    if (!photo) return '';
    
    // 如果已经是完整的URL，直接返回
    if (photo.path && (photo.path.startsWith('http://') || photo.path.startsWith('https://'))) {
      return photo.path;
    }
    
    // 构建完整的URL
    const baseUrl = 'https://192.168.1.8:8000';
    if (photo.path && photo.path.startsWith('/uploads/')) {
      return `${baseUrl}${photo.path}`;
    }
    
    return photo.path || '';
  }
});