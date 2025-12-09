# BoolTox Web 新 UI - 快速启动指南

> ✅ 所有依赖已安装完成！
> 🚀 立即启动查看效果

---

## 🎯 1 分钟快速启动

### 步骤 1: 启动开发服务器

```bash
cd E:\Code\TS\BoolTox\booltox-web
pnpm --filter @booltox/web dev
```

### 步骤 2: 打开浏览器

访问: `http://localhost:3000`

### 步骤 3: 体验新功能

#### 测试 1: 命令面板（⌘K）
```
1. 按 Cmd+K (Mac) 或 Ctrl+K (Windows)
2. 输入"主题"
3. 按 Enter 切换主题
4. 观察颜色变化
```

#### 测试 2: 主题定制器
```
1. 点击 Navbar 右侧的调色板图标 🎨
2. 选择"紫罗兰"
3. 观察实时预览
4. 关闭面板，查看整个网站变色
5. 刷新页面，确认设置已保存
```

#### 测试 3: 3D 效果
```
1. 返回首页（按 ⌘H 或点击 Logo）
2. 鼠标移动到三个特性卡片上
3. 观察卡片随鼠标倾斜
4. 观察光晕效果
```

#### 测试 4: 插件市场
```
1. 访问 /tools/market
2. 点击左侧"开发工具"分类
3. 点击"#python"标签
4. 在搜索框输入"Python"
5. 点击任意插件卡片查看详情
```

#### 测试 5: Toast 通知
```
1. 在插件市场点击"安装"按钮
2. 观察右下角 Toast 通知
3. 注意加载 → 成功的状态变化
```

---

## 🔧 故障排除

### 问题 1: 端口被占用

**错误**: `Port 3000 is already in use`

**解决**:
```bash
# 方案 1: 使用其他端口
pnpm --filter @booltox/web dev -- -p 3001

# 方案 2: 杀掉占用端口的进程
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

---

### 问题 2: 依赖错误

**错误**: `Module not found`

**解决**:
```bash
# 重新安装依赖
cd E:\Code\TS\BoolTox\booltox-web
pnpm install

# 清除缓存
rm -rf packages/web/.next
pnpm --filter @booltox/web dev
```

---

### 问题 3: TypeScript 类型错误

**错误**: `Cannot find module '@/components/...'`

**解决**:
确保 `tsconfig.json` 中配置了路径别名：
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

### 问题 4: 样式不生效

**解决**:
```bash
# 清除 Next.js 缓存
rm -rf packages/web/.next

# 重新启动
pnpm --filter @booltox/web dev
```

---

## 📋 验证清单

启动后，请验证以下功能：

### 基础功能
- [ ] 页面正常加载（无 404 错误）
- [ ] 深色/浅色模式切换正常
- [ ] 字体加载正常
- [ ] 无 Console 错误

### 交互功能
- [ ] ⌘K 打开命令面板
- [ ] 命令面板搜索有结果
- [ ] 主题定制器能打开
- [ ] 颜色切换生效
- [ ] Toast 通知显示正常

### 动画效果
- [ ] 首页入场动画流畅
- [ ] 卡片悬停上浮
- [ ] 3D 倾斜效果正常
- [ ] 按钮点击反馈
- [ ] 页面切换动画

### 响应式
- [ ] 移动端布局正常（< 768px）
- [ ] 平板布局正常（768px - 1024px）
- [ ] 桌面布局正常（> 1024px）

---

## 🎨 页面导航

### 可访问的页面
```
首页:              http://localhost:3000
工具箱:            http://localhost:3000/tools
插件市场:          http://localhost:3000/tools/market
插件详情:          http://localhost:3000/tools/market/python-runner
资源导航:          http://localhost:3000/resources
```

**注意**: 新页面文件名为 `*-new.tsx`，如果要使用新页面，需要：
1. 在组件中导入新页面
2. 或重命名文件（去掉 `-new` 后缀）

---

## 🚀 启用新页面（可选）

### 方式 1: 重命名文件（完全替换）

```bash
cd packages/web

# 备份原文件
mkdir -p backups
cp app/(tools)/tools/page.tsx backups/
cp app/(tools)/tools/market/page.tsx backups/
cp app/(tools)/tools/market/[pluginId]/page.tsx backups/

# 替换为新文件
mv app/(tools)/tools/page-new.tsx app/(tools)/tools/page.tsx
mv app/(tools)/tools/market/page-new.tsx app/(tools)/tools/market/page.tsx
mv app/(tools)/tools/market/[pluginId]/page-new.tsx app/(tools)/tools/market/[pluginId]/page.tsx
```

### 方式 2: 创建路由切换

在 `app/(tools)/tools/layout.tsx` 中添加：
```tsx
import { useState } from 'react';
import PageOld from './page';
import PageNew from './page-new';

export default function Layout() {
  const [useNewUI] = useState(true); // 切换标志

  return useNewUI ? <PageNew /> : <PageOld />;
}
```

---

## 📱 移动端测试

### Chrome DevTools
1. 按 F12 打开开发者工具
2. 点击"Toggle device toolbar"（Ctrl+Shift+M）
3. 选择设备：
   - iPhone 14 Pro (393 x 852)
   - iPad Air (820 x 1180)
   - Desktop (1920 x 1080)
4. 测试各功能在不同设备的表现

---

## 🎯 性能检查

### Lighthouse 测试

1. 按 F12 打开 DevTools
2. 切换到"Lighthouse"标签
3. 选择"Desktop"或"Mobile"
4. 点击"Analyze page load"
5. 查看分数（目标：90+）

### 预期结果
- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 90
- **SEO**: > 90

---

## 🆘 需要帮助？

### 查看文档
- **设计理念**: 查看 `DESIGN.md`
- **安装问题**: 查看 `SETUP.md`
- **使用问题**: 查看 `GUIDE.md`
- **进度报告**: 查看 `PROGRESS.md`

### 在线资源
- Shadcn/ui: https://ui.shadcn.com
- Sonner: https://sonner.emilkowal.ski
- cmdk: https://cmdk.paco.me
- Tailwind CSS: https://tailwindcss.com

---

## 🎉 下一步

1. ✅ 验证所有功能正常
2. 🔄 连接真实后端 API
3. 🎨 根据品牌调整配色
4. 📱 测试移动端体验
5. 🚀 准备部署上线

---

**祝你使用愉快！** 🚀

如有任何问题，随时查看文档或寻求帮助。
