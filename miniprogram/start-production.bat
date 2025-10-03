@echo off
echo 启动选照片小程序生产环境...

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: Node.js未安装或未添加到PATH
    pause
    exit /b 1
)

REM 启动后端服务器
echo 启动后端服务器...
cd /d "%~dp0server"
start "后端服务器" cmd /k "npm start"

REM 等待后端服务器启动
timeout /t 5 /nobreak >nul

REM 启动代理服务器
echo 启动HTTPS代理服务器...
cd /d "%~dp0"
start "代理服务器" cmd /k "node simple-https-proxy.js"

echo.
echo ✅ 生产环境启动完成！
echo.
echo 📱 小程序访问地址: http://192.168.1.6:8080
echo 🖥️  后端服务器: http://localhost:5000
echo 🔗 代理服务器: http://192.168.1.6:8080
echo.
echo 💡 提示: 请保持两个命令行窗口运行，关闭窗口将停止服务
echo.
pause