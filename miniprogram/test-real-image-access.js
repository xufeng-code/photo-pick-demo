const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 设置 Secret（与服务器一致）
process.env.SIGNED_URL_SECRET = 'your-secret-key-change-in-production-please';

// 查找一个真实存在的图片文件
const uploadsDir = path.join(__dirname, 'server', 'uploads');
const thumbDir = path.join(uploadsDir, 'thumb');
const previewDir = path.join(uploadsDir, 'preview');

console.log('🔍 查找可用的图片文件...');

// 获取缩略图目录中的文件
const thumbFiles = fs.readdirSync(thumbDir).filter(file => file.endsWith('.jpg') || file.endsWith('.jpeg'));
console.log(`📁 缩略图目录中有 ${thumbFiles.length} 个文件`);

// 获取预览图目录中的文件
const previewFiles = fs.readdirSync(previewDir).filter(file => file.endsWith('.jpg') || file.endsWith('.jpeg'));
console.log(`📁 预览图目录中有 ${previewFiles.length} 个文件`);

// 找到同时存在于两个目录中的文件
const commonFiles = thumbFiles.filter(file => previewFiles.includes(file));
console.log(`🎯 同时存在于缩略图和预览图目录的文件: ${commonFiles.length} 个`);

if (commonFiles.length === 0) {
    console.log('❌ 没有找到同时存在于两个目录的文件');
    process.exit(1);
}

// 使用第一个可用的文件
const testFile = commonFiles[0];
const fileKey = testFile.replace(/\.(jpg|jpeg)$/i, '');

console.log(`✅ 使用测试文件: ${testFile}`);
console.log(`🔑 文件Key: ${fileKey}`);

// 生成签名URL的函数（与服务器端算法保持一致）
function generateSignedUrl(path, expiresIn = 3600000) {
    const expires = Date.now() + expiresIn;
    const secret = process.env.SIGNED_URL_SECRET;
    
    // 使用与服务器端相同的payload格式: filePath:expires
    const payload = `${path}:${expires}`;
    const token = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    
    return `${path}?token=${token}&expires=${expires}`;
}

// 生成测试URL
const baseUrl = 'http://localhost:3000';
const thumbUrl = `${baseUrl}/files/thumb/${testFile}`;
const previewPath = `preview/${testFile}`;  // 修复：服务器端期望的路径格式
const signedPreviewUrl = `${baseUrl}/files/${generateSignedUrl(previewPath)}`;
const unsignedPreviewUrl = `${baseUrl}/files/preview/${testFile}`;

console.log('\n📋 生成的测试URL:');
console.log('1. 缩略图URL (无需签名):');
console.log(`   ${thumbUrl}`);
console.log('\n2. 签名预览图URL:');
console.log(`   ${signedPreviewUrl}`);
console.log('\n3. 无签名预览图URL (应该失败):');
console.log(`   ${unsignedPreviewUrl}`);

