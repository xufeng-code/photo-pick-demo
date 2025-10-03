#!/usr/bin/env node

/**
 * 小程序调试脚本
 * 模拟真实的小程序环境，检查可能的错误原因
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000';

// 模拟小程序的request方法
const mockWxRequest = {
  request: async (url, options = {}) => {
    try {
      const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
      console.log(`📤 小程序请求: ${options.method || 'GET'} ${fullUrl}`);
      
      const config = {
        method: options.method || 'GET',
        url: fullUrl,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MiniProgram/1.0',
          ...options.headers
        },
        timeout: options.timeout || 60000
      };
      
      if (options.data) {
        config.data = options.data;
        console.log(`📋 请求数据:`, options.data);
      }
      
      const response = await axios(config);
      console.log(`✅ 请求成功: ${response.status}`);
      return response.data;
      
    } catch (error) {
      console.error(`❌ 请求失败: ${error.message}`);
      if (error.response) {
        console.error(`   状态码: ${error.response.status}`);
        console.error(`   响应数据:`, error.response.data);
      }
      throw error;
    }
  }
};

// 模拟小程序的全局数据
const mockApp = {
  globalData: {
    photos: [],
    aiResult: null
  }
};

// 模拟小程序的页面数据
const mockPageData = {
  imageUrl: '',
  bestTag: '',
  description: '',
  loading: true,
  showFullscreen: false
};

// 模拟setData方法
function setData(data) {
  Object.assign(mockPageData, data);
  console.log('📱 页面数据更新:', data);
}

// 模拟wx.showToast
function showToast(options) {
  console.log(`🔔 Toast提示: ${options.title} (${options.icon})`);
}

// 获取照片的签名URL（复制自小程序代码）
async function getSignedUrlForPhoto(bestPhoto) {
  try {
    console.log('🔐 正在获取签名URL，fileKey:', bestPhoto.fileKey);
    
    // 调用后端API获取签名URL
    const response = await mockWxRequest.request('/upload/signed-url', {
      method: 'POST',
      data: {
        fileKey: bestPhoto.fileKey,
        type: 'preview'
      }
    });
    
    if (response && response.url) {
      console.log('✅ 获取到签名URL:', response.url);
      
      // 测试签名URL是否可访问
      try {
        const testResponse = await axios.head(response.url);
        console.log('✅ 签名URL可访问，状态码:', testResponse.status);
        
        // 使用签名URL设置页面数据
        const aiResult = mockApp.globalData.aiResult;
        const bestTag = aiResult && aiResult.tags && aiResult.tags.length > 0 ? aiResult.tags[0] : '精选照片';
        const description = aiResult && aiResult.reason || '这张照片最能展现您的魅力！';
        const isDemoData = aiResult && aiResult.isDemoData || false;
        
        setData({
          imageUrl: response.url,
          bestTag,
          description,
          loading: false,
          isDemoData
        });
        
        return { success: true, url: response.url };
        
      } catch (urlError) {
        console.error('❌ 签名URL无法访问:', urlError.message);
        throw new Error('签名URL无法访问');
      }
    } else {
      throw new Error('未获取到有效的签名URL');
    }
  } catch (error) {
    console.error('❌ 获取签名URL失败:', error.message);
    
    // 降级处理：使用临时的直接URL（仅用于开发测试）
    const fallbackUrl = `${API_BASE}/files/preview/${bestPhoto.fileKey}.jpg`;
    console.log('🔄 使用降级URL:', fallbackUrl);
    
    try {
      // 测试降级URL是否可访问
      const testResponse = await axios.head(fallbackUrl);
      console.log('✅ 降级URL可访问，状态码:', testResponse.status);
      
      const aiResult = mockApp.globalData.aiResult;
      const bestTag = aiResult && aiResult.tags && aiResult.tags.length > 0 ? aiResult.tags[0] : '精选照片';
      const description = aiResult && aiResult.reason || '这张照片最能展现您的魅力！';
      const isDemoData = aiResult && aiResult.isDemoData || false;
      
      setData({
        imageUrl: fallbackUrl,
        bestTag,
        description,
        loading: false,
        isDemoData
      });
      
      showToast({
        title: '图片加载可能较慢',
        icon: 'none'
      });
      
      return { success: true, url: fallbackUrl, usedFallback: true };
      
    } catch (fallbackError) {
      console.error('❌ 降级URL也无法访问:', fallbackError.message);
      
      showToast({
        title: '图片加载失败',
        icon: 'none'
      });
      
      return { success: false, error: error.message };
    }
  }
}

// 模拟推荐页面的onLoad方法
async function simulateRecommendPageLoad() {
  console.log('📱 模拟推荐页面加载...\n');
  
  // 模拟从全局数据获取照片
  const photos = [
    {
      id: 'test-photo-1',
      fileKey: '8a5784e1-0300-41cc-8ab0-a0b6c76e0ba6',
      path: null
    }
  ];
  
  // 模拟AI结果
  const aiResult = {
    bestPhotoIndex: 0,
    tags: ['精选照片'],
    reason: '这张照片最能展现您的魅力！',
    isDemoData: false
  };
  
  mockApp.globalData.photos = photos;
  mockApp.globalData.aiResult = aiResult;
  
  console.log('📋 模拟数据设置完成');
  console.log('   照片数量:', photos.length);
  console.log('   AI结果:', aiResult);
  
  // 获取最佳照片
  let bestPhoto = null;
  if (aiResult && typeof aiResult.bestPhotoIndex === 'number' && aiResult.bestPhotoIndex >= 0) {
    bestPhoto = photos[aiResult.bestPhotoIndex];
    console.log('✅ 找到最佳照片:', bestPhoto.id);
  }
  
  if (!bestPhoto) {
    console.error('❌ 未找到最佳照片');
    return { success: false, error: '未找到最佳照片' };
  }
  
  // 处理图片URL
  let imageUrl = '';
  if (bestPhoto.path) {
    // 如果有path属性，直接使用
    imageUrl = bestPhoto.path;
    console.log('✅ 使用已构建的path:', imageUrl);
    
    setData({
      imageUrl,
      bestTag: aiResult.tags[0],
      description: aiResult.reason,
      loading: false
    });
    
    return { success: true, url: imageUrl };
  } else {
    // 需要获取签名URL
    console.log('🔐 需要获取签名URL...');
    return await getSignedUrlForPhoto(bestPhoto);
  }
}

// 检查服务器状态
async function checkServerStatus() {
  console.log('🏥 检查服务器状态...');
  
  try {
    const response = await axios.get(`${API_BASE}/health`);
    console.log('✅ 服务器正常运行:', response.data);
    return true;
  } catch (error) {
    console.error('❌ 服务器无法访问:', error.message);
    return false;
  }
}

// 检查测试文件是否存在
async function checkTestFiles() {
  console.log('📁 检查测试文件...');
  
  const testFileKey = '8a5784e1-0300-41cc-8ab0-a0b6c76e0ba6';
  const files = [
    { type: 'thumb', path: `server/uploads/thumb/${testFileKey}.jpg` },
    { type: 'preview', path: `server/uploads/preview/${testFileKey}.jpg` },
    { type: 'original', path: `server/uploads/original/${testFileKey}.jpg` }
  ];
  
  for (const file of files) {
    const fullPath = path.join(__dirname, file.path);
    const exists = fs.existsSync(fullPath);
    console.log(`   ${file.type}: ${exists ? '✅ 存在' : '❌ 不存在'} (${fullPath})`);
  }
}

// 主调试函数
async function runMiniProgramDebug() {
  console.log('🐛 小程序调试开始\n');
  console.log('=' .repeat(50));
  
  // 1. 检查服务器状态
  const serverOk = await checkServerStatus();
  if (!serverOk) {
    console.log('\n❌ 服务器无法访问，请确保后端服务正在运行');
    return;
  }
  
  // 2. 检查测试文件
  await checkTestFiles();
  
  // 3. 模拟推荐页面加载
  console.log('\n📱 开始模拟小程序推荐页面...');
  const result = await simulateRecommendPageLoad();
  
  console.log('\n' + '=' .repeat(50));
  console.log('🐛 调试结果');
  console.log('=' .repeat(50));
  
  if (result.success) {
    console.log('✅ 小程序页面加载成功');
    console.log('   图片URL:', result.url);
    if (result.usedFallback) {
      console.log('⚠️ 使用了降级URL，签名URL可能有问题');
    }
    
    console.log('\n📱 最终页面数据:');
    console.log(JSON.stringify(mockPageData, null, 2));
    
  } else {
    console.log('❌ 小程序页面加载失败');
    console.log('   错误:', result.error);
  }
  
  console.log('\n💡 调试建议:');
  if (result.success) {
    if (result.usedFallback) {
      console.log('   1. 检查签名URL生成逻辑');
      console.log('   2. 验证签名验证中间件');
      console.log('   3. 确认文件路径格式正确');
    } else {
      console.log('   1. 小程序端应该能正常显示图片');
      console.log('   2. 如果仍有问题，检查微信开发者工具的Network面板');
      console.log('   3. 确认小程序的域名配置正确');
    }
  } else {
    console.log('   1. 确保后端服务正在运行');
    console.log('   2. 检查测试文件是否存在');
    console.log('   3. 验证API端点是否正常');
  }
}

// 运行调试
runMiniProgramDebug().catch(console.error);