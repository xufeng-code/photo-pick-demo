// 测试修复后的AI接口
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000';

async function testAIInterface() {
  try {
    console.log('🧪 开始测试修复后的AI接口...');
    
// 创建20x20像素的JPEG图片的base64数据（符合通义千问VL的尺寸要求）
function createTestImageBase64() {
  // 这是一个20x20像素的红色JPEG图片的base64数据
  return '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAUABQDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwDfwA==';
}

    const testImageBase64 = createTestImageBase64();
    
    const testData = {
      sessionId: 'test-session-' + Date.now(),
      photos: [
        {
          id: 'test-photo-1',
          base64: `data:image/jpeg;base64,${testImageBase64}`,
          width: 20,
          height: 20,
          size: 1000
        },
        {
          id: 'test-photo-2', 
          base64: `data:image/jpeg;base64,${testImageBase64}`,
          width: 20,
          height: 20,
          size: 1000
        }
      ]
    };
    
    console.log('📤 发送测试请求到AI接口...');
    const response = await axios.post(`${API_BASE}/ai/pick`, testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ AI接口测试成功!');
    console.log('📊 响应状态:', response.status);
    console.log('📋 响应数据:', JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('❌ AI接口测试失败:', error.message);
    if (error.response) {
      console.error('📊 错误状态码:', error.response.status);
      console.error('📋 错误详情:', error.response.data);
    }
    return false;
  }
}

// 运行测试
testAIInterface().then(success => {
  if (success) {
    console.log('🎉 AI接口修复验证成功！');
  } else {
    console.log('💥 AI接口仍有问题，需要进一步调试');
  }
  process.exit(success ? 0 : 1);
});