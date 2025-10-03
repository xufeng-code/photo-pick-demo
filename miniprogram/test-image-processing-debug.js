const fs = require('fs');
const path = require('path');
const imageProcessor = require('./server/utils/imageProcessor');

async function testImageProcessing() {
  console.log('🔍 开始诊断图片处理问题...\n');
  
  // 1. 检查目录结构
  console.log('📁 检查uploads目录结构:');
  const uploadsDir = path.join(__dirname, 'server/uploads');
  const originalDir = path.join(uploadsDir, 'original');
  const previewDir = path.join(uploadsDir, 'preview');
  const thumbDir = path.join(uploadsDir, 'thumb');
  
  console.log('- uploads目录:', fs.existsSync(uploadsDir) ? '✅ 存在' : '❌ 不存在');
  console.log('- original目录:', fs.existsSync(originalDir) ? '✅ 存在' : '❌ 不存在');
  console.log('- preview目录:', fs.existsSync(previewDir) ? '✅ 存在' : '❌ 不存在');
  console.log('- thumb目录:', fs.existsSync(thumbDir) ? '✅ 存在' : '❌ 不存在');
  
  // 2. 检查特定文件
  const testFileKey = '8a5784e1-0300-41cc-8ab0-a0b6c76e0ba6';
  console.log(`\n🔍 检查文件 ${testFileKey}:`);
  
  const originalFile = path.join(originalDir, `${testFileKey}.jpg`);
  const previewFile = path.join(previewDir, `${testFileKey}.jpg`);
  const thumbFile = path.join(thumbDir, `${testFileKey}.jpg`);
  
  console.log('- original文件:', fs.existsSync(originalFile) ? '✅ 存在' : '❌ 不存在');
  console.log('- preview文件:', fs.existsSync(previewFile) ? '✅ 存在' : '❌ 不存在');
  console.log('- thumb文件:', fs.existsSync(thumbFile) ? '✅ 存在' : '❌ 不存在');
  
  // 3. 如果original存在但preview不存在，尝试重新生成
  if (fs.existsSync(originalFile) && !fs.existsSync(previewFile)) {
    console.log('\n🔄 尝试重新生成preview和thumb文件...');
    
    try {
      const originalBuffer = fs.readFileSync(originalFile);
      console.log('✅ 读取original文件成功，大小:', originalBuffer.length, 'bytes');
      
      // 使用imageProcessor重新处理
      const processor = new imageProcessor();
      const result = await processor.processImage(originalBuffer, `${testFileKey}.jpg`);
      
      console.log('✅ 图片处理成功:', result);
      
      // 再次检查文件是否生成
      console.log('\n📋 重新检查文件:');
      console.log('- preview文件:', fs.existsSync(previewFile) ? '✅ 已生成' : '❌ 仍然不存在');
      console.log('- thumb文件:', fs.existsSync(thumbFile) ? '✅ 已生成' : '❌ 仍然不存在');
      
    } catch (error) {
      console.error('❌ 图片处理失败:', error);
    }
  }
  
  // 4. 列出preview目录内容
  console.log('\n📂 preview目录内容:');
  try {
    const previewFiles = fs.readdirSync(previewDir);
    console.log(`共 ${previewFiles.length} 个文件:`);
    previewFiles.slice(0, 10).forEach(file => {
      console.log(`  - ${file}`);
    });
    if (previewFiles.length > 10) {
      console.log(`  ... 还有 ${previewFiles.length - 10} 个文件`);
    }
  } catch (error) {
    console.error('❌ 无法读取preview目录:', error.message);
  }
  
  // 5. 测试Express静态文件路径
  console.log('\n🌐 Express静态文件路径测试:');
  console.log('配置: app.use(\'/files\', express.static(path.join(__dirname, \'uploads\')));');
  console.log('请求路径: /files/preview/8a5784e1-0300-41cc-8ab0-a0b6c76e0ba6.jpg');
  console.log('实际文件路径:', previewFile);
  console.log('映射是否正确:', fs.existsSync(previewFile) ? '✅ 正确' : '❌ 文件不存在');
}

testImageProcessing().catch(console.error);