// 测试小程序完整数据流程
const fs = require('fs');
const path = require('path');

// 模拟小程序环境
const mockApp = {
  globalData: {}
};

// 模拟wx API
const wx = {
  showToast: (options) => console.log('Toast:', options.title),
  hideLoading: () => console.log('隐藏加载中...'),
  showLoading: (options) => console.log('显示加载中:', options.title),
  navigateTo: (options) => {
    console.log('导航到:', options.url);
    if (options.success) options.success();
  },
  navigateBack: () => console.log('返回上一页')
};

// 模拟getApp
global.getApp = () => mockApp;
global.wx = wx;

// 模拟上传和分析结果
const mockUploadAndAnalyzeResult = {
  uploadResult: {
    success: [
      {
        files: [
          {
            fileKey: 'd71e5d3b-04a5-45ca-988f-65a6a4e02059',
            urls: {
              original: 'http://localhost:5000/files/original/d71e5d3b-04a5-45ca-988f-65a6a4e02059.jpg',
              preview: 'http://localhost:5000/files/preview/d71e5d3b-04a5-45ca-988f-65a6a4e02059.jpg',
              thumb: 'http://localhost:5000/files/thumb/d71e5d3b-04a5-45ca-988f-65a6a4e02059.jpg'
            },
            size: 4314
          }
        ]
      },
      {
        files: [
          {
            fileKey: 'e716fefa-a50c-4376-8263-1a2446765887',
            urls: {
              original: 'http://localhost:5000/files/original/e716fefa-a50c-4376-8263-1a2446765887.jpg',
              preview: 'http://localhost:5000/files/preview/e716fefa-a50c-4376-8263-1a2446765887.jpg',
              thumb: 'http://localhost:5000/files/thumb/e716fefa-a50c-4376-8263-1a2446765887.jpg'
            },
            size: 3973
          }
        ]
      }
    ]
  },
  fileKeys: ['d71e5d3b-04a5-45ca-988f-65a6a4e02059', 'e716fefa-a50c-4376-8263-1a2446765887'],
  analysisResult: {
    success: true,
    data: {
      bestPhotoId: 'd71e5d3b-04a5-45ca-988f-65a6a4e02059',
      reason: '照片 #0 在多个维度上表现出色...'
    }
  }
};

// 模拟tempFiles数据
const mockTempFiles = [
  { size: 4314, width: 200, height: 200 },
  { size: 3973, width: 200, height: 200 }
];

const mockRes = {
  tempFiles: mockTempFiles,
  tempFilePaths: ['temp/path1.jpg', 'temp/path2.jpg']
};

console.log('🚀 开始测试小程序数据流程...\n');

// 模拟home页面的数据处理逻辑
console.log('📊 模拟上传分析完成，结果:', mockUploadAndAnalyzeResult);

// 构建照片数据（复制home页面的逻辑）
const photos = [];
mockUploadAndAnalyzeResult.uploadResult.success.forEach((uploadResponse, index) => {
  console.log(`📸 处理第${index}个上传响应:`, uploadResponse);
  const tempFile = mockRes.tempFiles[index];
  
  if (uploadResponse.files && uploadResponse.files.length > 0) {
    uploadResponse.files.forEach((fileInfo, fileIndex) => {
      console.log(`📁 处理文件信息 ${index}-${fileIndex}:`, fileInfo);
      const photoIndex = index * uploadResponse.files.length + fileIndex;
      const photoData = {
        id: fileInfo.fileKey || `photo_${photoIndex}`,
        path: fileInfo.urls && fileInfo.urls.preview ? fileInfo.urls.preview : null,
        tempFilePath: mockRes.tempFilePaths[index],
        size: tempFile ? tempFile.size : fileInfo.size,
        width: tempFile ? (tempFile.width || 0) : 0,
        height: tempFile ? (tempFile.height || 0) : 0,
        fileKey: fileInfo.fileKey,
        urls: fileInfo.urls
      };
      console.log(`✅ 构建照片数据 ${photoIndex}:`, photoData);
      photos.push(photoData);
    });
  } else {
    console.error(`❌ 第${index}个上传响应缺少files数组:`, uploadResponse);
  }
});

console.log('\n📸 最终构建照片数据:', photos);
console.log('📸 照片数据数量:', photos.length);

// 保存到全局数据
console.log('\n💾 开始保存数据到globalData...');
mockApp.globalData.photos = photos;
mockApp.globalData.analysisResult = mockUploadAndAnalyzeResult;
mockApp.globalData.fileKeys = mockUploadAndAnalyzeResult.fileKeys;

console.log('💾 数据保存完成，验证保存结果:');
console.log('- app.globalData.photos:', mockApp.globalData.photos);
console.log('- app.globalData.photos.length:', mockApp.globalData.photos ? mockApp.globalData.photos.length : 'undefined');
console.log('- app.globalData.fileKeys:', mockApp.globalData.fileKeys);
console.log('- app.globalData.fileKeys.length:', mockApp.globalData.fileKeys ? mockApp.globalData.fileKeys.length : 'undefined');

// 模拟analyze页面的数据检查逻辑
console.log('\n🔍 模拟分析页面加载，开始检查数据...');

const app = mockApp;
console.log('📊 全局数据检查:');
console.log('- app.globalData:', app.globalData);
console.log('- app.globalData.photos:', app.globalData.photos);
console.log('- app.globalData.fileKeys:', app.globalData.fileKeys);
console.log('- app.globalData.analysisResult:', app.globalData.analysisResult);

const photosCheck = app.globalData.photos || [];
const fileKeysCheck = app.globalData.fileKeys || [];

console.log(`📸 照片数据检查: 数量=${photosCheck.length}`);
console.log(`🔑 文件键检查: 数量=${fileKeysCheck.length}`);

if (photosCheck.length === 0 && fileKeysCheck.length === 0) {
  console.error('❌ 没有照片数据和文件键，显示错误并返回');
} else if (photosCheck.length === 0 && fileKeysCheck.length > 0) {
  console.log('⚠️ 有文件键但没有照片数据，尝试重建照片数据');
} else {
  console.log('✅ 数据传递成功！照片数据和文件键都存在');
  console.log('✅ 可以正常进行分析页面的后续处理');
}

console.log('\n🎉 测试完成！');