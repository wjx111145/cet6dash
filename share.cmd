@echo off
chcp 65001 >nul
echo ==============================
echo  CET-6 突击站 - 公网分享工具
echo ==============================
echo.
echo 正在启动隧道，请稍候...
echo.
echo 注意：隧道启动后手机会收到验证码
echo 在浏览器打开返回的 URL 即可
echo.
echo 按 Ctrl+C 可关闭隧道
echo ==============================
echo.

"C:\Program Files\nodejs\npx.cmd" --yes localtunnel --port 3000
pause
