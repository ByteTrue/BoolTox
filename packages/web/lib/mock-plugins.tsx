import {
  Package,
  Terminal,
  Palette,
  Shield,
  Globe,
  Database,
  Zap,
  FileText,
  Code,
  Cpu,
  Image,
  Music,
  Video,
  Lock,
  Settings,
  GitBranch,
} from 'lucide-react';

export interface Plugin {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  tags: string[];
  rating: number;
  downloads: number;
  version: string;
  isOfficial: boolean;
  isRunning?: boolean;
  isInstalled?: boolean;
  author: string;
  lastUpdated: string;
  license: string;
}

export const CATEGORIES = [
  { id: 'all', label: '全部插件', icon: Package },
  { id: 'development', label: '开发工具', icon: Code },
  { id: 'text', label: '文本处理', icon: FileText },
  { id: 'design', label: '设计工具', icon: Palette },
  { id: 'security', label: '安全工具', icon: Shield },
  { id: 'network', label: '网络工具', icon: Globe },
  { id: 'data', label: '数据分析', icon: Database },
  { id: 'media', label: '媒体处理', icon: Image },
  { id: 'automation', label: '自动化', icon: Zap },
  { id: 'system', label: '系统工具', icon: Settings },
];

export const TAGS = [
  'python',
  'nodejs',
  'automation',
  'api',
  'database',
  'security',
  'network',
  'text',
  'image',
  'video',
  'audio',
  'git',
  'docker',
  'ai',
  'ml',
];

export const MOCK_PLUGINS: Plugin[] = [
  {
    id: 'python-runner',
    name: 'Python Runner',
    description: '运行 Python 脚本和包，支持虚拟环境管理、依赖安装和调试功能',
    icon: <Terminal size={24} />,
    category: 'development',
    tags: ['python', 'automation', 'scripting'],
    rating: 4.9,
    downloads: 25800,
    version: '2.1.0',
    isOfficial: true,
    isRunning: true,
    isInstalled: true,
    author: 'BoolTox Team',
    lastUpdated: '2025-12-05',
    license: 'MIT',
  },
  {
    id: 'package-manager',
    name: 'Package Manager',
    description: '统一管理 npm、pip、cargo 等包管理器，支持批量更新和依赖分析',
    icon: <Package size={24} />,
    category: 'development',
    tags: ['nodejs', 'python', 'package'],
    rating: 4.7,
    downloads: 18300,
    version: '1.5.2',
    isOfficial: true,
    isInstalled: true,
    author: 'BoolTox Team',
    lastUpdated: '2025-12-01',
    license: 'MIT',
  },
  {
    id: 'theme-editor',
    name: 'Theme Editor',
    description: '可视化主题编辑器，支持实时预览、色彩生成和导出功能',
    icon: <Palette size={24} />,
    category: 'design',
    tags: ['theme', 'color', 'design'],
    rating: 4.6,
    downloads: 12100,
    version: '1.2.0',
    isOfficial: false,
    isInstalled: false,
    author: 'DesignCo',
    lastUpdated: '2025-11-28',
    license: 'Apache-2.0',
  },
  {
    id: 'api-tester',
    name: 'API Tester',
    description: '强大的 API 测试工具，支持 REST、GraphQL、WebSocket 协议',
    icon: <Globe size={24} />,
    category: 'network',
    tags: ['api', 'network', 'testing'],
    rating: 4.8,
    downloads: 21500,
    version: '3.0.1',
    isOfficial: true,
    isInstalled: false,
    author: 'BoolTox Team',
    lastUpdated: '2025-12-06',
    license: 'MIT',
  },
  {
    id: 'data-visualizer',
    name: 'Data Visualizer',
    description: '数据可视化工具，支持多种图表类型和交互式仪表板',
    icon: <Database size={24} />,
    category: 'data',
    tags: ['data', 'chart', 'visualization'],
    rating: 4.5,
    downloads: 15600,
    version: '2.3.0',
    isOfficial: false,
    isInstalled: false,
    author: 'DataLab',
    lastUpdated: '2025-11-25',
    license: 'MIT',
  },
  {
    id: 'security-scanner',
    name: 'Security Scanner',
    description: '代码安全扫描工具，检测漏洞、敏感信息泄露和依赖安全问题',
    icon: <Shield size={24} />,
    category: 'security',
    tags: ['security', 'vulnerability', 'audit'],
    rating: 4.9,
    downloads: 19200,
    version: '1.8.0',
    isOfficial: true,
    isInstalled: false,
    author: 'BoolTox Team',
    lastUpdated: '2025-12-04',
    license: 'MIT',
  },
  {
    id: 'image-optimizer',
    name: 'Image Optimizer',
    description: '批量图片压缩和优化工具，支持 WebP、AVIF 转换',
    icon: <Image size={24} />,
    category: 'media',
    tags: ['image', 'optimization', 'compression'],
    rating: 4.7,
    downloads: 14800,
    version: '1.4.1',
    isOfficial: false,
    isInstalled: false,
    author: 'MediaTools',
    lastUpdated: '2025-11-30',
    license: 'GPL-3.0',
  },
  {
    id: 'text-transformer',
    name: 'Text Transformer',
    description: '文本转换和处理工具，支持格式转换、批量替换和正则操作',
    icon: <FileText size={24} />,
    category: 'text',
    tags: ['text', 'regex', 'transformation'],
    rating: 4.6,
    downloads: 11200,
    version: '2.0.0',
    isOfficial: false,
    isInstalled: false,
    author: 'TextPro',
    lastUpdated: '2025-11-22',
    license: 'MIT',
  },
  {
    id: 'git-assistant',
    name: 'Git Assistant',
    description: 'Git 增强工具，提供可视化提交历史、分支管理和冲突解决',
    icon: <GitBranch size={24} />,
    category: 'development',
    tags: ['git', 'version-control', 'collaboration'],
    rating: 4.8,
    downloads: 23400,
    version: '2.5.0',
    isOfficial: true,
    isInstalled: false,
    author: 'BoolTox Team',
    lastUpdated: '2025-12-07',
    license: 'MIT',
  },
  {
    id: 'docker-manager',
    name: 'Docker Manager',
    description: 'Docker 容器管理工具，支持容器监控、日志查看和镜像管理',
    icon: <Cpu size={24} />,
    category: 'system',
    tags: ['docker', 'container', 'devops'],
    rating: 4.7,
    downloads: 17900,
    version: '1.6.0',
    isOfficial: false,
    isInstalled: false,
    author: 'DevOps Team',
    lastUpdated: '2025-11-29',
    license: 'Apache-2.0',
  },
  {
    id: 'automation-workflow',
    name: 'Automation Workflow',
    description: '可视化自动化工作流编排工具，支持定时任务和条件触发',
    icon: <Zap size={24} />,
    category: 'automation',
    tags: ['automation', 'workflow', 'scheduling'],
    rating: 4.8,
    downloads: 20100,
    version: '3.1.0',
    isOfficial: true,
    isInstalled: false,
    author: 'BoolTox Team',
    lastUpdated: '2025-12-03',
    license: 'MIT',
  },
  {
    id: 'password-manager',
    name: 'Password Manager',
    description: '本地密码管理器，支持 AES-256 加密、自动填充和多设备同步',
    icon: <Lock size={24} />,
    category: 'security',
    tags: ['security', 'password', 'encryption'],
    rating: 4.9,
    downloads: 16700,
    version: '1.3.0',
    isOfficial: false,
    isInstalled: false,
    author: 'SecureVault',
    lastUpdated: '2025-11-27',
    license: 'MIT',
  },
  {
    id: 'video-converter',
    name: 'Video Converter',
    description: '视频格式转换工具，支持 H.265、VP9 编码和硬件加速',
    icon: <Video size={24} />,
    category: 'media',
    tags: ['video', 'conversion', 'encoding'],
    rating: 4.5,
    downloads: 13400,
    version: '2.2.0',
    isOfficial: false,
    isInstalled: false,
    author: 'MediaLab',
    lastUpdated: '2025-11-24',
    license: 'GPL-2.0',
  },
  {
    id: 'audio-editor',
    name: 'Audio Editor',
    description: '音频编辑和处理工具，支持剪辑、混音和效果添加',
    icon: <Music size={24} />,
    category: 'media',
    tags: ['audio', 'editing', 'processing'],
    rating: 4.6,
    downloads: 10800,
    version: '1.7.0',
    isOfficial: false,
    isInstalled: false,
    author: 'AudioPro',
    lastUpdated: '2025-11-20',
    license: 'MIT',
  },
  {
    id: 'code-formatter',
    name: 'Code Formatter',
    description: '多语言代码格式化工具，支持自定义规则和批量处理',
    icon: <Code size={24} />,
    category: 'development',
    tags: ['code', 'formatting', 'linting'],
    rating: 4.7,
    downloads: 22600,
    version: '2.4.0',
    isOfficial: true,
    isInstalled: false,
    author: 'BoolTox Team',
    lastUpdated: '2025-12-02',
    license: 'MIT',
  },
  {
    id: 'system-monitor',
    name: 'System Monitor',
    description: '系统资源监控工具，实时显示 CPU、内存、磁盘和网络状态',
    icon: <Cpu size={24} />,
    category: 'system',
    tags: ['system', 'monitoring', 'performance'],
    rating: 4.8,
    downloads: 19800,
    version: '1.9.0',
    isOfficial: true,
    isInstalled: false,
    author: 'BoolTox Team',
    lastUpdated: '2025-12-06',
    license: 'MIT',
  },
];

