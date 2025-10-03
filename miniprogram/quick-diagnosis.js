#!/usr/bin/env node

console.log('🔍 快速诊断 - 检查配置一致性\n');

// 1. 检查小程序配置
console.log('📱 1. 小程序配置:');
try {
    const config = require('./utils/config.js');
    console.log('✅ 配置加载成功');
    console.log(`   环境: ${config.CURRENT_ENV}`);
    console.log(`   BASE_URL: ${config.CURRENT_CONFIG.BASE_URL}`);
    console.log(`   API_BASE: ${config.CURRENT_CONFIG.API_BASE}`);
    
    const isCorrect = config.CURRENT_CONFIG.BASE_URL === 'https://public-grapes-hug.loca.lt';
    console.log(`   配置正确: ${isCorrect ? '✅' : '❌'}`);
} catch (error) {
    console.log('❌ 配置加载失败:', error.message);
}

// 2. 检查后端URL生成
console.log('\n🔧 2. 后端URL生成:');
try {
    // 手动设置环境变量
    process.env.BASE_URL = 'https://public-grapes-hug.loca.lt';
  process.env.PUBLIC_BASE = 'https://public-grapes-hug.loca.lt';
    
    const { toPublicUrl } = require('./server/utils/publicUrl.js');
    const testUrl = toPublicUrl('/files/preview/test.jpg');
    
    console.log('✅ URL生成正常');
    console.log(`   测试URL: ${testUrl}`);
    console.log(`   使用HTTPS: ${testUrl.startsWith('https://') ? '✅' : '❌'}`);
    console.log(`   非localhost: ${!testUrl.includes('localhost') ? '✅' : '❌'}`);
} catch (error) {
    console.log('❌ URL生成失败:', error.message);
}

// 3. 检查可能的问题
console.log('\n⚠️ 3. 潜在问题检查:');

// 检查localtunnel是否可访问
console.log('   检查localtunnel连接...');
const https = require('https');
const url = 'https://public-grapes-hug.loca.lt';

https.get(url, (res) => {
    console.log(`   ✅ localtunnel可访问 (状态码: ${res.statusCode})`);
}).on('error', (err) => {
    console.log(`   ❌ localtunnel不可访问: ${err.message}`);
    console.log('   💡 建议: 检查localtunnel服务是否正在运行');
});

console.log('\n📋 4. 修复建议:');
console.log('如果看到错误:');
console.log('1. 确保localtunnel服务正在运行');
console.log('2. 确保后端服务器正在运行');
console.log('3. 检查网络连接');
console.log('4. 如果问题持续，可能需要重启服务');

setTimeout(() => {
    console.log('\n🔍 诊断完成！');
}, 2000);