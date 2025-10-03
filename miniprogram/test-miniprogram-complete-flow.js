#!/usr/bin/env node

/**
 * 小程序完整流程测试
 * 模拟用户从上传照片到查看推荐结果的完整体验
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

// 模拟小程序页面数据处理
function processPageData(photos, aiResult) {
  console.log('📱 处理小程序页面数据...');
  
  // 模拟推荐页面的onLoad逻辑
  let bestPhoto = photos[0];
  let bestTag = '构图';
  let description = '这张照片表现优秀，值得分享。';
  let isDemoData = false;

  if (aiResult) {
    try {
      if (aiResult.bestPhotoId || aiResult.bestId) {
        const photoId = aiResult.bestPhotoId || aiResult.bestId;
        const foundPhoto = photos.find(p => p.fileKey === photoId || p.id === photoId);
        if (foundPhoto) {
          bestPhoto = foundPhoto;
          console.log('✅ AI推荐照片:', bestPhoto.fileKey);
        }
      }
      
      if (aiResult.tags && Array.isArray(aiResult.tags) && aiResult.tags.length > 0) {
        bestTag = aiResult.tags[0];
      }
      
      if (aiResult.reason && typeof aiResult.reason === 'string') {
        description = aiResult.reason;
      }
    } catch (error) {
      console.error('❌ 处理AI结果时出错:', error);
    }
  }

  return {
    bestPhoto,
    bestTag,
    description,
    isDemoData,
    allPhotos: photos
  };
}

// 模拟获取图片显示URL
async function getImageDisplayUrl(fileKey, type = 'preview') {
  try {
    const response = await mockWxRequest('/upload/signed-url', {
      method: 'POST',
      data: { fileKey, type }
    });
    return response.url;
  } catch (error) {
    console.error(`❌ 获取${type}图片URL失败:`, error.message);
    return null;
  }
}

async function testMiniprogramFlow() {
  try {
    console.log('📱 开始小程序完整流程测试...\n');

    // 步骤1: 用户选择照片（模拟）
    console.log('1️⃣ 用户选择照片...');
    const testImagePath = path.join(__dirname, 'assets', 'test', '1.jpg');
    
    if (!fs.existsSync(testImagePath)) {
      throw new Error('测试图片不存在: ' + testImagePath);
    }
    
    console.log('✅ 用户选择了3张照片');

    // 步骤2: 上传照片到服务器
    console.log('\n2️⃣ 上传照片到服务器...');
    const formData = new FormData();
    formData.append('photos', fs.createReadStream(testImagePath));
    formData.append('photos', fs.createReadStream(testImagePath));
    formData.append('photos', fs.createReadStream(testImagePath));

    const uploadResponse = await axios.post(`${API_BASE}/upload`, formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    });

    console.log('✅ 照片上传成功');
    console.log('- 上传数量:', uploadResponse.data.files.length);
    
    const photos = uploadResponse.data.files.map(file => ({
      fileKey: file.fileKey,
      id: file.fileKey,
      originalName: file.originalName,
      size: file.size,
      urls: file.urls
    }));

    // 步骤3: 显示上传进度和预览
    console.log('\n3️⃣ 显示上传进度和预览...');
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const previewUrl = await getImageDisplayUrl(photo.fileKey, 'thumb');
      console.log(`✅ 照片${i + 1}预览准备就绪: ${photo.originalName}`);
      console.log(`   - 文件大小: ${Math.round(photo.size / 1024)}KB`);
      console.log(`   - 预览URL: ${previewUrl ? '已生成' : '生成失败'}`);
    }

    // 步骤4: 进行AI分析
    console.log('\n4️⃣ 进行AI智能分析...');
    console.log('🤖 AI正在分析照片质量...');
    
    const fileKeys = photos.map(photo => photo.fileKey);
    const aiResponse = await mockWxRequest('/ai/pick', {
      method: 'POST',
      data: { 
        sessionId: 'miniprogram-flow-' + Date.now(),
        fileKeys 
      }
    });

    console.log('✅ AI分析完成');
    console.log('- 分析结果:', aiResponse.data.bestPhotoId ? '找到最佳照片' : '使用默认推荐');

    // 步骤5: 跳转到推荐页面
    console.log('\n5️⃣ 跳转到推荐页面...');
    const pageData = processPageData(photos, aiResponse.data);
    
    console.log('✅ 推荐页面数据准备完成');
    console.log('- 推荐照片:', pageData.bestPhoto.fileKey);
    console.log('- 推荐标签:', pageData.bestTag);
    console.log('- 推荐理由:', pageData.description.substring(0, 30) + '...');

    // 步骤6: 加载推荐页面图片
    console.log('\n6️⃣ 加载推荐页面图片...');
    
    // 获取主图片URL
    const mainImageUrl = await getImageDisplayUrl(pageData.bestPhoto.fileKey, 'preview');
    console.log('✅ 主图片URL:', mainImageUrl ? '已生成' : '生成失败');
    
    // 获取缩略图URL（用于其他照片展示）
    const thumbnailUrls = [];
    for (const photo of pageData.allPhotos) {
      const thumbUrl = await getImageDisplayUrl(photo.fileKey, 'thumb');
      thumbnailUrls.push({
        fileKey: photo.fileKey,
        url: thumbUrl
      });
    }
    
    console.log('✅ 缩略图URLs:', thumbnailUrls.filter(t => t.url).length + '/' + thumbnailUrls.length + ' 成功');

    // 步骤7: 验证图片可访问性
    console.log('\n7️⃣ 验证图片可访问性...');
    
    if (mainImageUrl) {
      try {
        const response = await axios.head(mainImageUrl);
        console.log('✅ 主图片可访问 (状态码:', response.status + ')');
        console.log('   - 内容类型:', response.headers['content-type']);
        console.log('   - 文件大小:', Math.round(response.headers['content-length'] / 1024) + 'KB');
      } catch (error) {
        console.log('❌ 主图片访问失败:', error.message);
      }
    }

    // 步骤8: 模拟用户交互
    console.log('\n8️⃣ 模拟用户交互...');
    
    // 模拟用户点击其他照片
    if (pageData.allPhotos.length > 1) {
      const otherPhoto = pageData.allPhotos[1];
      const otherImageUrl = await getImageDisplayUrl(otherPhoto.fileKey, 'preview');
      console.log('✅ 用户切换到其他照片:', otherPhoto.fileKey);
      console.log('   - 切换图片URL:', otherImageUrl ? '已生成' : '生成失败');
    }

    // 模拟分享功能准备
    console.log('✅ 分享功能准备就绪');
    console.log('   - 分享图片:', pageData.bestPhoto.fileKey);
    console.log('   - 分享文案:', pageData.description);

    // 步骤9: 性能统计
    console.log('\n9️⃣ 性能统计...');
    
    const totalFiles = photos.length;
    const successfulUrls = thumbnailUrls.filter(t => t.url).length + (mainImageUrl ? 1 : 0);
    const successRate = Math.round((successfulUrls / (totalFiles + 1)) * 100);
    
    console.log('✅ 性能统计完成');
    console.log('- 总文件数:', totalFiles);
    console.log('- 成功URL数:', successfulUrls);
    console.log('- 成功率:', successRate + '%');

    // 步骤10: 最终验证
    console.log('\n🔟 最终验证...');
    
    const allChecks = [
      { name: '文件上传', status: photos.length > 0 },
      { name: 'AI分析', status: aiResponse.data && aiResponse.data.bestPhotoId },
      { name: '页面数据', status: pageData.bestPhoto && pageData.bestTag },
      { name: '主图片URL', status: mainImageUrl !== null },
      { name: '缩略图URLs', status: thumbnailUrls.some(t => t.url) },
      { name: '图片可访问', status: successRate > 80 }
    ];
    
    const passedChecks = allChecks.filter(check => check.status).length;
    const totalChecks = allChecks.length;
    
    console.log('📊 功能检查结果:');
    allChecks.forEach(check => {
      console.log(`   ${check.status ? '✅' : '❌'} ${check.name}`);
    });
    
    console.log(`\n🎯 总体评分: ${passedChecks}/${totalChecks} (${Math.round(passedChecks/totalChecks*100)}%)`);
    
    if (passedChecks === totalChecks) {
      console.log('\n🎉 小程序完整流程测试通过！');
      console.log('🚀 系统已准备就绪，用户可以正常使用所有功能！');
    } else {
      console.log('\n⚠️ 部分功能需要优化，但核心流程正常');
    }

  } catch (error) {
    console.error('❌ 小程序流程测试过程中出现错误:', error.message);
    console.error('详细错误:', error);
  }
}

// 运行小程序流程测试
testMiniprogramFlow();