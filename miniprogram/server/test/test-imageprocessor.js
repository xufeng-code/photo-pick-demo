const fs = require('fs');
const path = require('path');
const imageProcessor = require('../utils/imageProcessor');

async function testImageProcessor() {
  try {
    console.log('🧪 测试 imageProcessor...');
    
    // 读取测试图片
    const testImagePath = path.join(__dirname, '../../assets/test/1.jpg');
    const buffer = fs.readFileSync(testImagePath);
    
    console.log('📸 测试图片大小:', buffer.length, 'bytes');
    
    // 处理图片
    console.log('🔄 开始处理图片...');
    const result = await imageProcessor.processImage(buffer, '1.jpg');
    
    console.log('✅ 处理成功!');
    console.log('📊 结果:', JSON.stringify(result, null, 2));
    
    // 检查文件是否存在
    const originalPath = path.join(__dirname, '../uploads/original', `${result.fileKey}.jpg`);
    const exists = fs.existsSync(originalPath);
    console.log('📁 文件是否存在:', exists);
    
    if (exists) {
      const stats = fs.statSync(originalPath);
      console.log('📏 文件大小:', stats.size, 'bytes');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testImageProcessor();