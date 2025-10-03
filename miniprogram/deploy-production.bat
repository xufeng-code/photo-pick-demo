@echo off
echo ========================================
echo 生产环境部署脚本
echo ========================================

echo 1. 设置环境变量...
set NODE_ENV=production

echo 2. 安装依赖...
npm install --production

echo 3. 检查SSL证书...
if not exist "ssl\private.key" (
    echo ❌ 错误: SSL私钥文件不存在
    echo 请将SSL证书文件放置在 ssl\ 目录下
    echo 需要文件: private.key, certificate.crt
    pause
    exit /b 1
)

if not exist "ssl\certificate.crt" (
    echo ❌ 错误: SSL证书文件不存在
    echo 请将SSL证书文件放置在 ssl\ 目录下
    echo 需要文件: private.key, certificate.crt
    pause
    exit /b 1
)

echo 4. 启动生产服务器...
echo ✅ 启动HTTPS服务器 (端口443)
echo ✅ 启动HTTP重定向服务器 (端口80)
node production-https-server.js

pause