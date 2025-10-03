// 测试环境变量加载
require('dotenv').config({ path: './server/.env' });

console.log('=== 环境变量检查 ===');
console.log('QWEN_VL_API_KEY:', process.env.QWEN_VL_API_KEY ? '已设置' : '未设置');
console.log('AI_PROVIDER:', process.env.AI_PROVIDER);
console.log('PORT:', process.env.PORT);
console.log('BASE_URL:', process.env.BASE_URL);

if (process.env.QWEN_VL_API_KEY) {
  console.log('API密钥前缀:', process.env.QWEN_VL_API_KEY.substring(0, 10) + '...');
}