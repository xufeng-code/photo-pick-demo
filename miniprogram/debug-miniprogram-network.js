// debug-miniprogram-network.js
// 详细调试小程序网络请求问题

const axios = require('axios');

// 模拟小程序的配置
const config = {
  CURRENT_CONFIG: {
    BASE_URL: 'http://192.168.1.6:8080'
  }
};

// 模拟小程序的request工具
const mockRequest = {
  async request(url, options = {}) {
    const fullUrl = config.CURRENT_CONFIG.BASE_URL + url;
    
    console.log('🌐 模拟小程序请求:', {
      url: fullUrl,
      method: options.method || 'GET',
      data: options.data,
      headers: options.header
    });
    
    try {
      const response = await axios({
        url: fullUrl,
        method: options.method || 'GET',
        data: options.data,
        headers: {
          'content-type': 'application/json',
          'User-Agent': 'MiniProgram/1.0',
          ...options.header
        },
        timeout: 10000
      });
      
      console.log('✅ 请求成功:', {
        status: response.status,
        headers: response.headers,
        dataSize: JSON.stringify(response.data).length
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ 请求失败:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });
      throw error;
    }
  }
};

// 模拟normalizeUrl函数
function normalizeUrl(url) {
  console.log('🔧 规范化URL:', url);
  
  if (!url) {
    console.warn('⚠️ URL为空');
    return '';
  }
  
  // 如果是对象，转换为字符串
  if (typeof url === 'object') {
    console.log('📝 URL是对象，转换为字符串:', url);
    url = url.toString();
  }
  
  // 如果已经是绝对URL，直接返回
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log('✅ 已是绝对URL:', url);
    return url;
  }
  
  // 如果是相对路径，拼接基础URL
  const baseUrl = config.CURRENT_CONFIG.BASE_URL;
  if (!baseUrl) {
    console.error('❌ BASE_URL未配置');
    return url;
  }
  
  const normalizedUrl = baseUrl + (url.startsWith('/') ? url : '/' + url);
  console.log('🔧 拼接后的URL:', normalizedUrl);
  return normalizedUrl;
}

// 模拟getSignedUrlForPhoto方法
async function getSignedUrlForPhoto(bestPhoto) {
  try {
    console.log('🔍 开始获取签名URL，fileKey:', bestPhoto.fileKey);
    
    const maxRetries = 3;
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`\n📡 第${attempt}次尝试获取签名URL...`);
        
        // 调用后端API获取签名URL
        const response = await mockRequest.request('/api/upload/signed-url', {
          method: 'POST',
          data: {
            fileKey: bestPhoto.fileKey,
            type: 'preview'
          }
        });
        
        if (response && response.url) {
          console.log('✅ 获取到签名URL:', response.url);
          
          // 规范化URL处理
          const normalizedUrl = normalizeUrl(response.url);
          console.log('🔧 规范化后的URL:', normalizedUrl);
          
          // 验证签名URL是否有效
          try {
            const url = new URL(normalizedUrl);
            const params = new URLSearchParams(url.search);
            const expires = parseInt(params.get('expires'));
            const currentTime = Date.now();
            
            if (expires && expires > currentTime) {
              console.log('✅ 签名URL有效，过期时间:', new Date(expires));
              
              // 测试签名URL是否可访问
              console.log('🧪 测试签名URL访问...');
              const testResponse = await axios.get(normalizedUrl, { timeout: 5000 });
              console.log('✅ 签名URL访问成功:', {
                status: testResponse.status,
                contentType: testResponse.headers['content-type'],
                size: testResponse.headers['content-length']
              });
              
              return normalizedUrl;
            } else {
              console.warn('⚠️ 签名URL已过期，重新获取...');
              throw new Error('签名URL已过期');
            }
          } catch (urlError) {
            console.warn('⚠️ 签名URL格式验证失败:', urlError.message);
            throw urlError;
          }
        } else {
          throw new Error('未获取到有效的签名URL');
        }
      } catch (attemptError) {
        console.error(`❌ 第${attempt}次尝试失败:`, attemptError.message);
        lastError = attemptError;
        
        if (attempt < maxRetries) {
          console.log('⏳ 等待1秒后重试...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // 所有重试都失败了
    throw lastError || new Error('获取签名URL失败');
    
  } catch (error) {
    console.error('💥 获取签名URL最终失败:', error.message);
    
    // 降级处理：使用临时的直接URL
    const API_BASE = config.CURRENT_CONFIG.BASE_URL;
    const fallbackUrl = `${API_BASE}/files/preview/${bestPhoto.fileKey}.jpg`;
    console.log('🔄 使用降级URL:', fallbackUrl);
    
    // 测试降级URL
    try {
      console.log('🧪 测试降级URL访问...');
      const testResponse = await axios.get(fallbackUrl, { timeout: 5000 });
      console.log('✅ 降级URL访问成功:', {
        status: testResponse.status,
        contentType: testResponse.headers['content-type'],
        size: testResponse.headers['content-length']
      });
    } catch (fallbackError) {
      console.error('❌ 降级URL访问失败:', fallbackError.message);
    }
    
    return fallbackUrl;
  }
}

// 主测试函数
async function main() {
  console.log('🚀 开始详细调试小程序网络请求...\n');
  
  // 测试数据
  const bestPhoto = {
    fileKey: '3254ac91-92a5-4b32-80f8-76e087d5db46'
  };
  
  try {
    // 1. 测试基础网络连接
    console.log('1️⃣ 测试基础网络连接...');
    const healthResponse = await axios.get(`${config.CURRENT_CONFIG.BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ 服务器连接正常:', healthResponse.status);
  } catch (error) {
    console.error('❌ 服务器连接失败:', error.message);
  }
  
  console.log('\n2️⃣ 模拟小程序获取签名URL流程...');
  const result = await getSignedUrlForPhoto(bestPhoto);
  console.log('\n🎯 最终结果:', result);
  
  console.log('\n✨ 调试完成！');
}

// 运行测试
main().catch(error => {
  console.error('💥 测试失败:', error);
  process.exit(1);
});