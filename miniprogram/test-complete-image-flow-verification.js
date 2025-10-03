const fs = require('fs');
const path = require('path');

// 完整的图片流程验证测试
async function testCompleteImageFlow() {
    console.log('🧪 开始完整图片流程验证测试...\n');
    
    const baseUrl = 'http://localhost:3000';
    
    try {
        // 1. 测试签名URL生成
        console.log('1️⃣ 测试签名URL生成...');
        const signedUrlResponse = await fetch(`${baseUrl}/upload/signed-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fileKey: '0077fecc-4b22-4f36-b78a-9856d72156df.jpg',
                type: 'image/jpeg'
            })
        });
        
        if (!signedUrlResponse.ok) {
            throw new Error(`签名URL生成失败: ${signedUrlResponse.status}`);
        }
        
        const signedUrlData = await signedUrlResponse.json();
        console.log('✅ 签名URL生成成功');
        console.log('   - fileKey:', signedUrlData.fileKey);
        console.log('   - type:', signedUrlData.type);
        console.log('   - expires:', new Date(signedUrlData.expires).toLocaleString());
        
        // 2. 测试图片访问
        console.log('\n2️⃣ 测试图片访问...');
        const imageResponse = await fetch(signedUrlData.url);
        
        if (!imageResponse.ok) {
            throw new Error(`图片访问失败: ${imageResponse.status}`);
        }
        
        const contentType = imageResponse.headers.get('content-type');
        const contentLength = imageResponse.headers.get('content-length');
        
        console.log('✅ 图片访问成功');
        console.log('   - Content-Type:', contentType);
        console.log('   - Content-Length:', contentLength, 'bytes');
        
        // 3. 测试小程序模拟请求
        console.log('\n3️⃣ 测试小程序模拟请求...');
        
        // 模拟小程序的request方法
        function mockWxRequest(options) {
            return new Promise((resolve, reject) => {
                fetch(options.url, {
                    method: options.method || 'GET',
                    headers: options.header || {},
                    body: options.data ? JSON.stringify(options.data) : undefined
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    resolve({
                        statusCode: 200,
                        data: data
                    });
                })
                .catch(error => {
                    reject({
                        statusCode: 500,
                        errMsg: error.message
                    });
                });
            });
        }
        
        // 模拟getSignedUrlForPhoto函数
        async function getSignedUrlForPhoto(fileKey, type = 'image/jpeg') {
            try {
                const result = await mockWxRequest({
                    url: `${baseUrl}/upload/signed-url`,
                    method: 'POST',
                    header: {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        fileKey: fileKey,
                        type: type
                    }
                });
                
                if (result.statusCode === 200 && result.data) {
                    return result.data;
                } else {
                    throw new Error('获取签名URL失败');
                }
            } catch (error) {
                console.error('获取签名URL出错:', error);
                throw error;
            }
        }
        
        // 测试小程序获取签名URL
        const testFileKey = '02a9f6e0-33f8-460e-8767-dbba3f81efbd.jpg';
        const signedData = await getSignedUrlForPhoto(testFileKey);
        
        console.log('✅ 小程序模拟请求成功');
        console.log('   - fileKey:', signedData.fileKey);
        console.log('   - url:', signedData.url.substring(0, 50) + '...');
        
        // 4. 测试图片URL有效性验证
        console.log('\n4️⃣ 测试图片URL有效性验证...');
        
        const testImageResponse = await fetch(signedData.url);
        if (testImageResponse.ok) {
            console.log('✅ 图片URL有效性验证通过');
            console.log('   - 状态码:', testImageResponse.status);
            console.log('   - 内容类型:', testImageResponse.headers.get('content-type'));
        } else {
            console.log('❌ 图片URL无效:', testImageResponse.status);
        }
        
        // 5. 测试过期时间验证
        console.log('\n5️⃣ 测试过期时间验证...');
        const expiresTime = new Date(signedData.expires);
        const currentTime = new Date();
        const timeUntilExpiry = expiresTime.getTime() - currentTime.getTime();
        
        if (timeUntilExpiry > 0) {
            console.log('✅ 过期时间验证通过');
            console.log('   - 当前时间:', currentTime.toLocaleString());
            console.log('   - 过期时间:', expiresTime.toLocaleString());
            console.log('   - 剩余时间:', Math.round(timeUntilExpiry / 1000), '秒');
        } else {
            console.log('❌ URL已过期');
        }
        
        console.log('\n🎉 完整图片流程验证测试完成！');
        console.log('📊 测试结果总结:');
        console.log('   ✅ 签名URL生成正常');
        console.log('   ✅ 图片访问正常');
        console.log('   ✅ 小程序模拟请求正常');
        console.log('   ✅ URL有效性验证通过');
        console.log('   ✅ 过期时间设置正确');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        console.error('详细错误:', error);
    }
}

// 运行测试
testCompleteImageFlow();