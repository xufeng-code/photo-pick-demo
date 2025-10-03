const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000';

async function testMiniProgramAICall() {
  console.log('🧪 测试小程序AI接口调用流程');
  
  try {
    // 1. 先上传文件
    console.log('📤 步骤1: 上传文件');
    const formData = new FormData();
    
    // 使用测试图片
    const testImagePath = path.join(__dirname, '../../assets/test/1.jpg');
    if (!fs.existsSync(testImagePath)) {
      console.error('❌ 测试图片不存在:', testImagePath);
      return;
    }
    
    formData.append('photos', fs.createReadStream(testImagePath));
    formData.append('photos', fs.createReadStream(testImagePath)); // 添加第二张相同的图片
    
    const uploadResponse = await axios.post(`${API_BASE}/upload`, formData, {
      headers: {
        ...formData.getHeaders()
      }
    });
    
    console.log('✅ 上传成功:', uploadResponse.data);
    
    // 2. 提取fileKeys
    let fileKeys;
    if (uploadResponse.data.files && Array.isArray(uploadResponse.data.files)) {
      // 新的数据结构
      fileKeys = uploadResponse.data.files.map(file => file.fileKey);
    } else if (uploadResponse.data.success && Array.isArray(uploadResponse.data.success)) {
      // 旧的数据结构
      fileKeys = uploadResponse.data.success.map(file => {
        if (file.files && file.files[0]) {
          return file.files[0].fileKey;
        } else if (file.fileKey) {
          return file.fileKey;
        } else {
          throw new Error('无法提取fileKey');
        }
      });
    } else {
      throw new Error('无法识别上传响应格式');
    }
    
    console.log('📋 提取的fileKeys:', fileKeys);
    
    // 3. 调用AI分析接口（模拟小程序的调用方式）
    console.log('🤖 步骤2: 调用AI分析接口');
    const aiRequestData = {
      sessionId: 'test-session-' + Date.now(),
      fileKeys: fileKeys
    };
    
    console.log('📤 发送AI请求:', aiRequestData);
    
    const aiResponse = await axios.post(`${API_BASE}/ai/pick`, aiRequestData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('🎉 AI分析成功:', aiResponse.data);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('❌ 响应状态:', error.response.status);
      console.error('❌ 响应数据:', error.response.data);
    }
  }
}

// 运行测试
testMiniProgramAICall();