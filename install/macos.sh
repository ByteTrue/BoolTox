#!/bin/bash
# BoolTox Agent 安装脚本 - macOS

set -e

echo "🚀 开始安装 BoolTox Agent..."

# 检查是否安装了 Homebrew
if ! command -v brew &> /dev/null; then
    echo "❌ 未检测到 Homebrew，正在安装..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# 检查 Node.js 版本
if ! command -v node &> /dev/null; then
    echo "📦 正在安装 Node.js 20..."
    brew install node@20
else
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        echo "⚠️  Node.js 版本过低（需要 >= 20），正在升级..."
        brew install node@20
    fi
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
pnpm install
pnpm --filter @booltox/agent build
cp -r packages/agent/dist/* "$AGENT_DIR/"
cp packages/agent/package.json "$AGENT_DIR/"
cd "$AGENT_DIR"
pnpm install --prod

# 创建启动脚本
cat > "$HOME/.booltox/start-agent.sh" <<'SCRIPT'
#!/bin/bash
cd "$HOME/.booltox/agent"
node dist/server.js
SCRIPT

chmod +x "$HOME/.booltox/start-agent.sh"

# 创建 launchd plist（开机自启）
PLIST_PATH="$HOME/Library/LaunchAgents/com.booltox.agent.plist"
cat > "$PLIST_PATH" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.booltox.agent</string>
    <key>ProgramArguments</key>
    <array>
        <string>$HOME/.booltox/start-agent.sh</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$HOME/.booltox/logs/agent.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/.booltox/logs/agent.error.log</string>
</dict>
</plist>
EOF

# 启动服务
mkdir -p "$HOME/.booltox/logs"
launchctl load "$PLIST_PATH"

echo "✅ BoolTox Agent 安装成功！"
echo "📍 服务地址: http://localhost:9527"
echo "📂 安装目录: $HOME/.booltox"
echo ""
echo "🎉 正在打开浏览器..."
sleep 2
open "http://localhost:9527"
