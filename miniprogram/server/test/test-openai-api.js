const axios = require('axios');

async function testOpenAIAPI() {
  try {
    console.log('🔍 测试OpenAI API连接...');
    
    const apiKey = process.env.OPENAI_API_KEY || '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';
    
    console.log('📋 API密钥:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 5));
    
    // 测试简单的文本生成
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: '请简短回答：什么是AI？'
        }
      ],
      max_tokens: 100
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ OpenAI API连接成功!');
    console.log('📊 响应状态:', response.status);
    console.log('💬 AI回复:', response.data.choices[0]?.message?.content);
    
    return true;
    
  } catch (error) {
    console.log('❌ OpenAI API连接失败');
    console.log('📊 错误状态码:', error.response?.status);
    console.log('📋 错误信息:', error.response?.data?.error?.message || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 提示: API密钥可能无效或已过期');
    } else if (error.response?.status === 429) {
      console.log('💡 提示: API请求频率限制或余额不足');
    }
    
    return false;
  }
}

async function testOpenAIVision() {
  try {
    console.log('\n🖼️  测试OpenAI视觉分析功能...');
    
    const apiKey = process.env.OPENAI_API_KEY || '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';
    
    // 创建一个简单的测试图片（1x1像素的PNG）
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '请分析这张图片的内容，简短回答即可。'
            },
            {
              type: 'image_url',
              image_url: {
                url: testImage
              }
            }
          ]
        }
      ],
      max_tokens: 100
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ OpenAI视觉分析成功!');
    console.log('💬 分析结果:', response.data.choices[0]?.message?.content);
    
    return true;
    
  } catch (error) {
    console.log('❌ OpenAI视觉分析失败');
    console.log('📋 错误信息:', error.response?.data?.error?.message || error.message);
    return false;
  }
}

// 运行测试
async function runTests() {
  console.log('🚀 开始测试OpenAI API...\n');
  
  const basicTest = await testOpenAIAPI();
  
  if (basicTest) {
    const visionTest = await testOpenAIVision();
    
    if (visionTest) {
      console.log('\n🎉 OpenAI API完全可用，建议切换到OpenAI服务!');
      console.log('💡 可以将AI_PROVIDER设置为"openai"来使用真实的AI服务');
    } else {
      console.log('\n⚠️  OpenAI基础功能可用，但视觉分析功能有问题');
    }
  } else {
    console.log('\n❌ OpenAI API不可用，继续使用模拟模式');
  }
}

runTests().catch(error => {
  console.error('测试过程中发生错误:', error);
});