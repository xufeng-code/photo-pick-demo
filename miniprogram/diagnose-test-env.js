// diagnose-test-env.js
// 诊断测试环境问题的综合脚本

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000';
const TEST_FILE_KEY = '0077fecc-4b22-4f36-b78a-9856d72156df';

// 检查服务器状态
async function checkServerHealth() {
  console.log('🏥 检查服务器健康状态...');
  
  try {
    const response = await axios.get(`${API_BASE}/health`, { timeout: 5000 });
    console.log('✅ 服务器健康检查通过:', response.data);
    return true;
  } catch (error) {
    console.error('❌ 服务器健康检查失败:', error.message);
    return false;
  }
}

// 检查文件是否存在
async function checkFileExistence() {
  console.log('\n📁 检查测试文件是否存在...');
  
  const filePaths = [
    path.join(__dirname, 'server', 'uploads', 'thumb', `${TEST_FILE_KEY}.jpg`),
    path.join(__dirname, 'server', 'uploads', 'preview', `${TEST_FILE_KEY}.jpg`),
    path.join(__dirname, 'server', 'uploads', 'original', `${TEST_FILE_KEY}.jpg`)
  ];
  
  let allExist = true;
  
  for (const filePath of filePaths) {
    const exists = fs.existsSync(filePath);
    const fileType = path.basename(path.dirname(filePath));
    console.log(`${exists ? '✅' : '❌'} ${fileType} 文件:`, exists ? '存在' : '不存在');
    if (!exists) allExist = false;
  }
  
  return allExist;
}

// 测试API端点
async function testApiEndpoints() {
  console.log('\n🔌 测试API端点...');
  
  const endpoints = [
    { name: '根路径', url: '/', method: 'GET' },
    { name: '健康检查', url: '/health', method: 'GET' },
    { name: '签名URL生成', url: '/upload/signed-url', method: 'POST', data: { fileKey: TEST_FILE_KEY, type: 'preview' } }
  ];
  
  let allPassed = true;
  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      const config = {
        url: API_BASE + endpoint.url,
        method: endpoint.method,
        timeout: 10000
      };
      
      if (endpoint.data) {
        config.data = endpoint.data;
        config.headers = { 'Content-Type': 'application/json' };
      }
      
      const response = await axios(config);
      console.log(`✅ ${endpoint.name}: ${response.status}`);
      results[endpoint.name] = { success: true, data: response.data };
    } catch (error) {
      console.error(`❌ ${endpoint.name}: ${error.message}`);
      results[endpoint.name] = { success: false, error: error.message };
      allPassed = false;
    }
  }
  
  return { allPassed, results };
}

// 测试图片访问
async function testImageAccess() {
  console.log('\n🖼️ 测试图片访问...');
  
  const tests = [
    {
      name: '缩略图直接访问',
      url: `${API_BASE}/files/thumb/${TEST_FILE_KEY}.jpg`
    },
    {
      name: '预览图直接访问（应该失败）',
      url: `${API_BASE}/files/preview/${TEST_FILE_KEY}.jpg`,
      shouldFail: true
    }
  ];
  
  const results = {};
  
  for (const test of tests) {
    try {
      const response = await axios.get(test.url, {
        responseType: 'arraybuffer',
        timeout: 10000
      });
      
      if (test.shouldFail) {
        console.log(`⚠️ ${test.name}: 意外成功 (应该失败)`);
        results[test.name] = { success: false, unexpected: true };
      } else {
        console.log(`✅ ${test.name}: 成功，大小 ${response.data.length} bytes`);
        results[test.name] = { success: true, size: response.data.length };
      }
    } catch (error) {
      if (test.shouldFail) {
        console.log(`✅ ${test.name}: 正确失败 (${error.response?.status || error.message})`);
        results[test.name] = { success: true, expectedFailure: true };
      } else {
        console.error(`❌ ${test.name}: ${error.message}`);
        results[test.name] = { success: false, error: error.message };
      }
    }
  }
  
  return results;
}

