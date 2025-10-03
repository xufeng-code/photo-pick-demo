/**
 * 调试通义千问VL API调用
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function testQwenVLAPI() {
    console.log('🔍 测试通义千问VL API调用...\n');
    
    // 检查配置
    const apiKey = process.env.QWEN_VL_API_KEY;
    const baseUrl = process.env.QWEN_VL_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
    const model = process.env.QWEN_VL_MODEL || 'qwen-vl-plus';
    
    console.log('📋 配置信息:');
    console.log(`API Key: ${apiKey ? apiKey.substring(0, 20) + '...' : '未配置'}`);
    console.log(`Base URL: ${baseUrl}`);
    console.log(`Model: ${model}\n`);
    
    if (!apiKey || apiKey === 'your_dashscope_api_key_here') {
        console.error('❌ API密钥未正确配置');
        return;
    }
    
    try {
        // 准备测试图片
        const testImagePath = path.join(__dirname, 'uploads', 'original');
        const files = fs.readdirSync(testImagePath).filter(file => 
            file.toLowerCase().endsWith('.jpg') || 
            file.toLowerCase().endsWith('.jpeg') || 
            file.toLowerCase().endsWith('.png')
        );
        
        if (files.length === 0) {
            console.error('❌ 没有找到测试图片');
            return;
        }
        
        console.log(`📸 找到 ${files.length} 张测试图片`);
        
        // 取前2张图片进行测试
        const testFiles = files.slice(0, 2);
        const content = [];
        
        for (let i = 0; i < testFiles.length; i++) {
            const filePath = path.join(testImagePath, testFiles[i]);
            const imageBuffer = fs.readFileSync(filePath);
            const base64Image = imageBuffer.toString('base64');
            
            content.push({
                image: `data:image/jpeg;base64,${base64Image}`
            });
            
            content.push({
                text: `照片 #${i} (索引: ${i})`
            });
            
            console.log(`✅ 已加载图片 ${i + 1}: ${testFiles[i]}`);
        }
        
        // 添加分析提示
        const prompt = `请分析这${testFiles.length}张照片，选出最佳的一张。

请按以下JSON格式返回分析结果：
{
  "bestPhotoIndex": 最佳照片的索引(0开始),
  "reason": "选择理由",
  "tags": ["标签1", "标签2"],
  "scores": [0.8, 0.9]
}`;

        content.push({
            text: prompt
        });
        
        // 构建请求
        const payload = {
            model: model,
            input: {
                messages: [
                    {
                        role: 'user',
                        content: content
                    }
                ]
            },
            parameters: {
                result_format: 'message'
            }
        };
        
        console.log('\n🚀 发送API请求...');
        console.log(`请求URL: ${baseUrl}`);
        console.log(`请求头: Authorization: Bearer ${apiKey.substring(0, 20)}...`);
        
        const response = await axios.post(baseUrl, payload, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: 60000
        });
        
        console.log('\n✅ API调用成功!');
        console.log('📊 响应状态:', response.status);
        console.log('📋 响应数据:');
        console.log(JSON.stringify(response.data, null, 2));
        
        // 提取AI响应
        let aiResponse = response.data.output.choices[0].message.content;
        console.log('\n🤖 AI原始响应:');
        console.log(aiResponse);
        
        // 如果响应是数组，提取第一个元素的text内容
        if (Array.isArray(aiResponse) && aiResponse.length > 0 && aiResponse[0].text) {
            aiResponse = aiResponse[0].text;
            console.log('\n📝 提取的文本内容:');
            console.log(aiResponse);
        }
        
    } catch (error) {
        console.error('\n❌ API调用失败:');
        console.error('错误类型:', error.constructor.name);
        console.error('错误消息:', error.message);
        
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应状态文本:', error.response.statusText);
            console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('请求配置:', error.config);
            console.error('没有收到响应');
        } else {
            console.error('请求设置错误:', error.message);
        }
    }
}

testQwenVLAPI().catch(console.error);