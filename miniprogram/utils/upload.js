// utils/upload.js
const { CONFIG } = require('./request');
const { getConfigManager, API_ENDPOINTS } = require('./config');

// 使用统一的配置管理器
const configManager = getConfigManager();
const API_BASE = configManager.getApiUrl();

/**
 * 判断是否需要压缩图片
 * 仅在开发者工具里（或图片超过阈值时）做压缩，避免 Vercel 413
 * - 不影响真机正常体验
 * - 压缩质量可按需微调
 */
function needCompressForDevtoolsOrLarge(filePath, approxBytes) {
  const { platform } = wx.getSystemInfoSync(); // 'ios' | 'android' | 'devtools'
  const isDevtools = platform === 'devtools';
  const TOO_LARGE = 700 * 1024; // 700KB 阈值（你也可以改成 800KB）

  return isDevtools || (typeof approxBytes === 'number' && approxBytes > TOO_LARGE);
}

/**
 * 智能压缩图片
 * 根据环境和文件大小决定是否压缩
 */
async function compressIfNeeded(filePath, approxBytes) {
  if (!needCompressForDevtoolsOrLarge(filePath, approxBytes)) {
    return filePath; // 不需要压缩
  }
  
  // 开发者工具降一点质量；手机端只在超阈值时降一点点
  const { platform } = wx.getSystemInfoSync();
  const isDevtools = platform === 'devtools';
  const quality = isDevtools ? 60 : 80; // 可在 50~85 间调整

  return new Promise((resolve, reject) => {
    wx.compressImage({
      src: filePath,
      quality,
      success: res => {
        console.log(`✅ 图片压缩成功: ${filePath} -> ${res.tempFilePath}, 质量: ${quality}%`);
        resolve(res.tempFilePath);
      },
      fail: err => {
        console.warn('⚠️ 图片压缩失败，使用原图:', err);
        resolve(filePath); // 压缩失败也别中断，继续用原图
      }
    });
  });
}

/**
 * 将本地文件转换为base64格式（支持智能压缩）
 * @param {string} filePath - 文件路径
 * @param {string} mime - MIME类型，默认为image/jpeg
 * @param {Object} options - 选项 {enableCompression: boolean}
 * @returns {Promise<string>} 返回data:image/jpeg;base64,xxx格式的字符串
 */
const readFileToBase64 = async (filePath, mime = 'image/jpeg', options = {}) => {
  try {
    const { enableCompression = true } = options;
    let finalFilePath = filePath;
    
    // 如果启用压缩，先获取文件信息并判断是否需要压缩
    if (enableCompression) {
      try {
        const fileInfo = await new Promise((resolve, reject) => {
          wx.getFileInfo({
            filePath,
            success: resolve,
            fail: reject
          });
        });
        
        console.log(`📊 文件信息: ${filePath}, 大小: ${(fileInfo.size / 1024).toFixed(1)}KB`);
        
        // 根据文件大小和环境决定是否压缩
        finalFilePath = await compressIfNeeded(filePath, fileInfo.size);
        
      } catch (error) {
        console.warn('⚠️ 获取文件信息失败，跳过压缩:', error);
        // 继续使用原文件路径
      }
    }
    
    // 转换为base64
    return new Promise((resolve, reject) => {
      const fs = wx.getFileSystemManager();
      fs.readFile({
        filePath: finalFilePath,
        encoding: 'base64',
        success: (res) => {
          const base64Data = `data:${mime};base64,${res.data}`;
          const sizeKB = (base64Data.length * 0.75 / 1024).toFixed(1); // base64大约比原文件大33%
          console.log(`✅ 文件转base64成功: ${filePath} -> ${sizeKB}KB`);
          resolve(base64Data);
        },
        fail: (error) => {
          console.error('❌ 文件转base64失败:', finalFilePath, error);
          reject(error);
        }
      });
    });
    
  } catch (error) {
    console.error('❌ readFileToBase64 处理失败:', error);
    throw error;
  }
};

/**
 * 直接发送base64图片数据到AI分析接口
 * @param {Object} params - 参数对象
 * @param {Array} params.photos - 照片数组，每个元素包含{base64, size?, mimeType?, path?}
 * @param {string} params.sessionId - 会话ID
 * @returns {Promise} AI分析结果
 */
