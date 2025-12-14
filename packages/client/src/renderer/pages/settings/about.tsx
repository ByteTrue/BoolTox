/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 关于页面
 */

import { useTheme } from '../../components/theme-provider';
import { ExternalLink } from 'lucide-react';

export function AboutSettings() {
  const { theme } = useTheme();

  const links = [
    { label: '官网', url: 'https://booltox.com' },
    { label: 'GitHub', url: 'https://github.com/ByteTrue/BoolTox' },
    { label: '工具仓库', url: 'https://github.com/ByteTrue/booltox-plugins' },
    { label: '问题反馈', url: 'https://github.com/ByteTrue/BoolTox/issues' },
  ];

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Logo 和标题 */}
      <div className="text-center">
        <div className="inline-flex rounded-xl bg-brand-gradient p-3 shadow-lg mb-4">
          <span className="text-5xl">📦</span>
        </div>
        <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          BoolTox
        </h1>
        <p className={`text-sm ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
          版本 0.0.1
        </p>
      </div>

      {/* 简介 */}
      <div
        className="rounded-lg border p-6"
        style={{
          background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.7)',
          borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        }}
      >
        <p className={`text-center ${theme === 'dark' ? 'text-white/80' : 'text-gray-700'}`}>
          开源、可扩展的工具箱平台
        </p>
        <p className={`text-center text-sm mt-2 ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
          Web 优先 · 工具生态 · 本地 Agent · 隐私优先
        </p>
      </div>

      {/* 链接 */}
      <div className="space-y-2">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
              theme === 'dark'
                ? 'border-white/10 hover:bg-white/5'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{link.label}</span>
            <ExternalLink size={16} className={theme === 'dark' ? 'text-white/60' : 'text-gray-400'} />
          </a>
        ))}
      </div>

      {/* 致谢 */}
      <div
        className="rounded-lg border p-4"
        style={{
          background: theme === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
          borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        }}
      >
        <p className={`text-sm text-center ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
          参考项目：Cherry Studio 设计模式
        </p>
        <p className={`text-sm text-center mt-2 ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
          设计哲学：Linus Torvalds "好品味"理念
        </p>
      </div>

      {/* 许可证 */}
      <div className="text-center">
        <p className={`text-sm ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>
          Copyright © 2025 ByteTrue
        </p>
        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>
          Licensed under CC-BY-NC-4.0
        </p>
      </div>
    </div>
  );
}
