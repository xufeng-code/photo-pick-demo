// 加载服务器目录下的.env文件
require('dotenv').config({ path: './server/.env' });

const signedUrl = require('./server/utils/signedUrl');

function debugSecret() {
  console.log('🔍 调试Secret配置...\n');
  
  // 检查环境变量
  console.log('📋 环境变量:');
  console.log('- SIGNED_URL_SECRET:', process.env.SIGNED_URL_SECRET);
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  
  // 使用导出的实例
  console.log('\n🔐 SignedUrlGenerator实例:');
  console.log('- Secret:', signedUrl.secret);
  
  // 测试生成和验证
  const filePath = 'preview/8a5784e1-0300-41cc-8ab0-a0b6c76e0ba6.jpg';
  const result = signedUrl.generateSignedUrl(filePath);
  
  console.log('\n📝 生成测试:');
  console.log('- 文件路径:', filePath);
  console.log('- 生成结果:', result);
  
  // 解析URL参数
  const url = new URL(`http://localhost:3000${result.url}`);
  const token = url.searchParams.get('token');
  const expires = url.searchParams.get('expires');
  
  console.log('\n🔍 验证测试:');
  console.log('- Token:', token);
  console.log('- Expires:', expires);
  
  const verification = signedUrl.verifySignedUrl(filePath, token, expires);
  console.log('- 验证结果:', verification);
}

debugSecret();