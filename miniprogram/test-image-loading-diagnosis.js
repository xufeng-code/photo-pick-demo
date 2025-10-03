const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 测试图片加载诊断
async function diagnoseImageLoading() {
    console.log('🔍 开始图片加载诊断...\n');
    
    const baseUrl = 'http://localhost:3000';
    
    // 1. 测试一个已知存在的图片文件
    const testFileKey = '2cec8223-09f6-4d10-9db6-fe804fabd5bd';
    console.log(`📋 测试文件: ${testFileKey}`);
    
    // 检查文件是否存在
    const originalPath = path.join(__dirname, 'server', 'uploads', 'original', `${testFileKey}.jpg`);
    const previewPath = path.join(__dirname, 'server', 'uploads', 'preview', `${testFileKey}.jpg`);
    
    console.log(`📁 原图文件存在: ${fs.existsSync(originalPath)}`);
    console.log(`📁 预览图文件存在: ${fs.existsSync(previewPath)}`);
    
    if (fs.existsSync(originalPath)) {
        const stats = fs.statSync(originalPath);
        console.log(`📊 原图文件大小: ${stats.size} bytes`);
    }
    
    if (fs.existsSync(previewPath)) {
        const stats = fs.statSync(previewPath);
        console.log(`📊 预览图文件大小: ${stats.size} bytes`);
    }
    
    console.log('\n🔗 测试签名URL生成...');
    
    try {
        // 2. 测试签名URL生成
        const signedUrlResponse = await axios.post(`${baseUrl}/api/signed-url`, {
            filePath: `preview/${testFileKey}.jpg`
        });
        
        console.log('✅ 签名URL生成成功');
        console.log('📋 响应数据:', JSON.stringify(signedUrlResponse.data, null, 2));
        
        const signedUrl = signedUrlResponse.data.url;
        const fullUrl = `${baseUrl}${signedUrl}`;
        
        console.log(`\n🌐 完整URL: ${fullUrl}`);
        
        // 3. 测试图片访问
        console.log('\n📸 测试图片访问...');
        
        try {
            const imageResponse = await axios.get(fullUrl, {
                responseType: 'arraybuffer',
                timeout: 10000
            });
            
            console.log('✅ 图片访问成功');
            console.log(`📊 响应状态: ${imageResponse.status}`);
            console.log(`📊 内容类型: ${imageResponse.headers['content-type']}`);
            console.log(`📊 内容长度: ${imageResponse.data.length} bytes`);
            
        } catch (imageError) {
            console.log('❌ 图片访问失败');
            console.log(`📊 错误状态: ${imageError.response?.status}`);
            console.log(`📊 错误信息: ${imageError.message}`);
            
            if (imageError.response) {
                console.log(`📊 响应头: ${JSON.stringify(imageError.response.headers, null, 2)}`);
                console.log(`📊 响应数据: ${imageError.response.data}`);
            }
        }
        
        // 4. 测试不同的URL格式
        console.log('\n🔄 测试不同URL格式...');
        
        // 直接访问（无签名）
        const directUrl = `${baseUrl}/files/preview/${testFileKey}.jpg`;
        console.log(`🌐 直接访问URL: ${directUrl}`);
        
        try {
            const directResponse = await axios.get(directUrl, {
                responseType: 'arraybuffer',
                timeout: 5000
            });
            console.log('✅ 直接访问成功（这可能是问题所在）');
        } catch (directError) {
            console.log('❌ 直接访问失败（这是正常的，需要签名）');
            console.log(`📊 错误状态: ${directError.response?.status}`);
        }
        
    } catch (signedUrlError) {
        console.log('❌ 签名URL生成失败');
        console.log(`📊 错误状态: ${signedUrlError.response?.status}`);
        console.log(`📊 错误信息: ${signedUrlError.message}`);
        
        if (signedUrlError.response) {
            console.log(`📊 响应数据: ${JSON.stringify(signedUrlError.response.data, null, 2)}`);
        }
    }
    
    // 5. 测试服务器健康状态
    console.log('\n🏥 测试服务器健康状态...');
    
    try {
        const healthResponse = await axios.get(`${baseUrl}/health`);
        console.log('✅ 服务器健康检查通过');
        console.log(`📊 响应: ${JSON.stringify(healthResponse.data, null, 2)}`);
    } catch (healthError) {
        console.log('❌ 服务器健康检查失败');
        console.log(`📊 错误: ${healthError.message}`);
    }
    
    console.log('\n🎯 诊断完成');
}

// 运行诊断
diagnoseImageLoading().catch(error => {
    console.error('💥 诊断过程出错:', error.message);
    process.exit(1);
});