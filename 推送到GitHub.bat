@echo off
rem ============================================================
rem 推送到 GitHub（一键脚本）
rem 首次运行会弹出浏览器/GitHub登录窗口，登录一次即可
rem ============================================================
chcp 65001 >NUL
cd /d "%~dp0"

echo [1/2] 正在推送代码到 GitHub...
git push -u origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [提示] 推送失败。原因通常是：
    echo   - 尚未登录 GitHub（会弹出登录窗口，登录后重跑本脚本即可）
    echo   - 仓库名/权限不对（检查 remote: git remote -v）
    echo   - 网络无法访问 github.com
    echo.
    echo 推送失败后可以运行本脚本重试。
) else (
    echo.
    echo ✅ 推送成功！
    echo   下一步：打开 GitHub 仓库 Settings - Pages，Source 选 "GitHub Actions"
    echo   等待 Actions 跑完（约1分钟），访问：
    echo   https://Dongjingsheng.github.io/fae-handbook/
)
echo.
pause