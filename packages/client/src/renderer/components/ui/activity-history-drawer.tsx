import { useId } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useTheme } from '../theme-provider';
import { getGlassStyle, getGlassShadow, GLASS_BORDERS } from '@/utils/glass-layers';
import { iconButtonInteraction } from '@/utils/animation-presets';
import { ActivityTimeline } from './activity-timeline';
import type { ModuleEvent } from '@/utils/module-event-logger';

export interface ActivityHistoryDrawerProps {
  open: boolean;
  events: ModuleEvent[];
  onClose: () => void;
}

/**
 * 操作记录历史抽屉组件
 * 右侧滑入展示所有操作历史
 */
export function ActivityHistoryDrawer({ open, events, onClose }: ActivityHistoryDrawerProps) {
  const { theme } = useTheme();
  const drawerId = useId();

  const drawerContent = (
    <AnimatePresence>
      {open && (
        <>
          {/* 遮罩层 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer 主体 */}
          <motion.div
            id={drawerId}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed right-0 top-0 z-[9999] h-full w-full sm:w-[480px] border-l ${getGlassShadow(
              theme
            )}`}
            style={{
              ...getGlassStyle('CARD', theme),
              borderColor:
                theme === 'dark'
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'rgba(101, 187, 233, 0.15)',
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${drawerId}-title`}
          >
            {/* 头部 */}
            <div
              className="flex items-center justify-between border-b p-6"
              style={{
                borderColor: theme === 'dark' ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT
              }}
            >
              <h2
                id={`${drawerId}-title`}
                className={`text-xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}
              >
                📝 操作历史
              </h2>
              <motion.button
                {...iconButtonInteraction}
                type="button"
                onClick={onClose}
                className={`rounded-lg p-2 transition-[background-color,transform] duration-250 ease-swift ${
                  theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-slate-100'
                }`}
                aria-label="关闭"
              >
                <X
                  className={`h-5 w-5 ${
                    theme === 'dark' ? 'text-white/70' : 'text-slate-600'
                  }`}
                />
              </motion.button>
            </div>

            {/* 内容区域 */}
            <div className="h-[calc(100%-100px)] overflow-y-auto elegant-scroll p-6">
              {events.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <p
                    className={`text-sm ${
                      theme === 'dark' ? 'text-white/50' : 'text-slate-400'
                    }`}
                  >
                    暂无操作记录
                  </p>
                </div>
              ) : (
                <ActivityTimeline events={events} maxItems={events.length} />
              )}
            </div>

            {/* 底部统计 */}
            <div
              className="absolute bottom-0 left-0 right-0 border-t p-4 text-center"
              style={{
                ...getGlassStyle('PANEL', theme),
                borderColor: theme === 'dark' ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT
              }}
            >
              <p
                className={`text-xs ${
                  theme === 'dark' ? 'text-white/50' : 'text-slate-500'
                }`}
              >
                共 {events.length} 条操作记录
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(drawerContent, document.body);
}
