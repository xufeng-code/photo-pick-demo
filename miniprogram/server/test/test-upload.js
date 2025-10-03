const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000';

async function testUpload() {
  try {
    console.log('🧪 开始测试上传功能...');
    
    // 准备测试图片
    const testImagePath1 = path.join(__dirname, '../../assets/test/1.jpg');
    const testImagePath2 = path.join(__dirname, '../../assets/test/1.jpg'); // 使用同一张图片模拟2张
    
    if (!fs.existsSync(testImagePath1)) {
      console.error('❌ 测试图片不存在:', testImagePath1);
      return;
    }
    
    console.log('📸 使用测试图片:', testImagePath1);
    
    // 创建FormData
    const formData = new FormData();
    formData.append('photos', fs.createReadStream(testImagePath1));
    formData.append('photos', fs.createReadStream(testImagePath2));
    
    // 发送上传请求
    console.log('📤 发送上传请求...');
    const response = await axios.post(`${API_BASE}/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000
    });
    
    console.log('✅ 上传成功!');
    console.log('📊 响应数据:', JSON.stringify(response.data, null, 2));
    
    // 测试AI分析接口
    if (response.data.files && response.data.files.length > 0) {
      console.log('\n🤖 测试AI分析接口...');
      
      const fileKeys = response.data.files.map(file => file.fileKey);
      console.log('🔑 文件keys:', fileKeys);
      
      const aiResponse = await axios.post(`${API_BASE}/ai/pick`, {
        sessionId: `test_${Date.now()}`,
        fileKeys: fileKeys
      }, {
        timeout: 60000
      });
      
      console.log('✅ AI分析成功!');
      console.log('🧠 分析结果:', JSON.stringify(aiResponse.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('📊 错误响应:', error.response.status, error.response.data);
    }
  }
}

// 运行测试
testUpload();