// 测试签名URL访问
async function testSignedUrlAccess(signedUrlData) {
  console.log('\n🔐 测试签名URL访问...');
  
  if (!signedUrlData || !signedUrlData.url) {
    console.log('❌ 没有有效的签名URL可测试');
    return { success: false, error: '无签名URL' };
  }
  
  try {
    const response = await axios.get(signedUrlData.url, {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    
    console.log(`✅ 签名URL访问成功，大小 ${response.data.length} bytes`);
    return { success: true, size: response.data.length };
  } catch (error) {
    console.error(`❌ 签名URL访问失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 测试CORS配置
async function testCorsConfig() {
  console.log('\n🌐 测试CORS配置...');
  
  try {
    // 模拟浏览器跨域请求
    const response = await axios.get(`${API_BASE}/health`, {
      headers: {
        'Origin': 'http://localhost:8080',
        'Access-Control-Request-Method': 'GET'
      },
      timeout: 5000
    });
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
      'Access-Control-Allow-Credentials': response.headers['access-control-allow-credentials']
    };
    
    console.log('✅ CORS响应头:', corsHeaders);
    return { success: true, headers: corsHeaders };
  } catch (error) {
    console.error('❌ CORS测试失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 检查环境配置
function checkEnvironmentConfig() {
  console.log('\n⚙️ 检查环境配置...');
  
  const envPath = path.join(__dirname, 'server', '.env');
  const configPath = path.join(__dirname, 'utils', 'request.js');
  
  const config = {};
  
  // 检查.env文件
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ .env文件存在');
    
    envContent.split('\\n').forEach(line => {
      if (line.includes('=') && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        config[key.trim()] = value.trim();
      }
    });
  } else {
    console.log('⚠️ .env文件不存在');
  }
  
  // 检查小程序配置
  if (fs.existsSync(configPath)) {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const apiBaseMatch = configContent.match(/API_BASE:\\s*['"]([^'"]*)['"]/);
    if (apiBaseMatch) {
      console.log('✅ 小程序API配置:', apiBaseMatch[1]);
      config.MINIPROGRAM_API_BASE = apiBaseMatch[1];
    }
  }
  
  return config;
}

// 主诊断函数
async function runDiagnosis() {
  console.log('🔍 开始测试环境诊断\\n');
  console.log('=' .repeat(50));
  
  const results = {};
  
  // 1. 检查环境配置
  results.config = checkEnvironmentConfig();
  
  // 2. 检查服务器健康状态
  results.serverHealth = await checkServerHealth();
  
  // 3. 检查文件存在性
  results.filesExist = await checkFileExistence();
  
  // 4. 测试API端点
  const apiResults = await testApiEndpoints();
  results.apiEndpoints = apiResults;
  
  // 5. 测试图片访问
  results.imageAccess = await testImageAccess();
  
  // 6. 测试签名URL访问
  const signedUrlData = apiResults.results['签名URL生成']?.data;
  results.signedUrlAccess = await testSignedUrlAccess(signedUrlData);
  
  // 7. 测试CORS配置
  results.cors = await testCorsConfig();
  
  // 输出诊断报告
  console.log('\\n' + '=' .repeat(50));
  console.log('📋 诊断报告');
  console.log('=' .repeat(50));
  
  const issues = [];
  const warnings = [];
  
  if (!results.serverHealth) {
    issues.push('服务器无法访问');
  }
  
  if (!results.filesExist) {
    issues.push('测试文件缺失');
  }
  
  if (!results.apiEndpoints.allPassed) {
    issues.push('API端点测试失败');
  }
  
  if (!results.signedUrlAccess.success) {
    issues.push('签名URL访问失败');
  }
  
  if (!results.cors.success) {
    warnings.push('CORS配置可能有问题');
  }
  
  // 输出问题和建议
  if (issues.length === 0) {
    console.log('✅ 所有核心功能正常，测试环境应该可以正常工作');
  } else {
    console.log('❌ 发现以下问题:');
    issues.forEach(issue => console.log(`   • ${issue}`));
  }
  
  if (warnings.length > 0) {
    console.log('\\n⚠️ 警告:');
    warnings.forEach(warning => console.log(`   • ${warning}`));
  }
  
  console.log('\\n💡 建议:');
  if (!results.serverHealth) {
    console.log('   1. 确保后端服务器正在运行 (node index.js)');
  }
  if (!results.filesExist) {
    console.log('   2. 上传一些测试图片到系统中');
  }
  if (issues.length === 0) {
    console.log('   1. 检查小程序端的具体错误信息');
    console.log('   2. 查看微信开发者工具的Network面板');
    console.log('   3. 确认小程序的API_BASE配置正确');
  }
  
  return results;
}

// 运行诊断
runDiagnosis().catch(console.error);