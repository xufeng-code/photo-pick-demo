@echo off
echo ========================================
echo 启动生产环境守护进程
echo ========================================

cd /d "%~dp0"

echo 正在启动生产环境守护进程...
node production-guardian.js

pause