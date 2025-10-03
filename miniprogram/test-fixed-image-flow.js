// 测试修复后的完整图片显示流程
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000';

// 模拟前端照片数据构建逻辑（修复后）
function buildPhotoData(uploadResult, tempFiles) {
  console.log('📸 构建照片数据（修复后的逻辑）...');
  
  const photos = uploadResult.success.map((uploadedFile, index) => {
    const tempFile = tempFiles[index];
    const fileInfo = uploadedFile.files ? uploadedFile.files[0] : uploadedFile;
    
    const photoData = {
      id: fileInfo.fileKey || `photo_${index}`,
      path: fileInfo.urls ? fileInfo.urls.preview : null, // 使用后端返回的preview URL
      tempFilePath: `temp_path_${index}`, // 模拟临时路径
      size: tempFile ? tempFile.size : 0,
      width: tempFile ? (tempFile.width || 0) : 0,
      height: tempFile ? (tempFile.height || 0) : 0,
      fileKey: fileInfo.fileKey,
      urls: fileInfo.urls // 保存完整的URLs对象
    };
    
    console.log(`   照片 ${index + 1}:`, {
      id: photoData.id,
      path: photoData.path,
      fileKey: photoData.fileKey,
      hasUrls: !!photoData.urls
    });
    
    return photoData;
  });
  
  return photos;
}

// 模拟推荐页面的图片URL处理逻辑（修复后）
function processImageUrl(bestPhoto) {
  console.log('🖼️  处理图片URL（修复后的逻辑）...');
  console.log('   bestPhoto:', {
    id: bestPhoto.id,
    path: bestPhoto.path,
    fileKey: bestPhoto.fileKey,
    hasUrls: !!bestPhoto.urls
  });
  
  let imageUrl = '';
  
  if (bestPhoto.path) {
    // 如果有path属性，直接使用（已包含签名URL）
    imageUrl = bestPhoto.path;
    console.log('   ✅ 使用已构建的path:', imageUrl);
  } else if (bestPhoto.urls && bestPhoto.urls.preview) {
    // 如果有urls对象，使用preview URL
    imageUrl = bestPhoto.urls.preview;
    console.log('   ✅ 使用urls.preview:', imageUrl);
  } else if (bestPhoto.fileKey) {
    // 如果有fileKey，需要获取签名URL（新的上传方式）
    console.log('   ⚠️ 需要异步获取签名URL，fileKey:', bestPhoto.fileKey);
    return null; // 需要异步处理
  } else if (bestPhoto.tempFilePath) {
    // 如果有tempFilePath，使用它（兼容性）
    imageUrl = bestPhoto.tempFilePath;
    console.log('   ✅ 使用tempFilePath:', imageUrl);
  } else {
    console.log('   ❌ 照片对象缺少必要的URL信息');
    return null;
  }
  
  return imageUrl;
}

