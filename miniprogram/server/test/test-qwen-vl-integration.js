const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// 测试配置
const TEST_CONFIG = {
    BASE_URL: 'http://localhost:3000',
    TEST_SESSION_ID: 'test-qwen-vl-' + Date.now()
};

console.log('🚀 开始测试通义千问VL集成...');
console.log('📋 测试配置:', TEST_CONFIG);

// 测试AI照片分析接口（使用通义千问VL）
async function testQwenVLIntegration() {
    console.log('\n🤖 测试通义千问VL集成...');
    
    try {
        // 使用JSON格式发送请求，使用有效的base64图片
        // 这是一个简单的红色方块图片 (10x10像素)
        const redSquareBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8/5+hnoEIwDiqkL4KAcT9GO2HLscYAAAAAElFTkSuQmCC';
        // 这是一个简单的蓝色方块图片 (10x10像素)
        const blueSquareBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNkYGBgZGRkYGRkYGBgAABrAAGjQ8qbAAAAAElFTkSuQmCC';
        
        const requestData = {
            sessionId: TEST_CONFIG.TEST_SESSION_ID,
            photos: [
                {
                    id: 'test1',
                    base64: redSquareBase64,
                    width: 10,
                    height: 10,
                    orientation: 1
                },
                {
                    id: 'test2', 
                    base64: blueSquareBase64,
                    width: 10,
                    height: 10,
                    orientation: 1
                }
            ]
        };

        console.log('📤 发送AI分析请求...');
        const response = await axios.post(`${TEST_CONFIG.BASE_URL}/ai/pick`, requestData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 120000 // 2分钟超时
        });

        console.log('✅ 通义千问VL集成测试成功!');
        console.log('📊 响应状态:', response.status);
        console.log('📋 分析结果:', JSON.stringify(response.data, null, 2));
        
        return response.data;
    } catch (error) {
        console.error('❌ 通义千问VL集成测试失败:', error.message);
        
        if (error.response) {
            console.error('📊 错误状态码:', error.response.status);
            console.error('📋 错误详情:', error.response.data);
        }
        
        throw error;
    }
}

// 主测试函数
async function runTests() {
    try {
        console.log('🔍 检查服务器状态...');
        
        // 检查服务器是否运行
        try {
            const healthCheck = await axios.get(`${TEST_CONFIG.BASE_URL}/health`, {
                timeout: 5000
            });
            console.log('✅ 服务器运行正常');
        } catch (error) {
            console.error('❌ 服务器未运行，请先启动服务器');
            console.error('💡 运行命令: npm start');
            return;
        }
        
        // 测试通义千问VL集成
        await testQwenVLIntegration();
        
        console.log('\n🎉 所有测试完成!');
        
    } catch (error) {
        console.error('\n❌ 测试失败:', error.message);
        process.exit(1);
    }
}

// 运行测试
runTests();