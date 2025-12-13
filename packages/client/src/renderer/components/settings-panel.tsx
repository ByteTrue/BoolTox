/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useMemo, useState, useEffect } from 'react';
import type { ElementType, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTheme } from './theme-provider';
import { useUpdate } from '@/contexts/update-context';
import { APP_VERSION } from '@/config/app-info';
import { ADMIN_API_BASE, RELEASE_CHANNEL } from '@/config/api';
import { getGlassStyle, getGlassShadow } from '@/utils/glass-layers';
import { buttonInteraction, cardHover } from '@/utils/animation-presets';
import { Modal } from './ui/modal';
import { GlassButton } from './ui/glass-button';
import { LogManager } from './settings/log-manager';
import {
  Settings as SettingsIcon,
  Info,
  RefreshCw,
  Download,
  CheckCircle2,
  Loader2,
  Package,
  Server,
  FileText,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Rocket,
} from 'lucide-react';

export function SettingsPanel() {
  const { theme, toggleTheme } = useTheme();
  const { state, details, retryCheck, downloadUpdate, installUpdate } = useUpdate();
  const [showNotes, setShowNotes] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoLaunch, setAutoLaunch] = useState(false);
  const [isLoadingAutoLaunch, setIsLoadingAutoLaunch] = useState(false);

  const isDev = import.meta.env.MODE === 'development';

  // 加载开机启动状态
  useEffect(() => {
    if (window.appSettings) {
      window.appSettings.getAutoLaunch().then(enabled => {
        setAutoLaunch(enabled);
      }).catch(err => {
        console.error('Failed to load auto launch status:', err);
      });
    }
  }, []);

  // 切换开机启动
  const handleAutoLaunchToggle = async () => {
    if (!window.appSettings || isLoadingAutoLaunch) return;
    
    setIsLoadingAutoLaunch(true);
    try {
      const newState = !autoLaunch;
      const result = await window.appSettings.setAutoLaunch(newState);
      if (result.success) {
        setAutoLaunch(newState);
      } else {
        console.error('Failed to set auto launch:', result.error);
      }
    } catch (error) {
      console.error('Failed to toggle auto launch:', error);
    } finally {
      setIsLoadingAutoLaunch(false);
    }
  };

  const primaryAction = useMemo(() => {
    switch (state.phase) {
      case 'available':
        return {
          label: '立即下载',
          icon: Download,
          handler: downloadUpdate,
          disabled: false,
          spinning: false,
        } as const;
      case 'downloading':
        return {
          label: '下载中...',
          icon: Loader2,
          handler: undefined,
          disabled: true,
          spinning: true,
        } as const;
      case 'downloaded':
        return {
          label: '安装更新',
          icon: CheckCircle2,
          handler: installUpdate,
          disabled: false,
          spinning: false,
        } as const;
      case 'checking':
        return {
          label: '检查中...',
          icon: Loader2,
          handler: undefined,
          disabled: true,
          spinning: true,
        } as const;
      case 'error':
        return {
          label: '重新检查',
          icon: RefreshCw,
          handler: retryCheck,
          disabled: false,
          spinning: false,
        } as const;
      case 'idle':
      default:
        return {
          label: '检查更新',
          icon: RefreshCw,
          handler: retryCheck,
          disabled: false,
          spinning: false,
        } as const;
    }
  }, [state.phase, downloadUpdate, installUpdate, retryCheck]);

  const PrimaryIcon = primaryAction.icon;

  const handlePrimaryAction = async () => {
    if (!primaryAction.handler || primaryAction.disabled) {
      return;
    }
    await primaryAction.handler();
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
            <SettingItem label="应用名称" value="BoolTox" />
            <SettingItem label="当前版本" value={APP_VERSION} />
          </div>
        </SettingCard>

        {/* 右列：偏好设置 */}
        <SettingCard title="偏好设置" icon={Sliders} theme={theme}>
          <div className="space-y-4">
            {/* 主题切换 */}
            <SettingToggle
              label="主题模式"
              description={theme === 'dark' ? '深色' : '浅色'}
              icon={theme === 'dark' ? Moon : Sun}
              checked={theme === 'dark'}
              onChange={toggleTheme}
              theme={theme}
            />
            
            {/* 开机启动 */}
            <SettingToggle
              label="开机启动"
              description={autoLaunch ? '已启用' : '未启用'}
              icon={Rocket}
              checked={autoLaunch}
              onChange={handleAutoLaunchToggle}
              disabled={isLoadingAutoLaunch}
              theme={theme}
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
              {(state.phase === 'checking' || state.phase === 'downloading') && (
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
              {state.phase === 'downloaded' && (
                <CheckCircle2 className="text-green-500" size={20} />
              )}

              {details && (
                <motion.button
                  {...buttonInteraction}
                  type="button"
                  onClick={() => setShowNotes(true)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-[background-color,opacity,box-shadow] duration-150 ease-swift ${
                    theme === 'dark'
                      ? 'text-white/90 hover:text-white'
                      : 'text-slate-800 hover:text-slate-900'
                  }`}
                  style={{
                    ...getGlassStyle('BUTTON', theme, {
                      withBorderGlow: true,
                      withInnerShadow: true,
                    }),
                    boxShadow: theme === 'dark'
                      ? '0 2px 8px rgba(0, 0, 0, 0.3), 0 0.5px 0 0 rgba(255, 255, 255, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)'
                      : '0 2px 10px rgba(0, 0, 0, 0.1), 0 0.5px 0 0 rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
                  }}
                >
                  <FileText className="h-4 w-4" />
                  更新详情
                </motion.button>
              )}

              <motion.button
                {...buttonInteraction}
                type="button"
                onClick={handlePrimaryAction}
                disabled={primaryAction.disabled}
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
                  boxShadow: theme === 'dark'
                    ? '0 2px 8px rgba(0, 0, 0, 0.3), 0 0.5px 0 0 rgba(255, 255, 255, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)'
                    : '0 2px 10px rgba(0, 0, 0, 0.1), 0 0.5px 0 0 rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
                }}
              >
                <PrimaryIcon
                  className={`h-4 w-4 ${primaryAction.spinning ? 'animate-spin' : ''}`}
                />
                {primaryAction.label}
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

      {/* 日志管理（独占一行） */}
      <SettingCard title="日志管理" icon={FileText} theme={theme}>
        <LogManager />
      </SettingCard>

      {/* 高级选项（仅开发环境，折叠面板） */}
      {isDev && (
        <SettingCard title="高级选项" icon={Server} theme={theme}>
          <div className="space-y-3">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center justify-between w-full text-sm font-medium transition-colors ${
                theme === 'dark'
                  ? 'text-white/90 hover:text-white'
                  : 'text-slate-800 hover:text-slate-900'
              }`}
            >
              <span>开发者信息</span>
              {showAdvanced ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-3 pt-2"
                >
                  <SettingItem
                    label="环境"
                    value={import.meta.env.MODE === 'development' ? '开发环境' : '生产环境'}
                  />
                  <SettingItem label="API 地址" value={ADMIN_API_BASE} />
                  <SettingItem label="更新渠道" value={RELEASE_CHANNEL} />
                  <SettingItem
                    label="Electron"
                    value={typeof window !== 'undefined' && window.electron ? '已启用' : '未启用'}
                  />
                  <SettingItem
                    label="Node 集成"
                    value={typeof process !== 'undefined' ? '已启用' : '未启用'}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SettingCard>
      )}

      <Modal
        open={showNotes}
        onClose={() => setShowNotes(false)}
        title={details?.name || `版本 ${details?.version || ''} 更新说明`}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <GlassButton variant="secondary" onClick={() => setShowNotes(false)}>
              关闭
            </GlassButton>
            {state.phase === 'available' && (
              <GlassButton variant="primary" onClick={() => {
                setShowNotes(false);
                downloadUpdate();
              }}>
                立即更新
              </GlassButton>
            )}
          </div>
        }
      >
        <div className={`prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
          {details?.date && (
            <p className={`text-xs mb-4 ${theme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>
              发布于 {new Date(details.date).toLocaleDateString()}
            </p>
          )}
          <div className="text-sm leading-relaxed opacity-90">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {details?.notes || '暂无更新说明'}
            </ReactMarkdown>
          </div>
        </div>
      </Modal>
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
  icon: ElementType;
  theme: 'light' | 'dark';
  children: ReactNode;
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

function SettingToggle({
  label,
  description,
  icon: Icon,
  checked,
  onChange,
  disabled = false,
  theme,
}: {
  label: string;
  description: string;
  icon: ElementType;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  theme: 'light' | 'dark';
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2.5">
        <Icon
          className={`h-4 w-4 ${
            theme === 'dark' ? 'text-white/60' : 'text-slate-500'
          }`}
        />
        <div>
          <p
            className={`text-xs font-medium ${
              theme === 'dark' ? 'text-white/90' : 'text-slate-800'
            }`}
          >
            {label}
          </p>
          <p
            className={`text-xs ${
              theme === 'dark' ? 'text-white/50' : 'text-slate-500'
            }`}
          >
            {description}
          </p>
        </div>
      </div>
      
      <button
        type="button"
        onClick={onChange}
        disabled={disabled}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          checked
            ? 'bg-brand-blue-500'
            : theme === 'dark'
            ? 'bg-white/20'
            : 'bg-slate-300'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
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
