const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testAIAPI() {
    try {
        console.log('🧪 开始测试AI分析API...');
        
        // 准备测试图片
        const imagePath = path.join(__dirname, '../../assets/test/1.jpg');
        
        if (!fs.existsSync(imagePath)) {
            console.error('❌ 测试图片不存在:', imagePath);
            return;
        }
        
        // 创建FormData
        const formData = new FormData();
        formData.append('photos', fs.createReadStream(imagePath));
        
        console.log('📤 发送请求到 http://localhost:3000/ai/pick');
        
        // 发送请求
        const response = await axios.post('http://localhost:3000/ai/pick', formData, {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 60000 // 60秒超时
        });
        
        console.log('✅ API调用成功!');
        console.log('📊 响应状态:', response.status);
        console.log('📋 响应数据:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.error('❌ API调用失败:');
        
        if (error.response) {
            console.error('状态码:', error.response.status);
            console.error('错误信息:', error.response.data);
        } else if (error.request) {
            console.error('网络错误:', error.message);
        } else {
            console.error('其他错误:', error.message);
        }
        
        console.error('完整错误:', error);
    }
}

// 运行测试
testAIAPI();