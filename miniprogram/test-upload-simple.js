// test-upload-simple.js
const fs = require('fs');
const path = require('path');

// 模拟图片上传测试
async function testUpload() {
    console.log('🧪 开始测试图片上传功能...');
    
    // 检查健康状态
    try {
        const response = await fetch('http://localhost:5000/health');
        const data = await response.json();
        console.log('✅ 健康检查:', data);
    } catch (error) {
        console.error('❌ 健康检查失败:', error.message);
        return;
    }
    
    // 检查测试图片是否存在
    const testImagePath = path.join(__dirname, 'assets', 'test', '1.jpg');
    if (!fs.existsSync(testImagePath)) {
        console.error('❌ 测试图片不存在:', testImagePath);
        return;
    }
    
    console.log('📁 测试图片路径:', testImagePath);
    
    // 创建FormData进行上传测试
    try {
        const FormData = require('form-data');
        const form = new FormData();
        
        // 读取文件内容
        const fileBuffer = fs.readFileSync(testImagePath);
        form.append('file', fileBuffer, {
            filename: '1.jpg',
            contentType: 'image/jpeg'
        });
        
        console.log('📤 开始上传图片...');
        
        // 使用Promise包装来确保FormData正确发送
        const response = await new Promise((resolve, reject) => {
            const options = {
                method: 'POST',
                headers: form.getHeaders()
            };
            
            const req = require('http').request('http://localhost:5000/upload', options, resolve);
            req.on('error', reject);
            form.pipe(req);
        });
        
        let data = '';
        response.on('data', chunk => data += chunk);
        const result = await new Promise((resolve, reject) => {
            response.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Invalid JSON: ${data.substring(0, 100)}...`));
                }
            });
            response.on('error', reject);
        });
        console.log('📊 上传结果:', result);
        
        if (result.success) {
            console.log('✅ 上传成功!');
            console.log('📄 文件名:', result.filename);
            console.log('🔗 相对路径:', result.url);
            console.log('🌐 完整URL:', `http://localhost:5000${result.url}`);
            
            // 验证文件是否真的存在
            const uploadedFilePath = path.join(__dirname, 'server', 'uploads', result.filename);
            if (fs.existsSync(uploadedFilePath)) {
                console.log('✅ 上传文件确实存在:', uploadedFilePath);
                const stats = fs.statSync(uploadedFilePath);
                console.log('📊 文件大小:', stats.size, '字节');
            } else {
                console.error('❌ 上传文件不存在:', uploadedFilePath);
            }
        } else {
            console.error('❌ 上传失败:', result.message);
        }
        
    } catch (error) {
        console.error('❌ 上传过程出错:', error.message);
    }
}

// 运行测试
testUpload().catch(console.error);