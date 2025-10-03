// 测试小程序base64直接发送功能
const fs = require('fs');
const path = require('path');

// 模拟小程序环境
global.wx = {
  request: function(options) {
    console.log('🔄 模拟wx.request调用:', {
      url: options.url,
      method: options.method,
      dataSize: options.data ? JSON.stringify(options.data).length : 0
    });
    
    // 使用内置的http模块模拟网络请求
    const https = require('https');
    const http = require('http');
    const url = require('url');
    
    const parsedUrl = url.parse(options.url);
    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.header
      }
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log('✅ 请求成功:', jsonData);
          if (options.success) {
            options.success({
              statusCode: res.statusCode,
              data: jsonData
            });
          }
        } catch (error) {
          console.log('✅ 请求成功 (非JSON响应):', data);
          if (options.success) {
            options.success({
              statusCode: res.statusCode,
              data: data
            });
          }
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ 请求失败:', error.message);
      if (options.fail) {
        options.fail({
          errMsg: `request:fail ${error.message}`
        });
      }
    });
    
    if (options.data) {
      req.write(JSON.stringify(options.data));
    }
    req.end();
  },
  
  getFileSystemManager: function() {
    return {
      readFile: function(options) {
        try {
          const data = fs.readFileSync(options.filePath, options.encoding);
          if (options.success) {
            options.success({ data });
          }
        } catch (error) {
          if (options.fail) {
            options.fail({ errMsg: `readFile:fail ${error.message}` });
          }
        }
      },
      readFileSync: function(filePath, encoding) {
        try {
          return fs.readFileSync(filePath, encoding);
        } catch (error) {
          throw new Error(`readFileSync:fail ${error.message}`);
        }
      }
    };
  },
  getFileInfo: function(options) {
    try {
      const stats = fs.statSync(options.filePath);
      if (options.success) {
        options.success({ size: stats.size });
      }
    } catch (error) {
      if (options.fail) {
        options.fail({ errMsg: `getFileInfo:fail ${error.message}` });
      }
    }
  },
  compressImage: function(options) {
    // 模拟压缩成功，实际返回原路径
    console.log(`🔄 模拟图片压缩: ${options.src}, 质量: ${options.quality}%`);
    if (options.success) {
      options.success({ tempFilePath: options.src });
    }
  },
  getSystemInfoSync: function() {
    return {
      platform: 'devtools' // 模拟开发者工具环境
    };
  }
};

// 导入小程序模块
const { readFileToBase64, analyzePhotosDirectly } = require('./utils/upload.js');
const { getConfigManager } = require('./utils/config.js');

async function testBase64Flow() {
  console.log('🧪 开始测试小程序base64直接发送流程...\n');
  
  try {
    // 1. 测试配置
    console.log('1️⃣ 测试配置管理...');
    const configManager = getConfigManager();
    const config = configManager.getConfig();
    console.log('   配置信息:', {
      BASE_URL: config.BASE_URL,
      API_BASE: config.API_BASE,
      ENVIRONMENT: config.ENVIRONMENT
    });
    
    // 2. 测试base64转换
    console.log('\n2️⃣ 测试base64转换...');
    const testImagePath = path.join(__dirname, 'assets', 'test', '1.jpg');
    
    if (!fs.existsSync(testImagePath)) {
      console.log('   ⚠️ 测试图片不存在，跳过base64转换测试');
    } else {
      try {
        const base64Data = await readFileToBase64(testImagePath);
        console.log('   ✅ base64转换成功');
        console.log('   📊 base64数据长度:', base64Data.length);
        console.log('   🔍 数据格式:', base64Data.substring(0, 50) + '...');
        
        // 3. 测试AI分析请求
        console.log('\n3️⃣ 测试AI分析请求...');
        const photos = [
          {
            id: 'test-photo-1',
            base64: base64Data
          }
        ];
        
        console.log('   📤 准备发送照片数据...');
        console.log('   📊 照片数量:', photos.length);
        console.log('   📊 总数据大小:', JSON.stringify(photos).length, 'bytes');
        
        // 调用AI分析
        const result = await new Promise((resolve, reject) => {
          analyzePhotosDirectly(photos)
            .then(resolve)
            .catch(reject);
        });
        
        console.log('   ✅ AI分析成功!');
        console.log('   📋 分析结果:', JSON.stringify(result, null, 2));
        
      } catch (error) {
        console.error('   ❌ base64转换失败:', error.message);
      }
    }
    
    // 4. 测试健康检查
    console.log('\n4️⃣ 测试健康检查...');
    const healthUrl = config.API_BASE + '/api/health';
    
    await new Promise((resolve, reject) => {
      wx.request({
        url: healthUrl,
        method: 'GET',
        success: (res) => {
          console.log('   ✅ 健康检查通过');
          console.log('   📊 状态码:', res.statusCode);
          console.log('   📋 响应数据:', res.data);
          resolve(res);
        },
        fail: (err) => {
          console.error('   ❌ 健康检查失败:', err.errMsg);
          reject(err);
        }
      });
    });
    
    console.log('\n🎉 所有测试完成!');
    
  } catch (error) {
    console.error('\n💥 测试过程中出现错误:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行测试
if (require.main === module) {
  testBase64Flow().then(() => {
    console.log('\n✅ 测试脚本执行完成');
    process.exit(0);
  }).catch((error) => {
    console.error('\n❌ 测试脚本执行失败:', error.message);
    process.exit(1);
  });
}

module.exports = { testBase64Flow };