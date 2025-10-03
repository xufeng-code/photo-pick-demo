const axios = require('axios');

// 通义千问VL API配置
const QWEN_VL_CONFIG = {
    // 阿里云API密钥 - 需要在阿里云控制台获取
    API_KEY: 'sk-f37dd8f159b149c8b82cf654f29702f7',
    // API端点 - 根据官方文档使用正确的端点
    BASE_URL: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
    // 模型名称 - 使用商业版模型
    MODEL: 'qwen-vl-plus'
};

/**
 * 测试通义千问VL的文本对话功能
 */
async function testQwenVLTextGeneration() {
    console.log('\n🧪 测试通义千问VL文本生成...');
    
    try {
        const payload = {
            model: QWEN_VL_CONFIG.MODEL,
            input: {
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                text: "你好，请介绍一下通义千问VL模型的特点。"
                            }
                        ]
                    }
                ]
            },
            parameters: {
                result_format: "message"
            }
        };

        const response = await axios.post(QWEN_VL_CONFIG.BASE_URL, payload, {
            headers: {
                'Authorization': `Bearer ${QWEN_VL_CONFIG.API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        console.log('✅ 通义千问VL文本生成成功!');
        console.log('📝 生成内容:', response.data.output?.choices?.[0]?.message?.content?.[0]?.text || '无内容');
        console.log('📊 完整响应:', JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.log('❌ 通义千问VL文本生成失败:', error.message);
        console.log('📊 错误状态码:', error.response?.status);
        console.log('📋 错误详情:', error.response?.data);
        return false;
    }
}

/**
 * 测试通义千问VL的图像分析功能
 */
async function testQwenVLVisionAnalysis() {
    console.log('\n🖼️ 测试通义千问VL图像分析...');
    
    try {
        const payload = {
            model: QWEN_VL_CONFIG.MODEL,
            input: {
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                image: 'https://dashscope.oss-cn-beijing.aliyuncs.com/images/dog_and_girl.jpeg'
                            },
                            {
                                text: "请分析这张图片的内容，包括构图、色彩、清晰度等方面，并给出评分。"
                            }
                        ]
                    }
                ]
            },
            parameters: {
                result_format: "message"
            }
        };

        const response = await axios.post(QWEN_VL_CONFIG.BASE_URL, payload, {
            headers: {
                'Authorization': `Bearer ${QWEN_VL_CONFIG.API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        console.log('✅ 通义千问VL图像分析成功!');
        console.log('🔍 分析结果:', response.data.output?.choices?.[0]?.message?.content?.[0]?.text || '无分析结果');
        console.log('📊 完整响应:', JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.log('❌ 通义千问VL图像分析失败:', error.message);
        console.log('📊 错误状态码:', error.response?.status);
        console.log('📋 错误详情:', error.response?.data);
        return false;
    }
}

/**
 * 测试通义千问VL的照片选择功能（模拟选照片场景）
 */
async function testQwenVLPhotoSelection() {
    console.log('\n📸 测试通义千问VL照片选择功能...');
    
    try {
        const payload = {
            model: QWEN_VL_CONFIG.MODEL,
            input: {
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                image: 'https://dashscope.oss-cn-beijing.aliyuncs.com/images/dog_and_girl.jpeg'
                            },
                            {
                                image: 'https://dashscope.oss-cn-beijing.aliyuncs.com/images/tiger.png'
                            },
                            {
                                text: "这两张照片中哪一张更适合作为头像？请分析原因。"
                            }
                        ]
                    }
                ]
            },
            parameters: {
                result_format: "message"
            }
        };

        const response = await axios.post(QWEN_VL_CONFIG.BASE_URL, payload, {
            headers: {
                'Authorization': `Bearer ${QWEN_VL_CONFIG.API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        console.log('✅ 通义千问VL照片选择成功!');
        console.log('🏆 选择结果:', response.data.output?.choices?.[0]?.message?.content?.[0]?.text || '无选择结果');
        console.log('📊 完整响应:', JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.log('❌ 通义千问VL照片选择失败:', error.message);
        console.log('📊 错误状态码:', error.response?.status);
        console.log('📋 错误详情:', error.response?.data);
        return false;
    }
}

/**
 * 主测试函数
 */
async function main() {
    console.log('🚀 开始测试通义千问VL API...');
    console.log('🔑 API密钥:', QWEN_VL_CONFIG.API_KEY.substring(0, 10) + '...');
    console.log('🌐 API端点:', QWEN_VL_CONFIG.BASE_URL);
    console.log('🤖 模型:', QWEN_VL_CONFIG.MODEL);
    
    // 检查API密钥配置
    if (QWEN_VL_CONFIG.API_KEY === 'your_dashscope_api_key_here') {
        console.log('\n⚠️  请先配置通义千问VL API密钥!');
        console.log('📝 获取方式:');
        console.log('   1. 访问阿里云控制台: https://dashscope.console.aliyun.com/');
        console.log('   2. 开通DashScope服务');
        console.log('   3. 创建API密钥');
        console.log('   4. 将API密钥填入此脚本的QWEN_VL_CONFIG.API_KEY字段');
        return;
    }
    
    let successCount = 0;
    let totalTests = 3;
    
    // 测试文本生成
    if (await testQwenVLTextGeneration()) {
        successCount++;
    }
    
    // 测试图像分析
    if (await testQwenVLVisionAnalysis()) {
        successCount++;
    }
    
    // 测试照片选择
    if (await testQwenVLPhotoSelection()) {
        successCount++;
    }
    
    console.log(`\n📊 测试完成! 成功: ${successCount}/${totalTests}`);
    
    if (successCount === totalTests) {
        console.log('🎉 所有测试通过! 通义千问VL API工作正常');
    } else if (successCount > 0) {
        console.log('⚠️  部分测试通过，请检查失败的测试项');
    } else {
        console.log('❌ 所有测试失败，请检查API密钥和网络连接');
    }
}

// 运行测试
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    testQwenVLTextGeneration,
    testQwenVLVisionAnalysis,
    testQwenVLPhotoSelection,
    QWEN_VL_CONFIG
};