// 验证图片URL是否可访问
async function verifyImageUrl(imageUrl) {
  try {
    // 确保使用完整的URL
    const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${API_BASE}${imageUrl}`;
    console.log('🌐 验证图片URL:', fullUrl);
    
    const response = await axios.get(fullUrl, {
      responseType: 'arraybuffer',
      timeout: 10000
    });
    
    if (response.status === 200) {
      console.log('   ✅ 图片URL可正常访问');
      console.log('   📊 图片大小:', response.data.length, 'bytes');
      console.log('   📋 Content-Type:', response.headers['content-type']);
      return true;
    } else {
      console.log('   ⚠️ 图片URL访问异常，状态码:', response.status);
      return false;
    }
  } catch (error) {
    if (error.response) {
      console.log('   ❌ 图片URL访问失败，状态码:', error.response.status);
      console.log('   📋 错误信息:', error.response.data);
    } else {
      console.log('   ❌ 网络错误:', error.message);
    }
    return false;
  }
}

async function testFixedImageFlow() {
  try {
    console.log('🧪 测试修复后的完整图片显示流程');
    console.log('='.repeat(50));
    console.log('');

    // 1. 模拟上传流程
    console.log('1️⃣ 模拟上传流程...');
    const testImagePath = path.join(__dirname, 'assets/test/1.jpg');
    
    if (!fs.existsSync(testImagePath)) {
      throw new Error(`测试图片不存在: ${testImagePath}`);
    }
    
    const formData = new FormData();
    formData.append('photos', fs.createReadStream(testImagePath));
    formData.append('photos', fs.createReadStream(testImagePath)); // 上传两张相同图片
    
    const uploadResponse = await axios.post(`${API_BASE}/upload`, formData, {
      headers: formData.getHeaders(),
      timeout: 30000
    });
    
    const filesArray = Object.values(uploadResponse.data.files);
    console.log('   ✅ 上传成功，文件数量:', filesArray.length);
    console.log('');

    // 2. 构建照片数据（使用修复后的逻辑）
    console.log('2️⃣ 构建照片数据...');
    const mockTempFiles = [
      { size: 123456, width: 800, height: 600 },
      { size: 234567, width: 1024, height: 768 }
    ];
    
    // 处理实际的上传响应结构
    const photos = [];
    if (uploadResponse.data.files) {
      const filesArray = Object.values(uploadResponse.data.files);
      filesArray.forEach((fileInfo, index) => {
        const tempFile = mockTempFiles[index] || {};
        photos.push({
          id: fileInfo.fileKey || `photo_${index}`,
          path: fileInfo.urls ? fileInfo.urls.preview : null, // 直接使用URL字符串
          tempFilePath: `temp_path_${index}`,
          size: tempFile.size || 0,
          width: tempFile.width || 0,
          height: tempFile.height || 0,
          fileKey: fileInfo.fileKey,
          urls: fileInfo.urls
        });
      });
    }
    console.log('   ✅ 照片数据构建完成，数量:', photos.length);
    console.log('');

    // 3. 模拟AI分析结果
    console.log('3️⃣ 模拟AI分析结果...');
    const mockAiResult = {
      bestPhotoId: photos[0].id,
      tags: ['最佳照片', '构图优美'],
      reason: '这张照片光线充足，构图优美，最能展现您的魅力！',
      isDemoData: false
    };
    
    console.log('   ✅ AI分析结果:', {
      bestPhotoId: mockAiResult.bestPhotoId,
      tags: mockAiResult.tags,
      reason: mockAiResult.reason.substring(0, 20) + '...'
    });
    console.log('');

    // 4. 获取最佳照片
    console.log('4️⃣ 获取最佳照片...');
    const bestPhoto = photos.find(photo => photo.id === mockAiResult.bestPhotoId) || photos[0];
    console.log('   ✅ 最佳照片:', {
      id: bestPhoto.id,
      fileKey: bestPhoto.fileKey,
      hasPath: !!bestPhoto.path,
      hasUrls: !!bestPhoto.urls
    });
    console.log('');

    // 5. 处理图片URL（使用修复后的逻辑）
    console.log('5️⃣ 处理图片URL...');
    const imageUrl = processImageUrl(bestPhoto);
    
    if (!imageUrl) {
      throw new Error('无法获取有效的图片URL');
    }
    
    console.log('   ✅ 最终图片URL:', imageUrl);
    console.log('');

    // 6. 验证图片URL可访问性
    console.log('6️⃣ 验证图片URL可访问性...');
    const isAccessible = await verifyImageUrl(imageUrl);
    console.log('');

    // 7. 模拟页面数据设置
    console.log('7️⃣ 模拟页面数据设置...');
    const pageData = {
      imageUrl: imageUrl,
      bestTag: mockAiResult.tags[0],
      description: mockAiResult.reason,
      loading: false,
      isDemoData: mockAiResult.isDemoData
    };
    
    console.log('   ✅ 页面数据设置完成:', {
      imageUrl: pageData.imageUrl.substring(0, 50) + '...',
      bestTag: pageData.bestTag,
      description: pageData.description.substring(0, 30) + '...',
      loading: pageData.loading
    });
    console.log('');

    // 测试结果总结
    console.log('📊 测试结果总结:');
    console.log('='.repeat(50));
    console.log('✅ 上传流程: 成功');
    console.log('✅ 照片数据构建: 成功');
    console.log('✅ AI分析模拟: 成功');
    console.log('✅ 最佳照片选择: 成功');
    console.log('✅ 图片URL处理: 成功');
    console.log(`${isAccessible ? '✅' : '❌'} 图片URL可访问性: ${isAccessible ? '成功' : '失败'}`);
    console.log('✅ 页面数据设置: 成功');
    console.log('');
    
    if (isAccessible) {
      console.log('🎉 修复后的图片显示流程测试完全成功！');
      console.log('💡 现在前端应该能够正确显示图片了。');
    } else {
      console.log('⚠️ 图片URL无法访问，可能需要进一步检查签名验证逻辑。');
    }

  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
    if (error.response) {
      console.error('📊 错误响应:', error.response.status, error.response.data);
    }
  }
}

// 运行测试
testFixedImageFlow();