const analyzePhotosDirectly = ({ photos, sessionId }) => {
  return new Promise((resolve, reject) => {
    console.log('🎯 开始直接AI分析，照片数量:', photos.length);
    
    // 验证输入数据
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return reject(new Error('照片数据无效'));
    }
    
    if (!sessionId) {
      return reject(new Error('sessionId 不能为空'));
    }
    
    // 构建 photos 数组结构（服务端期望的格式）
    const photosData = photos.map((p, idx) => {
      // 去掉 data URL 前缀，只传纯 base64
      const base64 = (p.base64 || '').replace(/^data:\w+\/[\w.+-]+;base64,/, '');
      
      return {
        id: p.id || `photo_${idx + 1}`,
        base64: base64,
        width: p.width || 0,
        height: p.height || 0,
        orientation: p.orientation || 'landscape'
      };
    });
    
    // 容错：如果有空 base64，直接拦截，避免 500
    const emptyIdx = photosData.findIndex(x => !x.base64);
    if (emptyIdx !== -1) {
      return reject(new Error(`第 ${emptyIdx + 1} 张图片的 base64 为空，已中止请求`));
    }
    
    // 检测是否在开发者工具环境
    const { platform } = wx.getSystemInfoSync();
    const source = platform === 'devtools' ? 'weapp-devtools' : 'weapp-device';
    
    const requestData = {
      sessionId,
      images: photosData,  // 👈 关键：改为 images 字段匹配新 API
      needScores: true
    };
    
    const API_PICK = API_BASE + API_ENDPOINTS.pick;
    console.log('📡 发送请求到:', API_PICK);
    console.log('📊 请求数据结构:', {
      sessionId: requestData.sessionId,
      imagesCount: requestData.images.length,
      needScores: requestData.needScores,
      firstImagePreview: requestData.images[0] ? {
        id: requestData.images[0].id,
        width: requestData.images[0].width,
        height: requestData.images[0].height,
        orientation: requestData.images[0].orientation,
        base64Length: requestData.images[0].base64.length
      } : null
    });
    
    wx.request({
      url: API_PICK,
      method: 'POST',
      header: { 
        'Content-Type': 'application/json' 
      },
      data: requestData,
      timeout: 30000,
      success: (res) => {
        console.log('✅ AI分析请求成功:', res);
        const { statusCode, data } = res;
        
        if (statusCode >= 200 && statusCode < 300) {
          console.log('🎉 AI分析完成，结果:', data);
          resolve(data);
        } else if (statusCode === 400) {
          // 400错误的友好提示
          const errorInfo = data || {};
          const errorMessage = errorInfo.message || errorInfo.error || errorInfo.debug || `状态码: ${statusCode}`;
          console.error('❌ AI分析参数错误:', errorMessage);
          console.error('❌ 详细错误信息:', data);
          reject(new Error(`参数错误: ${errorMessage}`));
        } else {
          console.error('❌ AI分析状态码错误:', statusCode, data);
          reject(new Error(`AI分析失败，状态码: ${statusCode}`));
        }
      },
      fail: (err) => {
        console.error('❌ AI分析网络错误:', err);
        reject(new Error('网络请求失败: ' + (err.errMsg || err.message || '未知错误')));
      }
    });
  });
};

/**
 * 检查网络连接状态
 * @returns {Promise<boolean>} 网络是否可用
 */
const checkNetworkStatus = () => {
  return new Promise((resolve) => {
    if (typeof wx !== 'undefined' && wx.getNetworkType) {
      wx.getNetworkType({
        success: (res) => {
          const isConnected = res.networkType !== 'none';
          console.log('🌐 网络状态检查:', res.networkType, isConnected ? '✅ 已连接' : '❌ 未连接');
          resolve(isConnected);
        },
        fail: () => {
          console.warn('⚠️ 无法获取网络状态，假设网络可用');
          resolve(true);
        }
      });
    } else {
      // 非小程序环境，假设网络可用
      resolve(true);
    }
  });
};

/**
 * 验证上传配置
 * @returns {boolean} 配置是否有效
 */
const validateUploadConfig = () => {
  if (!API_BASE) {
    console.error('❌ 上传配置错误: API_BASE 未定义');
    return false;
  }
  
  if (!API_BASE.startsWith('https://') && !API_BASE.startsWith('http://')) {
    console.error('❌ 上传配置错误: API_BASE 格式无效', API_BASE);
    return false;
  }
  
  console.log('✅ 上传配置验证通过:', API_BASE);
  return true;
};

/**
 * 上传单个文件
 * @param {string} filePath - 文件路径
 * @param {string} name - 表单字段名
 * @returns {Promise} 上传结果
 */
