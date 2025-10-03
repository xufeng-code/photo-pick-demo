// test-config-direct.js
// 直接测试CONFIG.API_BASE配置

console.log('🔧 开始测试CONFIG.API_BASE配置...\n');

try {
  // 1. 测试config.js加载
  console.log('1. 加载 utils/config.js...');
  const config = require('./utils/config.js');
  
  console.log('✅ config.js 加载成功');
  console.log('📋 可用的导出:', Object.keys(config));
  
  // 2. 测试CONFIG对象
  if (config.CONFIG) {
    console.log('\n2. 检查CONFIG对象...');
    console.log('✅ CONFIG对象存在');
    console.log('🔗 CONFIG.API_BASE:', config.CONFIG.API_BASE);
    console.log('🌐 CONFIG.BASE_URL:', config.CONFIG.BASE_URL);
    console.log('🐛 CONFIG.DEBUG:', config.CONFIG.DEBUG);
    
    if (config.CONFIG.API_BASE) {
      console.log('✅ CONFIG.API_BASE 已正确设置');
    } else {
      console.log('❌ CONFIG.API_BASE 未定义');
    }
  } else {
    console.log('\n❌ CONFIG对象不存在');
    console.log('📋 CURRENT_CONFIG:', config.CURRENT_CONFIG);
  }
  
  // 3. 测试url.js加载
  console.log('\n3. 测试 utils/url.js...');
  const urlUtils = require('./utils/url.js');
  
  console.log('✅ url.js 加载成功');
  console.log('📋 可用的函数:', Object.keys(urlUtils));
  
  // 4. 测试URL规范化
  console.log('\n4. 测试URL规范化...');
  const testUrls = [
    '/api/upload',
    { url: '/api/share' },
    'https://example.com/image.jpg',
    '',
    null
  ];
  
  testUrls.forEach((testUrl, index) => {
    try {
      const result = urlUtils.normalizeUrl(testUrl);
      console.log(`测试 ${index + 1}: ${JSON.stringify(testUrl)} -> ${result}`);
    } catch (error) {
      console.log(`测试 ${index + 1}: ${JSON.stringify(testUrl)} -> 错误: ${error.message}`);
    }
  });
  
  // 5. 测试环境信息
  console.log('\n5. 环境信息...');
  console.log('🌍 CURRENT_ENV:', config.CURRENT_ENV);
  console.log('⚙️ CURRENT_CONFIG:', JSON.stringify(config.CURRENT_CONFIG, null, 2));
  
  console.log('\n🎉 所有测试完成！');
  
} catch (error) {
  console.error('❌ 测试过程中出现错误:');
  console.error(error.message);
  console.error(error.stack);
}