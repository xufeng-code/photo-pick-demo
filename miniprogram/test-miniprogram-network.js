// 测试小程序网络连接
const { CURRENT_CONFIG } = require('./utils/config');

console.log('🔧 当前配置:', CURRENT_CONFIG);

// 模拟小程序环境
global.wx = {
  request: function(options) {
    console.log('🌐 模拟小程序网络请求:', options);
    
    // 使用Node.js的http模块来测试连接
    const http = require('http');
    const url = require('url');
    
    const parsedUrl = url.parse(options.url);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: parsedUrl.path,
      method: options.method || 'GET',
      headers: options.header || {}
    };
    
    console.log('📡 实际请求参数:', requestOptions);
    
    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('✅ 请求成功:', {
          statusCode: res.statusCode,
          headers: res.headers,
          dataLength: data.length
        });
        options.success && options.success({
          statusCode: res.statusCode,
          data: data ? JSON.parse(data) : null
        });
      });
    });
    
    req.on('error', (err) => {
      console.error('❌ 请求失败:', err);
      options.fail && options.fail(err);
    });
    
    if (options.data && options.method !== 'GET') {
      req.write(JSON.stringify(options.data));
    }
    
    req.end();
  }
};

// 测试网络连接
async function testNetworkConnection() {
  console.log('🧪 开始测试网络连接...');
  
  try {
    const { request } = require('./utils/request');
    
    // 测试基础连接
    console.log('1. 测试基础API连接...');
    const response = await request('/health');
    console.log('✅ 基础连接测试成功:', response);
    
  } catch (error) {
    console.error('❌ 网络连接测试失败:', error);
  }
}

testNetworkConnection();