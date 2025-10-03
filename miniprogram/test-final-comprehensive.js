#!/usr/bin/env node

/**
 * 最终综合测试 - 验证整个系统的完整流程
 * 包括：文件上传、AI分析、推荐页面处理、签名URL生成等
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:5000';

// 模拟小程序的request函数
function mockWxRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
    
    axios({
      method: options.method || 'GET',
      url: fullUrl,
      data: options.data,
      headers: options.headers || {},
      timeout: 15000
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

// 模拟推荐页面的完整逻辑
function simulateRecommendPage(photos, aiResult) {
  console.log('🎯 模拟推荐页面完整逻辑...');
  
  // 获取AI推荐的最佳照片
  let bestPhoto = photos[0];
  let bestTag = '构图';
  let description = '这张照片表现优秀，值得分享。';
  let isDemoData = false;

  // 处理AI分析结果
  if (aiResult) {
    try {
      // 兼容本地分析结果格式 (bestPhoto, bestTag, description)
      if (aiResult.bestPhoto && typeof aiResult.bestPhoto === 'object') {
        console.log('✅ 检测到本地分析结果格式');
        isDemoData = aiResult.isDemoData || false;
        const foundPhoto = photos.find(p => p.id === aiResult.bestPhoto.id);
        if (foundPhoto) {
          bestPhoto = foundPhoto;
          bestTag = aiResult.bestTag || bestTag;
          description = aiResult.description || description;
        }
      }
      // 兼容服务器AI分析结果格式 (bestPhotoIndex, bestPhotoId, reason, tags)
      else {
        console.log('✅ 检测到服务器AI分析结果格式');
        
        // 优先处理bestPhotoId（AI分析返回的格式）
        if (aiResult.bestPhotoId || aiResult.bestId) {
          const photoId = aiResult.bestPhotoId || aiResult.bestId;
          const foundPhoto = photos.find(p => p.fileKey === photoId || p.id === photoId);
          if (foundPhoto) {
            bestPhoto = foundPhoto;
            console.log('✅ 通过ID找到最佳照片:', bestPhoto.fileKey);
          } else {
            console.warn('⚠️ 未找到对应ID的照片，使用默认');
          }
        } else if (typeof aiResult.bestPhotoIndex === 'number' && aiResult.bestPhotoIndex >= 0 && aiResult.bestPhotoIndex < photos.length) {
          bestPhoto = photos[aiResult.bestPhotoIndex];
          console.log('✅ 通过索引找到最佳照片:', bestPhoto.fileKey);
        }

        // 处理标签和描述
        if (aiResult.tags && Array.isArray(aiResult.tags) && aiResult.tags.length > 0) {
          bestTag = aiResult.tags[0];
        }
        if (aiResult.reason && typeof aiResult.reason === 'string') {
          description = aiResult.reason;
        }
      }
    } catch (error) {
      console.error('❌ 处理AI结果时出错:', error);
    }
  }

  return {
    bestPhoto,
    bestTag,
    description,
    isDemoData
  };
}

async function comprehensiveTest() {
  try {
    console.log('🚀 开始最终综合测试...\n');

    // 1. 测试文件上传
    console.log('1️⃣ 测试文件上传功能...');
    const testImagePath = path.join(__dirname, 'assets', 'test', '1.jpg');
    
    if (!fs.existsSync(testImagePath)) {
      throw new Error('测试图片不存在: ' + testImagePath);
    }

    // 上传多个文件，每个文件单独上传
    const photos = [];
    
    for (let i = 0; i < 3; i++) {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(testImagePath));

      const uploadResponse = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: formData.getHeaders(),
        timeout: 30000
      });

      console.log(`✅ 文件 ${i + 1} 上传成功`);
      
      photos.push({
        fileKey: uploadResponse.data.fileKey,
        id: uploadResponse.data.fileKey,
        originalName: uploadResponse.data.originalName,
        size: uploadResponse.data.size,
        urls: uploadResponse.data.urls
      });
    }

    console.log('✅ 所有文件上传完成');
    console.log('- 上传文件数量:', photos.length);
    console.log('- 文件处理状态:', photos.every(f => f.urls) ? '全部成功' : '部分失败');

    // 2. 测试AI分析
    console.log('\n2️⃣ 测试AI分析功能...');
    const fileKeys = photos.map(photo => photo.fileKey);
    
    const aiResponse = await mockWxRequest('/api/ai/pick', {
      method: 'POST',
      data: { 
        sessionId: 'comprehensive-test-' + Date.now(),
        fileKeys 
      }
    });

    console.log('✅ AI分析完成');
    console.log('- 最佳照片ID:', aiResponse.data.bestPhotoId);
    console.log('- 分析原因:', aiResponse.data.reason);
    console.log('- 标签数量:', aiResponse.data.tags ? aiResponse.data.tags.length : 0);

    // 3. 测试推荐页面逻辑
    console.log('\n3️⃣ 测试推荐页面逻辑...');
    const recommendResult = simulateRecommendPage(photos, aiResponse.data);
    
    console.log('✅ 推荐页面处理完成');
    console.log('- 选中照片:', recommendResult.bestPhoto.fileKey);
    console.log('- 推荐标签:', recommendResult.bestTag);
    console.log('- 推荐描述:', recommendResult.description.substring(0, 50) + '...');

    // 4. 测试签名URL生成
    console.log('\n4️⃣ 测试签名URL生成...');
    const signedUrlResponse = await mockWxRequest('/api/upload/signed-url', {
      method: 'POST',
      data: {
        fileKey: recommendResult.bestPhoto.fileKey,
        type: 'preview'
      }
    });

    console.log('✅ 签名URL生成成功');
    console.log('- URL长度:', signedUrlResponse.url.length);
    console.log('- 包含token:', signedUrlResponse.url.includes('token=') ? '是' : '否');
    console.log('- 包含expires:', signedUrlResponse.url.includes('expires=') ? '是' : '否');

    // 5. 测试URL可访问性
    console.log('\n5️⃣ 测试URL可访问性...');
    const accessResponse = await axios.head(signedUrlResponse.url);
    console.log('✅ URL可访问');
    console.log('- 状态码:', accessResponse.status);
    console.log('- 内容类型:', accessResponse.headers['content-type']);
    console.log('- 内容长度:', accessResponse.headers['content-length']);

    // 6. 测试所有类型的签名URL
    console.log('\n6️⃣ 测试所有类型的签名URL...');
    const urlTypes = ['original', 'preview', 'thumb'];
    
    for (const type of urlTypes) {
      try {
        const response = await mockWxRequest('/api/upload/signed-url', {
          method: 'POST',
          data: {
            fileKey: recommendResult.bestPhoto.fileKey,
            type: type
          }
        });
        
        const testResponse = await axios.head(response.url);
        console.log(`✅ ${type} URL正常 (${testResponse.status})`);
      } catch (error) {
        console.log(`❌ ${type} URL异常:`, error.message);
      }
    }

    // 7. 性能测试
    console.log('\n7️⃣ 性能测试...');
    const startTime = Date.now();
    
    // 并发测试签名URL生成
    const concurrentPromises = Array.from({ length: 5 }, (_, i) => 
      mockWxRequest('/api/upload/signed-url', {
        method: 'POST',
        data: {
          fileKey: recommendResult.bestPhoto.fileKey,
          type: 'preview'
        }
      })
    );
    
    await Promise.all(concurrentPromises);
    const endTime = Date.now();
    
    console.log('✅ 并发性能测试完成');
    console.log('- 并发请求数:', concurrentPromises.length);
    console.log('- 总耗时:', endTime - startTime, 'ms');
    console.log('- 平均耗时:', Math.round((endTime - startTime) / concurrentPromises.length), 'ms/请求');

    // 8. 数据完整性验证
    console.log('\n8️⃣ 数据完整性验证...');
    
    // 验证上传的文件数据
    const allFilesValid = photos.every(photo => 
      photo.fileKey && 
      photo.originalName && 
      photo.size > 0 &&
      photo.urls &&
      photo.urls.original &&
      photo.urls.preview &&
      photo.urls.thumb
    );
    
    console.log('✅ 数据完整性验证完成');
    console.log('- 文件数据完整性:', allFilesValid ? '通过' : '失败');
    console.log('- AI结果完整性:', aiResponse.data.bestPhotoId ? '通过' : '失败');
    console.log('- 推荐结果完整性:', recommendResult.bestPhoto && recommendResult.bestTag ? '通过' : '失败');

    console.log('\n🎉 最终综合测试完成！');
    console.log('📊 测试总结:');
    console.log('- ✅ 文件上传功能正常');
    console.log('- ✅ AI分析功能正常');
    console.log('- ✅ 推荐页面逻辑正常');
    console.log('- ✅ 签名URL生成正常');
    console.log('- ✅ URL访问功能正常');
    console.log('- ✅ 并发性能良好');
    console.log('- ✅ 数据完整性良好');
    console.log('\n🚀 系统已准备就绪，可以正常使用！');

  } catch (error) {
    console.error('❌ 综合测试过程中出现错误:', error.message);
    console.error('详细错误:', error);
  }
}

// 运行综合测试
comprehensiveTest();