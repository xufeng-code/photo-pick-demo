// 检查上传响应的实际结构
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000';

async function testUploadResponse() {
  try {
    console.log('🧪 检查上传响应的实际结构...');
    
    const testImagePath = path.join(__dirname, 'assets/test/1.jpg');
    
    if (!fs.existsSync(testImagePath)) {
      throw new Error(`测试图片不存在: ${testImagePath}`);
    }
    
    const formData = new FormData();
    formData.append('photos', fs.createReadStream(testImagePath));
    formData.append('photos', fs.createReadStream(testImagePath));
    
    const uploadResponse = await axios.post(`${API_BASE}/upload`, formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    });
    
    console.log('✅ 上传成功!');
    console.log('📊 完整响应结构:');
    console.log(JSON.stringify(uploadResponse.data, null, 2));
    
    console.log('');
    console.log('📋 响应分析:');
    console.log('- 状态码:', uploadResponse.status);
    console.log('- 响应类型:', typeof uploadResponse.data);
    console.log('- 是否有files字段:', !!uploadResponse.data.files);
    console.log('- files类型:', typeof uploadResponse.data.files);
    console.log('- files长度:', uploadResponse.data.files ? uploadResponse.data.files.length : 'N/A');
    
    if (uploadResponse.data.files && uploadResponse.data.files.length > 0) {
      console.log('');
      console.log('📸 第一个文件结构:');
      console.log(JSON.stringify(uploadResponse.data.files[0], null, 2));
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('📊 错误响应:', error.response.status, error.response.data);
    }
  }
}

testUploadResponse();