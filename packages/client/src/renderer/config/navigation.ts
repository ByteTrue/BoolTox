// 导航配置服务：支持按部署和环境变量裁剪入口
// 可扩展：接入远程配置 / A/B / 租户差异

export type NavConfigItem = {
  key: string;
  label: string;
  description?: string;
  icon: 'grid' | 'pulse' | 'spark' | 'layers';
  badge?: string;
  tone?: 'accent' | 'neutral';
  flag?: string; // 对应环境变量开关，如 FEATURE_ANALYTICS
  enabled?: boolean; // 直接布尔控制优先级最高
};

const baseNav: NavConfigItem[] = [
  {
    key: 'overview',
    label: '概览面板',
    description: '运行快照',
    icon: 'grid',
  },
  {
    key: 'module-center',
    label: '模块中心',
    description: '模块管理',
    icon: 'layers',
    tone: 'accent',
  },
  {
    key: 'settings',
    label: '设置',
    description: '应用设置',
    icon: 'pulse',
  },
];

function flagEnabled(flag?: string): boolean {
  if (!flag) return true;
  const envName = `VITE_${flag}`;
  const val = import.meta.env[envName];
  if (val === undefined) return true; // 未显式配置默认开启
  return val !== '0' && val !== 'false' && val.toLowerCase() !== 'off';
}

export function getPrimaryNav(): NavConfigItem[] {
  return baseNav.filter((item) => (item.enabled ?? true) && flagEnabled(item.flag));
}
