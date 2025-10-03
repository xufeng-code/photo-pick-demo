const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testUrlGeneration() {
  try {
    console.log('🧪 开始测试URL生成功能...');
    
    // 使用真实的测试图片文件
    const testImagePath = path.join(__dirname, 'assets', 'test', '1.jpg');
    
    if (!fs.existsSync(testImagePath)) {
      throw new Error('测试图片不存在: ' + testImagePath);
    }
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testImagePath), {
      filename: 'test-image.jpg',
      contentType: 'image/jpeg'
    });
    
    console.log('📤 发送上传请求...');
    const response = await axios.post('http://localhost:5000/api/upload', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ 上传成功！');
    console.log('📊 响应状态:', response.status);
    console.log('📋 响应数据:', JSON.stringify(response.data, null, 2));
    
    // 检查URL是否包含undefined
    const responseData = response.data;
    if (responseData.url && responseData.url.includes('undefined')) {
      console.log('❌ URL包含undefined:', responseData.url);
    } else {
      console.log('✅ URL生成正常:', responseData.url);
    }
    
    if (responseData.urls) {
      Object.entries(responseData.urls).forEach(([type, url]) => {
        if (url.includes('undefined')) {
          console.log(`❌ ${type} URL包含undefined:`, url);
        } else {
          console.log(`✅ ${type} URL正常:`, url);
        }
      });
    }
    
    // 使用真实测试图片，无需清理
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('📊 错误响应状态:', error.response.status);
      console.error('📋 错误响应数据:', error.response.data);
    }
  }
}

testUrlGeneration();