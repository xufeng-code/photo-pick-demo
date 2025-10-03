const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

async function testUploadAndAI() {
  try {
    console.log('🧪 开始测试上传和AI分析...');
    
    // 1. 测试上传
    console.log('\n📤 测试图片上传...');
    const formData = new FormData();
    
    // 添加两张测试图片
    const testImage1 = fs.createReadStream(path.join(__dirname, 'assets/test/1.jpg'));
    const testImage2 = fs.createReadStream(path.join(__dirname, 'assets/test/1.jpg'));
    
    formData.append('photos', testImage1);
    formData.append('photos', testImage2);
    
    const uploadResponse = await axios.post(`${BASE_URL}/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    
    console.log('✅ 上传成功!');
    console.log('📊 上传结果:', JSON.stringify(uploadResponse.data, null, 2));
    
    // 2. 测试AI分析
    console.log('\n🤖 测试AI分析...');
    const fileKeys = uploadResponse.data.files.map(file => file.fileKey);
    console.log('🔑 文件Keys:', fileKeys);
    
    const aiResponse = await axios.post(`${BASE_URL}/ai/pick`, {
      fileKeys: fileKeys,
      prompt: '请分析这些图片',
      sessionId: 'test-session-' + Date.now()
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ AI分析成功!');
    console.log('🎯 分析结果:', aiResponse.data);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('📊 状态码:', error.response.status);
    }
  }
}

testUploadAndAI();