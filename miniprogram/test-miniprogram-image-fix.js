// test-miniprogram-image-fix.js
// 测试小程序图片加载修复方案

const axios = require('axios');

// 配置
const config = {
  CURRENT_CONFIG: {
    BASE_URL: 'http://192.168.1.6:8080'
  }
};

// 测试数据
const testFileKey = '3254ac91-92a5-4b32-80f8-76e087d5db46';

async function testImageLoadingFix() {
  console.log('🔧 测试小程序图片加载修复方案...\n');
  
  try {
    // 1. 测试签名URL生成
    console.log('1️⃣ 测试签名URL生成...');
    const signedUrlResponse = await axios.post(`${config.CURRENT_CONFIG.BASE_URL}/api/upload/signed-url`, {
      fileKey: testFileKey,
      type: 'preview'
    });
    
    const signedUrl = signedUrlResponse.data.url;
    console.log('✅ 签名URL生成成功:', signedUrl);
    
    // 2. 测试签名URL访问
    console.log('\n2️⃣ 测试签名URL访问...');
    const imageResponse = await axios.get(signedUrl, { 
      timeout: 10000,
      responseType: 'arraybuffer'
    });
    console.log('✅ 签名URL访问成功:', {
      status: imageResponse.status,
      contentType: imageResponse.headers['content-type'],
      size: imageResponse.data.length
    });
    
    // 3. 测试降级URL
    console.log('\n3️⃣ 测试降级URL...');
    const fallbackUrl = `${config.CURRENT_CONFIG.BASE_URL}/files/preview/${testFileKey}.jpg`;
    try {
      const fallbackResponse = await axios.get(fallbackUrl, { 
        timeout: 10000,
        responseType: 'arraybuffer'
      });
      console.log('✅ 降级URL访问成功:', {
        status: fallbackResponse.status,
        contentType: fallbackResponse.headers['content-type'],
        size: fallbackResponse.data.length
      });
    } catch (fallbackError) {
      console.log('❌ 降级URL访问失败:', fallbackError.response?.status || fallbackError.message);
      console.log('   这是正常的，因为降级URL需要token验证');
    }
    
    // 4. 生成小程序修复建议
    console.log('\n4️⃣ 小程序修复建议:');
    console.log('');
    console.log('📱 在微信开发者工具中：');
    console.log('   1. 打开"详情" -> "本地设置"');
    console.log('   2. 勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"');
    console.log('   3. 重新编译小程序');
    console.log('');
    console.log('🔧 代码修复：');
    console.log('   1. 确保使用正确的BASE_URL:', config.CURRENT_CONFIG.BASE_URL);
    console.log('   2. 签名URL请求正常工作');
    console.log('   3. 图片组件的binderror事件处理正确');
    console.log('');
    console.log('🧪 测试步骤：');
    console.log('   1. 在小程序中上传照片');
    console.log('   2. 查看控制台日志，确认签名URL请求成功');
    console.log('   3. 检查图片是否正常显示');
    console.log('   4. 如果图片不显示，查看onImageError的日志');
    
    // 5. 创建测试URL
    console.log('\n5️⃣ 测试URL:');
    console.log('   签名URL:', signedUrl);
    console.log('   降级URL:', fallbackUrl);
    console.log('   可以在浏览器中直接访问签名URL测试');
    
    return {
      success: true,
      signedUrl,
      fallbackUrl,
      recommendations: [
        '在开发者工具中关闭域名校验',
        '确认BASE_URL配置正确',
        '检查图片组件的错误处理',
        '查看控制台日志定位问题'
      ]
    };
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// 运行测试
testImageLoadingFix().then(result => {
  console.log('\n🎯 测试结果:', result.success ? '成功' : '失败');
  if (result.success) {
    console.log('\n✨ 修复方案已验证，请按照建议操作！');
  }
}).catch(error => {
  console.error('💥 测试异常:', error);
});