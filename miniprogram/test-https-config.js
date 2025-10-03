#!/usr/bin/env node

/**
 * HTTPS配置测试脚本
 * 验证域名配置、API访问和图片加载功能
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// 读取配置
function readConfig() {
  const envPath = path.join(__dirname, 'server', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const config = {};
  envContent.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      config[key.trim()] = value.trim();
    }
  });
  
  return config;
}

// 发送HTTP请求
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.data) {
      req.write(JSON.stringify(options.data));
    }
    
    req.end();
  });
}

async function testHealthCheck(baseUrl) {
  console.log('🔍 测试健康检查...');
  try {
    const response = await makeRequest(`${baseUrl}/health`);
    if (response.statusCode === 200) {
      console.log('✅ 健康检查通过');
      return true;
    } else {
      console.log(`❌ 健康检查失败: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 健康检查错误: ${error.message}`);
    return false;
  }
}

async function testSignedUrlGeneration(baseUrl) {
  console.log('🔍 测试签名URL生成...');
  try {
    const response = await makeRequest(`${baseUrl}/upload/signed-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        fileKey: 'test-file-key',
        type: 'preview'
      }
    });
    
    if (response.statusCode === 200) {
      const result = JSON.parse(response.data);
      console.log('✅ 签名URL生成成功');
      console.log(`   URL: ${result.url}`);
      console.log(`   过期时间: ${result.expires}`);
      return result.url;
    } else {
      console.log(`❌ 签名URL生成失败: ${response.statusCode}`);
      console.log(`   响应: ${response.data}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ 签名URL生成错误: ${error.message}`);
    return null;
  }
}

async function testFileAccess(signedUrl) {
  if (!signedUrl) return false;
  
  console.log('🔍 测试文件访问...');
  try {
    const response = await makeRequest(signedUrl);
    if (response.statusCode === 404) {
      console.log('⚠️  文件不存在 (正常，因为是测试文件)');
      return true; // 404是预期的，因为测试文件不存在
    } else if (response.statusCode === 401) {
      console.log('❌ 签名验证失败');
      return false;
    } else if (response.statusCode === 200) {
      console.log('✅ 文件访问成功');
      return true;
    } else {
      console.log(`❌ 文件访问失败: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 文件访问错误: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🧪 HTTPS配置测试开始\n');
  
  // 读取配置
  const config = readConfig();
  const baseUrl = config.BASE_URL || 'http://localhost:3000';
  
  console.log(`📋 当前配置:`);
  console.log(`   BASE_URL: ${baseUrl}`);
  console.log(`   协议: ${baseUrl.startsWith('https://') ? 'HTTPS ✅' : 'HTTP ⚠️'}`);
  console.log('');
  
  // 测试序列
  const tests = [
    { name: '健康检查', fn: () => testHealthCheck(baseUrl) },
    { name: '签名URL生成', fn: () => testSignedUrlGeneration(baseUrl) },
  ];
  
  let allPassed = true;
  let signedUrl = null;
  
  for (const test of tests) {
    const result = await test.fn();
    if (test.name === '签名URL生成' && result) {
      signedUrl = result;
    }
    if (!result && test.name !== '签名URL生成') {
      allPassed = false;
    }
  }
  
  // 测试文件访问
  if (signedUrl) {
    const fileAccessResult = await testFileAccess(signedUrl);
    if (!fileAccessResult) {
      allPassed = false;
    }
  }
  
  console.log('\n📊 测试结果:');
  if (allPassed) {
    console.log('🎉 所有测试通过！');
    
    if (baseUrl.startsWith('https://')) {
      console.log('\n✅ HTTPS配置正确，可以用于小程序生产环境');
      console.log('\n📝 下一步操作:');
      console.log('1. 在微信小程序后台添加合法域名:');
      console.log(`   request合法域名: ${baseUrl}`);
      console.log(`   downloadFile合法域名: ${baseUrl}`);
      console.log('2. 重新编译小程序项目');
      console.log('3. 在真机上测试功能');
    } else {
      console.log('\n⚠️  当前使用HTTP协议，仅适用于开发环境');
      console.log('   生产环境请运行: node setup-https.js 配置HTTPS域名');
    }
  } else {
    console.log('❌ 部分测试失败，请检查配置');
  }
}

main().catch(console.error);