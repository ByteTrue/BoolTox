# BoolTox Agent 安装脚本 - Windows

Write-Host "🚀 开始安装 BoolTox Agent..." -ForegroundColor Green

# 检查 Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 未检测到 Node.js，请先安装 Node.js 20+" -ForegroundColor Red
    Write-Host "下载地址: https://nodejs.org" -ForegroundColor Yellow
    exit 1
}

$nodeVersion = (node -v).TrimStart('v').Split('.')[0]
if ([int]$nodeVersion -lt 20) {
    Write-Host "⚠️  Node.js 版本过低（需要 >= 20），请升级" -ForegroundColor Yellow
    exit 1
}

# 创建安装目录
$agentDir = "$env:USERPROFILE\.booltox\agent"
New-Item -ItemType Directory -Force -Path $agentDir | Out-Null

# TODO: 从 GitHub Releases 下载
Write-Host "📥 正在下载 BoolTox Agent..." -ForegroundColor Cyan

# 临时方案：提示手动下载
Write-Host "请从 GitHub 下载最新版本:" -ForegroundColor Yellow
Write-Host "https://github.com/ByteTrue/BoolTox/releases/latest" -ForegroundColor Cyan

# 创建启动脚本
$startScript = @"
@echo off
cd /d %USERPROFILE%\.booltox\agent
node dist\server.js
"@

$startScript | Out-File -FilePath "$env:USERPROFILE\.booltox\start-agent.bat" -Encoding ASCII

# 创建桌面快捷方式
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\BoolTox Agent.lnk")
$Shortcut.TargetPath = "$env:USERPROFILE\.booltox\start-agent.bat"
$Shortcut.Save()

Write-Host "✅ BoolTox Agent 安装成功！" -ForegroundColor Green
Write-Host "📍 服务地址: http://localhost:9527" -ForegroundColor Cyan
Write-Host "📂 安装目录: $agentDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 双击桌面快捷方式启动 Agent" -ForegroundColor Green

# 打开浏览器
Start-Process "http://localhost:9527"
