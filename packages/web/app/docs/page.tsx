import Link from 'next/link';
import { FileText, Book, Code, Users, ArrowRight } from 'lucide-react';

export default function DocsPage() {
  const docCategories = [
    {
      title: '快速开始',
      description: '了解 BoolTox 并开始使用',
      icon: <Book size={24} />,
      links: [
        { label: '项目介绍', href: 'https://github.com/ByteTrue/BoolTox#readme' },
        { label: '安装 Agent', href: 'https://github.com/ByteTrue/BoolTox#快速开始' },
        { label: '使用插件', href: '#' },
      ],
    },
    {
      title: '插件开发',
      description: '学习如何开发自己的插件',
      icon: <Code size={24} />,
      links: [
        { label: '开发指南', href: 'https://github.com/ByteTrue/BoolTox/blob/main/docs/PLUGIN_DEVELOPMENT.md' },
        { label: 'API 参考', href: '#' },
        { label: '示例插件', href: 'https://github.com/ByteTrue/booltox-plugins' },
      ],
    },
    {
      title: '贡献指南',
      description: '参与 BoolTox 开源社区',
      icon: <Users size={24} />,
      links: [
        { label: '贡献指南', href: 'https://github.com/ByteTrue/BoolTox/blob/main/CONTRIBUTING.md' },
        { label: '行为准则', href: '#' },
        { label: 'Issues', href: 'https://github.com/ByteTrue/BoolTox/issues' },
      ],
    },
    {
      title: '参考资料',
      description: '深入了解技术细节',
      icon: <FileText size={24} />,
      links: [
        { label: '架构设计', href: 'https://github.com/ByteTrue/BoolTox/blob/main/docs/agent-platform-spec.md' },
        { label: '项目进度', href: 'https://github.com/ByteTrue/BoolTox/blob/main/PROGRESS.md' },
        { label: '更新日志', href: '#' },
      ],
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-50 dark:bg-neutral-950 pt-16">
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* 页头 */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
            文档中心
          </h1>
          <p className="text-xl text-neutral-600 dark:text-neutral-400">
            探索 BoolTox 的完整文档和开发指南
          </p>
        </div>

        {/* 文档分类 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {docCategories.map((category) => (
            <div
              key={category.title}
              className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 shadow-soft hover:shadow-soft-lg transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400">
                  {category.icon}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {category.title}
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {category.description}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {category.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all group"
                  >
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      {link.label}
                    </span>
                    <ArrowRight
                      size={16}
                      className="text-neutral-400 dark:text-neutral-600 group-hover:translate-x-1 transition-transform"
                    />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="mt-12 p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 text-center">
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            找不到你需要的内容？
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="https://github.com/ByteTrue/BoolTox/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
            >
              提交问题
            </Link>
            <Link
              href="https://github.com/ByteTrue/BoolTox/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              参与讨论
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
