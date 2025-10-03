// pages/share/index.js
Page({
  data: {
    shareId: '',
    photos: [],
    bestPhoto: null,
    currentPhoto: null,
    currentIndex: 0,
    commentText: '',
    friendName: '朋友'
  },

  onLoad(options) {
    const { shareId } = options;
    if (!shareId) {
      wx.showToast({
        title: '分享链接无效',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({ shareId });
    this.loadShareData();
  },

  // 加载分享数据
  async loadShareData() {
    try {
      // 模拟从服务器获取分享数据
      const shareData = await this.getShareData(this.data.shareId);
      
      if (!shareData || !shareData.photos.length) {
        wx.showToast({
          title: '分享内容不存在',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
        return;
      }

      // 为照片添加URL
      const photosWithUrls = shareData.photos.map(photo => ({
        ...photo,
        url: this.getPhotoUrl(photo)
      }));
      
      const bestPhotoWithUrl = shareData.bestPhoto ? {
        ...shareData.bestPhoto,
        url: this.getPhotoUrl(shareData.bestPhoto)
      } : null;

      this.setData({
        photos: photosWithUrls,
        bestPhoto: bestPhotoWithUrl,
        currentPhoto: photosWithUrls[0],
        currentIndex: 0,
        friendName: shareData.ownerName || '朋友'
      });

    } catch (error) {
      console.error('加载分享数据失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 模拟获取分享数据的API调用
  async getShareData(shareId) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 模拟从全局数据获取（实际应该从服务器获取）
    const app = getApp();
    const photos = app.globalData.photos || [];
    const compareResult = app.globalData.compareResult;
    
    if (!photos.length) {
      throw new Error('No photos found');
    }

    // 为每张照片添加朋友侧的点赞和评论数据
    const photosWithSocialData = photos.map(photo => ({
      ...photo,
      isLiked: false,
      likeCount: Math.floor(Math.random() * 20),
      comments: this.generateMockComments()
    }));

    return {
      shareId,
      photos: photosWithSocialData,
      bestPhoto: compareResult?.bestPhoto || photosWithSocialData[0],
      ownerName: '朋友'
    };
  },

  // 生成模拟评论数据
  generateMockComments() {
    const commentTemplates = [
      '这张照片拍得真好！',
      '太美了！',
      '喜欢这个角度',
      '构图很棒',
      '光线处理得很好',
      '很有艺术感',
      '赞！'
    ];
    
    const usernames = ['小明', '小红', '小李', '小王', '小张'];
    const commentCount = Math.floor(Math.random() * 5);
    const comments = [];
    
    for (let i = 0; i < commentCount; i++) {
      comments.push({
        id: `comment_${Date.now()}_${i}`,
        username: usernames[Math.floor(Math.random() * usernames.length)],
        content: commentTemplates[Math.floor(Math.random() * commentTemplates.length)],
        time: this.formatTime(new Date(Date.now() - Math.random() * 86400000)), // 随机时间
        avatar: '/assets/icons/default-avatar.svg'
      });
    }
    
    return comments;
  },

  // 缩略图点击事件
  onThumbnailTap(e) {
    const { photo, index } = e.currentTarget.dataset;
    this.setData({
      currentPhoto: photo,
      currentIndex: index
    });
  },

  // 点赞功能
  async onLike() {
    const { currentPhoto, photos, currentIndex } = this.data;
    const isLiked = !currentPhoto.isLiked;
    const likeCount = currentPhoto.likeCount + (isLiked ? 1 : -1);

    // 更新当前照片状态
    const updatedPhoto = {
      ...currentPhoto,
      isLiked,
      likeCount
    };

    // 更新照片列表
    const updatedPhotos = [...photos];
    updatedPhotos[currentIndex] = updatedPhoto;

    this.setData({
      currentPhoto: updatedPhoto,
      photos: updatedPhotos
    });

    // 调用点赞API
    try {
      await this.callLikeAPI(currentPhoto.id, isLiked);
    } catch (error) {
      console.error('点赞失败:', error);
      // 如果API调用失败，回滚状态
      this.setData({
        currentPhoto,
        photos
      });
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    }
  },

  // 评论输入事件
  onCommentInput(e) {
    this.setData({
      commentText: e.detail.value
    });
  },

  // 发送评论
  async onSendComment() {
    const { commentText, currentPhoto, photos, currentIndex } = this.data;
    
    if (!commentText.trim()) {
      return;
    }

    const newComment = {
      id: `comment_${Date.now()}`,
      username: '我',
      content: commentText.trim(),
      time: this.formatTime(new Date()),
      avatar: '/assets/icons/default-avatar.svg'
    };

    // 更新当前照片的评论
    const updatedPhoto = {
      ...currentPhoto,
      comments: [...(currentPhoto.comments || []), newComment]
    };

    // 更新照片列表
    const updatedPhotos = [...photos];
    updatedPhotos[currentIndex] = updatedPhoto;

    this.setData({
      currentPhoto: updatedPhoto,
      photos: updatedPhotos,
      commentText: ''
    });

    // 调用评论API
    try {
      await this.callCommentAPI(currentPhoto.id, commentText.trim());
      wx.showToast({
        title: '评论成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('评论失败:', error);
      wx.showToast({
        title: '评论失败',
        icon: 'none'
      });
    }
  },

  // 模拟点赞API调用
  async callLikeAPI(photoId, isLiked) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log(`${isLiked ? '点赞' : '取消点赞'} 照片:`, photoId);
    // 实际实现中应该调用真实的API
    // return wx.request({
    //   url: '/share/like',
    //   method: 'POST',
    //   data: { shareId: this.data.shareId, photoId, isLiked }
    // });
  },

  // 模拟评论API调用
  async callCommentAPI(photoId, content) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('评论照片:', photoId, '内容:', content);
    // 实际实现中应该调用真实的API
    // return wx.request({
    //   url: '/share/comment',
    //   method: 'POST',
    //   data: { shareId: this.data.shareId, photoId, content }
    // });
  },

  // 格式化时间
  formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return date.toLocaleDateString();
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