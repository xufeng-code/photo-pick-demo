@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🤖 选照片小程序后端服务启动脚本
echo ========================================
echo.

:: 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装或未添加到PATH
    echo.
    echo 📥 请先安装Node.js:
    echo    1. 访问 https://nodejs.org/
    echo    2. 下载并安装最新LTS版本
    echo    3. 重新运行此脚本
    echo.
    echo 🔧 或者使用包管理器安装:
    echo    winget install OpenJS.NodeJS
    echo    或
    echo    choco install nodejs
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js 已安装
node --version

:: 检查npm是否可用
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm 不可用
    pause
    exit /b 1
)

echo ✅ npm 已安装
npm --version
echo.

:: 检查是否已安装依赖
if not exist "node_modules" (
    echo 📦 正在安装依赖包...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已安装
)

echo.

:: 检查环境配置
if not exist ".env" (
    echo ⚠️  .env 文件不存在，使用默认配置
) else (
    echo ✅ 环境配置文件存在
)

:: 创建uploads目录
if not exist "uploads" (
    mkdir uploads
    mkdir uploads\original
    mkdir uploads\preview
    mkdir uploads\thumb
    echo ✅ 创建uploads目录结构
)

:: 检查数据库目录
if not exist "database" (
    mkdir database
    echo ✅ 创建database目录
)

echo.
echo 🚀 启动后端服务...
echo 📍 服务地址: http://localhost:3000
echo 🧪 测试页面: http://localhost:3000/test/test.html
echo.
echo 💡 提示:
echo    - 按 Ctrl+C 停止服务
echo    - 查看 README.md 了解API文档
echo    - 使用测试页面验证功能
echo.

:: 启动服务
npm run dev

pause