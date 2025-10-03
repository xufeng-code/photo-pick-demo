// 测试图片加载修复
const axios = require('axios');

const API_BASE = 'http://localhost:3000';
const TEST_FILE_KEY = '1f8367ec-1d62-40d9-9370-0ce522e8d953';

async function testImageLoadingFix() {
  console.log('🧪 测试图片加载修复...\n');

  try {
    // 1. 测试获取签名URL
    console.log('1️⃣ 测试获取签名URL...');
    const signedUrlResponse = await axios.post(`${API_BASE}/upload/signed-url`, {
      fileKey: TEST_FILE_KEY,
      type: 'preview'
    });

    if (signedUrlResponse.data && signedUrlResponse.data.url) {
      console.log('✅ 签名URL获取成功:', signedUrlResponse.data.url);
      
      // 2. 测试签名URL访问
      console.log('\n2️⃣ 测试签名URL访问...');
      const imageResponse = await axios.get(signedUrlResponse.data.url, {
        responseType: 'arraybuffer',
        timeout: 10000
      });
      
      if (imageResponse.status === 200) {
        console.log('✅ 签名URL访问成功，状态码:', imageResponse.status);
        console.log('📊 图片大小:', imageResponse.data.length, 'bytes');
      } else {
        console.log('❌ 签名URL访问失败，状态码:', imageResponse.status);
      }
    } else {
      console.log('❌ 签名URL获取失败');
    }

    // 3. 测试直接访问（应该失败）
    console.log('\n3️⃣ 测试直接访问（应该失败）...');
    try {
      const directResponse = await axios.get(`${API_BASE}/files/preview/${TEST_FILE_KEY}.jpg`, {
        timeout: 5000
      });
      console.log('⚠️ 直接访问意外成功，状态码:', directResponse.status);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ 直接访问正确被拒绝，状态码:', error.response.status);
      } else {
        console.log('❌ 直接访问出现意外错误:', error.message);
      }
    }

    // 4. 模拟小程序request调用
    console.log('\n4️⃣ 模拟小程序request调用...');
    
    // 模拟小程序的request函数
    function mockWxRequest(url, options) {
      return new Promise((resolve, reject) => {
        const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
        
        axios({
          method: options.method || 'GET',
          url: fullUrl,
          data: options.data,
          headers: options.headers || {},
          timeout: 10000
        }).then(response => {
          resolve(response.data);
        }).catch(error => {
          reject(error);
        });
      });
    }

    // 模拟推荐页面的getSignedUrlForPhoto逻辑
    const mockBestPhoto = { fileKey: TEST_FILE_KEY };
    
    try {
      console.log('正在获取签名URL，fileKey:', mockBestPhoto.fileKey);
      
      const response = await mockWxRequest('/upload/signed-url', {
        method: 'POST',
        data: {
          fileKey: mockBestPhoto.fileKey,
          type: 'preview'
        }
      });
      
      if (response && response.url) {
        console.log('✅ 小程序模拟：获取到签名URL:', response.url);
        
        // 测试签名URL是否可访问
        const testResponse = await axios.get(response.url, {
          responseType: 'arraybuffer',
          timeout: 5000
        });
        
        if (testResponse.status === 200) {
          console.log('✅ 小程序模拟：签名URL可正常访问');
        }
      } else {
        throw new Error('未获取到有效的签名URL');
      }
    } catch (error) {
      console.log('❌ 小程序模拟失败:', error.message);
    }

    console.log('\n🎉 图片加载修复测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
  }
}

// 运行测试
testImageLoadingFix();