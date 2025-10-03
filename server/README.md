# 选照片小程序 - Vercel Serverless Functions 后端

这是一个基于 Vercel Serverless Functions 的后端服务，为选照片小程序提供文件上传和AI照片选择功能。

## 🚀 部署到 Vercel

### 1. 环境变量配置

在 Vercel 项目中设置以下环境变量：

```bash
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
```

**获取 Vercel Blob Token：**
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入你的项目设置
3. 点击 "Storage" 标签
4. 创建或选择一个 Blob Store
5. 生成 Read/Write Token
6. 复制 Token 并设置为环境变量

### 2. 部署步骤

```bash
# 1. 安装 Vercel CLI（如果还没有安装）
npm install -g vercel

# 2. 在 server 目录下登录 Vercel
cd server
vercel login

# 3. 部署到生产环境
vercel --prod
```

### 3. 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 设置本地环境变量
# 创建 .env 文件并添加：
# BLOB_READ_WRITE_TOKEN=your_token_here

# 3. 启动本地开发服务器
vercel dev
```

## 📡 API 接口

### POST /api/upload

上传图片文件到 Vercel Blob 存储。

**请求格式：**
- Content-Type: `multipart/form-data`
- 字段名: `file`
- 支持的文件类型: 图片文件 (image/*)

**响应格式：**
```json
{
  "id": "uuid-string",
  "originalUrl": "https://blob-url/image.jpg",
  "previewUrl": "https://blob-url/image.jpg",
  "thumbUrl": "https://blob-url/image.jpg"
}
```

**示例：**
```javascript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

### POST /api/ai/pick

AI 照片选择分析（当前为 Mock 实现）。

**请求格式：**
```json
{
  "photos": [
    {
      "id": "photo-id-1",
      "previewUrl": "https://example.com/photo1.jpg"
    },
    {
      "id": "photo-id-2", 
      "previewUrl": "https://example.com/photo2.jpg"
    }
  ]
}
```

**响应格式：**
```json
{
  "bestId": "photo-id-1",
  "scores": {
    "portrait": 85,
    "quality": 92,
    "composition": 78,
    "mood": 88,
    "overall": 86
  },
  "reason": "这张照片的人物表情自然，光线柔和，构图平衡，整体氛围温馨。"
}
```

## 🏗️ 项目结构

```
server/
├── api/
│   ├── upload.js          # 文件上传 API
│   └── ai/
│       └── pick.js        # AI 照片选择 API
├── package.json           # 项目依赖
├── vercel.json           # Vercel 配置
└── README.md             # 项目文档
```

## 🔧 技术栈

- **运行时**: Node.js 18.x (Serverless Functions)
- **文件存储**: Vercel Blob
- **文件解析**: Busboy
- **部署平台**: Vercel

## ⚠️ 重要说明

1. **运行时类型**: 使用 Node.js Serverless Functions（非 Edge Runtime）
2. **存储限制**: 不能写入本地磁盘，所有文件存储使用 Vercel Blob
3. **CORS 支持**: 所有 API 都已配置 CORS 头，支持跨域访问
4. **文件访问**: 上传的文件设置为 `public` 访问权限
5. **Mock 数据**: AI 分析当前使用 Mock 数据，后续可替换为真实 AI 服务

## 🔄 后续优化

- [ ] 集成真实的 AI 图像分析服务
- [ ] 添加图片压缩和多尺寸生成
- [ ] 实现更详细的错误处理和日志记录
- [ ] 添加请求频率限制和安全验证