const signedUrl = require('./server/utils/signedUrl');

function testHttpSignature() {
  console.log('🌐 模拟HTTP请求签名验证...\n');
  
  const filePath = 'preview/8a5784e1-0300-41cc-8ab0-a0b6c76e0ba6.jpg';
  
  // 1. 生成签名URL
  const result = signedUrl.generateSignedUrl(filePath);
  console.log('📝 生成的签名URL:', result.url);
  
  // 2. 解析URL参数
  const url = new URL(`http://localhost:3000${result.url}`);
  const token = url.searchParams.get('token');
  const expires = url.searchParams.get('expires');
  const requestPath = url.pathname; // 这是req.path的值
  
  console.log('\n📋 HTTP请求信息:');
  console.log('- 请求路径 (req.path):', requestPath);
  console.log('- Token:', token);
  console.log('- Expires:', expires);
  
  // 3. 模拟中间件的路径处理
  console.log('\n🔄 中间件路径处理:');
  const fullPath = requestPath; // 例如: /preview/xxx.jpg
  const extractedFilePath = fullPath.startsWith('/') ? fullPath.substring(1) : fullPath;
  console.log('- 原始路径:', fullPath);
  console.log('- 提取的文件路径:', extractedFilePath);
  console.log('- 期望的文件路径:', filePath);
  console.log('- 路径匹配:', extractedFilePath === filePath);
  
  // 4. 手动验证签名
  console.log('\n🔍 手动验证签名:');
  const verification1 = signedUrl.verifySignedUrl(filePath, token, expires);
  console.log('- 使用原始路径验证:', verification1);
  
  const verification2 = signedUrl.verifySignedUrl(extractedFilePath, token, expires);
  console.log('- 使用提取路径验证:', verification2);
  
  // 5. 检查路径差异
  if (filePath !== extractedFilePath) {
    console.log('\n⚠️  路径不匹配问题:');
    console.log('- 生成时使用:', filePath);
    console.log('- 验证时使用:', extractedFilePath);
    console.log('- 差异:', {
      生成: filePath.split('/'),
      验证: extractedFilePath.split('/')
    });
  }
}

testHttpSignature();