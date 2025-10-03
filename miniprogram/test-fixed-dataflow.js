// 测试修复后的数据流
const fs = require('fs');
const path = require('path');

// 模拟小程序的照片数据结构（修复后）
const mockPhotos = [
  {
    id: 'photo_1',
    tempFilePath: path.join(__dirname, 'assets/test/1.jpg'), // 使用正确的字段名
    size: 1024000,
    width: 1920,
    height: 1080,
    orientation: 'landscape'
  },
  {
    id: 'photo_2', 
    tempFilePath: path.join(__dirname, 'assets/test/1.jpg'), // 使用相同的测试图片
    size: 1024000,
    width: 1920,
    height: 1080,
    orientation: 'landscape'
  }
];

// 测试 toBase64Payload 函数
async function testToBase64Payload() {
  console.log('🧪 测试 toBase64Payload 函数...');
  
  try {
    // 模拟小程序环境
    global.wx = {
      getImageInfo: (options) => {
        console.log('📸 getImageInfo 调用，src:', options.src);
        
        // 检查文件是否存在
        if (!fs.existsSync(options.src)) {
          console.error('❌ 文件不存在:', options.src);
          options.fail && options.fail(new Error('文件不存在'));
          return;
        }
        
        // 模拟成功响应
        setTimeout(() => {
          options.success && options.success({
            width: 1920,
            height: 1080,
            path: options.src
          });
        }, 10);
      },
      createSelectorQuery: () => ({
        select: () => ({
          fields: () => ({
            exec: (callback) => {
              // 模拟 canvas 节点
              const mockCanvas = {
                width: 0,
                height: 0,
                getContext: () => ({
                  drawImage: () => {},
                }),
                createImage: () => ({
                  onload: null,
                  onerror: null,
                  set src(value) {
                    setTimeout(() => {
                      this.onload && this.onload();
                    }, 10);
                  }
                }),
                toDataURL: () => 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
              };
              
              callback([{ node: mockCanvas }]);
            }
          })
        })
      })
    };
    
    // 导入 media.js 模块
    const { toBase64Payload } = require('./utils/media.js');
    
    // 测试函数
    const result = await toBase64Payload(mockPhotos);
    
    console.log('✅ toBase64Payload 测试成功');
    console.log('📦 结果结构:', Object.keys(result));
    console.log('📸 照片数量:', result.photos ? result.photos.length : 0);
    
    if (result.photos && result.photos.length > 0) {
      console.log('📋 第一张照片信息:', {
        id: result.photos[0].id,
        hasBase64: !!result.photos[0].base64,
        base64Length: result.photos[0].base64 ? result.photos[0].base64.length : 0
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ toBase64Payload 测试失败:', error);
    throw error;
  }
}

// 测试后端 AI 接口
async function testAIEndpoint(payload) {
  console.log('🧪 测试后端 AI 接口...');
  
  const http = require('http');
  
  const postData = JSON.stringify({
    sessionId: 'test_session_' + Date.now(),
    ...payload
  });
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/ai/pick',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ AI 接口测试成功');
          console.log('📊 响应状态:', res.statusCode);
          console.log('📋 响应数据:', result);
          resolve(result);
        } catch (error) {
          console.error('❌ 解析响应失败:', error);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ 请求失败:', error);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试修复后的数据流...\n');
  
  try {
    // 1. 测试 base64 转换
    const base64Result = await testToBase64Payload();
    
    console.log('\n📡 测试后端接口...');
    
    // 2. 测试后端接口
    await testAIEndpoint(base64Result);
    
    console.log('\n🎉 所有测试通过！数据流修复成功！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
if (require.main === module) {
  runTests();
}

module.exports = { testToBase64Payload, testAIEndpoint };