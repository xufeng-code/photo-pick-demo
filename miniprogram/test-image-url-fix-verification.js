#!/usr/bin/env node

/**
 * 图片URL修复验证测试
 * 验证后端生成的完整URL是否能正常访问
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000';

async function testImageUrlFix() {
  console.log('🧪 开始图片URL修复验证测试...\n');

  try {
    // 1. 检查服务器健康状态
    console.log('1️⃣ 检查服务器状态...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ 服务器运行正常\n');

    // 2. 上传测试图片
    console.log('2️⃣ 上传测试图片...');
    const testImagePath = path.join(__dirname, 'assets', 'test', '1.jpg');
    
    if (!fs.existsSync(testImagePath)) {
      throw new Error(`测试图片不存在: ${testImagePath}`);
    }

    const FormData = require('form-data');
    const form = new FormData();
    form.append('photos', fs.createReadStream(testImagePath));

    const uploadResponse = await axios.post(`${API_BASE}/upload`, form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 30000
    });

    if (!uploadResponse.data.success || !uploadResponse.data.files || uploadResponse.data.files.length === 0) {
      throw new Error('上传失败或返回数据格式错误');
    }

    const uploadedFile = uploadResponse.data.files[0];
    console.log('✅ 图片上传成功');
    console.log('📁 文件信息:', {
      fileKey: uploadedFile.fileKey,
      originalName: uploadedFile.originalName,
      size: uploadedFile.size
    });

    // 3. 验证后端返回的URL格式
    console.log('\n3️⃣ 验证后端返回的URL格式...');
    const urls = uploadedFile.urls;
    console.log('📋 返回的URLs:');
    console.log('- original:', urls.original);
    console.log('- preview:', urls.preview);
    console.log('- thumb:', urls.thumb);

    // 检查URL格式
    const urlChecks = [
      { name: 'original', url: urls.original },
      { name: 'preview', url: urls.preview },
      { name: 'thumb', url: urls.thumb }
    ];

    for (const check of urlChecks) {
      if (!check.url || typeof check.url !== 'string') {
        throw new Error(`${check.name} URL格式错误: ${check.url}`);
      }
      
      if (!check.url.startsWith('https://')) {
        console.warn(`⚠️ ${check.name} URL不是HTTPS: ${check.url}`);
      }
      
      if (!check.url.includes('/files/')) {
        throw new Error(`${check.name} URL路径格式错误: ${check.url}`);
      }
      
      console.log(`✅ ${check.name} URL格式正确`);
    }

    // 4. 测试直接访问URL（缩略图应该可以直接访问）
    console.log('\n4️⃣ 测试直接访问缩略图URL...');
    try {
      const thumbResponse = await axios.head(urls.thumb, { timeout: 10000 });
      console.log('✅ 缩略图直接访问成功');
      console.log('📊 响应状态:', thumbResponse.status);
      console.log('📏 内容长度:', thumbResponse.headers['content-length']);
      console.log('📄 内容类型:', thumbResponse.headers['content-type']);
    } catch (error) {
      console.error('❌ 缩略图直接访问失败:', error.message);
      if (error.response) {
        console.error('📊 响应状态:', error.response.status);
        console.error('📄 响应头:', error.response.headers);
      }
    }

    // 5. 测试获取签名URL
    console.log('\n5️⃣ 测试获取签名URL...');
    const signedUrlResponse = await axios.post(`${API_BASE}/upload/signed-url`, {
      fileKey: uploadedFile.fileKey,
      type: 'preview',
      expiryMinutes: 30
    });

    if (!signedUrlResponse.data.success || !signedUrlResponse.data.url) {
      throw new Error('获取签名URL失败');
    }

    const signedUrl = signedUrlResponse.data.url;
    console.log('✅ 签名URL获取成功');
    console.log('🔗 签名URL:', signedUrl.substring(0, 80) + '...');

    // 6. 测试签名URL访问
    console.log('\n6️⃣ 测试签名URL访问...');
    try {
      const signedResponse = await axios.head(signedUrl, { timeout: 10000 });
      console.log('✅ 签名URL访问成功');
      console.log('📊 响应状态:', signedResponse.status);
      console.log('📏 内容长度:', signedResponse.headers['content-length']);
      console.log('📄 内容类型:', signedResponse.headers['content-type']);
    } catch (error) {
      console.error('❌ 签名URL访问失败:', error.message);
      if (error.response) {
        console.error('📊 响应状态:', error.response.status);
        console.error('📄 响应头:', error.response.headers);
      }
    }

    // 7. 模拟前端使用场景
    console.log('\n7️⃣ 模拟前端使用场景...');
    
    // 模拟推荐页面的逻辑
    const bestPhoto = {
      fileKey: uploadedFile.fileKey,
      urls: uploadedFile.urls
    };

    let imageUrl = null;
    
    // 使用修复后的逻辑：直接使用后端返回的URL
    if (bestPhoto.urls && bestPhoto.urls.preview) {
      console.log('📸 使用preview URL:', bestPhoto.urls.preview);
      imageUrl = bestPhoto.urls.preview;
    } else if (bestPhoto.urls && bestPhoto.urls.thumb) {
      console.log('📸 fallback到thumb URL:', bestPhoto.urls.thumb);
      imageUrl = bestPhoto.urls.thumb;
    }

    if (imageUrl) {
      console.log('✅ 前端逻辑：成功获取图片URL');
      console.log('🖼️ 最终图片URL:', imageUrl);
      
      // 验证URL是否可访问
      try {
        const finalResponse = await axios.head(imageUrl, { timeout: 10000 });
        console.log('✅ 最终URL访问成功');
      } catch (error) {
        console.error('❌ 最终URL访问失败:', error.message);
      }
    } else {
      console.error('❌ 前端逻辑：无法获取图片URL');
    }

    console.log('\n🎉 图片URL修复验证测试完成！');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.response) {
      console.error('📊 响应状态:', error.response.status);
      console.error('📄 响应数据:', error.response.data);
    }
    process.exit(1);
  }
}

// 运行测试
testImageUrlFix().catch(console.error);