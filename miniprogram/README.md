# 选照片 AI

一个基于 AI 的智能照片选择工具，支持 H5 网页版和微信小程序。

## 功能特性

- 🤖 AI 智能照片分析和推荐
- 📱 微信小程序支持
- 🌐 H5 网页版
- 📸 照片上传和管理
- 🔗 照片分享功能

## 技术栈

- **前端**: 微信小程序 + H5
- **后端**: Node.js + Express
- **部署**: Vercel
- **AI**: 智能照片分析服务

## 快速开始

### 本地开发

1. 克隆项目
```bash
git clone https://github.com/yourusername/xuanzhaopian.git
cd xuanzhaopian
```

2. 安装依赖
```bash
npm install
cd server && npm install
```

3. 启动开发服务器
```bash
npm run dev
```

### 部署

项目已配置 Vercel 自动部署，推送到 main 分支即可自动部署。

## API 接口

- `GET /api/ping` - 健康检查
- `POST /api/upload` - 照片上传
- `POST /api/ai` - AI 分析
- `GET /api/share/:id` - 照片分享

## 许可证

MIT License