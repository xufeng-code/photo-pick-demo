# 选照片小程序后端服务

## 功能特性

- 🤖 AI照片分析 (通义千问VL)
- 📤 分享功能 (创建、点赞、评论、同步)
- 🖼️ 图片处理 (EXIF矫正、缩略图生成)
- 🔐 签名URL访问控制
- 💾 SQLite数据库存储
- 🚀 Express.js框架

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

复制 `.env` 文件并配置：

```bash
# 必需配置
QWEN_VL_API_KEY=your_dashscope_api_key_here

# 可选配置
PORT=3000
SIGNED_URL_SECRET=your-secret-key
AI_PROVIDER=qwen-vl
```

### 3. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务启动后访问：http://localhost:3000

## API接口

### AI分析接口

#### POST /ai/pick
分析多张照片，选出最佳照片

**请求参数：**
- `sessionId`: 会话ID
- `photos`: 图片文件数组 (multipart/form-data)

**响应示例：**
```json
{
  "success": true,
  "data": {
    "analysisId": "uuid",
    "sessionId": "session_123",
    "photos": [...],
    "bestPhotoId": "photo_uuid",
    "reason": "这张照片构图最佳...",
    "tags": ["构图佳", "光线好"],
    "scores": { "photo_1": 95, "photo_2": 82 }
  }
}
```

### 分享功能接口

#### POST /share/create
创建分享

**请求参数：**
- `sessionId`: 会话ID
- `bestPhotoId`: 最佳照片ID (可选)
- `photos`: 图片文件数组

#### POST /share/like
点赞/取消点赞

**请求参数：**
```json
{
  "shareId": "share_uuid",
  "photoId": "photo_uuid",
  "userId": "user_123"
}
```

#### POST /share/comment
添加评论

**请求参数：**
```json
{
  "shareId": "share_uuid",
  "photoId": "photo_uuid",
  "author": "用户名",
  "content": "评论内容"
}
```

#### GET /share/sync/:shareId
同步分享数据

#### GET /share/:shareId
获取分享详情

## 图片存储

### 目录结构
```
uploads/
├── original/     # 原图 (签名URL访问)
├── preview/      # 预览图 2048px (签名URL访问)
└── thumb/        # 缩略图 1024px (公开访问)
```

### 访问方式
- **缩略图**: `/files/thumb/filename.jpg` (公开)
- **预览图**: `/files/preview/filename.jpg?token=xxx&expires=xxx` (签名)
- **原图**: `/files/original/filename.jpg?token=xxx&expires=xxx` (签名)

## 数据库表结构

### photos 表
存储图片文件信息
- `id`: 照片ID
- `file_key`: 文件唯一标识
- `original_name`: 原始文件名
- `size`: 文件大小
- `width/height`: 图片尺寸
- `*_path`: 各版本文件路径

### shares 表
存储分享信息
- `id`: 分享ID
- `session_id`: 会话ID
- `photos_data`: 照片数据JSON
- `best_photo_id`: 最佳照片ID

### likes 表
存储点赞记录

### comments 表
存储评论数据

### ai_analyses 表
存储AI分析结果

## 开发说明

### 图片处理
- 自动EXIF方向矫正
- 去除EXIF隐私信息
- 生成多尺寸版本
- 支持JPEG/PNG/WebP格式

### 安全特性
- 文件类型验证
- 文件大小限制
- 请求频率限制
- 签名URL访问控制

### AI服务
- 支持通义千问VL (阿里云DashScope)
- 预留OpenAI、Claude等API接口
- 降级处理机制
- 详细的分析提示词

## 部署建议

### 本地开发
- 使用SQLite数据库
- 文件存储在本地uploads目录
- 签名URL模拟访问控制

### 生产环境
- 配置对象存储 (S3/R2/COS)
- 使用真实签名URL机制
- 配置CDN加速
- 设置环境变量

## 故障排除

### 常见问题

1. **AI分析失败**
   - 检查通义千问VL API密钥 (QWEN_VL_API_KEY)
   - 确认网络连接
   - 查看错误日志

2. **图片上传失败**
   - 检查文件大小限制
   - 确认文件格式支持
   - 检查uploads目录权限

3. **签名URL无效**
   - 检查SIGNED_URL_SECRET配置
   - 确认URL未过期
   - 验证文件路径正确

### 日志查看
```bash
# 查看服务日志
npm run dev

# 检查数据库
sqlite3 database/app.db
.tables
.schema photos
```

## 技术栈

- **框架**: Express.js
- **数据库**: SQLite3
- **图片处理**: Sharp
- **AI服务**: 通义千问VL (阿里云DashScope)
- **文件上传**: Multer
- **安全**: Helmet, CORS, Rate Limiting