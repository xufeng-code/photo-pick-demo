/**
 * 调试AI响应内容
 * 查看AI实际返回的内容，找出解析问题
 */

const aiService = require('./server/services/aiService');
const fs = require('fs');
const path = require('path');

async function debugAIResponse() {
    console.log('🔍 开始调试AI响应...\n');
    
    try {
        // 准备测试文件
        const testFiles = [
            'dfbb250c-5260-454d-a8ed-0b96bdf1d632',
            '1830a65c-80d0-4abb-87a0-920b9290abc6',
            'f83cc0c8-f36b-431e-ba59-efdce79273cd'
        ];
        
        // 构建文件对象
        const files = testFiles.map((fileKey, index) => {
            const possibleExtensions = ['.jpg', '.jpeg', '.png'];
            let filePath = null;
            
            for (const ext of possibleExtensions) {
                const testPath = path.join(__dirname, 'server/uploads/original', `${fileKey}${ext}`);
                if (fs.existsSync(testPath)) {
                    filePath = testPath;
                    break;
                }
            }
            
            if (!filePath) {
                throw new Error(`文件不存在: ${fileKey}`);
            }
            
            const buffer = fs.readFileSync(filePath);
            
            return {
                buffer: buffer,
                originalname: `photo_${index + 1}.jpg`,
                mimetype: 'image/jpeg',
                size: buffer.length,
                metadata: {
                    id: fileKey,
                    fileKey: fileKey
                }
            };
        });
        
        console.log('📋 准备的文件:', files.map(f => ({
            id: f.metadata.id,
            size: f.size,
            originalname: f.originalname
        })));
        
        // 临时修改AI服务以输出详细日志
        const originalCallQwenVL = aiService.callQwenVL;
        const originalParseAIResponse = aiService.parseAIResponse;
        
        // 重写callQwenVL方法以捕获原始响应
        aiService.callQwenVL = async function(photos) {
            console.log('\n🤖 调用通义千问VL API...');
            
            try {
                const result = await originalCallQwenVL.call(this, photos);
                console.log('\n📊 AI原始响应:');
                console.log('=' .repeat(80));
                console.log(result);
                console.log('=' .repeat(80));
                console.log('\n📊 响应类型:', typeof result);
                console.log('📊 响应长度:', result ? result.length : 'undefined');
                
                return result;
            } catch (error) {
                console.error('\n❌ AI调用失败:', error.message);
                console.error('错误详情:', error);
                throw error;
            }
        };
        
        // 重写parseAIResponse方法以显示解析过程
        aiService.parseAIResponse = function(aiResponse, photos) {
            console.log('\n🔍 开始解析AI响应...');
            console.log('📊 输入响应:', aiResponse);
            console.log('📊 照片数量:', photos.length);
            
            try {
                const result = originalParseAIResponse.call(this, aiResponse, photos);
                console.log('\n✅ 解析结果:');
                console.log(JSON.stringify(result, null, 2));
                return result;
            } catch (error) {
                console.error('\n❌ 解析失败:', error.message);
                console.error('错误详情:', error);
                
                // 返回默认结果
                const defaultResult = {
                    bestPhotoId: photos[0]?.id,
                    reason: '解析AI响应时出错，默认选择第一张照片',
                    tags: [],
                    scores: photos.map(() => 1)
                };
                
                console.log('\n🔄 返回默认结果:');
                console.log(JSON.stringify(defaultResult, null, 2));
                
                return defaultResult;
            }
        };
        
        // 执行AI分析
        console.log('\n🎯 开始AI分析...');
        const result = await aiService.analyzePhotos({
            sessionId: `debug_session_${Date.now()}`,
            files: files
        });
        
        console.log('\n🎉 最终分析结果:');
        console.log(JSON.stringify(result, null, 2));
        
        // 恢复原始方法
        aiService.callQwenVL = originalCallQwenVL;
        aiService.parseAIResponse = originalParseAIResponse;
        
    } catch (error) {
        console.error('\n❌ 调试过程中发生错误:', error.message);
        console.error('错误堆栈:', error.stack);
    }
}

// 运行调试
debugAIResponse();