const fs = require('fs');
const path = require('path');

// 读取测试图片并转换为base64
function imageToBase64(imagePath) {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64String = imageBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64String}`;
}

// 测试AI分析
async function testAIAnalysis() {
    try {
        console.log('🧪 开始测试新的AI prompt...');
        
        // 准备测试数据
        const photo1Path = path.join(__dirname, 'assets', 'test', '1.jpg');
        const photo2Path = path.join(__dirname, 'assets', 'test', '2.jpg');
        
        const photo1Base64 = imageToBase64(photo1Path);
        const photo2Base64 = imageToBase64(photo2Path);
        
        const testData = {
            sessionId: 'test_new_prompt_' + Date.now(),
            photos: [
                {
                    id: '1',
                    base64: photo1Base64,
                    width: 800,
                    height: 600
                },
                {
                    id: '2', 
                    base64: photo2Base64,
                    width: 800,
                    height: 600
                }
            ]
        };
        
        console.log('📤 发送AI分析请求...');
        
        // 发送请求
        const response = await fetch('http://localhost:5000/api/ai/pick', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        const result = await response.json();
        
        console.log('📥 AI分析结果:');
        console.log(JSON.stringify(result, null, 2));
        
        // 检查新prompt格式
        const reason = result.data?.reason || result.reason;
        if (reason && reason.includes('我们综合评估了人像、画质、构图、氛围四个方面')) {
            console.log('✅ 新prompt格式正确！');
            console.log('📝 reason内容:', reason);
        } else {
            console.log('❌ 新prompt格式不正确，reason内容:');
            console.log(reason);
        }
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

// 运行测试
testAIAnalysis();