const uploadFile = (filePath, name = 'file') => {
  return new Promise(async (resolve, reject) => {
    console.log('📤 开始上传文件:', filePath);
    
    // 预检查：验证配置
    if (!validateUploadConfig()) {
      return reject(new Error('上传配置无效，请检查网络设置'));
    }
    
    // 预检查：网络状态
    const isNetworkAvailable = await checkNetworkStatus();
    if (!isNetworkAvailable) {
      return reject(new Error('网络连接不可用，请检查网络设置'));
    }
    
    // 设置上传超时
    const uploadTimeout = setTimeout(() => {
      console.error('❌ 文件上传超时:', filePath);
      reject(new Error('文件上传超时，请检查网络连接后重试'));
    }, 120000); // 2分钟超时
    
    wx.uploadFile({
      url: API_BASE + '/api/upload',
      filePath: filePath,
      name: name,
      header: {
        'content-type': 'multipart/form-data'
      },
      success: (res) => {
        clearTimeout(uploadTimeout);
        console.log('✅ 文件上传成功:', res);
        
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data);
            resolve(data);
          } catch (error) {
            console.error('❌ 解析上传响应失败:', error);
            reject(new Error('解析上传响应失败'));
          }
        } else {
          console.error('❌ 上传状态码错误:', res.statusCode);
          reject(new Error(`上传失败: ${res.statusCode}`));
        }
      },
      fail: (error) => {
        clearTimeout(uploadTimeout);
        console.error('❌ 文件上传失败:', error);
        
        // 创建更友好的错误信息
        let errorMessage = '文件上传失败';
        let shouldRetry = false;
        
        if (error.errMsg) {
          if (error.errMsg.includes('timeout')) {
            errorMessage = '上传超时，请检查网络连接后重试';
            shouldRetry = true;
          } else if (error.errMsg.includes('ECONNRESET')) {
            errorMessage = '连接被重置，服务器可能繁忙，请稍后重试';
            shouldRetry = true;
          } else if (error.errMsg.includes('ECONNREFUSED')) {
            errorMessage = '无法连接到服务器，请检查网络设置';
            shouldRetry = false;
          } else if (error.errMsg.includes('503')) {
            errorMessage = '服务器暂时不可用，请稍后重试';
            shouldRetry = true;
          } else if (error.errMsg.includes('502') || error.errMsg.includes('504')) {
            errorMessage = '服务器网关错误，请稍后重试';
            shouldRetry = true;
          } else if (error.errMsg.includes('fail')) {
            errorMessage = '网络连接失败，请检查网络设置后重试';
            shouldRetry = true;
          }
        }
        
        console.error('❌ 上传失败详情:', {
          filePath,
          errorMessage,
          originalError: error.errMsg,
          shouldRetry,
          apiBase: API_BASE
        });
        
        const enhancedError = new Error(errorMessage);
        enhancedError.originalError = error;
        reject(enhancedError);
      }
    });
  });
};

/**
 * 批量上传文件
 * @param {Array} filePaths - 文件路径数组
 * @param {Object} options - 选项
 * @returns {Promise} 上传结果
 */
const uploadFiles = (filePaths, options = {}) => {
  const { 
    concurrency = 3, // 并发数
    onProgress = null // 进度回调
  } = options;
  
  console.log(`📤 开始批量上传 ${filePaths.length} 个文件，并发数: ${concurrency}`);
  
  const results = [];
  const errors = [];
  
  // 递归处理批次
  const processBatch = (startIndex) => {
    if (startIndex >= filePaths.length) {
      console.log(`🎉 批量上传完成，成功: ${results.length}，失败: ${errors.length}`);
      
      if (errors.length > 0) {
        console.warn('⚠️ 部分文件上传失败:', errors);
      }
      
      return Promise.resolve({
        success: results,
        errors: errors,
        total: filePaths.length
      });
    }
    
    const batch = filePaths.slice(startIndex, startIndex + concurrency);
    console.log(`📦 处理批次 ${Math.floor(startIndex / concurrency) + 1}，文件数: ${batch.length}`);
    
    // 并发上传当前批次
    const batchPromises = batch.map((filePath, index) => {
      return uploadFile(filePath).then((result) => {
        // 调用进度回调
        if (onProgress) {
          onProgress({
            current: startIndex + index + 1,
            total: filePaths.length,
            file: result
          });
        }
        
        return result;
      }).catch((error) => {
        console.error(`❌ 文件上传失败: ${filePath}`, error);
        errors.push({ filePath, error });
        return null;
      });
    });
    
    return Promise.allSettled(batchPromises).then((batchResults) => {
      // 收集成功的结果
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        }
      });
      
      // 添加延迟避免请求过于频繁
      if (startIndex + concurrency < filePaths.length) {
        return new Promise(resolve => setTimeout(resolve, 100)).then(() => {
          return processBatch(startIndex + concurrency);
        });
      } else {
        return processBatch(startIndex + concurrency);
      }
    });
  };
  
  return processBatch(0);
};

