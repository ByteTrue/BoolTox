/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

// 极简概览配置（开源默认：少量指标 + Release Notes）
export const overviewContent = {
  summary: {
    tag: '概览',
    title: 'BoolTox 运行概览',
    description: '最小化宿主，只保留核心指标与最近发布记录。',
    chips: ['核心指标', '模块运行', '版本动态'],
    actions: [
      { label: '刷新数据', variant: 'primary' as const },
      { label: '查看日志', variant: 'ghost' as const },
    ],
    inspector: {
      badge: '监控',
      depthLabel: '模块总数',
      depthValue: '0',
      primaryLabel: '最近发布',
      primaryValue: '—',
      gesturesLabel: '活跃趋势',
      gesturesValue: '初始化中',
      latencyLabel: '平均响应',
      latencyValue: '–',
    },
  },
  metrics: [
    { title: '已安装模块', value: '0', delta: '+0', description: 'Installed' },
    { title: '启用中', value: '0', delta: '+0', description: 'Enabled' },
    { title: '主机版本', value: 'v0.1.0', delta: '稳定', description: 'Core' },
  ],
  releaseNotes: [
    {
      time: '现在',
      title: '初始版本',
      actor: 'core',
      detail: '开放最小运行壳。',
      tone: 'done' as const,
    },
  ],
};

export const serviceStatus = {
  environments: [
    {
      label: '移动端',
      domain: 'App Store / Google Play',
      status: '在线' as const,
      updatedAt: '最新模块已同步',
    },
    {
      label: '桌面端',
      domain: 'macOS / Windows 客户端',
      status: '在线' as const,
      updatedAt: '体验中心 2.3 刚刚更新',
    },
    {
      label: '网页端',
      domain: 'booltox.app',
      status: '维护' as const,
      updatedAt: '夜间 00:00-02:00 优化体验',
    },
  ],
  integrations: [
    {
      name: '账号中心',
      status: '正常' as const,
      detail: '支持手机号 / 邮箱快速登录，数据实时同步。',
      nextAction: '邀请好友赢半年会员',
    },
    {
      name: '云同步',
      status: '关注' as const,
      detail: '个别用户反馈主题未及时同步，正在加速处理。',
      nextAction: '预计今晚修复',
    },
    {
      name: '活动推送',
      status: '待处理' as const,
      detail: '即将开放兴趣订阅，届时可定制通知。',
      nextAction: '收集偏好标签',
    },
  ],
};

export const collectionContent = {
  categories: [
    {
      title: '效率工具',
      detail: '聚焦任务管理、日程规划与笔记整理。',
      status: '精选 6 款',
    },
    {
      title: '创意设计',
      detail: '灵感收集、配色推荐与图像处理模块。',
      status: '精选 5 款',
    },
    {
      title: '生活方式',
      detail: '健康习惯、出行服务与娱乐推荐。',
      status: '精选 4 款',
    },
  ],
  resources: [
    {
      title: '新手指南',
      description: '了解如何安装、管理与评价模块。',
      action: '查看指南',
    },
    {
      title: '会员权益',
      description: '解锁限免、专属主题与云同步特权。',
      action: '了解更多',
    },
  ],
  compatibility: [
    {
      environment: '移动端',
      support: 'iOS / Android 应用',
      status: '体验稳定',
    },
    {
      environment: '桌面端',
      support: 'macOS / Windows 客户端',
      status: '体验稳定',
    },
    {
      environment: '网页端',
      support: '主流浏览器最新版本',
      status: '持续优化',
    },
  ],
  releaseStages: [
    {
      title: '本周上新',
      description: '精选 5 款效率模块已上线，可立即体验。',
      status: '完成' as const,
    },
    {
      title: '主题特辑',
      description: '周末推出三套新主题，正在最后调试。',
      status: '进行中' as const,
    },
    {
      title: '社区功能',
      description: '评论与评分系统预计下月开放。',
      status: '规划中' as const,
    },
  ],
  updateFeed: [
    {
      title: '语音助手',
      summary: '新增自然语言指令，语音即可完成常用操作。',
      owner: 'Ling',
      eta: '已上线',
      impact: '高' as const,
    },
    {
      title: '旅程相册',
      summary: '自动整理旅行照片并生成故事卡片。',
      owner: 'Mira',
      eta: '本周更新',
      impact: '中' as const,
    },
    {
      title: '习惯日历',
      summary: '可视化记录每日习惯并提醒打卡。',
      owner: 'Chen',
      eta: '即将上线',
      impact: '低' as const,
    },
  ],
};

