#!/usr/bin/env node

/**
 * 测试图片加载修复效果
 * 验证签名URL生成和访问
 */

const http = require('http');
const url = require('url');

console.log('🧪 测试图片加载修复效果\n');

// 测试签名URL生成
async function testSignedUrlGeneration() {
  console.log('📝 测试签名URL生成...');
  
  try {
    const response = await fetch('http://localhost:3000/upload/signed-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileKey: '38037645-2f2b-469f-a41a-06946d9a28f8.jpg',
        type: 'preview'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ 签名URL生成成功:', data);
    
    if (data.url) {
      // 验证URL格式
      const parsedUrl = new URL(data.url);
      const params = new URLSearchParams(parsedUrl.search);
      const expires = parseInt(params.get('expires'));
      const token = params.get('token');
      
      console.log('🔍 URL验证:');
      console.log('  - 基础URL:', parsedUrl.origin + parsedUrl.pathname);
      console.log('  - Token:', token ? '✅ 存在' : '❌ 缺失');
      console.log('  - 过期时间:', expires ? new Date(expires).toLocaleString() : '❌ 缺失');
      console.log('  - 是否有效:', expires > Date.now() ? '✅ 有效' : '❌ 已过期');
      
      return data.url;
    } else {
      throw new Error('响应中没有URL');
    }
  } catch (error) {
    console.error('❌ 签名URL生成失败:', error.message);
    return null;
  }
}

// 测试签名URL访问
async function testSignedUrlAccess(signedUrl) {
  console.log('\n📝 测试签名URL访问...');
  
  if (!signedUrl) {
    console.log('❌ 没有有效的签名URL可测试');
    return false;
  }
  
  try {
    const response = await fetch(signedUrl, {
      method: 'HEAD'  // 只获取头部信息，不下载整个文件
    });
    
    console.log('🔍 访问结果:');
    console.log('  - 状态码:', response.status);
    console.log('  - 状态文本:', response.statusText);
    console.log('  - Content-Type:', response.headers.get('content-type') || '未知');
    console.log('  - Content-Length:', response.headers.get('content-length') || '未知');
    
    if (response.ok) {
      console.log('✅ 签名URL访问成功');
      return true;
    } else {
      console.log('❌ 签名URL访问失败');
      return false;
    }
  } catch (error) {
    console.error('❌ 签名URL访问出错:', error.message);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('🧪 开始测试图片加载修复效果');
  console.log('='.repeat(50));
  
  // 检查服务器是否运行
  try {
    const healthCheck = await fetch('http://localhost:3000/health');
    if (!healthCheck.ok) {
      throw new Error('服务器健康检查失败');
    }
    console.log('✅ 服务器运行正常\n');
  } catch (error) {
    console.error('❌ 服务器未运行或无法访问:', error.message);
    console.log('\n💡 请确保后端服务器正在运行 (node index.js)');
    return;
  }
  
  // 测试签名URL生成
  const signedUrl = await testSignedUrlGeneration();
  
  // 测试签名URL访问
  const accessSuccess = await testSignedUrlAccess(signedUrl);
  
  console.log('\n' + '='.repeat(50));
  console.log('🧪 测试结果');
  console.log('='.repeat(50));
  
  const results = [
    { name: '签名URL生成', success: !!signedUrl },
    { name: '签名URL访问', success: accessSuccess }
  ];
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(status + ' ' + result.name);
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log('\n📊 测试完成: ' + successCount + '/' + results.length + ' 项成功');
  
  if (successCount === results.length) {
    console.log('\n🎉 所有测试都通过了！');
    console.log('\n📝 现在可以在微信开发者工具中测试：');
    console.log('1. 清除缓存并重启微信开发者工具');
    console.log('2. 重新打开推荐页面');
    console.log('3. 观察图片是否正常加载');
    console.log('4. 检查Console中的重试日志');
  } else {
    console.log('\n⚠️ 部分测试失败，请检查服务器配置');
  }
}

// 运行测试
runTests().catch(console.error);