// 测试修复后的URL生成
// 手动设置环境变量进行测试
process.env.PORT = '5000';
process.env.BASE_URL = 'http://localhost:5000';
process.env.PUBLIC_BASE = 'http://localhost:5000';

const { toPublicUrl, generateFileUrl } = require('./server/utils/publicUrl');

console.log('🔧 测试URL生成修复');
console.log('==================');

// 测试环境变量
console.log('📋 环境变量:');
console.log('- PORT:', process.env.PORT);
console.log('- BASE_URL:', process.env.BASE_URL);
console.log('- PUBLIC_BASE:', process.env.PUBLIC_BASE);
console.log('');

// 测试URL生成
console.log('🔗 URL生成测试:');
const testFilename = 'test-image-123.jpg';

const originalUrl = generateFileUrl('original', testFilename);
const previewUrl = generateFileUrl('preview', testFilename);
const thumbUrl = generateFileUrl('thumb', testFilename);

console.log('- Original URL:', originalUrl);
console.log('- Preview URL:', previewUrl);
console.log('- Thumb URL:', thumbUrl);
console.log('');

// 验证URL是否使用正确的端口
const expectedPort = '5000';
const urls = [originalUrl, previewUrl, thumbUrl];

console.log('✅ URL验证:');
urls.forEach((url, index) => {
  const types = ['Original', 'Preview', 'Thumb'];
  if (url.includes(`localhost:${expectedPort}`)) {
    console.log(`✅ ${types[index]} URL 使用正确端口 ${expectedPort}`);
  } else {
    console.log(`❌ ${types[index]} URL 端口错误: ${url}`);
  }
});

console.log('');
console.log('🎯 修复验证完成！');