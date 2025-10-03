#!/usr/bin/env node

/**
 * 测试正确的签名URL接口
 * 验证 /upload/signed-url 接口
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000';
const TEST_FILE_KEY = '2cec8223-09f6-4d10-9db6-fe804fabd5bd';

console.log('🧪 测试正确的签名URL接口\n');

async function testCorrectSignedUrlAPI() {
  try {
    console.log('📝 测试 /upload/signed-url 接口...');
    
    // 测试签名URL生成
    const response = await axios.post(`${API_BASE}/upload/signed-url`, {
      fileKey: TEST_FILE_KEY,
      type: 'preview',
      expiryMinutes: 30
    });
    
    console.log('✅ 签名URL生成成功');
    console.log('📋 响应数据:', JSON.stringify(response.data, null, 2));
    
    const { url, expires, fileKey, type } = response.data;
    
    // 验证响应格式
    console.log('\n🔍 验证响应格式:');
    console.log('- fileKey:', fileKey ? '✅' : '❌');
    console.log('- type:', type ? '✅' : '❌');
    console.log('- url:', url ? '✅' : '❌');
    console.log('- expires:', expires ? '✅' : '❌');
    
    if (url) {
      console.log('\n🌐 完整URL:', url);
      
      // 测试图片访问
      console.log('\n📸 测试图片访问...');
      const imageResponse = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000
      });
      
      if (imageResponse.status === 200) {
        console.log('✅ 图片访问成功');
        console.log('📊 响应状态:', imageResponse.status);
        console.log('📊 内容类型:', imageResponse.headers['content-type']);
        console.log('📊 内容长度:', imageResponse.data.length, 'bytes');
      } else {
        console.log('❌ 图片访问失败，状态码:', imageResponse.status);
      }
    }
    
    console.log('\n🎯 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('📊 错误状态:', error.response.status);
      console.error('📊 错误数据:', error.response.data);
    }
  }
}

// 运行测试
testCorrectSignedUrlAPI();