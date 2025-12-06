#!/bin/bash
# BoolTox Agent 安装脚本 (macOS)

set -e

echo "🚀 BoolTox Agent 安装程序"
echo "=========================="
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js"
    echo "请先安装 Node.js (>= 20.0.0): https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 版本过低 (需要 >= 20.0.0)"
    echo "当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js 检查通过: $(node -v)"

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 安装 pnpm..."
    npm install -g pnpm
fi

echo "✅ pnpm 检查通过: $(pnpm -v)"
echo ""

# 安装目录
INSTALL_DIR="$HOME/.booltox/agent"

echo "📂 安装目录: $INSTALL_DIR"
echo ""

# 克隆或更新代码
if [ -d "$INSTALL_DIR" ]; then
    echo "📥 更新现有安装..."
    cd "$INSTALL_DIR"
    git pull
else
    echo "📥 下载 BoolTox Agent..."
    mkdir -p "$HOME/.booltox"
    git clone https://github.com/ByteTrue/BoolTox.git "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# 安装依赖
echo "📦 安装依赖..."
pnpm install --filter @booltox/agent...

# 构建
echo "🔨 构建 Agent..."
pnpm --filter @booltox/agent build

echo ""
echo "✅ 安装完成！"
echo ""
echo "🎯 下一步："
echo "  1. 启动 Agent:"
echo "     cd $INSTALL_DIR/packages/agent"
echo "     pnpm start"
echo ""
echo "  2. 开机自动启动（可选）:"
echo "     创建 ~/Library/LaunchAgents/com.booltox.agent.plist"
echo ""
echo "📖 更多信息: https://github.com/ByteTrue/BoolTox"