/**
 * 上传单个文件（增强版）
 * @param {string} filePath - 文件路径
 * @param {Object} options - 选项
 * @returns {Promise} 上传结果
 */
const uploadFileEnhanced = (filePath, options = {}) => {
  const {
    timeout = 120000, // 2分钟超时
    retryTimes = 2,    // 重试次数
    onProgress = null  // 进度回调
  } = options;
  
  console.log(`📤 开始增强版上传文件: ${filePath}`);
  
  return new Promise(async (resolve, reject) => {
    // 预检查：验证配置
    if (!validateUploadConfig()) {
      return reject(new Error('上传配置无效，请检查网络设置'));
    }
    
    // 预检查：网络状态
    const isNetworkAvailable = await checkNetworkStatus();
    if (!isNetworkAvailable) {
      return reject(new Error('网络连接不可用，请检查网络设置'));
    }
    
    let retryCount = 0;
    
    const attemptUpload = async () => {
      const uploadTask = wx.uploadFile({
        url: `${API_BASE}/api/upload`,
        filePath,
        name: 'file',
        timeout,
        success: (res) => {
          try {
            console.log(`✅ 文件上传成功: ${filePath}`, res);
            
            // 解析响应数据
            const data = JSON.parse(res.data || '{}');
            
            if (data && data.success) {
              resolve({
                success: true,
                filename: data.filename,
                url: data.url,
                fullUrl: data.urls ? data.urls.preview : `${API_BASE}${data.url}`,
                fileKey: data.fileKey,
                originalPath: filePath,
                urls: data.urls // 保存完整的URLs对象
              });
            } else {
              throw new Error(data?.message || '服务器返回失败状态');
            }
          } catch (parseError) {
            console.error(`❌ 解析上传响应失败: ${filePath}`, parseError);
            
            // 如果还有重试次数，则重试
            if (retryCount < retryTimes) {
              retryCount++;
              console.log(`🔄 解析失败，重试第 ${retryCount} 次: ${filePath}`);
              // 重试前再次检查网络状态
              checkNetworkStatus().then(networkOk => {
                if (networkOk) {
                  setTimeout(attemptUpload, 1000 * retryCount);
                } else {
                  reject(new Error('网络连接已断开，无法重试'));
                }
              }).catch(() => {
                // 网络检查失败，仍然尝试重试
                setTimeout(attemptUpload, 1000 * retryCount);
              });
            } else {
              reject(new Error(`响应解析失败，已重试${retryTimes}次: ${parseError.message}`));
            }
          }
        },
        fail: (error) => {
          console.error(`❌ 文件上传失败: ${filePath}`, error);
          
          // 分析错误类型
          let errorMessage = '上传失败';
          let shouldRetry = false;
          
          if (error.errMsg) {
            if (error.errMsg.includes('timeout')) {
              errorMessage = '上传超时，请检查网络连接后重试';
              shouldRetry = true;
            } else if (error.errMsg.includes('fail uploadFile:fail')) {
              errorMessage = '网络连接失败，请检查网络设置后重试';
              shouldRetry = true;
            } else if (error.errMsg.includes('ECONNRESET')) {
              errorMessage = '连接被重置，服务器可能繁忙，请稍后重试';
              shouldRetry = true;
            } else if (error.errMsg.includes('ECONNREFUSED')) {
              errorMessage = '无法连接到服务器，请检查网络设置';
              shouldRetry = false;
            } else if (error.errMsg.includes('503')) {
              errorMessage = '服务器暂时不可用，请稍后重试';
              shouldRetry = true;
            } else if (error.errMsg.includes('502') || error.errMsg.includes('504')) {
              errorMessage = '服务器网关错误，请稍后重试';
              shouldRetry = true;
            } else if (error.errMsg.includes('404')) {
              errorMessage = '上传接口不存在，请检查配置';
              shouldRetry = false;
            } else {
              errorMessage = error.errMsg;
              shouldRetry = true;
            }
          }
          
          console.error('❌ 上传失败详情:', {
            filePath,
            retryCount,
            errorMessage,
            originalError: error.errMsg,
            shouldRetry,
            apiBase: API_BASE
          });
          
          // 如果可以重试且还有重试次数
          if (shouldRetry && retryCount < retryTimes) {
            retryCount++;
            console.log(`🔄 上传失败，重试第 ${retryCount} 次: ${filePath}`);
            
            // 重试前检查网络状态
            checkNetworkStatus().then(networkOk => {
              if (networkOk) {
                setTimeout(attemptUpload, 1000 * retryCount);
              } else {
                reject(new Error('网络连接已断开，无法重试'));
              }
            }).catch(() => {
              // 网络检查失败，仍然尝试重试
              setTimeout(attemptUpload, 1000 * retryCount);
            });
          } else {
            const finalError = new Error(retryCount >= retryTimes ? 
              `${errorMessage}，已重试${retryTimes}次` : errorMessage);
            finalError.originalError = error;
            reject(finalError);
          }
        }
      });
      
      // 监听上传进度
      if (onProgress && uploadTask.onProgressUpdate) {
        uploadTask.onProgressUpdate((progressRes) => {
          const progress = Math.round((progressRes.progress / 100) * 100);
          console.log(`📊 上传进度: ${filePath} - ${progress}%`);
          onProgress(progress, filePath);
        });
      }
    };
    
    attemptUpload();
  });
};

