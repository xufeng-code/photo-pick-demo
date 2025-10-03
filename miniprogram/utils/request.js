// utils/request.js
/**
 * 统一网络请求处理
 */

// 引入配置
const { getConfigManager } = require('./config');

// 获取配置管理器实例
const configManager = getConfigManager();
const currentConfig = configManager.getConfig();

// 验证配置
if (!currentConfig || !currentConfig.BASE_URL) {
  console.error('配置错误: BASE_URL 未定义', currentConfig);
  throw new Error('配置错误: BASE_URL 未定义，请检查 utils/config.js');
}

// 统一的请求配置
const CONFIG = {
  BASE_URL: currentConfig.BASE_URL,
  API_BASE: currentConfig.BASE_URL,  // 添加缺失的API_BASE属性
  TIMEOUT: 10000,
  RETRY_COUNT: 3,
  RETRY_DELAY: 1000
};

/**
 * 网络请求方法
 * @param {string} url - 请求URL
 * @param {Object} options - 请求选项
 * @param {number} retryCount - 当前重试次数
 * @returns {Promise} 请求结果
 */
const request = (url, options = {}, retryCount = 0) => {
  // 构建完整URL
  const fullUrl = CONFIG.API_BASE + url;
  
  // 设置默认选项
  const requestOptions = {
    url: fullUrl,
    method: options.method || 'GET',
    data: options.data || {},
    header: {
      'content-type': 'application/json',
      ...options.header
    },
    timeout: CONFIG.TIMEOUT
  };
  
  console.log('🌐 发送网络请求:', {
    url: fullUrl,
    method: requestOptions.method,
    dataSize: JSON.stringify(requestOptions.data).length
  });
  
  return new Promise((resolve, reject) => {
    wx.request({
      ...requestOptions,
      success: (res) => {
        console.log('✅ 网络请求成功:', {
          statusCode: res.statusCode,
          dataSize: JSON.stringify(res.data).length
        });
        
        // 处理响应
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          // 处理错误状态码
          console.error('❌ 请求状态码错误:', res.statusCode, res);
          const error = new Error(`请求失败: ${res.statusCode}`);
          error.response = res;
          
          // 判断是否需要重试
          if (shouldRetry(res.statusCode) && retryCount < CONFIG.RETRY_TIMES) {
            console.log(`请求失败，将在${1000 * (retryCount + 1)}ms后重试（${retryCount + 1}/${CONFIG.RETRY_TIMES}）`);
            setTimeout(() => {
              request(url, options, retryCount + 1)
                .then(resolve)
                .catch(reject);
            }, 1000 * (retryCount + 1)); // 指数退避
          } else {
            reject(error);
          }
        }
      },
      fail: (err) => {
        // 处理网络错误
        console.error('❌ 网络请求失败:', {
          url: fullUrl,
          error: err,
          errorType: typeof err,
          errorMessage: err.errMsg || err.message,
          retryCount: retryCount
        });
        
        // 检查是否是可重试的网络错误
        const isRetryableError = (
          err.errMsg && (
            err.errMsg.includes('timeout') ||
            err.errMsg.includes('ECONNRESET') ||
            err.errMsg.includes('ENOTFOUND') ||
            err.errMsg.includes('ECONNREFUSED') ||
            err.errMsg.includes('network error') ||
            err.errMsg.includes('fail')
          )
        );
        
        // 判断是否需要重试
        if (isRetryableError && retryCount < CONFIG.RETRY_TIMES) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // 指数退避，最大5秒
          console.log(`🔄 检测到网络错误，将在${delay}ms后重试 (${retryCount + 1}/${CONFIG.RETRY_TIMES}):`, url);
          console.log(`🔍 错误类型: ${err.errMsg}`);
          
          // 延迟重试
          setTimeout(() => {
            request(url, options, retryCount + 1)
              .then(resolve)
              .catch(reject);
          }, delay);
        } else {
          console.error('❌ 重试次数已用完或不可重试错误，请求最终失败');
          
          // 创建更友好的错误信息
          let errorMessage = '网络连接失败';
          if (err.errMsg) {
            if (err.errMsg.includes('timeout')) {
              errorMessage = '请求超时，请检查网络连接';
            } else if (err.errMsg.includes('ECONNRESET')) {
              errorMessage = '连接被重置，请重试';
            } else if (err.errMsg.includes('ECONNREFUSED')) {
              errorMessage = '连接被拒绝，请检查服务器状态';
            } else if (err.errMsg.includes('ENOTFOUND')) {
              errorMessage = '无法找到服务器，请检查网络设置';
            }
          }
          
          const enhancedError = new Error(errorMessage);
          enhancedError.originalError = err;
          enhancedError.retryCount = retryCount;
          reject(enhancedError);
        }
      },
      complete: (res) => {
        // 可以在这里添加请求完成后的统一处理，如取消loading状态等
        if (options.complete) {
          options.complete(res);
        }
      }
    });
  });
};

