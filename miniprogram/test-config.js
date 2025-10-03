// test-config.js - 测试修复后的配置
const { CURRENT_CONFIG, CURRENT_ENV } = require('./utils/config');

console.log('🔧 测试修复后的配置...\n');

// 测试环境检测
console.log('1. 环境检测测试:');
console.log(`   当前环境: ${CURRENT_ENV}`);

// 测试配置信息
console.log('\n2. 配置信息测试:');
console.log(`   BASE_URL: ${CURRENT_CONFIG.BASE_URL}`);
console.log(`   API_BASE: ${CURRENT_CONFIG.API_BASE}`);

// 验证URL格式
console.log('\n3. URL格式验证:');
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const baseUrlValid = isValidUrl(CURRENT_CONFIG.BASE_URL);
const apiBaseValid = isValidUrl(CURRENT_CONFIG.API_BASE);

console.log(`   BASE_URL 格式: ${baseUrlValid ? '✅ 有效' : '❌ 无效'}`);
console.log(`   API_BASE 格式: ${apiBaseValid ? '✅ 有效' : '❌ 无效'}`);

// 检查是否使用HTTPS
console.log('\n4. HTTPS检查:');
const baseUrlHttps = CURRENT_CONFIG.BASE_URL.startsWith('https://');
const apiBaseHttps = CURRENT_CONFIG.API_BASE.startsWith('https://');

console.log(`   BASE_URL HTTPS: ${baseUrlHttps ? '✅ 是' : '⚠️ 否'}`);
console.log(`   API_BASE HTTPS: ${apiBaseHttps ? '✅ 是' : '⚠️ 否'}`);

// 检查是否指向Vercel生产环境
console.log('\n5. Vercel生产环境检查:');
const isVercelProd = CURRENT_CONFIG.BASE_URL.includes('xuanzhaopian-ai.vercel.app');
console.log(`   指向Vercel生产环境: ${isVercelProd ? '✅ 是' : '❌ 否'}`);

// 总结
console.log('\n📊 测试结果总结:');
const allValid = baseUrlValid && apiBaseValid && baseUrlHttps && apiBaseHttps && isVercelProd;
console.log(`   配置状态: ${allValid ? '✅ 全部正确' : '⚠️ 需要检查'}`);

if (!allValid) {
  console.log('\n🔧 建议修复:');
  if (!baseUrlValid) console.log('   - 修复 BASE_URL 格式');
  if (!apiBaseValid) console.log('   - 修复 API_BASE 格式');
  if (!baseUrlHttps) console.log('   - BASE_URL 使用 HTTPS');
  if (!apiBaseHttps) console.log('   - API_BASE 使用 HTTPS');
  if (!isVercelProd) console.log('   - 确保指向 Vercel 生产环境');
}

console.log('\n🎯 配置测试完成！');