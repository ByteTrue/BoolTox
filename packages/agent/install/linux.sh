#!/bin/bash
# BoolTox Agent 安装脚本 - Linux

set -e

echo "🚀 开始安装 BoolTox Agent..."

# 检测发行版
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    OS=$(uname -s)
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "📦 正在安装 Node.js 20..."

    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ "$OS" = "fedora" ] || [ "$OS" = "rhel" ]; then
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo yum install -y nodejs
    else
        echo "❌ 不支持的发行版，请手动安装 Node.js 20+"
        exit 1
    fi
fi

# 检查版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "⚠️  Node.js 版本过低（需要 >= 20），请手动升级"
    exit 1
fi

# 下载 Agent
echo "📥 正在下载 BoolTox Agent..."
AGENT_DIR="$HOME/.booltox/agent"
mkdir -p "$AGENT_DIR"

# TODO: 从 GitHub Releases 下载
# curl -L https://github.com/ByteTrue/BoolTox/releases/latest/download/booltox-agent.tar.gz -o /tmp/booltox-agent.tar.gz
# tar -xzf /tmp/booltox-agent.tar.gz -C "$AGENT_DIR"

# 临时方案：从源码安装
cd /tmp
git clone --depth 1 https://github.com/ByteTrue/BoolTox.git booltox-temp
cd booltox-temp
npm install -g pnpm
pnpm install
pnpm --filter @booltox/agent build
cp -r packages/agent/dist/* "$AGENT_DIR/"
cp packages/agent/package.json "$AGENT_DIR/"
cd "$AGENT_DIR"
pnpm install --prod

# 创建 systemd 服务
SERVICE_FILE="$HOME/.config/systemd/user/booltox-agent.service"
mkdir -p "$HOME/.config/systemd/user"

cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=BoolTox Agent Service
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/node $AGENT_DIR/dist/server.js
Restart=always
RestartSec=10
StandardOutput=append:$HOME/.booltox/logs/agent.log
StandardError=append:$HOME/.booltox/logs/agent.error.log

[Install]
WantedBy=default.target
EOF

# 启动服务
mkdir -p "$HOME/.booltox/logs"
systemctl --user daemon-reload
systemctl --user enable booltox-agent.service
systemctl --user start booltox-agent.service

echo "✅ BoolTox Agent 安装成功！"
echo "📍 服务地址: http://localhost:9527"
echo "📂 安装目录: $AGENT_DIR"
echo ""
echo "管理命令:"
echo "  启动: systemctl --user start booltox-agent"
echo "  停止: systemctl --user stop booltox-agent"
echo "  状态: systemctl --user status booltox-agent"
echo ""
echo "🎉 正在打开浏览器..."
sleep 2
xdg-open "http://localhost:9527" 2>/dev/null || echo "请手动访问: http://localhost:9527"