/**
 * 判断是否需要重试请求
 * @param {number} statusCode - 响应状态码
 * @returns {boolean} 是否需要重试
 */
const shouldRetry = (statusCode) => {
  // 以下状态码可以考虑重试
  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  return retryableStatusCodes.includes(statusCode);
};

/**
 * GET请求
 * @param {string} url - 请求URL
 * @param {Object} params - 请求参数
 * @param {Object} options - 额外选项
 * @returns {Promise} 请求结果
 */
const get = (url, params = {}, options = {}) => {
  return request(url, { method: 'GET', data: params, ...options });
};

/**
 * POST请求
 * @param {string} url - 请求URL
 * @param {Object} data - 请求数据
 * @param {Object} options - 额外选项
 * @returns {Promise} 请求结果
 */
const post = (url, data = {}, options = {}) => {
  return request(url, { method: 'POST', data: data, ...options });
};

/**
 * Mock数据生成器
 * @param {string} url - 请求URL
 * @param {Object} data - 请求数据
 * @returns {Promise} Mock响应
 */
const mockRequest = (url, data) => {
  return new Promise((resolve) => {
    // 模拟网络延迟
    setTimeout(() => {
      if (url.includes('/ai/pick')) {
        // Mock AI选图结果
        if (data && data.photos && data.photos.length > 0) {
          resolve({
            bestId: data.photos[0].id,
            reason: '构图稳定，清晰度更好',
            tags: ['构图', '画质'],
            scored: data.photos.map((photo, index) => ({
              id: photo.id,
              score: 0.8 - index * 0.05,
              details: {
                light: 0.75 - index * 0.03,
                composition: 0.85 - index * 0.05,
                clarity: 0.8 - index * 0.04,
                face: 0,
                mood: 0.78 - index * 0.03
              }
            }))
          });
        }
      } else if (url.includes('/share/create')) {
        // Mock 创建分享
        resolve({
          shareId: `share_${Date.now()}`,
          url: `pages/share/index?shareId=share_${Date.now()}`
        });
      } else if (url.includes('/share/like')) {
        // Mock 点赞
        resolve({
          liked: Math.floor(Math.random() * 10) + 1
        });
      } else if (url.includes('/share/comment')) {
        // Mock 评论
        resolve({
          commentId: `comment_${Date.now()}`,
          ts: Date.now()
        });
      } else if (url.includes('/share/sync')) {
        // Mock 同步分享数据
        const shareId = url.split('?shareId=')[1];
        resolve({
          album: []
        });
      }
      
      // 默认返回空对象
      resolve({});
    }, 500);
  });
};

/**
 * 切换到真实接口
 * @param {string} apiBase - 真实API基础URL
 */
const switchToRealApi = (apiBase) => {
  CONFIG.API_BASE = apiBase;
  console.log('已切换到真实接口:', apiBase);
};

// 导出所有函数和配置
module.exports = {
  CONFIG,
  request,
  get,
  post,
  mockRequest,
  switchToRealApi
};