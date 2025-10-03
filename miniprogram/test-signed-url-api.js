// test-signed-url-api.js
// 测试签名URL API端点

const axios = require('axios');

async function testSignedUrlApi() {
  console.log('🧪 开始测试签名URL API端点...\n');
  
  const API_BASE = 'http://localhost:3000';
  
  try {
    // 测试1: 正常的fileKey请求
    console.log('📝 测试1: 正常的fileKey请求');
    const response1 = await axios.post(`${API_BASE}/upload/signed-url`, {
      fileKey: 'test-file-key-123',
      type: 'preview',
      expiryMinutes: 30
    });
    
    console.log('✅ API响应成功');
    console.log('📊 响应数据:', response1.data);
    console.log('🔗 生成的URL:', response1.data.url);
    console.log('⏰ 过期时间:', response1.data.expires);
    console.log('');
    
    // 测试2: 不同类型的请求
    console.log('📝 测试2: 请求原图URL');
    const response2 = await axios.post(`${API_BASE}/upload/signed-url`, {
      fileKey: 'test-file-key-123',
      type: 'original'
    });
    
    console.log('✅ 原图URL生成成功:', response2.data.url);
    console.log('');
    
    // 测试3: 缩略图URL
    console.log('📝 测试3: 请求缩略图URL');
    const response3 = await axios.post(`${API_BASE}/upload/signed-url`, {
      fileKey: 'test-file-key-123',
      type: 'thumb'
    });
    
    console.log('✅ 缩略图URL生成成功:', response3.data.url);
    console.log('');
    
    // 测试4: 缺少fileKey参数
    console.log('📝 测试4: 缺少fileKey参数（应该返回错误）');
    try {
      await axios.post(`${API_BASE}/upload/signed-url`, {
        type: 'preview'
      });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ 正确返回400错误:', error.response.data.error);
      } else {
        console.log('❌ 意外的错误:', error.message);
      }
    }
    console.log('');
    
    // 测试5: 验证生成的URL格式
    console.log('📝 测试5: 验证URL格式');
    const testUrl = response1.data.url;
    const urlPattern = /^http:\/\/localhost:3000\/files\/preview\/test-file-key-123\.jpg\?token=.+&expires=\d+$/;
    
    if (urlPattern.test(testUrl)) {
      console.log('✅ URL格式正确');
    } else {
      console.log('❌ URL格式不正确:', testUrl);
    }
    
    console.log('\n✅ 签名URL API端点测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('📊 错误状态码:', error.response.status);
      console.error('📋 错误详情:', error.response.data);
    }
  }
}

// 运行测试
testSignedUrlApi().catch(console.error);