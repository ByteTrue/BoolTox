# BoolTox Agent 安装脚本 (Windows PowerShell)

Write-Host "🚀 BoolTox Agent 安装程序" -ForegroundColor Green
Write-Host "==========================" -ForegroundColor Green
Write-Host ""

# 检查 Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 未检测到 Node.js" -ForegroundColor Red
    Write-Host "请先安装 Node.js (>= 20.0.0): https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

$nodeVersion = (node -v).TrimStart('v').Split('.')[0]
if ([int]$nodeVersion -lt 20) {
    Write-Host "❌ Node.js 版本过低 (需要 >= 20.0.0)" -ForegroundColor Red
    Write-Host "当前版本: $(node -v)" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Node.js 检查通过: $(node -v)" -ForegroundColor Green

# 检查 pnpm
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "📦 安装 pnpm..." -ForegroundColor Cyan
    npm install -g pnpm
}

Write-Host "✅ pnpm 检查通过: $(pnpm -v)" -ForegroundColor Green
Write-Host ""

# 安装目录
$installDir = "$env:USERPROFILE\.booltox\agent"

Write-Host "📂 安装目录: $installDir" -ForegroundColor Cyan
Write-Host ""

# 克隆或更新代码
if (Test-Path $installDir) {
    Write-Host "📥 更新现有安装..." -ForegroundColor Cyan
    Set-Location $installDir
    git pull
} else {
    Write-Host "📥 下载 BoolTox Agent..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.booltox" | Out-Null
    git clone https://github.com/ByteTrue/BoolTox.git $installDir
    Set-Location $installDir
}

# 安装依赖
Write-Host "📦 安装依赖..." -ForegroundColor Cyan
pnpm install --filter @booltox/agent...

# 构建
Write-Host "🔨 构建 Agent..." -ForegroundColor Cyan
pnpm --filter @booltox/agent build

Write-Host ""
Write-Host "✅ 安装完成！" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 下一步：" -ForegroundColor Yellow
Write-Host "  1. 启动 Agent:"
Write-Host "     cd $installDir\packages\agent"
Write-Host "     pnpm start"
Write-Host ""
Write-Host "  2. 开机自动启动（可选）:"
Write-Host "     使用任务计划程序创建启动任务"
Write-Host ""
Write-Host "📖 更多信息: https://github.com/ByteTrue/BoolTox" -ForegroundColor Cyan
