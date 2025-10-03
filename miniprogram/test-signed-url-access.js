// 设置正确的Secret
process.env.SIGNED_URL_SECRET = 'your-secret-key-change-in-production-please';

const signedUrl = require('./server/utils/signedUrl');
const axios = require('axios');

async function testSignedUrlAccess() {
  console.log('🔐 测试签名URL访问...\n');
  
  const testFileKey = '8a5784e1-0300-41cc-8ab0-a0b6c76e0ba6';
  const filePath = `preview/${testFileKey}.jpg`;
  
  // 1. 生成签名URL
  console.log('📝 生成签名URL:');
  const signedUrlResult = signedUrl.generateSignedUrl(filePath);
  console.log('- 文件路径:', filePath);
  console.log('- 签名URL:', signedUrlResult.url);
  console.log('- 过期时间:', signedUrlResult.expires);
  
  // 2. 构建完整URL
  const fullUrl = `http://localhost:3000${signedUrlResult.url}`;
  console.log('\n🌐 完整URL:', fullUrl);
  
  // 3. 测试访问
  console.log('\n🔍 测试URL访问:');
  try {
    const response = await axios.head(fullUrl);
    console.log('✅ 访问成功!');
    console.log('- 状态码:', response.status);
    console.log('- Content-Type:', response.headers['content-type']);
    console.log('- Content-Length:', response.headers['content-length']);
  } catch (error) {
    console.error('❌ 访问失败:');
    if (error.response) {
      console.error('- 状态码:', error.response.status);
      console.error('- 错误信息:', error.response.data);
    } else {
      console.error('- 网络错误:', error.message);
    }
  }
  
  // 4. 测试无签名访问（应该失败）
  console.log('\n🚫 测试无签名访问（应该返回401）:');
  const unsignedUrl = `http://localhost:3000/files/${filePath}`;
  console.log('- 无签名URL:', unsignedUrl);
  
  try {
    const response = await axios.head(unsignedUrl);
    console.log('⚠️  意外成功! 状态码:', response.status);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ 正确返回401未经授权');
    } else {
      console.error('❌ 意外错误:', error.response?.status || error.message);
    }
  }
  
  // 5. 测试thumb访问（应该成功，不需要签名）
  console.log('\n🖼️  测试thumb访问（不需要签名）:');
  const thumbUrl = `http://localhost:3000/files/thumb/${testFileKey}.jpg`;
  console.log('- Thumb URL:', thumbUrl);
  
  try {
    const response = await axios.head(thumbUrl);
    console.log('✅ Thumb访问成功!');
    console.log('- 状态码:', response.status);
  } catch (error) {
    console.error('❌ Thumb访问失败:');
    if (error.response) {
      console.error('- 状态码:', error.response.status);
    } else {
      console.error('- 网络错误:', error.message);
    }
  }
}

testSignedUrlAccess().catch(console.error);