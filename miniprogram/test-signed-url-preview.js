// 测试签名URL生成和preview图片访问
const axios = require('axios');

async function testSignedUrlPreview() {
  try {
    console.log('🔍 测试签名URL生成和preview图片访问');
    console.log('');

    const API_BASE = 'http://localhost:3000';
    const fileKey = '2778c19d-6e38-4ced-ba26-a2862faa8e4d';
    
    console.log('📋 测试信息:');
    console.log('   - fileKey:', fileKey);
    console.log('   - 文件类型: preview');
    console.log('');

    // 1. 生成签名URL
    console.log('1️⃣ 生成签名URL...');
    const signedUrlResponse = await axios.post(`${API_BASE}/upload/signed-url`, {
      fileKey: fileKey,
      type: 'preview'
    });

    if (!signedUrlResponse.data || !signedUrlResponse.data.url) {
      throw new Error('未获取到有效的签名URL');
    }

    const signedUrl = signedUrlResponse.data.url;
    console.log('✅ 签名URL生成成功:', signedUrl);
    console.log('');

    // 2. 测试签名URL访问
    console.log('2️⃣ 测试签名URL访问...');
    const imageResponse = await axios.get(signedUrl, {
      responseType: 'arraybuffer',
      timeout: 10000
    });

    if (imageResponse.status === 200) {
      console.log('✅ 签名URL访问成功!');
      console.log('   - 状态码:', imageResponse.status);
      console.log('   - 图片大小:', imageResponse.data.length, 'bytes');
      console.log('   - Content-Type:', imageResponse.headers['content-type']);
    } else {
      console.log('⚠️ 签名URL访问异常，状态码:', imageResponse.status);
    }
    console.log('');

    // 3. 测试无签名直接访问（应该失败）
    console.log('3️⃣ 测试无签名直接访问（应该返回401）...');
    const directUrl = `${API_BASE}/files/preview/${fileKey}.jpg`;
    
    try {
      const directResponse = await axios.get(directUrl, {
        responseType: 'arraybuffer',
        timeout: 5000
      });
      console.log('⚠️ 意外：无签名访问成功了，状态码:', directResponse.status);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ 预期结果：无签名访问被拒绝 (401)');
      } else {
        console.log('❌ 无签名访问失败，但不是预期的401错误:', error.message);
      }
    }
    console.log('');

    // 4. 测试缩略图公开访问
    console.log('4️⃣ 测试缩略图公开访问...');
    const thumbUrl = `${API_BASE}/files/thumb/${fileKey}.jpg`;
    
    try {
      const thumbResponse = await axios.get(thumbUrl, {
        responseType: 'arraybuffer',
        timeout: 5000
      });
      
      if (thumbResponse.status === 200) {
        console.log('✅ 缩略图公开访问成功!');
        console.log('   - 状态码:', thumbResponse.status);
        console.log('   - 图片大小:', thumbResponse.data.length, 'bytes');
      } else {
        console.log('⚠️ 缩略图访问异常，状态码:', thumbResponse.status);
      }
    } catch (error) {
      console.log('❌ 缩略图访问失败:', error.message);
    }
    console.log('');

    console.log('🎉 签名URL测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
    if (error.response) {
      console.error('   - 响应状态:', error.response.status);
      console.error('   - 响应数据:', error.response.data);
    }
  }
}

// 运行测试
testSignedUrlPreview();