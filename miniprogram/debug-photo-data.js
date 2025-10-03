const fs = require('fs');

async function debugPhotoData() {
    try {
        console.log("🔍 检查上传的照片数据...");
        
        // 模拟上传一张图片
        const FormData = require('form-data');
        const fetch = require('node-fetch');
        
        const form = new FormData();
        form.append('file', fs.createReadStream('./assets/test/1.jpg'));
        
        const response = await fetch('http://localhost:3000/upload', {
            method: 'POST',
            body: form
        });
        
        const result = await response.json();
        console.log('📸 上传结果:', JSON.stringify(result, null, 2));
        console.log('📸 URLs结构:', result.urls);
        console.log('📸 preview URL:', result.urls.preview);
        console.log('📸 thumb URL:', result.urls.thumb);
        console.log('📸 preview URL类型:', typeof result.urls.preview);
        console.log('📸 thumb URL类型:', typeof result.urls.thumb);
        
        // 测试直接访问
        console.log('\n🌐 测试直接访问preview URL...');
        const previewResponse = await fetch(result.urls.preview.replace('https://smart-cloths-attack.loca.lt', 'http://localhost:3000'));
        console.log('📊 Preview访问状态:', previewResponse.status);
        
        console.log('\n🌐 测试直接访问thumb URL...');
        const thumbResponse = await fetch(result.urls.thumb.replace('https://smart-cloths-attack.loca.lt', 'http://localhost:3000'));
        console.log('📊 Thumb访问状态:', thumbResponse.status);
        
    } catch (error) {
        console.error('❌ 调试失败:', error);
    }
}

debugPhotoData();
