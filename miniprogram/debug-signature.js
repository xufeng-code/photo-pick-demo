const crypto = require('crypto');

// 设置环境变量
process.env.SIGNED_URL_SECRET = 'your-secret-key-change-in-production-please';

function testSignature() {
    const filePath = 'preview/0077fecc-4b22-4f36-b78a-9856d72156df.jpg';
    const expires = 1758993776547;
    const secret = process.env.SIGNED_URL_SECRET;
    
    console.log('🔍 调试签名算法:');
    console.log('- 文件路径:', filePath);
    console.log('- 过期时间:', expires);
    console.log('- 密钥:', secret);
    
    // 生成payload
    const payload = `${filePath}:${expires}`;
    console.log('- Payload:', payload);
    
    // 生成签名
    const token = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    console.log('- 生成的签名:', token);
    console.log('- 服务器期望:', '662b755e1f0ce50cc8c5965cd32b5e9b46805fae99e81b2d041af44588e092dd');
    console.log('- 签名匹配:', token === '662b755e1f0ce50cc8c5965cd32b5e9b46805fae99e81b2d041af44588e092dd');
    
    // 测试新的时间戳
    console.log('\n🆕 生成新的签名:');
    const newExpires = Date.now() + 3600000;
    const newPayload = `${filePath}:${newExpires}`;
    const newToken = crypto.createHmac('sha256', secret).update(newPayload).digest('hex');
    
    console.log('- 新过期时间:', newExpires);
    console.log('- 新Payload:', newPayload);
    console.log('- 新签名:', newToken);
    console.log('- 完整URL:', `http://localhost:3000/files/preview/0077fecc-4b22-4f36-b78a-9856d72156df.jpg?token=${newToken}&expires=${newExpires}`);
}

testSignature();