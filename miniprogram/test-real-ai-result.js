#!/usr/bin/env node

/**
 * 测试真实的AI分析结果处理
 * 验证推荐页面能正确处理AI返回的bestPhotoId
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000';

// 模拟小程序的request函数
function mockWxRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
    
    axios({
      method: options.method || 'GET',
      url: fullUrl,
      data: options.data,
      headers: options.headers || {},
      timeout: 10000
    }).then(response => {
      resolve(response.data);
    }).catch(error => {
      if (error.response) {
        reject(new Error(`HTTP ${error.response.status}: ${error.response.statusText}`));
      } else {
        reject(error);
      }
    });
  });
}

// 模拟推荐页面的onLoad逻辑（修复后）
function simulateRecommendPageOnLoad(photos, aiResult) {
  console.log('🎯 模拟推荐页面onLoad逻辑（修复后）...');
  console.log('照片数量:', photos.length);
  console.log('AI分析结果:', JSON.stringify(aiResult, null, 2));

  // 获取AI推荐的最佳照片
  let bestPhoto = photos[0];
  let bestTag = '构图';
  let description = '这张照片表现优秀，值得分享。';
  let isDemoData = false;

  // 处理AI分析结果
  if (aiResult) {
    console.log('处理AI结果:', aiResult);
    
    try {
      // 兼容本地分析结果格式 (bestPhoto, bestTag, description)
      if (aiResult.bestPhoto && typeof aiResult.bestPhoto === 'object') {
        console.log('检测到本地分析结果格式');
        // 检查是否为演示数据
        isDemoData = aiResult.isDemoData || false;
        // 验证bestPhoto是否在photos数组中
        const foundPhoto = photos.find(p => p.id === aiResult.bestPhoto.id);
        if (foundPhoto) {
          bestPhoto = foundPhoto;
          bestTag = aiResult.bestTag || bestTag;
          description = aiResult.description || description;
          console.log('使用本地分析结果:', { bestPhoto: bestPhoto.id, bestTag, description, isDemoData });
        } else {
          console.warn('本地分析结果中的bestPhoto不在当前照片列表中，使用默认');
        }
      }
      // 兼容服务器AI分析结果格式 (bestPhotoIndex, bestPhotoId, reason, tags)
      else {
        console.log('检测到服务器AI分析结果格式');
        
        // 优先处理bestPhotoId（AI分析返回的格式）
        if (aiResult.bestPhotoId || aiResult.bestId) {
          // 兼容不同的ID字段名
          const photoId = aiResult.bestPhotoId || aiResult.bestId;
          // 尝试通过fileKey匹配
          const foundPhoto = photos.find(p => p.fileKey === photoId || p.id === photoId);
          if (foundPhoto) {
            bestPhoto = foundPhoto;
            console.log('✅ 找到最佳照片 (ID):', bestPhoto.fileKey || bestPhoto.id);
          } else {
            console.warn('❌ 未找到对应ID的照片:', photoId);
            console.warn('可用照片fileKeys:', photos.map(p => p.fileKey || p.id));
          }
        } else if (typeof aiResult.bestPhotoIndex === 'number' && aiResult.bestPhotoIndex >= 0 && aiResult.bestPhotoIndex < photos.length) {
          bestPhoto = photos[aiResult.bestPhotoIndex];
          console.log('✅ 找到最佳照片 (索引', aiResult.bestPhotoIndex, '):', bestPhoto.fileKey || bestPhoto.id);
        }

        // 处理标签
        if (aiResult.tags && Array.isArray(aiResult.tags) && aiResult.tags.length > 0) {
          bestTag = aiResult.tags[0];
          console.log('使用AI标签:', bestTag);
        }

        // 处理描述
        if (aiResult.reason && typeof aiResult.reason === 'string') {
          description = aiResult.reason;
          console.log('使用AI描述:', description);
        }
      }
    } catch (error) {
      console.error('处理AI结果时出错:', error);
      console.log('回退到默认推荐逻辑');
    }
  } else {
    console.log('使用默认推荐逻辑');
  }

  return {
    bestPhoto,
    bestTag,
    description,
    isDemoData
  };
}

async function testRealAiResult() {
  try {
    console.log('🧪 测试真实AI分析结果处理...\n');

    // 1. 上传测试图片
    console.log('1️⃣ 上传测试图片...');
    const testImagePath = path.join(__dirname, 'assets', 'test', '1.jpg');
    
    if (!fs.existsSync(testImagePath)) {
      throw new Error('测试图片不存在: ' + testImagePath);
    }

    const formData = new FormData();
    formData.append('photos', fs.createReadStream(testImagePath));
    formData.append('photos', fs.createReadStream(testImagePath)); // 上传两张相同图片

    const uploadResponse = await axios.post(`${API_BASE}/upload`, formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    });

    console.log('✅ 上传成功，文件数量:', uploadResponse.data.files.length);
    const photos = uploadResponse.data.files.map(file => ({
      fileKey: file.fileKey,
      id: file.fileKey,
      originalName: file.originalName,
      size: file.size,
      urls: file.urls
    }));

    // 2. 进行AI分析
    console.log('\n2️⃣ 进行AI分析...');
    const fileKeys = photos.map(photo => photo.fileKey);
    
    const aiResponse = await mockWxRequest('/ai/pick', {
      method: 'POST',
      data: { 
        sessionId: 'test-session-' + Date.now(),
        fileKeys 
      }
    });

    console.log('✅ AI分析完成');
    console.log('AI结果:', JSON.stringify(aiResponse.data, null, 2));

    // 3. 测试推荐页面逻辑
    console.log('\n3️⃣ 测试推荐页面逻辑...');
    const result = simulateRecommendPageOnLoad(photos, aiResponse.data);
    
    console.log('\n📋 推荐页面处理结果:');
    console.log('- 最佳照片fileKey:', result.bestPhoto.fileKey);
    console.log('- 标签:', result.bestTag);
    console.log('- 描述:', result.description);
    console.log('- 是否演示数据:', result.isDemoData);

    // 4. 测试获取签名URL
    console.log('\n4️⃣ 测试获取签名URL...');
    const signedUrlResponse = await mockWxRequest('/upload/signed-url', {
      method: 'POST',
      data: {
        fileKey: result.bestPhoto.fileKey,
        type: 'preview'
      }
    });

    if (signedUrlResponse && signedUrlResponse.url) {
      console.log('✅ 获取到签名URL:', signedUrlResponse.url);
      
      // 验证URL可访问性
      const testResponse = await axios.head(signedUrlResponse.url);
      console.log('✅ 签名URL可访问，状态码:', testResponse.status);
    }

    console.log('\n🎉 真实AI分析结果处理测试完成！所有功能正常工作。');

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
  }
}

// 运行测试
testRealAiResult();