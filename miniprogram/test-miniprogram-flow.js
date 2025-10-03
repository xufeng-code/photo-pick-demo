// test-miniprogram-flow.js
// 模拟小程序端的图片加载流程测试

const axios = require('axios');

const API_BASE = 'http://localhost:3000';
const TEST_FILE_KEY = '0077fecc-4b22-4f36-b78a-9856d72156df';

// 模拟小程序的request方法
async function mockWxRequest(url, options = {}) {
  try {
    const fullUrl = API_BASE + url;
    console.log('🌐 模拟小程序请求:', {
      url: fullUrl,
      method: options.method || 'GET',
      dataSize: JSON.stringify(options.data || {}).length
    });

    const response = await axios({
      url: fullUrl,
      method: options.method || 'GET',
      data: options.data,
      headers: {
        'content-type': 'application/json',
        ...options.header
      },
      timeout: 60000
    });

    console.log('✅ 模拟小程序请求成功:', {
      statusCode: response.status,
      dataSize: JSON.stringify(response.data).length
    });

    return response.data;
  } catch (error) {
    console.error('❌ 模拟小程序请求失败:', error.message);
    throw error;
  }
}

// 模拟推荐页面的getSignedUrlForPhoto方法
async function testGetSignedUrlForPhoto() {
  console.log('\n🎯 测试小程序端获取签名URL流程...');
  
  const bestPhoto = { 
    fileKey: TEST_FILE_KEY,
    id: 'test-photo-1'
  };

  try {
    console.log('正在获取签名URL，fileKey:', bestPhoto.fileKey);
    
    // 调用后端API获取签名URL
    const response = await mockWxRequest('/upload/signed-url', {
      method: 'POST',
      data: {
        fileKey: bestPhoto.fileKey,
        type: 'preview'
      }
    });
    
    if (response && response.url) {
      console.log('✅ 获取到签名URL:', response.url);
      
      // 测试签名URL是否可访问
      console.log('🔍 测试签名URL可访问性...');
      const testResponse = await axios.get(response.url, {
        responseType: 'arraybuffer',
        timeout: 10000
      });
      
      if (testResponse.status === 200) {
        console.log('✅ 签名URL可正常访问，图片大小:', testResponse.data.length, 'bytes');
        return {
          success: true,
          imageUrl: response.url,
          imageSize: testResponse.data.length
        };
      } else {
        throw new Error(`签名URL访问失败: ${testResponse.status}`);
      }
    } else {
      throw new Error('未获取到有效的签名URL');
    }
  } catch (error) {
    console.error('❌ 获取签名URL失败:', error.message);
    
    // 降级处理：使用临时的直接URL（仅用于开发测试）
    const fallbackUrl = `${API_BASE}/files/preview/${bestPhoto.fileKey}.jpg`;
    console.log('🔄 使用降级URL:', fallbackUrl);
    
    try {
      // 测试降级URL
      const testResponse = await axios.get(fallbackUrl, {
        responseType: 'arraybuffer',
        timeout: 10000
      });
      
      if (testResponse.status === 200) {
        console.log('⚠️ 降级URL可访问，但这不是正常情况');
        return {
          success: false,
          fallbackWorked: true,
          imageUrl: fallbackUrl,
          imageSize: testResponse.data.length,
          error: error.message
        };
      }
    } catch (fallbackError) {
      console.error('❌ 降级URL也无法访问:', fallbackError.message);
      return {
        success: false,
        fallbackWorked: false,
        error: error.message,
        fallbackError: fallbackError.message
      };
    }
  }
}

// 测试缩略图访问（无需签名）
async function testThumbAccess() {
  console.log('\n🖼️ 测试缩略图访问...');
  
  const thumbUrl = `${API_BASE}/files/thumb/${TEST_FILE_KEY}.jpg`;
  console.log('缩略图URL:', thumbUrl);
  
  try {
    const response = await axios.get(thumbUrl, {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    
    if (response.status === 200) {
      console.log('✅ 缩略图访问成功，大小:', response.data.length, 'bytes');
      return { success: true, size: response.data.length };
    }
  } catch (error) {
    console.error('❌ 缩略图访问失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 主测试函数
async function runMiniProgramTest() {
  console.log('🚀 开始小程序端图片加载流程测试\n');
  
  try {
    // 1. 测试缩略图访问
    const thumbResult = await testThumbAccess();
    
    // 2. 测试签名URL获取和访问
    const signedUrlResult = await testGetSignedUrlForPhoto();
    
    // 3. 输出测试结果
    console.log('\n📊 测试结果汇总:');
    console.log('================');
    console.log('缩略图访问:', thumbResult.success ? '✅ 成功' : '❌ 失败');
    if (!thumbResult.success) {
      console.log('  错误:', thumbResult.error);
    }
    
    console.log('签名URL流程:', signedUrlResult.success ? '✅ 成功' : '❌ 失败');
    if (!signedUrlResult.success) {
      console.log('  错误:', signedUrlResult.error);
      if (signedUrlResult.fallbackWorked) {
        console.log('  降级URL:', '⚠️ 可用（但不正常）');
      }
    }
    
    // 4. 给出建议
    console.log('\n💡 建议:');
    if (thumbResult.success && signedUrlResult.success) {
      console.log('✅ 所有测试通过，小程序端图片加载应该正常工作');
    } else if (thumbResult.success && !signedUrlResult.success && signedUrlResult.fallbackWorked) {
      console.log('⚠️ 签名URL有问题，但降级机制工作正常');
      console.log('   建议检查签名URL生成逻辑或服务器配置');
    } else {
      console.log('❌ 存在严重问题，需要检查服务器配置和网络连接');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出现严重错误:', error.message);
  }
}

// 运行测试
runMiniProgramTest();