// 生成HTML测试页面
const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>真实图片访问测试</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .test-section {
            margin: 20px 0;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .test-section h3 {
            margin-top: 0;
            color: #333;
            border-bottom: 2px solid #007bff;
            padding-bottom: 10px;
        }
        .image-container {
            margin: 15px 0;
            text-align: center;
        }
        .image-container img {
            max-width: 300px;
            max-height: 200px;
            border: 2px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .url-display {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            word-break: break-all;
            margin: 10px 0;
            border-left: 4px solid #007bff;
        }
        .status {
            padding: 8px 15px;
            border-radius: 6px;
            font-weight: bold;
            margin: 10px 0;
            text-align: center;
        }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        .loading { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        
        .test-button {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            margin: 10px 5px;
        }
        .test-button:hover {
            background: #0056b3;
        }
        .auto-test {
            background: #28a745;
        }
        .auto-test:hover {
            background: #218838;
        }
    </style>
</head>
<body>
    <h1>🖼️ 真实图片访问测试</h1>
    <p>使用真实存在的图片文件: <strong>${testFile}</strong></p>
    
    <div class="test-section">
        <h3>1. 缩略图访问测试（无需签名）</h3>
        <p>缩略图应该可以直接访问，无需签名验证。</p>
        <div class="url-display">${thumbUrl}</div>
        <div class="image-container">
            <img id="thumb-image" alt="缩略图" style="display:none;">
        </div>
        <div id="thumb-status" class="status loading">⏳ 准备测试...</div>
        <button class="test-button" onclick="testThumbImage()">测试缩略图</button>
    </div>

    <div class="test-section">
        <h3>2. 预览图访问测试（需要签名）</h3>
        <p>预览图需要有效的签名才能访问。</p>
        <div class="url-display">${signedPreviewUrl}</div>
        <div class="image-container">
            <img id="preview-image" alt="预览图" style="display:none;">
        </div>
        <div id="preview-status" class="status loading">⏳ 准备测试...</div>
        <button class="test-button" onclick="testPreviewImage()">测试签名预览图</button>
    </div>

    <div class="test-section">
        <h3>3. 无签名预览图测试（应该失败）</h3>
        <p>没有签名的预览图访问应该被拒绝。</p>
        <div class="url-display">${unsignedPreviewUrl}</div>
        <div class="image-container">
            <img id="no-sign-image" alt="无签名预览图" style="display:none;">
        </div>
        <div id="no-sign-status" class="status loading">⏳ 准备测试...</div>
        <button class="test-button" onclick="testNoSignImage()">测试无签名访问</button>
    </div>

    <div class="test-section">
        <h3>4. 服务器健康检查</h3>
        <div id="health-status" class="status loading">⏳ 准备检查...</div>
        <button class="test-button" onclick="testHealth()">检查服务器状态</button>
    </div>

    <div class="test-section">
        <h3>🚀 一键测试所有功能</h3>
        <button class="test-button auto-test" onclick="runAllTests()">运行所有测试</button>
    </div>

    <script>
        function testThumbImage() {
            const img = document.getElementById('thumb-image');
            const status = document.getElementById('thumb-status');
            const url = '${thumbUrl}';
            
            status.className = 'status loading';
            status.textContent = '⏳ 加载中...';
            img.style.display = 'none';
            
            img.onload = function() {
                status.className = 'status success';
                status.textContent = '✅ 缩略图加载成功！';
                img.style.display = 'block';
            };
            
            img.onerror = function() {
                status.className = 'status error';
                status.textContent = '❌ 缩略图加载失败';
                img.style.display = 'none';
            };
            
            img.src = url + '?t=' + Date.now();
        }
        
        function testPreviewImage() {
            const img = document.getElementById('preview-image');
            const status = document.getElementById('preview-status');
            const url = '${signedPreviewUrl}';
            
            status.className = 'status loading';
            status.textContent = '⏳ 加载中...';
            img.style.display = 'none';
            
            img.onload = function() {
                status.className = 'status success';
                status.textContent = '✅ 签名预览图加载成功！';
                img.style.display = 'block';
            };
            
            img.onerror = function() {
                status.className = 'status error';
                status.textContent = '❌ 签名预览图加载失败';
                img.style.display = 'none';
            };
            
            img.src = url + '&t=' + Date.now();
        }
        
        function testNoSignImage() {
            const img = document.getElementById('no-sign-image');
            const status = document.getElementById('no-sign-status');
            const url = '${unsignedPreviewUrl}';
            
            status.className = 'status loading';
            status.textContent = '⏳ 测试中...';
            img.style.display = 'none';
            
            img.onload = function() {
                status.className = 'status error';
                status.textContent = '❌ 意外成功！应该被拒绝访问';
                img.style.display = 'block';
            };
            
            img.onerror = function() {
                status.className = 'status success';
                status.textContent = '✅ 正确拒绝无签名访问！';
                img.style.display = 'none';
            };
            
            img.src = url + '?t=' + Date.now();
        }
        
        function testHealth() {
            const status = document.getElementById('health-status');
            
            status.className = 'status loading';
            status.textContent = '⏳ 检查中...';
            
            fetch('http://localhost:3000/health')
                .then(response => response.json())
                .then(data => {
                    status.className = 'status success';
                    status.textContent = '✅ 服务器运行正常: ' + data.status;
                })
                .catch(error => {
                    status.className = 'status error';
                    status.textContent = '❌ 服务器连接失败: ' + error.message;
                });
        }
        
        function runAllTests() {
            console.log('🚀 开始运行所有测试...');
            
            // 先检查服务器状态
            testHealth();
            
            // 延迟执行图片测试，避免同时发起太多请求
            setTimeout(() => {
                testThumbImage();
            }, 500);
            
            setTimeout(() => {
                testPreviewImage();
            }, 1000);
            
            setTimeout(() => {
                testNoSignImage();
            }, 1500);
        }
        
        // 页面加载完成后自动运行所有测试
        window.addEventListener('load', function() {
            console.log('📄 页面加载完成，自动运行测试...');
            setTimeout(runAllTests, 1000);
        });
    </script>
</body>
</html>`;

// 写入HTML文件
const htmlPath = path.join(__dirname, 'test-real-image-access.html');
fs.writeFileSync(htmlPath, htmlContent);

console.log(`\n✅ 已生成HTML测试页面: ${htmlPath}`);
console.log('\n🌐 请在浏览器中打开该文件进行测试！');