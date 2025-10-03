const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const SERVER_URL = 'http://localhost:5000';

async function testEndToEnd() {
    console.log('🧪 开始端到端测试');
    console.log('📋 测试流程: 上传照片 → AI分析 → 验证结果');
    
    try {
        // 步骤1: 准备测试照片
        console.log('\n📸 步骤1: 准备测试照片');
        const testPhotos = [
            path.join(__dirname, 'assets/test/1.jpg'),
            path.join(__dirname, 'server/uploads/original/dfbb250c-5260-454d-a8ed-0b96bdf1d632.jpg'),
            path.join(__dirname, 'server/uploads/original/1830a65c-80d0-4abb-87a0-920b9290abc6.jpg')
        ];
        
        // 验证测试照片存在
        const validPhotos = [];
        for (const photoPath of testPhotos) {
            if (fs.existsSync(photoPath)) {
                validPhotos.push(photoPath);
                console.log(`✅ 找到测试照片: ${path.basename(photoPath)}`);
            } else {
                console.log(`⚠️ 测试照片不存在: ${photoPath}`);
            }
        }
        
        if (validPhotos.length < 2) {
            throw new Error('需要至少2张测试照片');
        }
        
        // 步骤2: 上传照片
        console.log('\n📤 步骤2: 上传照片');
        const uploadedFiles = [];
        
        for (let i = 0; i < Math.min(validPhotos.length, 3); i++) {
            const photoPath = validPhotos[i];
            const formData = new FormData();
            formData.append('photos', fs.createReadStream(photoPath));
            
            console.log(`📤 上传照片 ${i + 1}: ${path.basename(photoPath)}`);
            
            const uploadResponse = await axios.post(`${SERVER_URL}/upload`, formData, {
                headers: {
                    ...formData.getHeaders(),
                },
                timeout: 30000
            });
            
            console.log(`📊 上传响应:`, JSON.stringify(uploadResponse.data, null, 2));
            
            if (uploadResponse.data.success && uploadResponse.data.files.length > 0) {
                const file = uploadResponse.data.files[0];
                const fileKey = file.fileKey || file.key || file.id || file.filename;
                uploadedFiles.push(fileKey);
                console.log(`✅ 上传成功: ${fileKey}`);
            } else {
                throw new Error(`上传失败: ${JSON.stringify(uploadResponse.data)}`);
            }
        }
        
        console.log(`📊 总共上传了 ${uploadedFiles.length} 张照片`);
        
        // 步骤3: AI分析
        console.log('\n🤖 步骤3: AI分析');
        const sessionId = `end_to_end_test_${Date.now()}`;
        
        const aiResponse = await axios.post(`${SERVER_URL}/api/ai/pick`, {
            sessionId: sessionId,
            fileKeys: uploadedFiles
        }, {
            timeout: 60000
        });
        
        console.log(`📊 AI分析响应状态: ${aiResponse.status}`);
        
        if (!aiResponse.data.success) {
            throw new Error(`AI分析失败: ${JSON.stringify(aiResponse.data)}`);
        }
        
        const analysisResult = aiResponse.data.data;
        console.log('✅ AI分析成功');
        
        // 步骤4: 验证结果
        console.log('\n🔍 步骤4: 验证分析结果');
        
        const validations = [
            {
                name: '推荐照片ID存在',
                test: () => analysisResult.bestPhotoId && analysisResult.bestPhotoId.length > 0,
                value: analysisResult.bestPhotoId
            },
            {
                name: '推荐照片ID在上传列表中',
                test: () => uploadedFiles.includes(analysisResult.bestPhotoId),
                value: `${analysisResult.bestPhotoId} in [${uploadedFiles.join(', ')}]`
            },
            {
                name: '推荐理由不是错误信息',
                test: () => analysisResult.reason && !analysisResult.reason.includes('解析AI响应时出错'),
                value: analysisResult.reason ? analysisResult.reason.substring(0, 100) + '...' : 'null'
            },
            {
                name: '标签是数组',
                test: () => Array.isArray(analysisResult.tags),
                value: analysisResult.tags
            },
            {
                name: '评分是数组',
                test: () => Array.isArray(analysisResult.scores),
                value: analysisResult.scores
            },
            {
                name: '会话ID正确',
                test: () => analysisResult.sessionId === sessionId,
                value: analysisResult.sessionId
            },
            {
                name: '照片总数正确',
                test: () => analysisResult.totalPhotos === uploadedFiles.length,
                value: `${analysisResult.totalPhotos} === ${uploadedFiles.length}`
            }
        ];
        
        let passedTests = 0;
        for (const validation of validations) {
            const passed = validation.test();
            console.log(`${passed ? '✅' : '❌'} ${validation.name}: ${validation.value}`);
            if (passed) passedTests++;
        }
        
        // 步骤5: 总结
        console.log('\n🎯 测试总结');
        console.log(`📊 通过测试: ${passedTests}/${validations.length}`);
        console.log(`📸 上传照片数: ${uploadedFiles.length}`);
        console.log(`🤖 推荐照片: ${analysisResult.bestPhotoId}`);
        console.log(`💭 推荐理由: ${analysisResult.reason.substring(0, 150)}...`);
        console.log(`🏷️ 标签: ${analysisResult.tags.join(', ')}`);
        console.log(`📊 评分: ${analysisResult.scores.join(', ')}`);
        
        if (passedTests === validations.length) {
            console.log('\n🎉 端到端测试全部通过！');
            console.log('✅ 照片上传功能正常');
            console.log('✅ AI分析功能正常');
            console.log('✅ 数据结构完整');
            console.log('✅ 业务逻辑正确');
            return true;
        } else {
            console.log('\n❌ 端到端测试存在问题');
            console.log(`⚠️ 失败测试数: ${validations.length - passedTests}`);
            return false;
        }
        
    } catch (error) {
        console.error('\n❌ 端到端测试失败:', error.message);
        if (error.response) {
            console.error('📊 错误响应:', error.response.data);
        }
        return false;
    }
}

// 运行测试
testEndToEnd().then(success => {
    process.exit(success ? 0 : 1);
});