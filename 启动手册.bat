@echo off
rem 启动 Vue 开发服务器
cd /d "%~dp0"
start "FAE手册-Vue dev server" cmd /k "npm run dev"
echo 启动完成。浏览器将自动打开 http://localhost:5173
echo 关闭方式：打开那个黑色窗口按 Ctrl+C 两次
timeout /t 3 >NUL