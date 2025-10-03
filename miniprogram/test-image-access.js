// 测试图片URL访问
const http = require('http');
const url = require('url');

// 测试图片URL
const imageUrl = 'http://192.168.1.6:8080/uploads/original/5b4c134a-0b35-4505-91f3-aecb8b167c7a.jpg';

console.log('🧪 测试图片URL访问:', imageUrl);

function testImageAccess(imageUrl) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(imageUrl);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.path,
      method: 'HEAD'
    };
    
    console.log('📡 请求参数:', options);
    
    const req = http.request(options, (res) => {
      console.log('✅ 响应状态:', res.statusCode);
      console.log('📋 响应头:', res.headers);
      
      if (res.statusCode === 200) {
        resolve({
          success: true,
          statusCode: res.statusCode,
          headers: res.headers
        });
      } else {
        reject(new Error(`HTTP ${res.statusCode}`));
      }
    });
    
    req.on('error', (err) => {
      console.error('❌ 请求失败:', err);
      reject(err);
    });
    
    req.end();
  });
}

// 执行测试
testImageAccess(imageUrl)
  .then(result => {
    console.log('✅ 图片访问测试成功:', result);
    
    // 检查内容类型
    const contentType = result.headers['content-type'];
    if (contentType && contentType.startsWith('image/')) {
      console.log('✅ 确认是图片文件，类型:', contentType);
    } else {
      console.log('⚠️ 内容类型可能不是图片:', contentType);
    }
    
    // 检查文件大小
    const contentLength = result.headers['content-length'];
    if (contentLength) {
      console.log('📏 文件大小:', contentLength, 'bytes');
    }
  })
  .catch(error => {
    console.error('❌ 图片访问测试失败:', error);
  });