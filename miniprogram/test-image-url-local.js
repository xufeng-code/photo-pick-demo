#!/usr/bin/env node

/**
 * 本地图片URL测试
 * 使用localhost地址测试图片访问
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000';

async function testLocalImageUrl() {
  console.log('🧪 开始本地图片URL测试...\n');

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

    // 4. 将HTTPS URL转换为本地HTTP URL进行测试
    console.log('\n4️⃣ 转换为本地URL进行测试...');
    const localUrls = {
      original: urls.original.replace('https://smart-cloths-attack.loca.lt', 'http://localhost:3000'),
      preview: urls.preview.replace('https://smart-cloths-attack.loca.lt', 'http://localhost:3000'),
      thumb: urls.thumb.replace('https://smart-cloths-attack.loca.lt', 'http://localhost:3000')
    };

    console.log('📋 本地URLs:');
    console.log('- original:', localUrls.original);
    console.log('- preview:', localUrls.preview);
    console.log('- thumb:', localUrls.thumb);

    // 5. 测试直接访问缩略图URL
    console.log('\n5️⃣ 测试直接访问缩略图URL...');
    try {
      const thumbResponse = await axios.head(localUrls.thumb, { timeout: 10000 });
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

    // 6. 测试获取签名URL
    console.log('\n6️⃣ 测试获取签名URL...');
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

    // 转换为本地URL
    const localSignedUrl = signedUrl.replace('https://smart-cloths-attack.loca.lt', 'http://localhost:3000');
    console.log('🔗 本地签名URL:', localSignedUrl.substring(0, 80) + '...');

    // 7. 测试签名URL访问
    console.log('\n7️⃣ 测试签名URL访问...');
    try {
      const signedResponse = await axios.head(localSignedUrl, { timeout: 10000 });
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

    // 8. 检查实际文件是否存在
    console.log('\n8️⃣ 检查实际文件是否存在...');
    const serverRoot = path.join(__dirname, 'server', 'uploads');
    const fileChecks = [
      { name: 'original', path: path.join(serverRoot, 'original', `${uploadedFile.fileKey}.jpg`) },
      { name: 'preview', path: path.join(serverRoot, 'preview', `${uploadedFile.fileKey}.jpg`) },
      { name: 'thumb', path: path.join(serverRoot, 'thumb', `${uploadedFile.fileKey}.jpg`) }
    ];

    for (const check of fileChecks) {
      if (fs.existsSync(check.path)) {
        const stats = fs.statSync(check.path);
        console.log(`✅ ${check.name} 文件存在: ${check.path} (${stats.size} bytes)`);
      } else {
        console.error(`❌ ${check.name} 文件不存在: ${check.path}`);
      }
    }

    console.log('\n🎉 本地图片URL测试完成！');

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
testLocalImageUrl().catch(console.error);