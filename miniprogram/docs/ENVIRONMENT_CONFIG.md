# 环境配置说明

本项目支持多环境配置，可以根据不同的部署环境自动切换 API 基础 URL。

## 环境类型

### 1. 开发环境 (development)
- **BASE_URL**: `http://localhost:3000`
- **使用场景**: 本地开发调试
- **特点**: 使用本地服务器，支持热重载

### 2. 测试环境 (staging)
- **BASE_URL**: `https://your-ngrok-domain.ngrok.io`
- **使用场景**: 真机测试、内部测试
- **特点**: 使用 ngrok 等工具暴露的 HTTPS 域名

### 3. 生产环境 (production)
- **BASE_URL**: `https://your-production-domain.com`
- **使用场景**: 正式发布
- **特点**: 使用正式的 HTTPS 域名

## 环境自动识别

小程序会根据运行环境自动选择配置：

```javascript
// 在微信开发者工具中
const accountInfo = wx.getAccountInfoSync();
if (accountInfo.miniProgram.envVersion === 'develop') {
  // 开发环境
} else if (accountInfo.miniProgram.envVersion === 'trial') {
  // 体验版 -> staging 环境
} else {
  // 正式版 -> production 环境
}
```

## 配置管理

### 使用配置管理脚本

```bash
# 显示当前配置
node scripts/config-env.js show

# 设置 staging 环境的 ngrok 域名
node scripts/config-env.js staging https://abc123.ngrok.io

# 设置生产环境域名
node scripts/config-env.js prod https://api.yourapp.com

# 手动设置任意环境
node scripts/config-env.js set development http://192.168.1.100:3000
```

### 手动修改配置

编辑 `utils/config.js` 文件中的 `ENV_CONFIG` 对象：

```javascript
const ENV_CONFIG = {
  development: {
    BASE_URL: 'http://localhost:3000',
    DEBUG: true
  },
  staging: {
    BASE_URL: 'https://your-ngrok-domain.ngrok.io',
    DEBUG: true
  },
  production: {
    BASE_URL: 'https://your-production-domain.com',
    DEBUG: false
  }
};
```

## 测试流程

### 1. 本地开发测试
```bash
# 启动本地服务器
cd server
npm start

# 在微信开发者工具中打开小程序
# 自动使用 development 配置
```

### 2. 真机测试
```bash
# 使用 ngrok 暴露本地服务器
ngrok http 3000

# 更新 staging 配置
node scripts/config-env.js staging https://abc123.ngrok.io

# 上传体验版到微信小程序后台
# 自动使用 staging 配置
```

### 3. 生产发布
```bash
# 更新生产环境配置
node scripts/config-env.js prod https://api.yourapp.com

# 发布正式版
# 自动使用 production 配置
```

## 微信小程序后台配置

### 服务器域名配置

在微信小程序后台 -> 开发 -> 开发设置 -> 服务器域名中配置：

**request 合法域名**:
- 测试环境: `https://your-ngrok-domain.ngrok.io`
- 生产环境: `https://your-production-domain.com`

**uploadFile 合法域名**:
- 测试环境: `https://your-ngrok-domain.ngrok.io`
- 生产环境: `https://your-production-domain.com`

**downloadFile 合法域名**:
- 测试环境: `https://your-ngrok-domain.ngrok.io`
- 生产环境: `https://your-production-domain.com`

### 注意事项

1. **HTTPS 要求**: 微信小程序要求所有网络请求必须使用 HTTPS
2. **域名备案**: 生产环境域名需要完成 ICP 备案
3. **SSL 证书**: 确保 HTTPS 证书有效且未过期
4. **ngrok 限制**: ngrok 免费版域名会定期变化，需要及时更新配置

## 故障排除

### 常见问题

1. **网络请求失败**
   - 检查域名是否在微信小程序后台配置
   - 确认服务器是否正常运行
   - 验证 HTTPS 证书是否有效

2. **环境配置不生效**
   - 确认小程序版本类型（开发版/体验版/正式版）
   - 检查 `utils/config.js` 中的配置是否正确
   - 重新编译小程序

3. **ngrok 域名失效**
   - 重新启动 ngrok
   - 更新 staging 环境配置
   - 重新上传体验版

### 调试方法

```javascript
// 在小程序中查看当前配置
const { CURRENT_ENV, CURRENT_CONFIG } = require('./utils/config');
console.log('当前环境:', CURRENT_ENV);
console.log('当前配置:', CURRENT_CONFIG);
```

## 最佳实践

1. **开发阶段**: 使用 development 配置进行本地开发
2. **测试阶段**: 使用 ngrok + staging 配置进行真机测试
3. **发布前**: 确保 production 配置指向正确的生产服务器
4. **版本管理**: 不要将敏感的生产环境配置提交到版本控制系统
5. **监控**: 在生产环境中添加适当的日志和监控