/**
 * 批量上传文件（增强版）
 * @param {Array} filePaths - 文件路径数组
 * @param {Object} options - 选项
 * @returns {Promise} 批量上传结果
 */
const uploadFilesEnhanced = (filePaths, options = {}) => {
  const {
    concurrency = 2,     // 并发数，降低以减少服务器压力
    onProgress = null,   // 进度回调
    onUploadProgress = null, // 单个文件上传进度回调
    timeout = 120000     // 超时时间
  } = options;
  
  console.log(`📤 开始批量上传 ${filePaths.length} 个文件，并发数: ${concurrency}`);
  
  const results = [];
  const errors = [];
  let completedCount = 0;
  
  // 递归处理批次
  const processBatch = (startIndex) => {
    if (startIndex >= filePaths.length) {
      console.log(`🎉 批量上传完成，成功: ${results.length}，失败: ${errors.length}`);
      
      if (errors.length > 0) {
        console.warn('⚠️ 部分文件上传失败:', errors);
      }
      
      return Promise.resolve({
        success: results,
        errors: errors,
        total: filePaths.length,
        successCount: results.length,
        errorCount: errors.length
      });
    }
    
    const endIndex = Math.min(startIndex + concurrency, filePaths.length);
    const batchPaths = filePaths.slice(startIndex, endIndex);
    
    console.log(`📦 处理批次 ${Math.floor(startIndex / concurrency) + 1}，文件 ${startIndex + 1}-${endIndex}`);
    
    const batchPromises = batchPaths.map((filePath, index) => {
      return uploadFileEnhanced(filePath, {
        timeout,
        onProgress: onUploadProgress
      }).then((result) => {
        completedCount++;
        console.log(`✅ 文件上传成功: ${filePath}`);
        results.push(result);
        
        // 调用总体进度回调
        if (onProgress) {
          const progress = Math.round((completedCount / filePaths.length) * 100);
          onProgress(progress, completedCount, filePaths.length);
        }
        
        return result;
      }).catch((error) => {
        completedCount++;
        console.error(`❌ 文件上传失败: ${filePath}`, error);
        errors.push({ filePath, error: error.message });
        
        // 调用总体进度回调
        if (onProgress) {
          const progress = Math.round((completedCount / filePaths.length) * 100);
          onProgress(progress, completedCount, filePaths.length);
        }
        
        return null;
      });
    });
    
    return Promise.allSettled(batchPromises).then((batchResults) => {
      // 添加延迟避免请求过于频繁
      if (startIndex + concurrency < filePaths.length) {
        return new Promise(resolve => setTimeout(resolve, 500)).then(() => {
          return processBatch(startIndex + concurrency);
        });
      } else {
        return processBatch(startIndex + concurrency);
      }
    });
  };
  
  return processBatch(0);
};

/**
 * 上传并分析照片
 * @param {Array} filePaths - 文件路径数组
 * @param {string} sessionId - 会话ID
 * @param {Object} options - 选项
 * @returns {Promise} 分析结果
 */
