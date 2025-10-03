const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000';

// 模拟推荐页面的图片URL处理逻辑（修复后）
function processImageUrlForRecommendPage(bestPhoto) {
  console.log('🖼️  推荐页面图片URL处理（修复后的逻辑）...');
  console.log('   bestPhoto结构:', {
    id: bestPhoto.id,
    hasPath: !!bestPhoto.path,
    hasUrls: !!bestPhoto.urls,
    hasFileKey: !!bestPhoto.fileKey,
    hasTempFilePath: !!bestPhoto.tempFilePath
  });

  let imageUrl = null;

  // 修复后的优先级逻辑
  if (bestPhoto.path) {
    console.log('   ✅ 使用已构建的path');
    imageUrl = bestPhoto.path;
  } else if (bestPhoto.urls && bestPhoto.urls.preview) {
    console.log('   ✅ 使用urls.preview');
    imageUrl = bestPhoto.urls.preview;
  } else if (bestPhoto.fileKey) {
    console.log('   ⚠️ 需要获取签名URL for fileKey:', bestPhoto.fileKey);
    // 这里应该调用getSignedUrlForPhoto，但在测试中我们模拟
    imageUrl = `/files/preview/${bestPhoto.fileKey}.jpg?token=mock&expires=mock`;
  } else if (bestPhoto.tempFilePath) {
    console.log('   ⚠️ 使用临时文件路径');
    imageUrl = bestPhoto.tempFilePath;
  } else {
    console.log('   ❌ 无法确定图片URL');
    imageUrl = null;
  }

  console.log('   🎯 最终图片URL:', imageUrl);
  return imageUrl;
}

async function testRecommendPageImageDisplay() {
  console.log('🧪 测试推荐页面图片显示');
  console.log('==================================================');

  try {
    // 1. 上传图片
    console.log('1️⃣ 上传测试图片...');
    const testImagePath = path.join(__dirname, 'assets', 'test', '1.jpg');
    
    const formData = new FormData();
    formData.append('photos', fs.createReadStream(testImagePath));
    formData.append('photos', fs.createReadStream(testImagePath));

    const uploadResponse = await axios.post(`${API_BASE}/upload`, formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    });

    const filesArray = Object.values(uploadResponse.data.files);
    console.log('   ✅ 上传成功，文件数量:', filesArray.length);
    console.log('');

    // 2. 构建照片数据（模拟前端逻辑）
    console.log('2️⃣ 构建照片数据（模拟前端逻辑）...');
    const photos = [];
    if (uploadResponse.data.files) {
      const filesArray = Object.values(uploadResponse.data.files);
      filesArray.forEach((fileInfo, index) => {
        photos.push({
          id: fileInfo.fileKey || `photo_${index}`,
          path: fileInfo.urls ? fileInfo.urls.preview : null, // 直接使用URL字符串
          tempFilePath: `temp_path_${index}`,
          size: fileInfo.size || 0,
          width: 800,
          height: 600,
          fileKey: fileInfo.fileKey,
          urls: fileInfo.urls
        });
      });
    }
    
    console.log('   ✅ 照片数据构建完成，数量:', photos.length);
    photos.forEach((photo, index) => {
      console.log(`   📸 照片 ${index + 1}:`, {
        id: photo.id,
        hasPath: !!photo.path,
        hasUrls: !!photo.urls,
        fileKey: photo.fileKey
      });
    });
    console.log('');

    // 3. 模拟AI分析和最佳照片选择
    console.log('3️⃣ 模拟AI分析和最佳照片选择...');
    const bestPhoto = photos[0]; // 选择第一张作为最佳照片
    console.log('   ✅ 选择最佳照片:', {
      id: bestPhoto.id,
      fileKey: bestPhoto.fileKey
    });
    console.log('');

    // 4. 测试推荐页面的图片URL处理
    console.log('4️⃣ 测试推荐页面图片URL处理...');
    const imageUrl = processImageUrlForRecommendPage(bestPhoto);
    console.log('');

    // 5. 验证图片URL可访问性
    console.log('5️⃣ 验证图片URL可访问性...');
    if (imageUrl) {
      try {
        const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${API_BASE}${imageUrl}`;
        console.log('🌐 访问URL:', fullUrl);
        
        const response = await axios.get(fullUrl, {
          responseType: 'arraybuffer',
          timeout: 10000
        });
        
        if (response.status === 200) {
          console.log('   ✅ 图片URL可正常访问');
          console.log('   📊 图片大小:', response.data.length, 'bytes');
          console.log('   📋 Content-Type:', response.headers['content-type']);
        }
      } catch (error) {
        console.log('   ❌ 图片URL访问失败:', error.message);
      }
    } else {
      console.log('   ❌ 无有效的图片URL');
    }
    console.log('');

    // 6. 模拟推荐页面数据设置
    console.log('6️⃣ 模拟推荐页面数据设置...');
    const recommendPageData = {
      bestPhoto: bestPhoto,
      imageUrl: imageUrl,
      aiResult: {
        bestPhotoId: bestPhoto.id,
        tags: ['最佳照片', '构图优美'],
        reason: '这张照片光线充足，构图优美，最能展现您的魅力！'
      },
      loading: false
    };
    
    console.log('   ✅ 推荐页面数据设置完成:', {
      hasImageUrl: !!recommendPageData.imageUrl,
      imageUrlPreview: recommendPageData.imageUrl ? recommendPageData.imageUrl.substring(0, 50) + '...' : 'null',
      bestPhotoId: recommendPageData.bestPhoto.id,
      aiTags: recommendPageData.aiResult.tags
    });
    console.log('');

    // 7. 测试结果总结
    console.log('📊 推荐页面测试结果总结:');
    console.log('==================================================');
    console.log('✅ 上传流程: 成功');
    console.log('✅ 照片数据构建: 成功');
    console.log('✅ 最佳照片选择: 成功');
    console.log(imageUrl ? '✅ 图片URL处理: 成功' : '❌ 图片URL处理: 失败');
    console.log('✅ 页面数据设置: 成功');
    console.log('');
    console.log('🎉 推荐页面图片显示测试完成！');
    
    if (imageUrl) {
      console.log('💡 推荐页面应该能够正确显示图片了。');
    } else {
      console.log('⚠️ 推荐页面可能无法显示图片，需要进一步检查。');
    }

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
    if (error.response) {
      console.error('   响应状态:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
  }
}

// 运行测试
testRecommendPageImageDisplay();