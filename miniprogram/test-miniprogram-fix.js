// 测试小程序图片修复
const fs = require('fs');
const path = require('path');

// 模拟小程序环境
global.wx = {
  getAccountInfoSync: () => ({
    miniProgram: {
      envVersion: 'develop' // 模拟开发环境
    }
  })
};

// 导入配置
const config = require('./utils/config.js');

console.log('🔍 测试小程序配置修复...');
console.log('📱 当前环境:', config.CURRENT_ENV);
console.log('🌐 当前配置:', config.CURRENT_CONFIG);

// 模拟照片数据（后端返回的格式）
const mockPhoto = {
  id: 'test-photo-1',
  fileKey: '708eab59-0271-446d-b465-f26a7bcf6593',
  urls: {
    original: 'https://smart-cloths-attack.loca.lt/files/original/708eab59-0271-446d-b465-f26a7bcf6593.jpg',
    preview: 'https://smart-cloths-attack.loca.lt/files/preview/708eab59-0271-446d-b465-f26a7bcf6593.jpg',
    thumb: 'https://smart-cloths-attack.loca.lt/files/thumb/708eab59-0271-446d-b465-f26a7bcf6593.jpg'
  }
};

console.log('\n📸 模拟照片数据:');
console.log('- Original URL:', mockPhoto.urls.original);
console.log('- Preview URL:', mockPhoto.urls.preview);
console.log('- Thumb URL:', mockPhoto.urls.thumb);

// 导入URL处理函数
const { normalizeUrl } = require('./utils/url.js');

console.log('\n🔧 测试URL处理:');
const normalizedPreview = normalizeUrl(mockPhoto.urls.preview);
console.log('- 规范化后的Preview URL:', normalizedPreview);

// 检查URL是否使用了正确的域名
const isCorrectDomain = normalizedPreview.includes('smart-cloths-attack.loca.lt');
console.log('- 使用正确域名:', isCorrectDomain ? '✅' : '❌');

// 检查URL是否是HTTPS
const isHttps = normalizedPreview.startsWith('https://');
console.log('- 使用HTTPS:', isHttps ? '✅' : '❌');

console.log('\n🎯 修复结果:');
if (isCorrectDomain && isHttps) {
  console.log('✅ 小程序图片URL配置修复成功！');
  console.log('✅ 小程序现在应该能够正常显示图片了');
} else {
  console.log('❌ 配置仍有问题，需要进一步检查');
}