import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './theme-provider';
import { useUpdate } from '@/contexts/update-context';
import { APP_VERSION } from '@/config/app-info';
import { ADMIN_API_BASE, RELEASE_CHANNEL } from '@/config/api';
import { getGlassStyle, getGlassShadow } from '@/utils/glass-layers';
import { buttonInteraction, cardHover } from '@/utils/animation-presets';
import {
  Settings as SettingsIcon,
  Info,
  RefreshCw,
  Download,
  CheckCircle2,
  Loader2,
  Package,
  Server,
} from 'lucide-react';

export function SettingsPanel() {
  const { theme } = useTheme();
  const { state, details, retryCheck } = useUpdate();
  const [checking, setChecking] = useState(false);

  const handleCheckUpdate = async () => {
    setChecking(true);
    try {
      await retryCheck();
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 标题 */}
      <div className="flex items-center gap-3">
        <SettingsIcon
          className={theme === 'dark' ? 'text-white' : 'text-slate-800'}
          size={28}
        />
        <h1
          className={`text-2xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}
        >
          设置
        </h1>
      </div>

      {/* 两列布局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左列：应用信息 */}
        <SettingCard title="应用信息" icon={Info} theme={theme}>
          <div className="space-y-3">
            <SettingItem label="应用名称" value="Booltox 不二工具箱" />
            <SettingItem label="当前版本" value={APP_VERSION} />
            <SettingItem label="更新渠道" value={RELEASE_CHANNEL} />
            <SettingItem label="API 地址" value={ADMIN_API_BASE} />
          </div>
        </SettingCard>

        {/* 右列：开发者信息 */}
        <SettingCard title="开发者信息" icon={Server} theme={theme}>
          <div className="space-y-3">
            <SettingItem
              label="环境"
              value={import.meta.env.MODE === 'development' ? '开发环境' : '生产环境'}
            />
            <SettingItem
              label="Electron"
              value={typeof window !== 'undefined' && window.electron ? '已启用' : '未启用'}
            />
            <SettingItem
              label="Node 集成"
              value={typeof process !== 'undefined' ? '已启用' : '未启用'}
            />
          </div>
        </SettingCard>
      </div>

      {/* 版本更新（独占一行） */}
      <SettingCard title="版本更新" icon={Package} theme={theme}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}
              >
                更新状态
              </p>
              <p
                className={`text-xs mt-1 ${
                  theme === 'dark' ? 'text-white/60' : 'text-slate-500'
                }`}
              >
                {state.phase === 'idle' && '当前版本已是最新'}
                {state.phase === 'checking' && '正在检查更新...'}
                {state.phase === 'available' && details && `发现新版本 ${details.version}`}
                {state.phase === 'downloading' && '正在下载更新包...'}
                {state.phase === 'downloaded' && '更新包已就绪'}
                {state.phase === 'error' && `检查失败: ${state.error}`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {state.phase === 'checking' && (
                <Loader2
                  className={`animate-spin ${
                    theme === 'dark' ? 'text-white/60' : 'text-slate-500'
                  }`}
                  size={20}
                />
              )}
              {state.phase === 'idle' && (
                <CheckCircle2 className="text-green-500" size={20} />
              )}
              {state.phase === 'available' && (
                <Download className="text-brand-blue-400" size={20} />
              )}

              <motion.button
                {...buttonInteraction}
                type="button"
                onClick={handleCheckUpdate}
                disabled={checking || state.phase === 'checking'}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-[background-color,opacity,box-shadow] duration-150 ease-swift disabled:opacity-50 disabled:cursor-not-allowed ${
                  theme === 'dark'
                    ? 'text-white/90 hover:text-white'
                    : 'text-slate-800 hover:text-slate-900'
                }`}
                style={{
                  ...getGlassStyle('BUTTON', theme, {
                    withBorderGlow: true,
                    withInnerShadow: true,
                  }),
                  // 增强按钮的浮起感
                  boxShadow: theme === 'dark'
                    ? '0 2px 8px rgba(0, 0, 0, 0.3), 0 0.5px 0 0 rgba(255, 255, 255, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)'
                    : '0 2px 10px rgba(0, 0, 0, 0.1), 0 0.5px 0 0 rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
                }}
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    checking || state.phase === 'checking' ? 'animate-spin' : ''
                  }`}
                />
                检查更新
              </motion.button>
            </div>
          </div>

          {details && (
            <div
              className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    版本 {details.version}
                  </p>
                  {details.notes && (
                    <p
                      className={`text-xs ${
                        theme === 'dark' ? 'text-white/70' : 'text-slate-600'
                      }`}
                    >
                      {details.notes}
                    </p>
                  )}
                </div>
                {details.sizeBytes && (
                  <div className="text-right">
                    <p
                      className={`text-xs ${
                        theme === 'dark' ? 'text-white/60' : 'text-slate-500'
                      }`}
                    >
                      安装包大小
                    </p>
                    <p
                      className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-white/80' : 'text-slate-700'
                      }`}
                    >
                      {formatBytes(details.sizeBytes)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </SettingCard>
    </div>
  );
}

function SettingCard({
  title,
  icon: Icon,
  theme,
  children,
}: {
  title: string;
  icon: React.ElementType;
  theme: 'light' | 'dark';
  children: React.ReactNode;
}) {
  return (
    <motion.div
      {...cardHover}
      className={`rounded-2xl border p-5 transition-shadow duration-250 ease-swift hover:shadow-lg ${getGlassShadow(theme)}`}
      style={getGlassStyle('CARD', theme)}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon
          className="text-brand-blue-500 dark:text-brand-blue-300"
          size={18}
        />
        <h3
          className={`text-base font-bold ${
            theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}
        >
          {title}
        </h3>
      </div>
      {children}
    </motion.div>
  );
}

function SettingItem({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();

  return (
    <div className="flex items-center justify-between py-1.5">
      <span
        className={`text-xs ${
          theme === 'dark' ? 'text-white/70' : 'text-slate-600'
        }`}
      >
        {label}
      </span>
      <span
        className={`text-xs font-medium ${
          theme === 'dark' ? 'text-white' : 'text-slate-800'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = -1;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}