// 按分类筛选插件
export function filterPluginsByCategory(category: string): Plugin[] {
  if (category === 'all') {
    return MOCK_PLUGINS;
  }
  return MOCK_PLUGINS.filter((plugin) => plugin.category === category);
}

// 按标签筛选插件
export function filterPluginsByTags(tags: string[]): Plugin[] {
  if (tags.length === 0) {
    return MOCK_PLUGINS;
  }
  return MOCK_PLUGINS.filter((plugin) => plugin.tags.some((tag) => tags.includes(tag)));
}

// 搜索插件
export function searchPlugins(query: string): Plugin[] {
  const lowerQuery = query.toLowerCase();
  return MOCK_PLUGINS.filter(
    (plugin) =>
      plugin.name.toLowerCase().includes(lowerQuery) ||
      plugin.description.toLowerCase().includes(lowerQuery) ||
      plugin.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

// 按评分排序
export function sortPluginsByRating(plugins: Plugin[]): Plugin[] {
  return [...plugins].sort((a, b) => b.rating - a.rating);
}

// 按下载量排序
export function sortPluginsByDownloads(plugins: Plugin[]): Plugin[] {
  return [...plugins].sort((a, b) => b.downloads - a.downloads);
}

// 按更新时间排序
export function sortPluginsByUpdate(plugins: Plugin[]): Plugin[] {
  return [...plugins].sort(
    (a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
  );
}

// 获取已安装的插件
export function getInstalledPlugins(): Plugin[] {
  return MOCK_PLUGINS.filter((plugin) => plugin.isInstalled);
}

// 获取运行中的插件
export function getRunningPlugins(): Plugin[] {
  return MOCK_PLUGINS.filter((plugin) => plugin.isRunning);
}

// 获取官方插件
export function getOfficialPlugins(): Plugin[] {
  return MOCK_PLUGINS.filter((plugin) => plugin.isOfficial);
}
