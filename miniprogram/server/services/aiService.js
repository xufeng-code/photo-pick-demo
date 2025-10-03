const axios = require('axios');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class AIService {
  constructor() {
    // 通义千问VL配置
    this.qwenVlApiKey = process.env.QWEN_VL_API_KEY || 'your_dashscope_api_key_here';
    this.qwenVlBaseUrl = process.env.QWEN_VL_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';
    this.qwenVlModel = process.env.QWEN_VL_MODEL || 'qwen-vl-plus';
    
    console.log('🤖 AI服务初始化完成 - 使用通义千问VL');
    console.log('🔑 通义千问VL API密钥状态:', this.qwenVlApiKey && this.qwenVlApiKey !== 'your_dashscope_api_key_here' ? '已配置' : '未配置');
  }

  /**
   * 解析AI响应，提取最佳照片ID和分析结果
   * @param {string} aiResponse - AI响应文本
   * @param {Array} photos - 照片数组
   * @returns {Object} 解析结果
   */
  parseAIResponse(aiResponse, photos) {
    try {
      // 尝试直接解析JSON
      let jsonStr = aiResponse.trim();
      
      // 如果响应被包裹在代码块中，提取JSON部分
      const jsonMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      // 如果没有找到代码块，尝试提取第一个完整的JSON对象
      if (!jsonMatch) {
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
      }
      
      // 清理可能的多余字符
      jsonStr = jsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(jsonStr);
      } catch (parseError) {
        // 如果JSON解析失败，尝试通过正则表达式提取信息
        const bestPhotoMatch = aiResponse.match(/(?:最佳照片|推荐照片|选择照片).*?(?:索引|编号|序号).*?(\d+)/i);
        if (bestPhotoMatch) {
          const bestPhotoIndex = parseInt(bestPhotoMatch[1]);
          parsedResponse = {
            bestPhotoIndex: bestPhotoIndex,
            reason: aiResponse.substring(0, 500) // 取前500字符作为理由
          };
        } else {
          // 如果都失败了，默认选择第一张照片
          parsedResponse = {
            bestPhotoIndex: 0,
            reason: '无法解析AI响应，默认选择第一张照片'
          };
        }
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
      
      return result;
    } catch (error) {
      // 返回默认结果
      return {
        bestPhotoId: photos[0]?.id,
        reason: '解析AI响应时出错，默认选择第一张照片',
        tags: [],
        scores: photos.map(() => 1)
      };
    }
  }

  /**
   * 压缩图片以适应API限制
   * @param {string} imagePath - 图片路径
   * @returns {Promise<Buffer>} 压缩后的图片Buffer
   */
  async compressImage(imagePath) {
    try {
      const compressedImageBuffer = await sharp(imagePath)
        .resize(800, 600, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 80 })
        .toBuffer();
      
      return compressedImageBuffer;
    } catch (error) {
      throw new Error(`图片压缩失败: ${error.message}`);
    }
  }

  /**
   * 从Buffer压缩图片
   * @param {Buffer} imageBuffer - 图片Buffer
   * @returns {Promise<Buffer>} 压缩后的图片Buffer
   */
  async compressImageFromBuffer(imageBuffer) {
    try {
      const compressedImageBuffer = await sharp(imageBuffer)
        .resize(800, 600, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 80 })
        .toBuffer();
      
      return compressedImageBuffer;
    } catch (error) {
      throw new Error(`图片压缩失败: ${error.message}`);
    }
  }

  /**
   * 将图片转换为Base64编码
   * @param {Buffer} imageBuffer - 图片Buffer
   * @returns {string} Base64编码的图片
   */
  imageToBase64(imageBuffer) {
    return imageBuffer.toString('base64');
  }

  /**
   * 调用OpenAI Vision API分析照片
   * @param {Array} photos - 照片数组
   * @returns {Promise<Object>} 分析结果
   */
  async callOpenAIVision(photos) {
    console.log('🔍 开始调用OpenAI Vision API...');
    console.log('📊 照片数量:', photos.length);
    
    if (!this.openaiApiKey || this.openaiApiKey === 'your_openai_api_key_here') {
      console.error('❌ OpenAI API密钥未配置');
      throw new Error('OpenAI API密钥未配置，请在.env文件中设置OPENAI_API_KEY');
    }
    
    try {
      // 准备图片数据
      const content = [];
      
      // 添加系统提示
      content.push({
        type: 'text',
        text: `你是一个专业的摄影分析助手，擅长从多张照片中选出最佳的一张。请分析以下${photos.length}张照片，并选出最佳的一张。
        
评价维度包括：
1. 人像质量：面部表情、姿势自然度、五官清晰度
2. 技术质量：曝光、对焦、清晰度、色彩平衡
3. 构图：画面平衡、主体突出、背景处理
4. 美学效果：视觉吸引力、情感表达、艺术感

请选出最佳照片，并提供详细的选择理由，说明为什么这张照片在上述维度中表现最优。

请按以下JSON格式返回分析结果：
{
  "bestPhotoIndex": 最佳照片的索引(0开始),
  "reason": "详细说明选择这张照片的理由，包括具体的优势点（如表情自然、五官清晰、构图优美等）",
  "tags": ["标签1", "标签2", "标签3"],
  "scores": [照片1评分, 照片2评分, ...] (0-10之间的数值)
}

请确保返回的是有效的JSON格式。`
      });
      
      // 调试：检查photos数组
      console.log('🔍 检查photos数组:');
      photos.forEach((photo, index) => {
        console.log(`照片 ${index}:`, {
          id: photo.id,
          hasBuffer: !!photo.buffer,
          bufferLength: photo.buffer ? photo.buffer.length : 'undefined',
          originalname: photo.originalname,
          mimetype: photo.mimetype,
          size: photo.size
        });
      });

      // 添加每张照片
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        console.log(`🖼️ 处理照片 ${i+1}/${photos.length}: ${photo.originalname}`);
        
        // 压缩图片 - 直接使用buffer
        console.log(`🖼️ 压缩图片: ${photo.originalname}`);
        const compressedImage = await this.compressImageFromBuffer(photo.buffer);
        const base64Image = this.imageToBase64(compressedImage);
        
        content.push({
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`
          }
        });
        
        // 添加照片索引说明
        content.push({
          type: 'text',
          text: `照片 #${i} (索引: ${i})`
        });
      }
      
      // 构建API请求
      const payload = {
        model: this.openaiModel,
        messages: [
          {
            role: 'user',
            content: content
          }
        ],
        max_tokens: 1000
      };
      
      console.log('🚀 发送请求到OpenAI Vision API...');
      const response = await axios.post(`${this.openaiBaseUrl}/chat/completions`, payload, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });
      
      console.log('✅ OpenAI Vision API调用成功!');
      console.log('📊 响应状态:', response.status);
      console.log('💰 使用的tokens:', response.data.usage);
      
      const aiResponse = response.data.choices[0].message.content;
      console.log('🤖 AI响应:', aiResponse.substring(0, 300) + '...');
      
      // 直接返回AI响应，让调用方进行解析
      return aiResponse;
    } catch (error) {
      console.error('❌ OpenAI Vision API调用失败:', error.message);
      
      if (error.response) {
        console.error('📊 错误状态码:', error.response.status);
        console.error('📋 错误详情:', error.response.data);
      }
      
      if (error.response?.status === 401) {
        throw new Error('OpenAI API密钥无效');
      }
      
      throw new Error('AI分析服务暂时不可用: ' + error.message);
    }
  }

  /**
   * 调用通义千问VL API分析照片
   * @param {Array} photos - 照片数组
   * @returns {Promise<Object>} 分析结果
   */
  async callQwenVL(photos) {
    if (!this.qwenVlApiKey || this.qwenVlApiKey === 'your_dashscope_api_key_here') {
      throw new Error('通义千问VL API密钥未配置');
    }

    try {
      const content = [];
      
      // 添加每张照片
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        
        // 压缩图片 - 直接使用buffer
        const compressedImage = await this.compressImageFromBuffer(photo.buffer);
        const base64Image = this.imageToBase64(compressedImage);
        
        content.push({
          image: `data:image/jpeg;base64,${base64Image}`
        });
        
        // 添加照片索引说明
        content.push({
          text: `照片 #${i} (索引: ${i})`
        });
      }
      
      // 添加分析提示
      const prompt = `你是一个专业的摄影分析助手，擅长从多张照片中选出最佳的一张。请分析以上 ${photos.length} 张照片，并选出最佳的一张。

评价维度包括：
1.**人像**：
- 面部表情：自然、生动、有感染力
- 姿势自然度：是否放松、自然、符合场景
- 五官清晰度：面部特征是否清晰可见

2.**画质**：
- 曝光：亮度是否适中，细节是否丰富
- 对焦：主体是否清晰，焦点是否准确
- 清晰度：整体画面是否清晰，无明显模糊
- 色彩平衡：色彩是否自然、和谐

3.**构图**：
- 画面平衡：视觉重量分布是否均衡
- 主体突出：主体是否明确且引人注目
- 背景处理：背景是否简洁或与主体形成良好对比

4.**氛围**：
- 视觉冲击力：画面是否吸引人
- 情感表达：照片传达的情感、氛围
- 艺术感：创意性、独特性、美感

**重要：你必须严格按照以下JSON格式输出，不能有任何偏差！**

输出格式要求（严格执行）：
1. **只能输出JSON，绝对不能有其他文字！**
2. **reason字段必须严格按照以下三部分格式：**
   - 第一部分：必须以"我们综合评估了人像、画质、构图、氛围四个方面"开头
   - 第二部分：必须说明具体得分，格式为"这张照片以得分X.XX获胜"或"这张照片获得最高分X.XX分"
   - 第三部分：必须用朋友聊天式语气，结合具体维度说出打动人的点
3. **reason总长度≤60字（含标点）**
4. **bestPhotoIndex从0开始**
5. **scores数组必须包含每张照片的0-1分数**
6. **tags必须是3个精炼标签，每个≤5字**

**严格按照以下示例格式输出：**

示例1（2张照片）：
{
  "bestPhotoIndex": 0,
  "reason": "我们综合评估了人像、画质、构图、氛围四个方面，这张照片以得分0.87获胜，你笑得放松又自然。",
  "tags": ["笑容自然","眼神真诚","肤色柔和"],
  "scores": [0.87, 0.79]
}

示例2（3张照片）：
{
  "bestPhotoIndex": 1,
  "reason": "我们综合评估了人像、画质、构图、氛围四个方面，这张照片获得最高分0.89分，光线柔和衬托出你的肤色。",
  "tags": ["光线柔和","肤色自然","对焦清晰"],
  "scores": [0.85, 0.89, 0.82]
}

示例3（4张照片）：
{
  "bestPhotoIndex": 2,
  "reason": "我们综合评估了人像、画质、构图、氛围四个方面，这张照片综合0.88分最高，你的位置刚刚好。",
  "tags": ["主体突出","画面平衡","背景干净"],
  "scores": [0.81, 0.84, 0.88, 0.76]
}

**再次强调：**
- 绝对不能输出"我推荐这张"、"因为这张照片表现优秀"等空洞表述
- 必须严格按照示例格式
- reason必须包含"我们综合评估了人像、画质、构图、氛围四个方面"开头
- 必须包含具体分数说明
- 必须有具体的打动理由，不能用空话

现在请严格按照上述格式分析照片并输出JSON：`;

      content.push({
        text: prompt
      });

      const payload = {
        model: this.qwenVlModel,
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

      const response = await axios.post(this.qwenVlBaseUrl, payload, {
        headers: {
          'Authorization': `Bearer ${this.qwenVlApiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 120000, // 增加超时时间到2分钟
        maxBodyLength: 20 * 1024 * 1024, // 20MB
        maxContentLength: 20 * 1024 * 1024 // 20MB
      });

      let aiResponse = response.data.output.choices[0].message.content;
      
      // 如果响应是数组，提取第一个元素的text内容
      if (Array.isArray(aiResponse) && aiResponse.length > 0 && aiResponse[0].text) {
        aiResponse = aiResponse[0].text;
      }
      
      // 添加调试日志输出AI原始响应
      console.log('🤖 AI原始响应:', aiResponse);
      
      // 直接返回AI响应，让调用方进行解析
      return aiResponse;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 400) {
          // 处理400错误的详细信息
          const errorData = error.response.data;
          if (errorData && errorData.message) {
            throw new Error(`API请求错误: ${errorData.message}`);
          }
        }
        
        if (error.response.status === 401) {
          throw new Error('API密钥无效或已过期');
        }
        
        if (error.response.status === 429) {
          throw new Error('API调用频率超限，请稍后重试');
        }
        
        throw new Error(`API调用失败: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('API调用超时，请检查网络连接');
      } else {
        console.error('❌ 通义千问VL API调用失败:', error.message);
        throw new Error(`AI分析服务暂时不可用: ${error.message}`);
      }
    }
  }

  /**
   * 分析照片并选出最佳照片
   * @param {Object} options - 分析选项
   * @param {string} options.sessionId - 会话ID
   * @param {Array} options.files - 文件数组
   * @returns {Promise<Object>} 分析结果
   */
  async analyzePhotos({ sessionId, files }) {
    console.log('🎯 开始AI照片分析...');
    
    if (!files || files.length === 0) {
      throw new Error('没有提供照片文件');
    }

    if (files.length < 2) {
      throw new Error('至少需要2张照片才能进行比较分析');
    }

    try {
      // 准备照片数据 - 保持buffer和base64数据
      const photos = await Promise.all(files.map(async (file, index) => {
        let imageBuffer;
        
        if (file.buffer) {
          imageBuffer = file.buffer;
        } else if (file.path) {
          imageBuffer = fs.readFileSync(file.path);
        } else {
          throw new Error(`文件 ${index + 1} 缺少有效的数据源`);
        }

        // 压缩图片以减少API调用成本
        const compressedBuffer = await this.compressImageFromBuffer(imageBuffer);
        const base64 = this.imageToBase64(compressedBuffer);

        return {
          id: file.metadata?.id || file.metadata?.fileKey || `photo_${index + 1}`,
          buffer: compressedBuffer, // 保持buffer用于OpenAI Vision
          base64, // 保持base64用于通义千问VL
          originalname: file.originalname || `photo_${index + 1}.jpg`,
          mimetype: file.mimetype || 'image/jpeg',
          size: compressedBuffer.length,
          metadata: file.metadata || {}
        };
      }));

      console.log(`📸 准备分析 ${photos.length} 张照片`);

      let result;
      
      // 只使用通义千问VL
      if (this.qwenVlApiKey && this.qwenVlApiKey !== 'your_dashscope_api_key_here') {
        console.log('🤖 使用通义千问VL进行分析...');
        result = await this.callQwenVL(photos);
      } else {
        throw new Error('未配置有效的通义千问VL API密钥');
      }

      // 解析AI响应
      const analysisResult = this.parseAIResponse(result, photos);
      
      // 添加会话信息
      analysisResult.sessionId = sessionId;
      analysisResult.timestamp = new Date().toISOString();
      analysisResult.totalPhotos = photos.length;

      console.log('✅ AI分析完成');
      return analysisResult;

    } catch (error) {
      console.error('❌ AI照片分析失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取分析历史记录
   * @param {string} sessionId - 会话ID
   * @returns {Promise<Object>} 历史记录
   */
  async getAnalysisHistory(sessionId) {
    console.log('📚 获取分析历史记录:', sessionId);
    
    // 这里可以实现数据库查询逻辑
    // 目前返回空结果
    return {
      sessionId,
      history: [],
      total: 0
    };
  }
}

module.exports = new AIService();