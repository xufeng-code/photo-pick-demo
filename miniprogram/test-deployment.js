#!/usr/bin/env node

/**
 * 部署测试脚本
 * 验证 H5 Demo 和 API 功能
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 测试配置
const TEST_CONFIG = {
  // 本地测试
  local: {
    baseUrl: 'http://localhost:3001',
    name: '本地环境'
  },
  // Vercel 测试（部署后更新）
  vercel: {
    baseUrl: 'https://xuanzhaopian-ai.vercel.app',
    name: 'Vercel 生产环境'
  }
};

/**
 * 测试 API 健康检查
 */
async function testHealthCheck(config) {
  try {
    console.log(`\n🔍 测试 ${config.name} - 健康检查...`);
    
    const response = await axios.get(`${config.baseUrl}/api/health`, {
      timeout: 10000
    });
    
    if (response.status === 200 && response.data.ok) {
      console.log(`✅ ${config.name} - 健康检查通过`);
      console.log(`   服务: ${response.data.service || 'N/A'}`);
      console.log(`   时间: ${response.data.timestamp || 'N/A'}`);
      return true;
    } else {
      console.log(`❌ ${config.name} - 健康检查失败`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${config.name} - 健康检查错误: ${error.message}`);
    return false;
  }
}

/**
 * 测试 H5 Demo 页面
 */
async function testH5Demo(config) {
  try {
    console.log(`\n🌐 测试 ${config.name} - H5 Demo 页面...`);
    
    const response = await axios.get(config.baseUrl, {
      timeout: 10000
    });
    
    if (response.status === 200 && response.data.includes('选照片 AI')) {
      console.log(`✅ ${config.name} - H5 Demo 页面加载成功`);
      return true;
    } else {
      console.log(`❌ ${config.name} - H5 Demo 页面内容异常`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${config.name} - H5 Demo 页面错误: ${error.message}`);
    return false;
  }
}

/**
 * 测试静态资源
 */
async function testStaticAssets(config) {
  try {
    console.log(`\n📁 测试 ${config.name} - 静态资源...`);
    
    const response = await axios.get(`${config.baseUrl}/app.js`, {
      timeout: 10000
    });
    
    if (response.status === 200 && response.data.includes('PhotoAnalyzer')) {
      console.log(`✅ ${config.name} - 静态资源加载成功`);
      return true;
    } else {
      console.log(`❌ ${config.name} - 静态资源内容异常`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${config.name} - 静态资源错误: ${error.message}`);
    return false;
  }
}

/**
 * 测试 CORS 配置
 */
async function testCORS(config) {
  try {
    console.log(`\n🔒 测试 ${config.name} - CORS 配置...`);
    
    const response = await axios.options(`${config.baseUrl}/api/health`, {
      timeout: 10000,
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'GET'
      }
    });
    
    const corsHeader = response.headers['access-control-allow-origin'];
    if (corsHeader === '*' || corsHeader === 'https://example.com') {
      console.log(`✅ ${config.name} - CORS 配置正确`);
      return true;
    } else {
      console.log(`❌ ${config.name} - CORS 配置异常: ${corsHeader}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${config.name} - CORS 测试错误: ${error.message}`);
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 开始部署功能测试...\n');
  
  const results = {
    local: { passed: 0, total: 0 },
    vercel: { passed: 0, total: 0 }
  };
  
  // 测试本地环境
  console.log('=' .repeat(50));
  console.log('📍 本地环境测试');
  console.log('=' .repeat(50));
  
  const localTests = [
    () => testHealthCheck(TEST_CONFIG.local),
    () => testH5Demo(TEST_CONFIG.local),
    () => testStaticAssets(TEST_CONFIG.local),
    () => testCORS(TEST_CONFIG.local)
  ];
  
  for (const test of localTests) {
    results.local.total++;
    if (await test()) {
      results.local.passed++;
    }
  }
  
  // 测试 Vercel 环境（如果可用）
  console.log('\n' + '=' .repeat(50));
  console.log('🌐 Vercel 环境测试');
  console.log('=' .repeat(50));
  
  const vercelTests = [
    () => testHealthCheck(TEST_CONFIG.vercel),
    () => testH5Demo(TEST_CONFIG.vercel),
    () => testStaticAssets(TEST_CONFIG.vercel),
    () => testCORS(TEST_CONFIG.vercel)
  ];
  
  for (const test of vercelTests) {
    results.vercel.total++;
    if (await test()) {
      results.vercel.passed++;
    }
  }
  
  // 输出测试结果
  console.log('\n' + '=' .repeat(50));
  console.log('📊 测试结果汇总');
  console.log('=' .repeat(50));
  
  console.log(`\n🏠 本地环境: ${results.local.passed}/${results.local.total} 通过`);
  console.log(`🌐 Vercel 环境: ${results.vercel.passed}/${results.vercel.total} 通过`);
  
  const totalPassed = results.local.passed + results.vercel.passed;
  const totalTests = results.local.total + results.vercel.total;
  
  console.log(`\n🎯 总体结果: ${totalPassed}/${totalTests} 通过`);
  
  if (totalPassed === totalTests) {
    console.log('\n🎉 所有测试通过！项目已准备好部署到 Vercel。');
  } else {
    console.log('\n⚠️  部分测试失败，请检查配置后重试。');
  }
  
  // 生成部署指南
  console.log('\n' + '=' .repeat(50));
  console.log('📋 下一步操作');
  console.log('=' .repeat(50));
  
  console.log('\n1. 🔧 准备 GitHub 仓库:');
  console.log('   git init');
  console.log('   git add .');
  console.log('   git commit -m "Initial commit: H5 Demo + 微信小程序"');
  console.log('   git remote add origin <your-github-repo>');
  console.log('   git push -u origin main');
  
  console.log('\n2. 🚀 部署到 Vercel:');
  console.log('   - 访问 https://vercel.com');
  console.log('   - 连接 GitHub 仓库');
  console.log('   - 配置环境变量（QWEN_API_KEY 等）');
  console.log('   - 部署完成后更新微信小程序域名配置');
  
  console.log('\n3. 📱 微信小程序配置:');
  console.log('   - 在微信公众平台添加 Vercel 域名到合法域名列表');
  console.log('   - 更新 utils/config.js 中的生产环境配置');
  console.log('   - 上传小程序代码并生成体验版');
}

// 运行测试
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testHealthCheck,
  testH5Demo,
  testStaticAssets,
  testCORS
};