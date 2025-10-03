// 测试实际的图片上传和URL生成
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000';

async function testImageUpload() {
  console.log('🧪 测试实际图片上传和URL生成');
  console.log('================================');
  
  try {
    // 1. 健康检查
    console.log('1. 检查服务器状态...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    if (!healthResponse.ok) {
      throw new Error('服务器未运行');
    }
    console.log('✅ 服务器运行正常');
    
    // 2. 检查是否有测试图片
    const testImagePath = './server/test/test-image.jpg';
    if (!fs.existsSync(testImagePath)) {
      console.log('⚠️ 测试图片不存在，跳过上传测试');
      return;
    }
    
    // 3. 上传图片
    console.log('2. 上传测试图片...');
    const formData = new FormData();
    formData.append('photos', fs.createReadStream(testImagePath));
    
    const uploadResponse = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`上传失败: ${uploadResponse.status}`);
    }
    
    const uploadResult = await uploadResponse.json();
    console.log('✅ 图片上传成功');
    
    // 4. 检查返回的URL
    console.log('3. 检查返回的URL...');
    if (uploadResult.files && uploadResult.files.length > 0) {
      const file = uploadResult.files[0];
      console.log('📋 返回的URL:');
      console.log('- Original:', file.urls.original);
      console.log('- Preview:', file.urls.preview);
      console.log('- Thumb:', file.urls.thumb);
      
      // 验证URL是否使用正确的端口
      const urls = [file.urls.original, file.urls.preview, file.urls.thumb];
      const types = ['Original', 'Preview', 'Thumb'];
      
      console.log('');
      console.log('✅ URL验证:');
      urls.forEach((url, index) => {
        if (url.includes('localhost:5000')) {
          console.log(`✅ ${types[index]} URL 使用正确端口 5000`);
        } else {
          console.log(`❌ ${types[index]} URL 端口错误: ${url}`);
        }
      });
      
      // 5. 测试图片访问
      console.log('');
      console.log('4. 测试图片访问...');
      try {
        const thumbResponse = await fetch(file.urls.thumb);
        if (thumbResponse.ok) {
          console.log('✅ 缩略图访问成功');
        } else {
          console.log(`❌ 缩略图访问失败: ${thumbResponse.status}`);
        }
      } catch (error) {
        console.log(`❌ 缩略图访问错误: ${error.message}`);
      }
      
    } else {
      console.log('❌ 上传结果中没有文件信息');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
  
  console.log('');
  console.log('🎯 测试完成！');
}

testImageUpload();