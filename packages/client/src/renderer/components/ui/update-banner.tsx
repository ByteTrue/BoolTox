import { useMemo, useState } from 'react';
import { Download, Loader2, RefreshCw, XCircle, CheckCircle2, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUpdate } from '@/contexts/update-context';
import { useTheme } from '../theme-provider';
import { getGlassStyle } from '@/utils/glass-layers';
import { buttonInteraction } from '@/utils/animation-presets';
import { Modal } from './modal';
import { GlassButton } from './glass-button';

export function UpdateBanner() {
  const {
    state,
    details,
    bannerDismissed,
    downloadUpdate,
    cancelDownload,
    installUpdate,
    dismissUpdate,
    retryCheck,
  } = useUpdate();
  const { theme } = useTheme();
  const [showNotes, setShowNotes] = useState(false);

  const progressPercent = useMemo(() => {
    if (state.phase !== 'downloading' || !state.progress) return 0;
    if (typeof state.progress.percent === 'number') {
      return Math.round(state.progress.percent);
    }
    const { downloadedBytes, totalBytes } = state.progress;
    if (!totalBytes || totalBytes === 0) {
      return 0;
    }
    return Math.min(100, Math.round((downloadedBytes / totalBytes) * 100));
  }, [state]);

  if (bannerDismissed || state.phase === 'idle' || state.phase === 'checking') {
    return null;
  }

  const sizeLabel = details?.sizeBytes ? formatBytes(details.sizeBytes) : undefined;
  const baseStyle = getGlassStyle('CARD', theme);

  return (
    <div
      className={`mb-4 rounded-2xl border px-5 py-4 shadow-unified-md ${
        theme === 'dark' ? 'bg-[#0b1625]/60 text-white' : 'bg-white/80 text-slate-800'
      }`}
      style={baseStyle}  // 使用统一的玻璃边框
    >
      {state.phase === 'available' && details ? (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand-blue-400">
              <Download size={16} />
              发现新版本
              <span className="text-white/70 dark:text-white/70 text-xs font-normal">{details.version}</span>
            </div>
            <p className={`text-sm ${theme === 'dark' ? 'text-white/80' : 'text-slate-600'}`}>
              {details.notes ? truncateText(details.notes, 120) : '可立即下载安装最新版本以获取最新功能和修复。'}
              {sizeLabel ? ` · 安装包大小约 ${sizeLabel}` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <motion.button
              {...buttonInteraction}
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-brand-blue-400 px-4 py-2 text-sm font-semibold text-white transition-[box-shadow,transform] duration-200"
              style={{
                boxShadow: theme === 'dark'
                  ? '0 4px 12px rgba(101, 187, 233, 0.4), 0 0 0 1px rgba(101, 187, 233, 0.3)'
                  : '0 4px 16px rgba(101, 187, 233, 0.35), 0 0 0 1px rgba(101, 187, 233, 0.2)',
              }}
              whileHover={{
                boxShadow: theme === 'dark'
                  ? '0 6px 20px rgba(101, 187, 233, 0.5), 0 0 0 1px rgba(101, 187, 233, 0.4)'
                  : '0 6px 24px rgba(101, 187, 233, 0.45), 0 0 0 1px rgba(101, 187, 233, 0.3)',
              }}
              onClick={downloadUpdate}
            >
              <Download size={16} /> 立即下载
            </motion.button>
            <motion.button
              {...buttonInteraction}
              type="button"
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-[background-color,box-shadow] duration-200 ${
                theme === 'dark' ? 'text-white/90' : 'text-slate-800'
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
              onClick={() => setShowNotes(true)}
            >
              <FileText size={16} /> 更新详情
            </motion.button>
            <motion.button
              {...buttonInteraction}
              type="button"
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-[background-color,box-shadow] duration-200 ${
                theme === 'dark' ? 'text-white/90' : 'text-slate-800'
              } ${details.mandatory ? 'opacity-60 cursor-not-allowed' : ''}`}
              style={{
                ...getGlassStyle('BUTTON', theme, {
                  withBorderGlow: true,
                  withInnerShadow: true,
                }),
                boxShadow: theme === 'dark'
                  ? '0 2px 8px rgba(0, 0, 0, 0.3), 0 0.5px 0 0 rgba(255, 255, 255, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)'
                  : '0 2px 10px rgba(0, 0, 0, 0.1), 0 0.5px 0 0 rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
              }}
              onClick={dismissUpdate}
              disabled={details.mandatory}
            >
              稍后提醒
            </motion.button>
          </div>
        </div>
      ) : null}

      {state.phase === 'downloading' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Loader2 size={18} className="animate-spin" />
            正在下载更新包
            {sizeLabel ? <span className="text-xs text-white/60 dark:text-white/60">（约 {sizeLabel}）</span> : null}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <div
              className="h-full rounded-full bg-brand-gradient-secondary transition-[width] duration-250 ease-swift"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-white/60 dark:text-white/60">
            <span>{progressPercent}%</span>
            {state.progress?.totalBytes ? (
              <span>
                {formatBytes(state.progress.downloadedBytes)} / {formatBytes(state.progress.totalBytes)}
              </span>
            ) : null}
          </div>
          <div className="flex justify-end">
            <motion.button
              {...buttonInteraction}
              type="button"
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-[background-color,box-shadow] duration-200 ${
                theme === 'dark' ? 'text-white/90' : 'text-slate-800'
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
              onClick={cancelDownload}
            >
              取消下载
            </motion.button>
          </div>
        </div>
      )}

      {state.phase === 'downloaded' && details ? (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={24} className="text-green-400" />
            <div>
              <p className="text-sm font-semibold">更新包已准备就绪</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>
                版本 {details.version} 下载完成，点击安装以完成更新。
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <motion.button
              {...buttonInteraction}
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-brand-blue-400 px-4 py-2 text-sm font-semibold text-white transition-[box-shadow,transform] duration-200"
              style={{
                boxShadow: theme === 'dark'
                  ? '0 4px 12px rgba(101, 187, 233, 0.4), 0 0 0 1px rgba(101, 187, 233, 0.3)'
                  : '0 4px 16px rgba(101, 187, 233, 0.35), 0 0 0 1px rgba(101, 187, 233, 0.2)',
              }}
              whileHover={{
                boxShadow: theme === 'dark'
                  ? '0 6px 20px rgba(101, 187, 233, 0.5), 0 0 0 1px rgba(101, 187, 233, 0.4)'
                  : '0 6px 24px rgba(101, 187, 233, 0.45), 0 0 0 1px rgba(101, 187, 233, 0.3)',
              }}
              onClick={installUpdate}
            >
              打开安装程序
            </motion.button>
            <motion.button
              {...buttonInteraction}
              type="button"
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-[background-color,box-shadow] duration-200 ${
                theme === 'dark' ? 'text-white/90' : 'text-slate-800'
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
              onClick={dismissUpdate}
            >
              稍后再说
            </motion.button>
          </div>
        </div>
      ) : null}

      {state.phase === 'error' && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <XCircle size={24} className="text-rose-400" />
            <div>
              <p className="text-sm font-semibold">更新遇到问题</p>
              <p className={`text-xs ${theme === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>
                {state.error ?? '下载或安装过程中发生错误，请重试。'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {details ? (
              <motion.button
                {...buttonInteraction}
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-brand-blue-400 px-4 py-2 text-sm font-semibold text-white transition-[box-shadow,transform] duration-200"
                style={{
                  boxShadow: theme === 'dark'
                    ? '0 4px 12px rgba(101, 187, 233, 0.4), 0 0 0 1px rgba(101, 187, 233, 0.3)'
                    : '0 4px 16px rgba(101, 187, 233, 0.35), 0 0 0 1px rgba(101, 187, 233, 0.2)',
                }}
                whileHover={{
                  boxShadow: theme === 'dark'
                    ? '0 6px 20px rgba(101, 187, 233, 0.5), 0 0 0 1px rgba(101, 187, 233, 0.4)'
                    : '0 6px 24px rgba(101, 187, 233, 0.45), 0 0 0 1px rgba(101, 187, 233, 0.3)',
                }}
                onClick={downloadUpdate}
              >
                <RefreshCw size={16} /> 重新下载
              </motion.button>
            ) : (
              <motion.button
                {...buttonInteraction}
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-brand-blue-400 px-4 py-2 text-sm font-semibold text-white transition-[box-shadow,transform] duration-200"
                style={{
                  boxShadow: theme === 'dark'
                    ? '0 4px 12px rgba(101, 187, 233, 0.4), 0 0 0 1px rgba(101, 187, 233, 0.3)'
                    : '0 4px 16px rgba(101, 187, 233, 0.35), 0 0 0 1px rgba(101, 187, 233, 0.2)',
                }}
                whileHover={{
                  boxShadow: theme === 'dark'
                    ? '0 6px 20px rgba(101, 187, 233, 0.5), 0 0 0 1px rgba(101, 187, 233, 0.4)'
                    : '0 6px 24px rgba(101, 187, 233, 0.45), 0 0 0 1px rgba(101, 187, 233, 0.3)',
                }}
                onClick={retryCheck}
              >
                <RefreshCw size={16} /> 重新检查
              </motion.button>
            )}
            <motion.button
              {...buttonInteraction}
              type="button"
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-[background-color,box-shadow] duration-200 ${
                theme === 'dark' ? 'text-white/90' : 'text-slate-800'
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
              onClick={dismissUpdate}
            >
              隐藏提示
            </motion.button>
          </div>
        </div>
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
            <GlassButton variant="primary" onClick={() => {
              setShowNotes(false);
              downloadUpdate();
            }}>
              立即更新
            </GlassButton>
          </div>
        }
      >
        <div className={`prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
          {details?.date && (
            <p className={`text-xs mb-4 ${theme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>
              发布于 {new Date(details.date).toLocaleDateString()}
            </p>
          )}
          <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed opacity-90">
            {details?.notes || '暂无更新说明'}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function truncateText(text: string, limit: number) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}…`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = -1;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