const uploadAndAnalyze = (filePaths, sessionId, options = {}) => {
  console.log('🔄 开始上传并分析照片流程');
  
  // 1. 批量上传文件
  return uploadFilesEnhanced(filePaths, {
    concurrency: 3,
    onProgress: options.onUploadProgress
  }).then((uploadResult) => {
    if (uploadResult.success.length === 0) {
      throw new Error('没有文件上传成功');
    }
    
    if (uploadResult.success.length < 2) {
      throw new Error('至少需要2张照片才能进行分析');
    }
    
    console.log('📋 上传结果详情:', uploadResult);
    
    // 2. 提取文件keys
    console.log('🔍 检查上传结果结构:', uploadResult);
    console.log('📋 完整上传结果:', JSON.stringify(uploadResult, null, 2));
    
    let fileKeys;
    try {
      // uploadFilesEnhanced返回格式：{ success: [...], errors: [...] }
      if (uploadResult.success && Array.isArray(uploadResult.success)) {
        console.log('🔍 检查success数组第一个元素:', uploadResult.success[0]);
        
        // 检查success数组中每个元素的结构
        if (uploadResult.success[0] && uploadResult.success[0].photos && Array.isArray(uploadResult.success[0].photos)) {
          // 如果每个success元素包含photos数组
          fileKeys = [];
          uploadResult.success.forEach(result => {
            if (result.photos) {
              result.photos.forEach(photo => {
                fileKeys.push(photo.id || photo.fileKey || photo.filename);
              });
            }
          });
          console.log('✅ 从success[].photos数组提取fileKeys:', fileKeys);
        } else if (uploadResult.success[0] && uploadResult.success[0].files && Array.isArray(uploadResult.success[0].files)) {
          // 如果每个success元素包含files数组
          fileKeys = [];
          uploadResult.success.forEach(result => {
            if (result.files) {
              result.files.forEach(file => {
                fileKeys.push(file.id || file.fileKey || file.filename);
              });
            }
          });
          console.log('✅ 从success[].files数组提取fileKeys:', fileKeys);
        } else if (uploadResult.success[0] && (uploadResult.success[0].id || uploadResult.success[0].fileKey || uploadResult.success[0].filename || uploadResult.success[0].fullUrl)) {
          // 如果success数组中直接是文件对象
          fileKeys = uploadResult.success.map(file => 
            file.id || file.fileKey || file.filename || file.fullUrl || `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          );
          console.log('✅ 从success数组直接提取fileKeys:', fileKeys);
        } else {
          console.error('❌ success数组格式不正确');
          console.log('📋 success[0]示例:', JSON.stringify(uploadResult.success[0], null, 2));
          throw new Error('success数组格式不正确');
        }
      } else {
        console.error('❌ 无法识别的上传结果格式');
        console.log('📋 上传结果示例:', JSON.stringify(uploadResult, null, 2));
        throw new Error('无法从上传结果中提取fileKey');
      }
      
      // 验证fileKeys
      if (!fileKeys || fileKeys.length === 0) {
        throw new Error('提取到的fileKeys为空');
      }
      
    } catch (error) {
      console.error('❌ 提取fileKeys失败:', error);
      console.log('📋 上传结果示例:', JSON.stringify(uploadResult, null, 2));
      throw new Error(`文件上传结果格式错误: ${error.message}`);
    }
    
    console.log('📊 准备分析照片，文件keys:', fileKeys);
    console.log('🔑 会话ID:', sessionId);
    
    // 3. 调用AI分析接口
    console.log('🚀 开始调用AI分析接口...');
    const { request } = require('./request');
    
    return request(API_PATHS.AI_PICK, {
      method: 'POST',
      data: {
        sessionId,
        fileKeys
      }
    }).then((analysisResult) => {
      console.log('🎉 照片分析完成，结果:', analysisResult);
      
      return {
        uploadResult,
        analysisResult,
        fileKeys
      };
    }).catch((aiError) => {
      console.error('❌ AI分析接口调用失败:', aiError);
      console.error('❌ AI错误详情:', JSON.stringify(aiError, null, 2));
      throw new Error(`AI分析失败: ${aiError.message || aiError.errMsg || '未知错误'}`);
    });
    
  }).catch((error) => {
    console.error('❌ 上传并分析失败:', error);
    throw error;
  });
};

// 导出所有函数
module.exports = {
  readFileToBase64,
  analyzePhotosDirectly,
  // 以下函数已废弃，现在直接使用base64发送到/api/pick
  // uploadFile,
  // uploadFiles,
  // uploadAndAnalyze,
  // uploadFileEnhanced,
  // uploadFilesEnhanced
};