export const themeContent = {
  palettes: [
    {
      title: '星光主题',
      description: '深蓝渐变搭配柔和高光，适合夜间浏览。',
      status: '已上线',
    },
    {
      title: '清晨主题',
      description: '淡雅暖色搭配柔雾质感，阅读更舒适。',
      status: '本周上线',
    },
    {
      title: '霓虹主题',
      description: '高对比色彩打造未来感界面，热门试用中。',
      status: '限时体验',
    },
    {
      title: '极简主题',
      description: '纯白与极简线条，突出模块内容表现。',
      status: '敬请期待',
    },
  ],
  services: [
    {
      title: '主题同步',
      detail: '登录同一账号即可同步主题设置到多端。',
      state: '已开启',
    },
    {
      title: '一键预览',
      detail: '支持在页面内快速切换主题对比效果。',
      state: '测试中',
    },
    {
      title: '护眼模式',
      detail: '即将上线护眼配色，晚间浏览更舒适。',
      state: '规划中',
    },
  ],
  previewModes: [
    {
      title: '桌面预览',
      description: '宽度 1440 · 模拟外部模块和平台并排布局。',
      status: '已加载',
    },
    {
      title: '移动预览',
      description: '宽度 414 · 快速检查字体和交互空间表现。',
      status: '已加载',
    },
    {
      title: '对比模式',
      description: '同时展示 Light/Dark 变量，便于排查差异。',
      status: '规划中',
    },
  ],
  tokens: [
    {
      label: '颜色变量',
      count: '28',
      coverage: '核心 UI + 模块共享',
    },
    {
      label: '排版体系',
      count: '12',
      coverage: '桌面 / 移动字号映射',
    },
    {
      label: '空间度量',
      count: '14',
      coverage: '4pt 基线导出',
    },
  ],
  auditChecklist: [
    {
      title: '对比度校验',
      detail: '主要按钮对比度符合 AA 要求。',
      status: '通过' as const,
    },
    {
      title: '中英混排',
      detail: '英文字符间距略大，准备手动调节。',
      status: '关注' as const,
    },
    {
      title: '暗色覆盖率',
      detail: '模块 3/5 已适配暗色主题，其余待补齐。',
      status: '待确认' as const,
    },
  ],
};

// analyticsContent 移除：主壳不再内置统计面板，后续由独立模块提供

export const marketplaceContent = {
  steps: [
    {
      title: '挑选模块',
      detail: '浏览推荐或搜索关键词，找到心仪的工具并加入收藏。',
    },
    {
      title: '一键安装',
      detail: '点击安装按钮即可同步到所有设备，支持免登录试用。',
    },
    {
      title: '体验授权',
      detail: '首次使用时确认所需权限，模块即可在侧边栏快速启动。',
    },
  ],
  roadmap: [
    {
      title: '模块配置 JSON',
      description: '定义统一字段，方便托管远程模块信息。',
      state: '进行中' as const,
    },
    {
      title: '在线安装入口',
      description: '支持通过 manifest URL 安装示例模块，逐步对外开放。',
      state: 'Beta' as const,
    },
    {
      title: '模块评分草案',
      description: '准备加入使用统计与手动反馈，辅助后续筛选。',
      state: '计划' as const,
    },
  ],
};
