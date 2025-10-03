// 测试生产环境API配置（简化版）
const axios = require('axios');

const PRODUCTION_URL = 'https://public-grapes-hug.loca.lt';

async function testProductionAPI() {
  console.log('🧪 开始测试生产环境API配置...');
  console.log('🌍 生产环境URL:', PRODUCTION_URL);
  
  // 直接测试新的AI API路径
  try {
    console.log('📤 测试生产环境AI API: /api/ai/pick');
    
    const testData = {
      sessionId: 'production-test-' + Date.now(),
      fileKeys: ['test-file-1']
    };
    
    const response = await axios.post(`${PRODUCTION_URL}/api/ai/pick`, testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    
    console.log('✅ 生产环境AI API路径正确');
    console.log('📊 响应状态:', response.status);
    
  } catch (error) {
    if (error.response) {
      console.log('📊 响应状态:', error.response.status);
      console.log('📋 响应数据:', error.response.data);
      
      if (error.response.status === 404) {
        console.error('❌ 生产环境API路径不正确，返回404');
        return false;
      } else if (error.response.status === 500) {
        console.log('✅ 生产环境API路径正确（服务器内部错误，但路径可达）');
      } else {
        console.log('✅ 生产环境API路径正确（非404错误）');
      }
    } else {
      console.error('❌ 网络错误:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ 无法连接到生产环境服务器');
        return false;
      }
    }
  }
  
  // 测试旧的API路径，确认返回404
  try {
    console.log('📤 测试旧的API路径: /ai/pick (应该返回404)');
    
    await axios.post(`${PRODUCTION_URL}/ai/pick`, {
      sessionId: 'test',
      fileKeys: ['test']
    }, {
      timeout: 10000
    });
    
    console.warn('⚠️ 旧路径仍然可用，这可能不是预期的');
    
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log('✅ 旧路径正确返回404，符合预期');
    } else if (error.response) {
      console.log('📊 旧路径响应状态:', error.response.status);
    } else {
      console.log('📊 旧路径网络错误:', error.message);
    }
  }
  
  return true;
}

testProductionAPI().then(success => {
  if (success) {
    console.log('\n🎉 生产环境API配置验证通过！');
    process.exit(0);
  } else {
    console.log('\n❌ 生产环境API配置验证失败');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ 测试过程中发生错误:', error);
  process.exit(1);
});