#!/bin/bash
# 设置所有示例工具的独立依赖
# 注意：必须使用 npm，不要用 pnpm

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🔧 开始设置所有示例工具..."
echo ""

# frontend-only-demo
echo "📦 [1/4] 设置 frontend-only-demo..."
cd "$SCRIPT_DIR/frontend-only-demo"
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
echo "✅ frontend-only-demo 完成"
echo ""

# backend-node-demo
echo "📦 [2/4] 设置 backend-node-demo..."
cd "$SCRIPT_DIR/backend-node-demo"
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
echo "✅ backend-node-demo 完成"
echo ""

# backend-demo (Python)
echo "📦 [3/4] 设置 backend-demo..."
cd "$SCRIPT_DIR/backend-demo"
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
echo "✅ backend-demo 前端已构建"
echo ""

# python-standalone-demo
echo "📦 [4/4] python-standalone-demo"
echo "   ⚠️  仅需 Python 依赖，无需 npm"
echo ""

echo "======================================"
echo "🎉 所有工具设置完成！"
echo "======================================"
echo ""
echo "Node.js 工具已就绪："
echo "  ✅ frontend-only-demo"
echo "  ✅ backend-node-demo"
echo "  ✅ backend-demo (前端)"
echo ""
echo "Python 依赖需手动安装："
echo "  cd backend-demo && pip install -r requirements.txt"
echo "  cd python-standalone-demo && pip install -r requirements.txt"
echo ""
echo "测试工具（独立运行）："
echo "  cd frontend-only-demo && node server.js"
echo "  cd backend-node-demo && node backend/dist/http_server.js"
echo "  cd backend-demo && python backend/http_server.py"
echo "  cd python-standalone-demo && python main.py"
echo ""
echo "或者在 BoolTox 中启动（推荐）"

