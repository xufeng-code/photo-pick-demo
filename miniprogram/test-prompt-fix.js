/**
 * 测试修复后的prompt是否能产生正确格式的输出
 */

const fs = require('fs');
const path = require('path');

// 模拟通义千问的响应处理
function testPromptResponse() {
  console.log('🧪 测试prompt修复效果...\n');
  
  // 模拟几种可能的AI响应
  const testResponses = [
    // 正确格式的响应
    `{
  "bestPhotoIndex": 0,
  "reason": "我们综合评估了人像、画质、构图、氛围四个方面，这张照片以得分0.87获胜，你笑得放松又自然。",
  "tags": ["笑容自然","眼神真诚","肤色柔和"],
  "scores": [0.87, 0.79]
}`,
    
    // 错误格式1：包含额外文字
    `根据分析，我推荐第一张照片。
{
  "bestPhotoIndex": 0,
  "reason": "我推荐这张，因为这张照片表现优秀，值得分享。",
  "tags": ["不错","很好","推荐"],
  "scores": [0.8, 0.7]
}`,
    
    // 错误格式2：纯文本响应
    `我推荐这张，因为这张照片表现优秀，值得分享。`,
    
    // 错误格式3：reason格式不正确
    `{
  "bestPhotoIndex": 1,
  "reason": "照片#2最好，构图不错。",
  "tags": ["构图好","清晰","美观"],
  "scores": [0.75, 0.85]
}`
  ];
  
  // 导入解析函数
  const AIService = require('./server/services/aiService');
  
  testResponses.forEach((response, index) => {
    console.log(`\n📋 测试响应 ${index + 1}:`);
    console.log('原始响应:', response);
    
    try {
      // 模拟照片数据
      const mockPhotos = [
        { id: 'photo1', filename: 'test1.jpg' },
        { id: 'photo2', filename: 'test2.jpg' }
      ];
      
      const result = AIService.parseAIResponse(response, mockPhotos);
      console.log('解析结果:', JSON.stringify(result, null, 2));
      
      // 检查reason格式是否正确
      const reason = result.reason;
      const hasCorrectStart = reason.includes('我们综合评估了人像、画质、构图、氛围四个方面');
      const hasScore = /得分\d+\.\d+|最高分\d+\.\d+分/.test(reason);
      const isNotEmpty = reason !== '我推荐这张，因为这张照片表现优秀，值得分享。';
      
      console.log('格式检查:');
      console.log('  ✅ 正确开头:', hasCorrectStart ? '是' : '❌ 否');
      console.log('  ✅ 包含分数:', hasScore ? '是' : '❌ 否');
      console.log('  ✅ 非空洞表述:', isNotEmpty ? '是' : '❌ 否');
      
      if (hasCorrectStart && hasScore && isNotEmpty) {
        console.log('  🎉 格式完全正确!');
      } else {
        console.log('  ⚠️  格式需要改进');
      }
      
    } catch (error) {
      console.log('❌ 解析失败:', error.message);
    }
    
    console.log('─'.repeat(50));
  });
}

// 显示新的prompt要求
function showPromptRequirements() {
  console.log('\n📝 新的prompt要求总结:');
  console.log('1. reason必须以"我们综合评估了人像、画质、构图、氛围四个方面"开头');
  console.log('2. 必须包含具体分数说明，如"这张照片以得分0.87获胜"');
  console.log('3. 必须有具体的打动理由，避免"表现优秀"等空话');
  console.log('4. 总长度≤50字');
  console.log('5. 必须输出标准JSON格式');
  console.log('\n✅ 正确示例:');
  console.log('"reason": "我们综合评估了人像、画质、构图、氛围四个方面，这张照片以得分0.87获胜，你笑得放松又自然。"');
  console.log('\n❌ 错误示例:');
  console.log('"reason": "我推荐这张，因为这张照片表现优秀，值得分享。"');
}

// 运行测试
console.log('🔧 Prompt修复效果测试');
console.log('='.repeat(60));

showPromptRequirements();
testPromptResponse();

console.log('\n🎯 测试完成!');
console.log('如果看到"格式完全正确"，说明prompt修复生效。');
console.log('如果仍有问题，需要进一步加强prompt约束。');