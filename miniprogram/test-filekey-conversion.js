// test-filekey-conversion.js
// 测试fileKey到图片URL转换功能

const axios = require('axios');

// 模拟推荐页面的fileKey转换逻辑
function convertFileKeyToUrl(bestPhoto) {
  let imageUrl = '';
  
  if (bestPhoto.path) {
    // 如果有path属性，直接使用（传统方式）
    imageUrl = bestPhoto.path;
    console.log('使用传统path:', imageUrl);
  } else if (bestPhoto.fileKey) {
    // 如果有fileKey，生成图片URL（新的上传方式）
    const API_BASE = 'http://localhost:3000';
    imageUrl = `${API_BASE}/files/preview/${bestPhoto.fileKey}.jpg`;
    console.log('使用fileKey生成URL:', imageUrl);
  } else if (bestPhoto.tempFilePath) {
    // 如果有tempFilePath，使用它（兼容性）
    imageUrl = bestPhoto.tempFilePath;
    console.log('使用tempFilePath:', imageUrl);
  } else {
    console.error('照片对象缺少必要的URL信息:', bestPhoto);
    return null;
  }
  
  return imageUrl;
}

// 测试不同类型的照片对象
async function testFileKeyConversion() {
  console.log('🧪 开始测试fileKey转换功能...\n');
  
  // 测试1: 有fileKey的照片对象
  console.log('📸 测试1: 有fileKey的照片对象');
  const photoWithFileKey = {
    fileKey: 'test-file-key-123',
    id: 1
  };
  const url1 = convertFileKeyToUrl(photoWithFileKey);
  console.log('生成的URL:', url1);
  console.log('');
  
  // 测试2: 有path的照片对象（传统方式）
  console.log('📸 测试2: 有path的照片对象（传统方式）');
  const photoWithPath = {
    path: '/temp/photo123.jpg',
    id: 2
  };
  const url2 = convertFileKeyToUrl(photoWithPath);
  console.log('生成的URL:', url2);
  console.log('');
  
  // 测试3: 有tempFilePath的照片对象
  console.log('📸 测试3: 有tempFilePath的照片对象');
  const photoWithTempPath = {
    tempFilePath: 'wxfile://temp_photo.jpg',
    id: 3
  };
  const url3 = convertFileKeyToUrl(photoWithTempPath);
  console.log('生成的URL:', url3);
  console.log('');
  
  // 测试4: 缺少URL信息的照片对象
  console.log('📸 测试4: 缺少URL信息的照片对象');
  const photoWithoutUrl = {
    id: 4
  };
  const url4 = convertFileKeyToUrl(photoWithoutUrl);
  console.log('生成的URL:', url4);
  console.log('');
  
  // 测试5: 验证生成的URL是否可访问（如果后端有文件服务）
  if (url1) {
    console.log('🌐 测试5: 验证fileKey生成的URL是否可访问');
    try {
      const response = await axios.head(url1, { timeout: 5000 });
      console.log('✅ URL可访问，状态码:', response.status);
    } catch (error) {
      if (error.response) {
        console.log('❌ URL不可访问，状态码:', error.response.status);
        console.log('这是正常的，因为测试用的fileKey不存在');
      } else {
        console.log('❌ 网络错误:', error.message);
      }
    }
  }
  
  console.log('\n✅ fileKey转换功能测试完成！');
}

// 运行测试
testFileKeyConversion().catch(console.error);