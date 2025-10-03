// test-upload.js - 测试上传功能
const { CURRENT_CONFIG } = require('./utils/config');

console.log('📤 测试上传功能...\n');

// 模拟微信小程序环境
global.wx = {
  getNetworkType: (options) => {
    console.log('🌐 模拟网络检测...');
    setTimeout(() => {
      options.success({ networkType: 'wifi' });
    }, 100);
  },
  uploadFile: (options) => {
    console.log('📤 模拟文件上传...');
    console.log(`   URL: ${options.url}`);
    console.log(`   文件路径: ${options.filePath}`);
    console.log(`   超时时间: ${options.timeout}ms`);
    
    // 模拟上传成功
    setTimeout(() => {
      const mockResponse = {
        statusCode: 200,
        data: JSON.stringify({
          success: true,
          filename: 'test-photo.jpg',
          url: '/files/test-photo.jpg',
          fileKey: 'test-photo-id',
          urls: {
          preview: 'https://xuanzhaopian-k6c0xkr75-xf-neau-5216s-projects.vercel.app/files/test-photo.jpg'
        }
        })
      };
      
      console.log('✅ 模拟上传成功');
      options.success(mockResponse);
    }, 1000);
    
    // 返回模拟的上传任务
    return {
      onProgressUpdate: (callback) => {
        console.log('📊 模拟上传进度...');
        let progress = 0;
        const interval = setInterval(() => {
          progress += 20;
          callback({ progress });
          if (progress >= 100) {
            clearInterval(interval);
          }
        }, 200);
      }
    };
  }
};

// 导入上传函数
const { uploadFileEnhanced } = require('./utils/upload');

// 测试上传功能
async function testUpload() {
  try {
    console.log('1. 配置验证:');
    console.log(`   API地址: ${CURRENT_CONFIG.API_BASE}`);
    console.log(`   是否HTTPS: ${CURRENT_CONFIG.API_BASE.startsWith('https://') ? '✅' : '❌'}`);
    
    console.log('\n2. 开始上传测试:');
    const result = await uploadFileEnhanced('test-image.jpg', {
      timeout: 30000,
      retryTimes: 2,
      onProgress: (progress) => {
        console.log(`   进度: ${progress}%`);
      }
    });
    
    console.log('\n3. 上传结果:');
    console.log('   ✅ 上传成功!');
    console.log(`   文件名: ${result.filename}`);
    console.log(`   文件Key: ${result.fileKey}`);
    console.log(`   相对URL: ${result.url}`);
    console.log(`   完整URL: ${result.fullUrl}`);
    
  } catch (error) {
    console.log('\n3. 上传结果:');
    console.log('   ❌ 上传失败!');
    console.log(`   错误信息: ${error.message}`);
    console.log(`   原始错误:`, error.originalError);
  }
}

// 运行测试
testUpload().then(() => {
  console.log('\n🎯 上传功能测试完成！');
}).catch((error) => {
  console.error('\n❌ 测试过程出错:', error);
});