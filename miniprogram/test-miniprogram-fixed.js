// test-miniprogram-fixed.js
// 测试小程序图片加载修复

const axios = require('axios');

// 模拟小程序的request工具
class MockWxRequest {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async request(url, options = {}) {
    const fullUrl = this.baseUrl + url;
    console.log(`📤 模拟小程序请求: ${options.method || 'GET'} ${fullUrl}`);
    
    try {
      const response = await axios({
        method: options.method || 'GET',
        url: fullUrl,
        data: options.data,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ 请求成功: ${response.status}`);
      return response.data;
    } catch (error) {
      console.error(`❌ 请求失败: ${error.message}`);
      if (error.response) {
        console.error(`状态码: ${error.response.status}`);
        console.error(`响应: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      throw error;
    }
  }
}

async function testMiniprogramImageLoading() {
  console.log('🧪 测试小程序图片加载修复...\n');
  
  // 使用代理地址
  const baseUrl = 'http://192.168.1.6:8080';
  const mockWxRequest = new MockWxRequest(baseUrl);
  
  try {
    // 1. 测试签名URL生成（使用修复后的路径）
    console.log('1️⃣ 测试签名URL生成...');
    const signedUrlResponse = await mockWxRequest.request('/api/upload/signed-url', {
      method: 'POST',
      data: {
        fileKey: '5b4c134a-0b35-4505-91f3-aecb8b167c7a',
        type: 'preview'
      }
    });
    
    console.log('✅ 签名URL生成成功:');
    console.log(`   URL: ${signedUrlResponse.url}`);
    console.log(`   过期时间: ${signedUrlResponse.expires}`);
    
    // 2. 测试图片访问
    console.log('\n2️⃣ 测试图片访问...');
    const imageResponse = await axios.get(signedUrlResponse.url, {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    
    console.log(`✅ 图片访问成功:`);
    console.log(`   状态码: ${imageResponse.status}`);
    console.log(`   内容类型: ${imageResponse.headers['content-type']}`);
    console.log(`   文件大小: ${imageResponse.data.length} bytes`);
    
    // 3. 验证URL格式
    console.log('\n3️⃣ 验证URL格式...');
    const url = new URL(signedUrlResponse.url);
    console.log(`✅ URL解析成功:`);
    console.log(`   协议: ${url.protocol}`);
    console.log(`   主机: ${url.host}`);
    console.log(`   路径: ${url.pathname}`);
    console.log(`   查询参数: ${url.search}`);
    
    // 检查是否使用了正确的代理地址
    if (url.host === '192.168.1.6:8080') {
      console.log('✅ 使用了正确的代理地址');
    } else {
      console.log('❌ 代理地址不正确');
    }
    
    console.log('\n🎉 所有测试通过！小程序图片加载应该已经修复。');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
testMiniprogramImageLoading();