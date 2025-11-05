# BoolTox Admin Dashboard

面向 BoolTox 客户端的后台管理前端，提供登录、概览、版本、模块、公告、日志与系统设置等管理入口。项目基于 **Vite + React 19 + TypeScript + Ant Design 5** 构建，并内置 React Query 与统一的 API 客户端。

## 快速开始

```bash
# 安装依赖（在仓库根目录）
pnpm install

# 启动管理后台
pnpm --filter @booltox/admin-dashboard dev
```

默认在 `http://localhost:5173` 运行。首次启动前，请在 `packages/server` 侧启动 API 服务，并确保管理员账号已准备好。

## 环境变量

通过 `.env` 或 `.env.local` 进行配置，常用变量如下：

| 变量名 | 说明 | 默认值 |
| ------ | ---- | ------ |
| `VITE_API_BASE_URL` | 后端 API 地址，最终会拼接 `/api/*` 路径 | `http://localhost:3000` |

> 提示：修改环境变量后需重新启动开发服务。

## 项目结构

```
src/
├── components/          # 公共组件：路由守卫等
├── features/            # 功能域模块（auth 等）
├── layouts/             # 全局布局
├── pages/               # 路由页面（概览、模块、公告…）
├── router/              # React Router 配置
├── shared/              # axios 客户端、Query 客户端等共享工具
├── storage/             # 本地存储与事件总线
├── styles/              # 全局样式
└── main.tsx             # 入口文件，挂载 Provider 与路由
```

## 已实现能力

- 登录页（邮箱 + 密码 + 记住状态），失败信息友好提示
- 访问令牌自动附加、401 时触发刷新流程并落盘
- RBAC 信息展示，支持退出登录
- 仪表盘视图以及版本、模块、公告、日志、设置等页面的表格骨架已接入后端分页接口（当前展示基础字段，可继续扩展操作能力）
- React Query + Devtools、Ant Design 主题定制及全局样式基线

## 常用脚本

| 命令 | 说明 |
| ---- | ---- |
| `pnpm dev` | 启动本地开发服务器 |
| `pnpm build` | 类型检查并打包产物到 `dist/` |
| `pnpm type-check` | 单独执行 TypeScript 类型检查 |
| `pnpm lint` | 执行 ESLint（基于 Vite 模板配置） |
| `pnpm preview` | 预览构建产物 |

## 后续规划

- 对接后台 API，完成数据表格、表单与详情页
- 根据权限控制侧边菜单与操作按钮显示
- 登录流程增加验证码/多因素校验、异常告警等安全策略

如需更多信息，请参考根目录 `architecture-plan.md` 与 `PROJECT_IMPLEMENTATION_STATUS.md`。
