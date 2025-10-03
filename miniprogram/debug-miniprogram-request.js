// debug-miniprogram-request.js
// 调试小程序签名URL请求失败的问题

const axios = require('axios');

// 模拟小程序的request工具
class MockWxRequest {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async request(url, options = {}) {
    const fullUrl = this.baseUrl + url;
    console.log(`📤 模拟小程序请求: ${options.method || 'GET'} ${fullUrl}`);
    console.log(`📋 请求数据:`, JSON.stringify(options.data, null, 2));
    
    try {
      const response = await axios({
        method: options.method || 'GET',
        url: fullUrl,
        data: options.data,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.63(0x18003f2f) NetType/WIFI Language/zh_CN'
        },
        timeout: 10000
      });
      
      console.log(`✅ 请求成功: ${response.status}`);
      console.log(`📋 响应数据:`, JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error(`❌ 请求失败: ${error.message}`);
      if (error.response) {
        console.error(`状态码: ${error.response.status}`);
        console.error(`响应: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      if (error.code) {
        console.error(`错误代码: ${error.code}`);
      }
      throw error;
    }
  }
}

async function debugMiniprogramRequest() {
  console.log('🔍 调试小程序签名URL请求...\n');
  
  // 使用代理地址
  const baseUrl = 'http://192.168.1.6:8080';
  const mockWxRequest = new MockWxRequest(baseUrl);
  
  // 测试文件key（从控制台日志中获取）
  const testFileKey = '3254ac91-92a5-4b32-80f8-76e087d5db46';
  
  try {
    console.log('1️⃣ 测试签名URL请求...');
    const response = await mockWxRequest.request('/api/upload/signed-url', {
      method: 'POST',
      data: {
        fileKey: testFileKey,
        type: 'preview'
      }
    });
    
    console.log('\n2️⃣ 测试生成的签名URL...');
    if (response && response.url) {
      console.log(`签名URL: ${response.url}`);
      
      // 测试访问签名URL
      const imageResponse = await axios.get(response.url, {
        responseType: 'arraybuffer',
        timeout: 10000
      });
      
      console.log(`✅ 签名URL访问成功:`);
      console.log(`   状态码: ${imageResponse.status}`);
      console.log(`   内容类型: ${imageResponse.headers['content-type']}`);
      console.log(`   文件大小: ${imageResponse.data.length} bytes`);
    }
    
    console.log('\n3️⃣ 测试降级URL...');
    const fallbackUrl = `${baseUrl}/files/preview/${testFileKey}.jpg`;
    console.log(`降级URL: ${fallbackUrl}`);
    
    try {
      const fallbackResponse = await axios.get(fallbackUrl, {
        responseType: 'arraybuffer',
        timeout: 10000
      });
      
      console.log(`✅ 降级URL访问成功:`);
      console.log(`   状态码: ${fallbackResponse.status}`);
      console.log(`   内容类型: ${fallbackResponse.headers['content-type']}`);
      console.log(`   文件大小: ${fallbackResponse.data.length} bytes`);
    } catch (fallbackError) {
      console.error(`❌ 降级URL访问失败: ${fallbackError.message}`);
    }
    
    console.log('\n🎉 调试完成！');
    
  } catch (error) {
    console.error('\n❌ 调试失败:', error.message);
    
    // 如果签名URL请求失败，测试降级方案
    console.log('\n🔄 测试降级方案...');
    const fallbackUrl = `${baseUrl}/files/preview/${testFileKey}.jpg`;
    console.log(`降级URL: ${fallbackUrl}`);
    
    try {
      const fallbackResponse = await axios.get(fallbackUrl, {
        responseType: 'arraybuffer',
        timeout: 10000
      });
      
      console.log(`✅ 降级URL访问成功:`);
      console.log(`   状态码: ${fallbackResponse.status}`);
      console.log(`   内容类型: ${fallbackResponse.headers['content-type']}`);
      console.log(`   文件大小: ${fallbackResponse.data.length} bytes`);
    } catch (fallbackError) {
      console.error(`❌ 降级URL也失败: ${fallbackError.message}`);
    }
  }
}

// 运行调试
debugMiniprogramRequest();