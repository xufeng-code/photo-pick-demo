/**
 * API接口测试脚本
 * 用于测试分享功能和AI分析接口
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// 测试配置
const BASE_URL = 'http://localhost:3000';
const TEST_SESSION_ID = 'test_session_' + Date.now();

// 测试图片路径
const TEST_IMAGES = [
  path.join(__dirname, '../../assets/test/1.jpg'),
  path.join(__dirname, '../../assets/test/test-photo.svg')
];

/**
 * HTTP请求工具函数
 */
async function makeRequest(url, options = {}) {
  const fetch = (await import('node-fetch')).default;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    console.log(`\n📡 ${options.method || 'GET'} ${url}`);
    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    
    return { response, data };
  } catch (error) {
    console.error(`❌ Request failed:`, error.message);
    return { error };
  }
}

/**
 * 上传文件请求
 */
async function uploadFiles(url, files, fields = {}) {
  const fetch = (await import('node-fetch')).default;
  const FormData = require('form-data');
  
  try {
    const form = new FormData();
    
    // 添加字段
    Object.entries(fields).forEach(([key, value]) => {
      form.append(key, value);
    });
    
    // 添加文件
    files.forEach((filePath, index) => {
      if (fs.existsSync(filePath)) {
        form.append('photos', fs.createReadStream(filePath));
      } else {
        console.warn(`⚠️  文件不存在: ${filePath}`);
      }
    });
    
    const response = await fetch(url, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    const data = await response.json();
    
    console.log(`\n📡 POST ${url}`);
    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));
    
    return { response, data };
  } catch (error) {
    console.error(`❌ Upload failed:`, error.message);
    return { error };
  }
}

/**
 * 测试健康检查
 */
async function testHealthCheck() {
  console.log('\n🏥 测试健康检查...');
  return await makeRequest(`${BASE_URL}/health`);
}

/**
 * 测试分享创建
 */
async function testCreateShare() {
  console.log('\n📤 测试创建分享...');
  
  return await uploadFiles(
    `${BASE_URL}/share/create`,
    TEST_IMAGES,
    { sessionId: TEST_SESSION_ID }
  );
}

/**
 * 测试AI照片分析
 */
async function testAIAnalysis() {
  console.log('\n🤖 测试AI照片分析...');
  
  return await uploadFiles(
    `${BASE_URL}/ai/pick`,
    TEST_IMAGES,
    { sessionId: TEST_SESSION_ID }
  );
}

/**
 * 测试点赞功能
 */
async function testLike(shareId, photoId) {
  console.log('\n❤️  测试点赞功能...');
  
  return await makeRequest(`${BASE_URL}/share/like`, {
    method: 'POST',
    body: JSON.stringify({
      shareId,
      photoId,
      userId: 'test_user_123'
    })
  });
}

/**
 * 测试评论功能
 */
async function testComment(shareId, photoId) {
  console.log('\n💬 测试评论功能...');
  
  return await makeRequest(`${BASE_URL}/share/comment`, {
    method: 'POST',
    body: JSON.stringify({
      shareId,
      photoId,
      author: '测试用户',
      content: '这张照片很棒！'
    })
  });
}

/**
 * 测试获取分享
 */
async function testGetShare(shareId) {
  console.log('\n📥 测试获取分享...');
  
  return await makeRequest(`${BASE_URL}/share/${shareId}`);
}

/**
 * 测试同步分享
 */
async function testSyncShare(shareId) {
  console.log('\n🔄 测试同步分享...');
  
  return await makeRequest(`${BASE_URL}/share/sync/${shareId}`);
}

/**
 * 测试AI分析历史
 */
async function testAIHistory() {
  console.log('\n📚 测试AI分析历史...');
  
  return await makeRequest(`${BASE_URL}/ai/history/${TEST_SESSION_ID}`);
}

/**
 * 主测试流程
 */
async function runTests() {
  console.log('🚀 开始API接口测试...');
  console.log(`📍 测试会话ID: ${TEST_SESSION_ID}`);
  
  try {
    // 1. 健康检查
    await testHealthCheck();
    
    // 2. 创建分享
    const shareResult = await testCreateShare();
    const shareId = shareResult.data?.data?.shareId;
    const photoId = shareResult.data?.data?.photos?.[0]?.id;
    
    if (shareId) {
      // 3. 测试点赞
      await testLike(shareId, photoId);
      
      // 4. 测试评论
      await testComment(shareId, photoId);
      
      // 5. 获取分享
      await testGetShare(shareId);
      
      // 6. 同步分享
      await testSyncShare(shareId);
    }
    
    // 7. AI分析
    await testAIAnalysis();
    
    // 8. AI历史
    await testAIHistory();
    
    console.log('\n✅ 所有测试完成！');
    
  } catch (error) {
    console.error('\n❌ 测试过程中出现错误:', error);
  }
}

/**
 * 单独测试函数
 */
const tests = {
  health: testHealthCheck,
  share: testCreateShare,
  ai: testAIAnalysis,
  like: () => testLike('test_share_id', 'test_photo_id'),
  comment: () => testComment('test_share_id', 'test_photo_id'),
  get: () => testGetShare('test_share_id'),
  sync: () => testSyncShare('test_share_id'),
  history: testAIHistory
};

// 命令行参数处理
const testName = process.argv[2];

if (testName && tests[testName]) {
  console.log(`🎯 运行单个测试: ${testName}`);
  tests[testName]();
} else if (testName) {
  console.log(`❌ 未知测试: ${testName}`);
  console.log(`可用测试: ${Object.keys(tests).join(', ')}`);
} else {
  // 运行完整测试套件
  runTests();
}

module.exports = {
  runTests,
  tests,
  TEST_SESSION_ID,
  BASE_URL
};