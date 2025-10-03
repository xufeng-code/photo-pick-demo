const crypto = require('crypto');

class SignedUrlGenerator {
  constructor() {
    this.secret = process.env.SIGNED_URL_SECRET || 'your-secret-key-change-in-production';
    this.defaultExpiry = 30 * 60 * 1000; // 30分钟
  }

  // 生成签名URL
  generateSignedUrl(filePath, expiryMinutes = 30) {
    const expiry = Date.now() + (expiryMinutes * 60 * 1000);
    const payload = `${filePath}:${expiry}`;
    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');
    
    return {
      url: `/files/${filePath}?token=${signature}&expires=${expiry}`,
      expires: new Date(expiry).toISOString()
    };
  }

  // 验证签名URL
  verifySignedUrl(filePath, token, expires) {
    try {
      console.log('🔍 详细签名验证过程:');
      console.log('- 输入文件路径:', filePath);
      console.log('- 输入Token:', token);
      console.log('- 输入Expires:', expires);
      console.log('- Secret:', this.secret);
      
      // 检查是否过期
      const expiryTime = parseInt(expires);
      console.log('- 解析过期时间:', expiryTime);
      console.log('- 当前时间:', Date.now());
      console.log('- 是否过期:', Date.now() > expiryTime);
      
      if (Date.now() > expiryTime) {
        return { valid: false, error: 'URL已过期' };
      }

      // 验证签名
      const payload = `${filePath}:${expiryTime}`;
      console.log('- 验证Payload:', payload);
      
      const expectedSignature = crypto
        .createHmac('sha256', this.secret)
        .update(payload)
        .digest('hex');
      
      console.log('- 期望签名:', expectedSignature);
      console.log('- 实际签名:', token);
      console.log('- 签名匹配:', token === expectedSignature);

      if (token !== expectedSignature) {
        return { valid: false, error: '签名无效' };
      }

      return { valid: true };
    } catch (error) {
      console.log('❌ 验证异常:', error);
      return { valid: false, error: '验证失败' };
    }
  }

  // 中间件：验证签名URL
  verifyMiddleware() {
    return (req, res, next) => {
      const { token, expires } = req.query;
      // 从请求URL中提取文件路径
      // 注意：Express已经去掉了/files前缀，所以req.path是 /preview/xxx.jpg 或 /thumb/xxx.jpg
      const fullPath = req.path; // 例如: /preview/xxx.jpg
      const filePath = fullPath.startsWith('/') ? fullPath.substring(1) : fullPath;

      console.log('🔐 签名验证中间件:');
      console.log('- 请求路径:', req.path);
      console.log('- 文件路径:', filePath);
      console.log('- Token:', token ? token.substring(0, 20) + '...' : 'undefined');
      console.log('- Expires:', expires);

      // 缩略图不需要签名验证（公开访问）
      if (filePath && filePath.startsWith('thumb/')) {
        console.log('✅ Thumb文件，跳过签名验证');
        return next();
      }

      // 原图和预览图需要签名验证
      if (!token || !expires) {
        console.log('❌ 缺少token或expires参数');
        return res.status(401).json({ 
          error: '访问被拒绝',
          message: '需要有效的访问令牌'
        });
      }

      const verification = this.verifySignedUrl(filePath, token, expires);
      console.log('🔍 签名验证结果:', verification);
      
      if (!verification.valid) {
        console.log('❌ 签名验证失败:', verification.error);
        return res.status(401).json({ 
          error: '访问被拒绝',
          message: verification.error
        });
      }

      console.log('✅ 签名验证成功');
      next();
    };
  }
}

module.exports = new SignedUrlGenerator();