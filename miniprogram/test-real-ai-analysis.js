/**
 * 真实AI分析测试
 * 直接调用API验证AI分析结果处理是否正确
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000';

async function testRealAIAnalysis() {
    console.log('🧪 开始真实AI分析测试\n');
    
    try {
        // 1. 准备测试文件
        const testFiles = [
            'dfbb250c-5260-454d-a8ed-0b96bdf1d632',
            '1830a65c-80d0-4abb-87a0-920b9290abc6',
            'f83cc0c8-f36b-431e-ba59-efdce79273cd'
        ];
        
        console.log('📋 测试文件列表:', testFiles);
        
        // 2. 验证文件存在
        console.log('\n🔍 验证测试文件...');
        for (const fileKey of testFiles) {
            const possibleExtensions = ['.jpg', '.jpeg', '.png'];
            let found = false;
            
            for (const ext of possibleExtensions) {
                const filePath = path.join(__dirname, 'server/uploads/original', `${fileKey}${ext}`);
                if (fs.existsSync(filePath)) {
                    console.log(`✅ 找到文件: ${fileKey}${ext}`);
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                console.log(`❌ 文件不存在: ${fileKey}`);
            }
        }
        
        // 3. 调用AI分析API
        console.log('\n🤖 调用AI分析API...');
        const sessionId = `test_session_${Date.now()}`;
        
        const response = await axios.post(`${API_BASE}/ai/pick`, {
            sessionId: sessionId,
            fileKeys: testFiles
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
        
        console.log('📊 API响应状态:', response.status);
        console.log('📊 API响应数据:', JSON.stringify(response.data, null, 2));
        
        // 4. 验证响应结构
        if (response.data.success && response.data.data) {
            const result = response.data.data;
            
            console.log('\n✅ AI分析成功');
            console.log('🎯 分析结果验证:');
            console.log(`- 推荐照片ID: ${result.bestPhotoId}`);
            console.log(`- 推荐理由: ${result.reason}`);
            console.log(`- 标签: ${result.tags ? result.tags.join(', ') : '无'}`);
            console.log(`- 评分: ${result.scores ? result.scores.join(', ') : '无'}`);
            console.log(`- 会话ID: ${result.sessionId || '无'}`);
            console.log(`- 时间戳: ${result.timestamp || '无'}`);
            console.log(`- 照片总数: ${result.totalPhotos || '无'}`);
            
            // 验证关键字段
            const validations = [
                {
                    name: '推荐照片ID存在',
                    condition: !!result.bestPhotoId,
                    value: result.bestPhotoId
                },
                {
                    name: '推荐照片ID在文件列表中',
                    condition: testFiles.includes(result.bestPhotoId),
                    value: result.bestPhotoId
                },
                {
                    name: '推荐理由不是错误信息',
                    condition: result.reason && !result.reason.includes('解析AI响应时出错'),
                    value: result.reason
                },
                {
                    name: '标签是数组',
                    condition: Array.isArray(result.tags),
                    value: result.tags
                },
                {
                    name: '评分是数组',
                    condition: Array.isArray(result.scores),
                    value: result.scores
                }
            ];
            
            console.log('\n🔍 详细验证结果:');
            let allPassed = true;
            
            validations.forEach(validation => {
                const status = validation.condition ? '✅' : '❌';
                console.log(`${status} ${validation.name}: ${validation.value}`);
                if (!validation.condition) {
                    allPassed = false;
                }
            });
            
            console.log(`\n🎯 总体测试结果: ${allPassed ? '✅ 全部通过' : '❌ 存在问题'}`);
            
            if (allPassed) {
                console.log('\n🎉 AI分析结果处理修复验证成功！');
                console.log('- ✅ AI能够正确返回推荐照片ID');
                console.log('- ✅ 推荐理由不再是错误信息');
                console.log('- ✅ 数据结构完整正确');
                console.log('- ✅ 兼容性处理正常');
            } else {
                console.log('\n⚠️ 仍存在问题，需要进一步检查');
            }
            
        } else {
            console.log('❌ AI分析失败');
            console.log('错误信息:', response.data.error || '未知错误');
        }
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
    }
}

// 运行测试
testRealAIAnalysis();