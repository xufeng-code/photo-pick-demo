/**
 * 调试AI响应解析过程
 */

require('dotenv').config();
const aiService = require('./services/aiService');
const fs = require('fs');
const path = require('path');

async function debugParseResponse() {
    console.log('🔍 调试AI响应解析过程...\n');
    
    try {
        // 准备测试图片
        const testImagePath = path.join(__dirname, 'uploads', 'original');
        const files = fs.readdirSync(testImagePath).filter(file => 
            file.toLowerCase().endsWith('.jpg') || 
            file.toLowerCase().endsWith('.jpeg') || 
            file.toLowerCase().endsWith('.png')
        );
        
        if (files.length < 2) {
            console.error('❌ 需要至少2张测试图片');
            return;
        }
        
        // 准备照片数据
        const photos = [];
        for (let i = 0; i < Math.min(2, files.length); i++) {
            const filePath = path.join(testImagePath, files[i]);
            const buffer = fs.readFileSync(filePath);
            photos.push({
                id: files[i].replace(/\.[^/.]+$/, ''), // 移除扩展名作为ID
                buffer: buffer,
                filename: files[i]
            });
        }
        
        console.log(`📸 准备了 ${photos.length} 张照片进行测试`);
        
        // 使用AI服务实例
        const service = aiService;
        
        // 调用通义千问VL获取原始响应
        console.log('\n🤖 调用通义千问VL...');
        const rawResponse = await service.callQwenVL(photos);
        
        console.log('\n📋 原始AI响应:');
        console.log('='.repeat(80));
        console.log(rawResponse);
        console.log('='.repeat(80));
        
        console.log('\n📊 响应类型:', typeof rawResponse);
        console.log('📊 响应长度:', rawResponse.length);
        
        // 手动调用parseAIResponse进行调试
        console.log('\n🔧 开始解析响应...');
        
        // 临时重写parseAIResponse方法以添加调试信息
        const originalParseAIResponse = service.parseAIResponse;
        service.parseAIResponse = function(aiResponse, photos) {
            console.log('\n🔍 parseAIResponse 调试信息:');
            console.log('输入响应:', aiResponse.substring(0, 200) + '...');
            
            try {
                // 尝试直接解析JSON
                let jsonStr = aiResponse.trim();
                console.log('🧹 清理后的响应:', jsonStr.substring(0, 200) + '...');
                
                // 如果响应被包裹在代码块中，提取JSON部分
                const jsonMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
                if (jsonMatch) {
                    jsonStr = jsonMatch[1];
                    console.log('✅ 找到代码块，提取的JSON:', jsonStr.substring(0, 200) + '...');
                } else {
                    console.log('❌ 未找到代码块');
                }
                
                // 如果没有找到代码块，尝试提取第一个完整的JSON对象
                if (!jsonMatch) {
                    const firstBrace = jsonStr.indexOf('{');
                    const lastBrace = jsonStr.lastIndexOf('}');
                    console.log(`🔍 JSON边界: 第一个{位置=${firstBrace}, 最后一个}位置=${lastBrace}`);
                    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
                        console.log('✅ 提取的JSON对象:', jsonStr.substring(0, 200) + '...');
                    }
                }
                
                // 清理可能的多余字符
                jsonStr = jsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
                console.log('🧹 清理控制字符后:', jsonStr.substring(0, 200) + '...');
                
                let parsedResponse;
                try {
                    parsedResponse = JSON.parse(jsonStr);
                    console.log('✅ JSON解析成功:', JSON.stringify(parsedResponse, null, 2));
                } catch (parseError) {
                    console.error('❌ JSON解析失败:', parseError.message);
                    console.log('🔍 尝试解析的字符串:', jsonStr);
                    throw parseError;
                }
                
                // 构建返回结果
                const bestPhotoIndex = parsedResponse.bestPhotoIndex || 0;
                const bestPhotoId = photos[bestPhotoIndex]?.id || photos[0]?.id;
                
                const result = {
                    bestPhotoId: bestPhotoId,
                    reason: parsedResponse.reason || '未提供分析理由',
                    tags: parsedResponse.tags || [],
                    scores: parsedResponse.scores || photos.map(() => 1)
                };
                
                console.log('✅ 最终解析结果:', JSON.stringify(result, null, 2));
                return result;
                
            } catch (error) {
                console.error('❌ 解析过程出错:', error.message);
                console.error('❌ 错误堆栈:', error.stack);
                
                // 返回默认结果
                const defaultResult = {
                    bestPhotoId: photos[0]?.id,
                    reason: '解析AI响应时出错，默认选择第一张照片',
                    tags: [],
                    scores: photos.map(() => 1)
                };
                
                console.log('🔄 返回默认结果:', JSON.stringify(defaultResult, null, 2));
                return defaultResult;
            }
        };
        
        // 调用解析方法
        const result = service.parseAIResponse(rawResponse, photos);
        
        console.log('\n🎯 最终结果:');
        console.log(JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('❌ 调试过程出错:', error.message);
        console.error(error.stack);
    }
}

debugParseResponse().catch(console.error);