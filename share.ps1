# CET-6 突击站 - 公网分享脚本
# 右键 "使用 PowerShell 运行"

$node = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $node) {
    $node = Get-Command "C:\Program Files\nodejs\node.exe" -ErrorAction SilentlyContinue
}

if (-not $node) {
    Write-Host "❌ 找不到 Node.js，请先安装" -ForegroundColor Red
    exit 1
}

Write-Host "==============================" -ForegroundColor Cyan
Write-Host " CET-6 突击站 - 分享到公网" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "启动隧道中，稍等..." -ForegroundColor Yellow
Write-Host ""
Write-Host "隧道就绪后，把显示的 URL 发给朋友" -ForegroundColor Cyan
Write-Host "按 Ctrl+C 关闭隧道" -ForegroundColor Gray
Write-Host ""

npx --yes localtunnel --port 3000
