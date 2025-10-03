# 小程序合法域名配置说明

## 概述
为了让小程序能够正常访问通过ngrok或localtunnel暴露的HTTPS服务，需要在微信小程序开发者工具中配置合法域名。

## 当前配置
根据 `.env` 文件中的配置：
- PUBLIC_BASE: `https://smart-cloths-attack.loca.lt`
- BASE_URL: `https://smart-cloths-attack.loca.lt`

## 配置步骤

### 1. 在微信小程序开发者工具中配置

#### 方法一：开发环境配置（推荐）
1. 打开微信小程序开发者工具
2. 点击右上角的"详情"按钮
3. 在"本地设置"选项卡中：
   - 勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"
   - 这样可以在开发环境中访问任何域名

#### 方法二：正式配置合法域名
1. 登录微信公众平台 (mp.weixin.qq.com)
2. 进入小程序管理后台
3. 选择"开发" -> "开发管理" -> "开发设置"
4. 在"服务器域名"部分添加以下域名：
   - **request合法域名**: `https://smart-cloths-attack.loca.lt`
   - **uploadFile合法域名**: `https://smart-cloths-attack.loca.lt`
   - **downloadFile合法域名**: `https://smart-cloths-attack.loca.lt`

### 2. 更新域名时的操作

当ngrok或localtunnel重新启动时，域名可能会发生变化，需要：

1. 更新 `server/.env` 文件中的 `PUBLIC_BASE` 和 `BASE_URL`
2. 重启后端服务器
3. 如果使用正式域名配置，需要在微信公众平台更新域名

### 3. 验证配置

配置完成后，可以通过以下方式验证：

1. 在小程序中上传照片
2. 检查返回的图片URL是否为绝对HTTPS地址
3. 确认图片能够正常显示

## 技术实现

### 后端URL生成
- 使用 `utils/publicUrl.js` 中的 `generateFileUrl` 函数
- 自动根据 `PUBLIC_BASE` 环境变量生成绝对HTTPS URL
- 格式：`https://smart-cloths-attack.loca.lt/files/{type}/{filename}`

### 前端URL使用
- 推荐页面：直接使用 `bestPhoto.urls.preview`
- 比较页面：使用 `photo.path`（来自urls.preview）
- 相册页面：使用 `photo.path`（来自urls.preview）

## 注意事项

1. **域名变化**：ngrok和localtunnel的免费版本每次重启都会生成新的域名
2. **HTTPS要求**：小程序只能访问HTTPS域名，不能访问HTTP
3. **开发调试**：建议在开发时使用"不校验合法域名"选项
4. **生产部署**：正式发布时需要使用固定的HTTPS域名

## 故障排除

### 图片无法显示
1. 检查 `.env` 文件中的 `PUBLIC_BASE` 配置
2. 确认ngrok/localtunnel正在运行
3. 验证小程序开发者工具的域名校验设置
4. 检查网络连接和防火墙设置

### 域名访问被拒绝
1. 确认域名已添加到小程序合法域名列表
2. 检查域名格式是否正确（必须包含https://）
3. 验证SSL证书是否有效