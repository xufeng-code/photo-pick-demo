# 部署指南

## 本地开发环境

### 1. 环境要求
- Node.js 16+ 
- npm 或 yarn
- Windows/macOS/Linux

### 2. 快速启动
```bash
# 方式1: 使用启动脚本 (Windows)
./start.bat

# 方式2: 手动启动
npm install
npm run dev
```

### 3. 验证部署
- 访问: http://localhost:3000/health
- 测试页面: http://localhost:3000/test/test.html
- API文档: 查看 README.md

## 生产环境部署

### 1. 服务器配置

#### 基础要求
- Node.js 18+ LTS
- 2GB+ RAM
- 10GB+ 存储空间
- 稳定网络连接

#### 推荐配置
- 4GB+ RAM (AI分析需要更多内存)
- SSD存储 (图片处理性能)
- CDN (图片访问加速)

### 2. 环境变量配置

创建生产环境 `.env` 文件:

```bash
# 服务配置
NODE_ENV=production
PORT=3000

# 数据库
DATABASE_PATH=./database/production.db

# AI服务 (必需)
QWEN_VL_API_KEY=your_production_dashscope_key
AI_PROVIDER=qwen-vl

# 安全配置
SIGNED_URL_SECRET=your_very_secure_secret_key_here
BASE_URL=https://your-domain.com

# 文件上传限制
MAX_FILE_SIZE=10485760
MAX_FILES_COUNT=10

# 跨域配置
CORS_ORIGIN=https://your-frontend-domain.com

# 日志
LOG_LEVEL=warn
```

### 3. 对象存储配置 (推荐)

#### Cloudflare R2
```bash
# 添加到 .env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-bucket.r2.dev
```

#### AWS S3
```bash
# 添加到 .env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your_bucket_name
```

### 4. 部署方式

#### 方式1: PM2 (推荐)
```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启应用
pm2 restart all
```

#### 方式2: Docker
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN mkdir -p uploads/original uploads/preview uploads/thumb
RUN mkdir -p database

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# 构建和运行
docker build -t photo-picker-backend .
docker run -d -p 3000:3000 --name photo-backend photo-picker-backend
```

#### 方式3: 系统服务 (Linux)
```bash
# 创建服务文件
sudo nano /etc/systemd/system/photo-picker.service
```

```ini
[Unit]
Description=Photo Picker Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/photo-picker-backend
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# 启用服务
sudo systemctl enable photo-picker
sudo systemctl start photo-picker
sudo systemctl status photo-picker
```

### 5. 反向代理配置

#### Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL配置
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 文件上传大小限制
    client_max_body_size 50M;

    # API代理
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件缓存
    location /files/ {
        proxy_pass http://localhost:3000/files/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6. 监控和日志

#### 健康检查
```bash
# 添加到crontab
*/5 * * * * curl -f http://localhost:3000/health || systemctl restart photo-picker
```

#### 日志轮转
```bash
# /etc/logrotate.d/photo-picker
/var/log/photo-picker/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload photo-picker
    endscript
}
```

### 7. 安全配置

#### 防火墙
```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### 文件权限
```bash
# 设置正确的文件权限
chown -R www-data:www-data /var/www/photo-picker-backend
chmod -R 755 /var/www/photo-picker-backend
chmod -R 755 uploads/
chmod 600 .env
```

### 8. 备份策略

#### 数据库备份
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
cp database/production.db backups/db_backup_$DATE.db
find backups/ -name "db_backup_*.db" -mtime +30 -delete
```

#### 文件备份
```bash
# 同步到对象存储
aws s3 sync uploads/ s3://your-backup-bucket/uploads/
```

### 9. 性能优化

#### 图片处理优化
- 使用SSD存储
- 配置图片CDN
- 启用gzip压缩
- 设置适当的缓存策略

#### 数据库优化
- 定期清理过期数据
- 添加适当的索引
- 考虑使用PostgreSQL (大规模)

### 10. 故障排除

#### 常见问题
1. **端口占用**: `lsof -i :3000`
2. **权限问题**: 检查文件权限和用户组
3. **内存不足**: 监控内存使用，考虑增加swap
4. **AI服务超时**: 检查网络连接和API密钥

#### 日志查看
```bash
# PM2日志
pm2 logs

# 系统服务日志
journalctl -u photo-picker -f

# Nginx日志
tail -f /var/log/nginx/error.log
```

## 扩展部署

### 负载均衡
- 使用多个后端实例
- 配置Nginx负载均衡
- 共享文件存储 (NFS/对象存储)

### 微服务架构
- AI服务独立部署
- 图片处理服务分离
- 使用消息队列处理异步任务

### 容器编排
- Kubernetes部署
- Docker Swarm
- 自动扩缩容配置