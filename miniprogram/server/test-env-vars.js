/**
 * 测试环境变量加载
 */

require('dotenv').config();

console.log('🔍 检查环境变量加载状态...\n');

const envVars = [
    'QWEN_VL_API_KEY',
    'QWEN_VL_MODEL', 
    'QWEN_VL_BASE_URL',
    'OPENAI_API_KEY',
    'OPENAI_MODEL'
];

envVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✅ 已配置' : '❌ 未配置';
    const displayValue = value ? 
        (value.length > 20 ? value.substring(0, 20) + '...' : value) : 
        'undefined';
    
    console.log(`${status} ${varName}: ${displayValue}`);
});

console.log('\n🔍 AI服务配置检查:');

// 检查通义千问VL配置
const qwenApiKey = process.env.QWEN_VL_API_KEY;
const qwenConfigured = qwenApiKey && qwenApiKey !== 'your_dashscope_api_key_here';
console.log(`${qwenConfigured ? '✅' : '❌'} 通义千问VL: ${qwenConfigured ? '已正确配置' : '未配置或使用默认值'}`);

// 检查OpenAI配置
const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiConfigured = openaiApiKey && openaiApiKey !== 'your_openai_api_key_here';
console.log(`${openaiConfigured ? '✅' : '❌'} OpenAI: ${openaiConfigured ? '已正确配置' : '未配置或使用默认值'}`);

console.log('\n📊 推荐使用的AI服务:');
if (qwenConfigured) {
    console.log('🎯 通义千问VL (优先)');
} else if (openaiConfigured) {
    console.log('🎯 OpenAI Vision');
} else {
    console.log('❌ 没有可用的AI服务');
}

// 测试AI服务初始化
console.log('\n🤖 测试AI服务初始化...');
try {
    const aiService = require('./services/aiService');
    console.log('✅ AI服务初始化成功');
} catch (error) {
    console.error('❌ AI服务初始化失败:', error.message);
}