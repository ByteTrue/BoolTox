'use client';

import { Settings as SettingsIcon, Zap, Bell, Shield, Database, Info } from 'lucide-react';

export default function SettingsPage() {
  const settingSections = [
    {
      title: 'Agent 配置',
      description: 'Agent 运行和连接设置',
      icon: <Zap size={24} />,
      items: [
        { label: 'Agent 地址', value: 'http://localhost:9527', disabled: true },
        { label: '自动启动', value: '开发中', disabled: true },
        { label: '自动更新', value: '开发中', disabled: true },
      ],
    },
    {
      title: '通知设置',
      description: '系统通知和提醒配置',
      icon: <Bell size={24} />,
      items: [
        { label: '插件安装通知', value: '开发中', disabled: true },
        { label: '插件更新通知', value: '开发中', disabled: true },
        { label: '系统通知', value: '开发中', disabled: true },
      ],
    },
    {
      title: '隐私和安全',
      description: '数据隐私和安全设置',
      icon: <Shield size={24} />,
      items: [
        { label: '数据收集', value: '禁用', disabled: true },
        { label: '使用统计', value: '禁用', disabled: true },
        { label: '插件权限管理', value: '开发中', disabled: true },
      ],
    },
    {
      title: '存储管理',
      description: '插件数据和缓存管理',
      icon: <Database size={24} />,
      items: [
        { label: '插件数据路径', value: '~/.booltox', disabled: true },
        { label: '清除缓存', value: '开发中', disabled: true },
        { label: '导出配置', value: '开发中', disabled: true },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">设置</h1>
        <p className="text-neutral-600 dark:text-neutral-400">配置 BoolTox 和 Agent 的偏好设置</p>
      </div>

      {/* 功能开发中提示 */}
      <div className="p-4 border border-primary-200 dark:border-primary-800/50 rounded-xl bg-primary-50 dark:bg-primary-900/20">
        <div className="flex items-center gap-3">
          <Info size={20} className="text-primary-600 dark:text-primary-400" />
          <div>
            <p className="text-sm font-medium text-primary-900 dark:text-primary-100">
              设置功能正在开发中
            </p>
            <p className="text-xs text-primary-700 dark:text-primary-300 mt-1">
              当前版本仅展示计划的设置项，实际功能将在后续版本中实现
            </p>
          </div>
        </div>
      </div>

      {/* 设置分组 */}
      <div className="space-y-6">
        {settingSections.map((section) => (
          <div
            key={section.title}
            className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900"
          >
            {/* 分组标题 */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                {section.icon}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {section.title}
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {section.description}
                </p>
              </div>
            </div>

            {/* 设置项 */}
            <div className="space-y-3">
              {section.items.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {item.label}
                  </span>
                  <span
                    className={`text-sm px-3 py-1 rounded-md ${
                      item.disabled
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                        : 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                    }`}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 关于信息 */}
      <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
            <Info size={24} />
          </div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">关于</h2>
        </div>

        <dl className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <dt className="text-sm text-neutral-600 dark:text-neutral-400">版本</dt>
            <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-100">v1.0.0</dd>
          </div>
          <div className="flex items-center justify-between py-2">
            <dt className="text-sm text-neutral-600 dark:text-neutral-400">许可证</dt>
            <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-100">CC-BY-NC-4.0</dd>
          </div>
          <div className="flex items-center justify-between py-2">
            <dt className="text-sm text-neutral-600 dark:text-neutral-400">GitHub</dt>
            <dd>
              <a
                href="https://github.com/ByteTrue/BoolTox"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-500 dark:text-primary-400 hover:underline"
              >
                ByteTrue/BoolTox
              </a>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
