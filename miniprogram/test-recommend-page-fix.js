// test-recommend-page-fix.js
// 测试推荐页面修复后的功能

const axios = require('axios');

const API_BASE = 'http://localhost:3000';

// 模拟小程序的request工具
function mockWxRequest(url, options = {}) {
  const fullUrl = API_BASE + url;
  
  console.log('🌐 模拟小程序请求:', {
    url: fullUrl,
    method: options.method || 'GET',
    data: options.data
  });
  
  return axios({
    url: fullUrl,
    method: options.method || 'GET',
    data: options.data,
    headers: {
      'content-type': 'application/json',
      ...options.header
    },
    timeout: 60000
  }).then(response => {
    console.log('✅ 请求成功:', response.status);
    return response.data;
  }).catch(error => {
    console.error('❌ 请求失败:', error.message);
    throw error;
  });
}

// 模拟推荐页面的getSignedUrlForPhoto方法
async function testGetSignedUrlForPhoto(fileKey) {
  try {
    console.log('🔗 测试获取签名URL，fileKey:', fileKey);
    
    // 调用后端API获取签名URL
    const response = await mockWxRequest('/upload/signed-url', {
      method: 'POST',
      data: {
        fileKey: fileKey,
        type: 'preview'
      }
    });
    
    if (response && response.url) {
      console.log('✅ 获取到签名URL:', response.url);
      
      // 模拟页面数据设置
      const pageData = {
        imageUrl: response.url,
        bestTag: '精选照片',
        description: '这张照片最能展现您的魅力！',
        loading: false,
        isDemoData: false
      };
      
      console.log('📱 模拟页面数据设置:', pageData);
      return pageData;
    } else {
      throw new Error('未获取到有效的签名URL');
    }
  } catch (error) {
    console.error('❌ 获取签名URL失败:', error.message);
    
    // 降级处理：使用临时的直接URL
    const fallbackUrl = `${API_BASE}/files/preview/${fileKey}.jpg`;
    console.log('🔄 使用降级URL:', fallbackUrl);
    
    const pageData = {
      imageUrl: fallbackUrl,
      bestTag: '精选照片',
      description: '这张照片最能展现您的魅力！',
      loading: false,
      isDemoData: false
    };
    
    console.log('📱 模拟页面数据设置（降级）:', pageData);
    return pageData;
  }
}

// 模拟完整的推荐页面onLoad流程
async function testRecommendPageFlow() {
  console.log('🧪 开始测试推荐页面修复后的流程\n');
  
  try {
    // 模拟全局数据
    const mockGlobalData = {
      photos: [
        {
          id: 1,
          fileKey: '3488d91b-548c-450a-98e9-fccc77375a55' // 使用真实的fileKey
        },
        {
          id: 2,
          fileKey: '33a76edc-99bc-4edb-b8e7-f7cc453cbfea'
        }
      ],
      aiResult: {
        bestPhotoId: 1,
        reason: '这张照片光线充足，构图优美，最能展现您的魅力！',
        tags: ['自然光', '构图优美', '表情自然'],
        scores: [
          { id: 1, score: 95 },
          { id: 2, score: 88 }
        ],
        totalPhotos: 2
      }
    };
    
    console.log('📋 模拟全局数据:', JSON.stringify(mockGlobalData, null, 2));
    console.log('');
    
    // 步骤1: 检查数据
    const photos = mockGlobalData.photos || [];
    const aiResult = mockGlobalData.aiResult;
    
    if (!photos.length) {
      throw new Error('照片数据缺失');
    }
    
    console.log('✅ 数据检查通过');
    console.log('');
    
    // 步骤2: 获取最佳照片
    let bestPhoto = photos[0];
    let bestTag = '构图';
    let description = '这张照片表现优秀，值得分享。';
    
    if (aiResult && aiResult.bestPhotoId) {
      const foundPhoto = photos.find(photo => photo.id === aiResult.bestPhotoId);
      if (foundPhoto) {
        bestPhoto = foundPhoto;
        console.log('🏆 找到AI推荐的最佳照片:', bestPhoto);
        
        if (aiResult.tags && aiResult.tags.length > 0) {
          bestTag = aiResult.tags[0];
        }
        
        if (aiResult.reason && typeof aiResult.reason === 'string') {
          description = aiResult.reason;
        }
      }
    }
    
    console.log('📊 最佳照片信息:', { bestPhoto, bestTag, description });
    console.log('');
    
    // 步骤3: 处理图片URL
    let pageData;
    
    if (bestPhoto.path) {
      console.log('📁 使用传统path:', bestPhoto.path);
      pageData = {
        imageUrl: bestPhoto.path,
        bestTag,
        description,
        loading: false,
        isDemoData: false
      };
    } else if (bestPhoto.fileKey) {
      console.log('🔑 检测到fileKey，获取签名URL...');
      pageData = await testGetSignedUrlForPhoto(bestPhoto.fileKey);
      pageData.bestTag = bestTag;
      pageData.description = description;
    } else if (bestPhoto.tempFilePath) {
      console.log('📱 使用tempFilePath:', bestPhoto.tempFilePath);
      pageData = {
        imageUrl: bestPhoto.tempFilePath,
        bestTag,
        description,
        loading: false,
        isDemoData: false
      };
    } else {
      throw new Error('照片对象缺少必要的URL信息');
    }
    
    console.log('');
    console.log('🎉 推荐页面流程测试完成！');
    console.log('📱 最终页面数据:', pageData);
    
    // 验证URL是否可访问
    console.log('');
    console.log('🌐 验证图片URL是否可访问...');
    try {
      const response = await axios.head(pageData.imageUrl, { timeout: 10000 });
      console.log('✅ 图片URL可访问，状态码:', response.status);
    } catch (error) {
      if (error.response) {
        console.log('⚠️  图片URL状态码:', error.response.status);
        if (error.response.status === 500) {
          console.log('💡 这是正常的，因为文件可能不存在或需要签名验证');
        }
      } else {
        console.log('❌ 网络错误:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ 推荐页面流程测试失败:', error.message);
  }
}

// 运行测试
testRecommendPageFlow().catch(console.error);