// pages/compare/index.js
const { normalizeUrl } = require('../../utils/url');

Page({
  data: {
    photos: [],
    bestPhoto: null,
    comparisonPhotos: [],
    currentPhoto: null,
    currentIndex: 0,
    isHorizontal: false,
    history: [],
    canUndo: false,
    bestSelected: false,
    candidateSelected: false,
    touchStartX: 0,
    touchStartY: 0,
    keepCount: 0,
    windowWidth: 0,
    windowHeight: 0,
    bestWrapperStyle: '',
    candidateWrapperStyle: '',
    candidateSwipeClass: '',
    showFullscreen: false,
    fullscreenPhoto: null,
    // 全屏缩放相关
    imageScale: 1,
    imageX: 0,
    imageY: 0,
    // 图片加载状态
    bestImageLoaded: false,
    bestImageError: false,
    candidateImageLoaded: false,
    candidateImageError: false
  },

  async onLoad(options) {
    const app = getApp();
    let photos = app.globalData.photos || [];
    const aiResult = app.globalData.aiResult;

    // 如果没有照片数据，添加测试数据用于开发调试
    if (!photos.length) {
      console.log('没有照片数据，添加测试数据');
      photos = [
        {
          id: 'test1',
          path: '/assets/test/1.jpg',
          width: 800,
          height: 600,
          size: 150000,
          orientation: 'landscape'
        },
        {
          id: 'test2', 
          path: '/assets/test/test-photo.svg',
          width: 400,
          height: 600,
          size: 80000,
          orientation: 'portrait'
        }
      ];
      app.globalData.photos = photos;
      console.log('已添加测试照片数据:', photos);
    }

    // 获取AI推荐的最佳照片，如果没有AI结果则使用第一张
    let bestPhoto = photos[0];
    if (aiResult && aiResult.bestPhoto) {
      bestPhoto = photos.find(p => p.id === aiResult.bestPhoto.id) || photos[0];
    }

    // 其他照片作为对比照片
    const comparisonPhotos = photos.filter(photo => photo.id !== bestPhoto.id);

    if (comparisonPhotos.length === 0) {
      wx.showToast({
        title: '需要至少2张照片进行对比',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    // 处理图片URL
    const bestPhotoUrl = this.getPhotoUrl(bestPhoto);
    const currentPhotoUrl = this.getPhotoUrl(comparisonPhotos[0]);

    this.setData({
      photos: photos,
      bestPhoto: bestPhoto, // 保持完整的照片对象
      bestPhotoUrl: bestPhotoUrl, // 添加处理后的URL
      comparisonPhotos: comparisonPhotos, // 保持完整的照片对象数组
      currentPhoto: comparisonPhotos[0], // 保持完整的照片对象
      currentPhotoUrl: currentPhotoUrl, // 添加处理后的URL
      currentIndex: 0,
      totalPhotos: photos.length,
      selectedCount: 1 // 最佳照片已经算作选中的1张
    });

    console.log('Best Photo:', this.data.bestPhoto);
    console.log('Best Photo URL:', bestPhotoUrl);
    console.log('Current Photo:', this.data.currentPhoto);
    console.log('Current Photo URL:', currentPhotoUrl);

    // 使用getImageInfo来验证图片是否可以加载，而不是getFileInfo
    this.validateImagePath(bestPhotoUrl, 'Best photo');
    this.validateImagePath(currentPhotoUrl, 'Current photo');

    // 检测照片方向
    this.checkImageOrientation(bestPhotoUrl);
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      windowWidth: systemInfo.windowWidth,
      windowHeight: systemInfo.windowHeight
    });
    await this.loadPhotoStyles();
  },

  // 验证图片路径是否有效
  validateImagePath(imagePath, description) {
    if (!imagePath) {
      console.warn(`${description} path is empty`);
      return Promise.reject(new Error('Empty path'));
    }

    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: imagePath,
        success: (res) => {
          console.log(`${description} loaded successfully:`, {
            width: res.width,
            height: res.height,
            path: res.path
          });
          resolve(res);
        },
        fail: (err) => {
          console.error(`${description} load failed:`, err);
          
          // 尝试降级处理
          this.handleImageLoadFailure(imagePath, description, err);
          reject(err);
        }
      });
    });
  },

  // 获取照片的有效URL
  getPhotoUrl(photo) {
    if (!photo) {
      console.error('❌ getPhotoUrl: 照片对象为空');
      return '';
    }

    console.log('🔍 处理照片URL，照片对象:', JSON.stringify(photo, null, 2));

    // 优先使用preview URL
    if (photo.urls && photo.urls.preview) {
      const url = normalizeUrl(photo.urls.preview);
      console.log('✅ 使用preview URL:', url);
      return url;
    }
    // 如果preview URL不可用，使用thumb URL
    else if (photo.urls && photo.urls.thumb) {
      const url = normalizeUrl(photo.urls.thumb);
      console.log('✅ 使用thumb URL:', url);
      return url;
    }
    // 最后的fallback：使用tempFilePath
    else if (photo.tempFilePath) {
      console.log('✅ 使用tempFilePath:', photo.tempFilePath);
      return photo.tempFilePath;
    }
    // 如果都没有，尝试使用path字段
    else if (photo.path) {
      console.log('⚠️ 使用path字段:', photo.path);
      return photo.path;
    }

    console.error('❌ 无法获取有效的图片URL');
    return '';
  },

  // 处理图片加载失败的降级逻辑
  handleImageLoadFailure(imagePath, description, error) {
    console.log(`Attempting fallback for ${description}...`);
    
    // 如果是网络图片，可以尝试重新加载
    if (imagePath.startsWith('http')) {
      // 添加时间戳重试
      const retryPath = imagePath + (imagePath.includes('?') ? '&' : '?') + 't=' + Date.now();
      
      setTimeout(() => {
        wx.getImageInfo({
          src: retryPath,
          success: (res) => {
            console.log(`${description} retry successful`);
          },
          fail: (retryErr) => {
            console.error(`${description} retry also failed:`, retryErr);
            // 可以在这里设置默认图片或显示占位符
          }
        });
      }, 1000);
    }
  },

  checkImageOrientation(imagePath) {
    wx.getImageInfo({
      src: imagePath,
      success: (res) => {
        const isHorizontal = res.width > res.height
        this.setData({
          isHorizontal
        })
      },
      fail: () => {
        // 默认为横版
        this.setData({
          isHorizontal: true
        })
      }
    })
  },

  onUndo() {
    if (!this.data.canUndo || !this.data.history.length) return;

    const lastAction = this.data.history[this.data.history.length - 1];
    const app = getApp();

    // 恢复上一次的决定
    let selectedCount = this.data.selectedCount;
    if (lastAction.type === 'keep' || lastAction.type === 'better') {
      selectedCount--;
      this.setData({
        keepCount: this.data.keepCount - 1
      });
    }
    delete app.globalData.compareDecisions[lastAction.photoId];

    // 更新历史记录和当前照片
    const history = this.data.history.slice(0, -1);
    const currentIndex = lastAction.index;
    const currentPhoto = this.data.comparisonPhotos[currentIndex];

    this.setData({
      currentIndex,
      currentPhoto,
      history,
      selectedCount,
      canUndo: history.length > 0
    });
  },

  onWorse() {
    this.makeDecision('worse');
  },

  onSame() {
    this.makeDecision('keep');
  },

  onBetter() {
    this.makeDecision('better');
  },

  makeDecision(decision) {
    const { currentPhoto, currentIndex, photos } = this.data;
    if (!currentPhoto) return;

    const app = getApp();
    app.globalData.compareDecisions = app.globalData.compareDecisions || {};
    app.globalData.compareDecisions[currentPhoto.id] = decision;

    // 更新历史记录
    const history = [...this.data.history, {
      type: decision,
      photoId: currentPhoto.id,
      index: currentIndex
    }];

    // 更新保存计数
    let keepCount = this.data.keepCount;
    let selectedCount = this.data.selectedCount;
    if (decision === 'keep' || decision === 'better') {
      keepCount++;
      selectedCount++;
    }

    // 移动到下一张照片
    const nextIndex = currentIndex + 1;
    if (nextIndex < this.data.comparisonPhotos.length) {
      const nextPhoto = this.data.comparisonPhotos[nextIndex];
      const nextPhotoUrl = this.getPhotoUrl(nextPhoto);
      this.setData({
        currentIndex: nextIndex,
        currentPhoto: nextPhoto,
        currentPhotoUrl: nextPhotoUrl,
        history,
        keepCount,
        selectedCount,
        canUndo: true
      });
      // 检测新照片的方向
      this.checkImageOrientation(nextPhotoUrl);
    } else {
      // 所有照片都已对比完成
      this.setData({
        history,
        keepCount,
        selectedCount,
        canUndo: true
      }, () => {
        // 保存对比结果
        app.globalData.compareResult = {
          bestPhoto: this.data.bestPhoto,
          decisions: app.globalData.compareDecisions
        };

        // 跳转到相册页面，使用navigateTo而不是redirectTo
        wx.navigateTo({
          url: '/pages/album/index',
          success: () => {
            console.log('成功跳转到相册页面');
          },
          fail: (err) => {
            console.error('跳转失败:', err);
            wx.showToast({
              title: '页面跳转失败',
              icon: 'none'
            });
          }
        });
      });
    }
  },

  onViewFullscreen(e) {
    const photo = e.currentTarget.dataset.photo;
    if (!photo) return;

    // 获取所有照片的路径，用于预览时切换
    const urls = [this.data.bestPhoto.path];
    if (this.data.currentPhoto) {
      urls.push(this.data.currentPhoto.path);
    }

    // 确定当前照片在预览列表中的索引
    const current = photo.id === this.data.bestPhoto.id ? 0 : 1;

    wx.previewImage({
      urls,
      current: urls[current],
      showmenu: false,
      fail: (err) => {
        console.error('预览失败:', err);
        wx.showToast({
          title: '预览失败',
          icon: 'none'
        });
      }
    });
  },

  // 处理双指缩放
  onScale(e) {
    const { scale } = e.detail;
    // 同步两张照片的缩放比例
    this.setData({
      'bestPhotoScale': scale,
      'currentPhotoScale': scale
    });
  },

  checkImageOrientation: function(imageUrl) {
    return new Promise((resolve) => {
      wx.getImageInfo({
        src: imageUrl,
        success: (res) => {
          this.setData({
            isHorizontal: res.width > res.height,
            photoWidth: res.width,
            photoHeight: res.height
          });
          resolve();
        },
        fail: () => {
          this.setData({
            isHorizontal: false
          });
          resolve();
        }
      });
    });
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      current: url,
      urls: [this.data.bestPhoto.path, this.data.currentPhoto.path]
    })
  },

  onTouchStart(e) {
    // 只处理候选照片的触摸事件
    const type = e.currentTarget.dataset.type;
    if (type !== 'candidate') return;
    
    this.startY = e.touches[0].clientY;
    this.startTime = Date.now();
  },

  onTouchMove(e) {
    if (!this.startY) return;
    
    // 只处理候选照片的触摸事件
    const type = e.currentTarget.dataset.type;
    if (type !== 'candidate') return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - this.startY;
    
    // 根据照片方向调整滑动判断
    const threshold = this.data.isHorizontal ? 30 : 50;
    
    if (Math.abs(deltaY) > threshold) {
      if (deltaY < 0) {
        // 上滑 - 替换最佳
        this.addSwipeClass('swiping-up');
      } else {
        // 下滑 - 删除候选
        this.addSwipeClass('swiping-down');
      }
    } else {
      this.removeSwipeClasses();
    }
  },

  onTouchEnd(e) {
    if (!this.startY) return;
    
    // 只处理候选照片的触摸事件
    const type = e.currentTarget.dataset.type;
    if (type !== 'candidate') return;
    
    const endY = e.changedTouches[0].clientY;
    const deltaY = endY - this.startY;
    const deltaTime = Date.now() - this.startTime;
    
    // 根据照片方向调整滑动判断
    const threshold = this.data.isHorizontal ? 30 : 50;
    const velocity = Math.abs(deltaY) / deltaTime;
    
    this.removeSwipeClasses();
    
    if (Math.abs(deltaY) > threshold || velocity > 0.5) {
      if (deltaY < 0) {
        // 上滑 - 替换最佳
        this.selectBetter();
      } else {
        // 下滑 - 删除候选
        this.selectWorse();
      }
    }
    
    this.startY = null;
    this.startTime = null;
  },

  addSwipeClass(className) {
    this.setData({
      candidateSwipeClass: className
    });
  },

  removeSwipeClasses() {
    this.setData({
      candidateSwipeClass: ''
    });
  },

  selectBetter() {
    const { currentPhoto, bestPhoto, history } = this.data
    
    // 将决策记录到全局数据中
    const app = getApp();
    app.globalData.compareDecisions = app.globalData.compareDecisions || {};
    app.globalData.compareDecisions[currentPhoto.id] = 'better';
    
    // 记录操作历史
    const newHistory = [...history]
    newHistory.push({
      action: 'better',
      oldBest: bestPhoto,
      newBest: currentPhoto
    })

    this.setData({
      bestPhoto: currentPhoto,
      history: newHistory,
      canUndo: true
    })

    wx.showToast({
      title: '已替换最佳',
      icon: 'success',
      duration: 1000
    })

    this.showNextPhoto()
  },

  selectWorse() {
    const { currentPhoto, history } = this.data
    
    // 将决策记录到全局数据中
    const app = getApp();
    app.globalData.compareDecisions = app.globalData.compareDecisions || {};
    app.globalData.compareDecisions[currentPhoto.id] = 'worse';
    
    // 记录操作历史
    const newHistory = [...history]
    newHistory.push({
      action: 'worse',
      photo: currentPhoto
    })

    this.setData({
      history: newHistory,
      canUndo: true
    })

    wx.showToast({
      title: '已删除',
      icon: 'success',
      duration: 1000
    })

    this.showNextPhoto()
  },

  saveCandidate() {
    const { currentPhoto, keepCount, history } = this.data
    
    // 将暂存决策记录到全局数据中
    const app = getApp();
    app.globalData.compareDecisions = app.globalData.compareDecisions || {};
    app.globalData.compareDecisions[currentPhoto.id] = 'keep';
    
    // 记录暂存操作
    const newHistory = [...history]
    newHistory.push({
      action: 'save',
      photo: currentPhoto,
      keepCount
    })

    this.setData({
      keepCount: keepCount + 1,
      history: newHistory,
      canUndo: true
    })

    wx.showToast({
      title: '已暂存',
      icon: 'success',
      duration: 1000
    })

    // 继续下一张
    this.showNextPhoto()
  },

  async showNextPhoto() {
    const { currentIndex, comparisonPhotos } = this.data
    const nextIndex = currentIndex + 1
    if (nextIndex < comparisonPhotos.length) {
      const nextPhoto = comparisonPhotos[nextIndex]
      const nextPhotoUrl = this.getPhotoUrl(nextPhoto)
      this.setData({
        currentPhoto: nextPhoto,
        currentPhotoUrl: nextPhotoUrl,
        currentIndex: nextIndex
      })
      
      // 检测新照片的方向
      this.checkImageOrientation(nextPhotoUrl)
    } else {
      // 所有照片对比完成
      this.saveResults()
    }
    await this.loadPhotoStyles();
  },

  saveResults() {
    // 保存对比结果到全局数据
    const app = getApp();
    app.globalData.compareResult = {
      bestPhoto: this.data.bestPhoto,
      decisions: app.globalData.compareDecisions || {}
    };

    // 跳转到相册页面
    wx.redirectTo({
      url: '/pages/album/index',
      fail: (err) => {
        console.error('跳转失败:', err);
        wx.showToast({
          title: '页面跳转失败',
          icon: 'none'
        });
      }
    });
  },

  undoLastAction: function() {
    if (this.data.history.length === 0) {
      return;
    }

    const lastAction = this.data.history[this.data.history.length - 1];
    const newHistory = this.data.history.slice(0, -1);

    // 根据不同的操作类型进行撤回
    if (lastAction.action === 'better') {
      // 撤回替换最佳操作
      this.setData({
        bestPhoto: lastAction.oldBest,
        currentIndex: this.data.currentIndex - 1,
        currentPhoto: lastAction.newBest,
        history: newHistory,
        canUndo: newHistory.length > 0
      });
    } else if (lastAction.action === 'save') {
      // 撤回暂存操作
      this.setData({
        keepCount: lastAction.keepCount,
        currentIndex: this.data.currentIndex - 1,
        currentPhoto: lastAction.photo,
        history: newHistory,
        canUndo: newHistory.length > 0
      });
    } else if (lastAction.action === 'worse') {
      // 撤回删除操作
      this.setData({
        currentIndex: this.data.currentIndex - 1,
        currentPhoto: lastAction.photo,
        history: newHistory,
        canUndo: newHistory.length > 0
      });
    }

    wx.showToast({
      title: '已撤回',
      icon: 'success',
      duration: 1000
    });
  },
  onImageLoad(e) {
    const type = e.currentTarget.dataset.type;
    console.log(`Image loaded successfully for ${type}`);
    
    // 标记图片加载成功
    if (type === 'best') {
      this.setData({ bestImageLoaded: true });
    } else if (type === 'candidate') {
      this.setData({ candidateImageLoaded: true });
    }
  },
  
  onImageError(e) {
    const type = e.currentTarget.dataset.type;
    const detail = e.detail;
    console.error(`Image load error for ${type}:`, detail);
    
    // 标记图片加载失败，可以显示占位符或错误提示
    if (type === 'best') {
      this.setData({ 
        bestImageLoaded: false,
        bestImageError: true 
      });
    } else if (type === 'candidate') {
      this.setData({ 
        candidateImageLoaded: false,
        candidateImageError: true 
      });
    }
    
    // 显示用户友好的错误提示
    wx.showToast({
      title: '图片加载失败',
      icon: 'none',
      duration: 2000
    });
  },

  onFullscreen(e) {
    const photo = e.currentTarget.dataset.photo;
    if (photo && photo.path) {
      wx.previewImage({
        current: photo.path,
        urls: [photo.path]
      });
    }
  },

  async calculateWrapperStyle(photo) {
    const {windowWidth, windowHeight, isHorizontal} = this.data;
    const padding = 60; // rpx
    const gap = 10; // rpx
    let maxWidth = windowWidth - padding * 2;
    let maxHeight = windowHeight * 0.7;
    let targetWidth, targetHeight;
    
    if (isHorizontal) {
      targetHeight = (maxHeight - gap) / 2;
      targetWidth = maxWidth;
    } else {
      targetWidth = (maxWidth - gap) / 2;
      targetHeight = maxHeight;
    }
    
    return new Promise((resolve) => {
      wx.getImageInfo({
        src: photo.path,
        success: (res) => {
          let ratio = res.width / res.height;
          let scaledWidth = targetWidth;
          let scaledHeight = targetHeight;
          
          if (isHorizontal) {
            scaledHeight = Math.min(targetHeight, res.height);
            scaledWidth = scaledHeight * ratio;
            if (scaledWidth > targetWidth) {
              scaledWidth = targetWidth;
              scaledHeight = scaledWidth / ratio;
            }
          } else {
            scaledWidth = Math.min(targetWidth, res.width);
            scaledHeight = scaledWidth / ratio;
            if (scaledHeight > targetHeight) {
              scaledHeight = targetHeight;
              scaledWidth = scaledHeight * ratio;
            }
          }
          
          resolve(`width: ${scaledWidth}rpx; height: ${scaledHeight}rpx;`);
        },
        fail: () => resolve('width: 300rpx; height: 400rpx;')
      });
    });
  },

  async loadPhotoStyles() {
    if (this.data.bestPhoto && this.data.currentPhoto) {
      const bestStyle = await this.calculateWrapperStyle(this.data.bestPhoto);
      const candidateStyle = await this.calculateWrapperStyle(this.data.currentPhoto);
      
      this.setData({
        bestWrapperStyle: bestStyle,
        candidateWrapperStyle: candidateStyle
      });
    }
  },

  // 打开全屏显示
  openFullscreen(e) {
    const { photo, type } = e.currentTarget.dataset;
    if (photo) {
      const fullscreenPhotoUrl = this.getPhotoUrl(photo);
      this.setData({
        showFullscreen: true,
        fullscreenPhoto: {
          ...photo,
          type: type
        },
        fullscreenPhotoUrl: fullscreenPhotoUrl,
        // 重置缩放状态
        imageScale: 1,
        imageX: 0,
        imageY: 0
      });
    }
  },

  // 关闭全屏显示
  closeFullscreen() {
    this.setData({
      showFullscreen: false,
      fullscreenPhoto: null
    });
  },

  // 防止点击内容区域关闭全屏
  preventClose() {
    // 空方法，用于阻止事件冒泡
  },

  // 处理图片缩放事件
  onImageScale(e) {
    this.setData({
      imageScale: e.detail.scale
    });
  },

  // 处理图片移动事件
  onImageMove(e) {
    this.setData({
      imageX: e.detail.x,
      imageY: e.detail.y
    });
  },

  // 从精选相册页面返回时的刷新功能
  refreshFromAlbum() {
    console.log('暂存页面 - 从精选相册返回，开始刷新');
    
    const app = getApp();
    
    // 重新获取照片数据
    let photos = app.globalData.photos || [];
    const aiResult = app.globalData.aiResult;
    
    if (!photos.length) {
      console.log('没有照片数据，无法刷新');
      return;
    }
    
    // 重新获取AI推荐的最佳照片
    let bestPhoto = photos[0];
    if (aiResult && aiResult.bestPhoto) {
      bestPhoto = photos.find(p => p.id === aiResult.bestPhoto.id) || photos[0];
    }
    
    // 重新筛选对比照片
    const comparisonPhotos = photos.filter(photo => photo.id !== bestPhoto.id);
    
    // 重置页面状态
    this.setData({
      photos: photos,
      bestPhoto: bestPhoto,
      comparisonPhotos: comparisonPhotos,
      currentPhoto: comparisonPhotos[0],
      currentIndex: 0,
      totalPhotos: photos.length,
      selectedCount: 1, // 最佳照片已经算作选中的1张
      history: [], // 清空历史记录
      canUndo: false,
      bestSelected: false,
      candidateSelected: false,
      keepCount: 0 // 重置暂存计数
    });
    
    // 清空全局的对比决策记录
    app.globalData.compareDecisions = {};
    app.globalData.compareResult = {};
    
    console.log('暂存页面刷新完成，重新开始照片对比');
  }
});