/**
 * 触觉反馈演示页面
 * 
 * 展示 Task 2.3 实现的所有触觉反馈效果
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './theme-provider';
import { getGlassStyle } from '../utils/glass-layers';
import { Toggle } from './ui/toggle';
import { DraggableCard } from './ui/draggable-card';
import { HapticScrollContainer } from './ui/haptic-scroll';
import { useToast, ToastContainer } from './ui/toast';
import {
  buttonTapFeedback,
  iconButtonTapFeedback,
  checkboxHapticFeedback,
  successHapticFeedback,
  errorHapticFeedback,
  notificationArrivalFeedback,
  pulseFeedback,
  longPressFeedback,
} from '../utils/haptic-feedback';
import {
  Heart,
  Star,
  Check,
  Bell,
  Zap,
  Activity,
  Box,
} from 'lucide-react';

export function HapticFeedbackDemo() {
  const { theme } = useTheme();
  const toast = useToast();
  const [checked, setChecked] = useState(false);
  const [toggle, setToggle] = useState(false);

  return (
    <div className="p-8 space-y-12">
      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />

      {/* Header */}
      <div>
        <h1
          className={`text-3xl font-bold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}
        >
          🎯 触觉反馈模拟
        </h1>
        <p
          className={`text-sm ${
            theme === 'dark' ? 'text-white/60' : 'text-slate-600'
          }`}
        >
          Task 2.3: 通过动画模拟物理触觉反馈
        </p>
      </div>

      {/* Section 1: 按钮触觉反馈 */}
      <section>
        <h2
          className={`text-xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}
        >
          1. 按钮点击触觉反馈
        </h2>

        <div
          className="rounded-2xl border p-6 space-y-6"
          style={getGlassStyle('CARD', theme)}
        >
          <div>
            <h3
              className={`text-sm font-medium mb-3 ${
                theme === 'dark' ? 'text-white/80' : 'text-slate-700'
              }`}
            >
              标准按钮 (Scale 0.95 + 回弹)
            </h3>
            <div className="flex flex-wrap gap-3">
              <motion.button
                variants={buttonTapFeedback}
                initial="initial"
                whileTap="tap"
                className={`px-6 py-2.5 rounded-xl font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-brand-blue-500 text-white hover:bg-brand-blue-600'
                    : 'bg-brand-blue-400 text-white hover:bg-brand-blue-500'
                }`}
                onClick={() =>
                  toast.info('按钮点击', '感受到触觉反馈了吗？')
                }
              >
                点击我
              </motion.button>

              <motion.button
                variants={buttonTapFeedback}
                initial="initial"
                whileTap="tap"
                className={`px-6 py-2.5 rounded-xl font-medium border transition-colors ${
                  theme === 'dark'
                    ? 'border-white/20 text-white hover:bg-white/10'
                    : 'border-black/10 text-slate-700 hover:bg-black/5'
                }`}
              >
                次要按钮
              </motion.button>
            </div>
          </div>

          <div>
            <h3
              className={`text-sm font-medium mb-3 ${
                theme === 'dark' ? 'text-white/80' : 'text-slate-700'
              }`}
            >
              图标按钮 (Scale 0.92 + 更快回弹)
            </h3>
            <div className="flex flex-wrap gap-3">
              {[Heart, Star, Bell, Zap].map((Icon, index) => (
                <motion.button
                  key={index}
                  variants={iconButtonTapFeedback}
                  initial="initial"
                  whileTap="tap"
                  className={`p-3 rounded-xl transition-colors ${
                    theme === 'dark'
                      ? 'hover:bg-white/10 text-white/80 hover:text-white'
                      : 'hover:bg-black/5 text-slate-600 hover:text-slate-800'
                  }`}
                  onClick={() => toast.success('点赞', '已添加到收藏')}
                >
                  <Icon size={20} />
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Checkbox 触觉反馈 */}
      <section>
        <h2
          className={`text-xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}
        >
          2. Checkbox 勾选触觉反馈
        </h2>

        <div
          className="rounded-2xl border p-6"
          style={getGlassStyle('CARD', theme)}
        >
          <div className="space-y-4">
            <motion.label className="flex items-center gap-3 cursor-pointer">
              <motion.div
                variants={checkboxHapticFeedback}
                initial="unchecked"
                animate={checked ? 'checked' : 'unchecked'}
                onClick={() => setChecked(!checked)}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                  checked
                    ? 'bg-brand-blue-500 border-brand-blue-500'
                    : theme === 'dark'
                    ? 'border-white/30'
                    : 'border-slate-300'
                }`}
              >
                {checked && <Check size={16} className="text-white" />}
              </motion.div>
              <span
                className={
                  theme === 'dark' ? 'text-white' : 'text-slate-700'
                }
              >
                压缩→弹出 + 轻微旋转
              </span>
            </motion.label>

            <div className="mt-4">
              <Toggle
                checked={toggle}
                onChange={setToggle}
                label="Toggle 开关 (先过冲再回弹)"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: 拖拽触觉反馈 */}
      <section>
        <h2
          className={`text-xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}
        >
          3. 拖拽操作触觉反馈
        </h2>

        <div
          className="rounded-2xl border p-6"
          style={getGlassStyle('CARD', theme)}
        >
          <p
            className={`text-sm mb-4 ${
              theme === 'dark' ? 'text-white/70' : 'text-slate-600'
            }`}
          >
            💡 拖拽卡片体验：缩小 + 旋转 + 阴影增强
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DraggableCard onDragEnd={() => toast.info('拖拽', '卡片已释放')}>
              <div className="flex items-center gap-3">
                <Box
                  size={24}
                  className={
                    theme === 'dark' ? 'text-brand-blue-400' : 'text-brand-blue-500'
                  }
                />
                <div>
                  <h4
                    className={`font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    可拖拽卡片 1
                  </h4>
                  <p
                    className={`text-xs ${
                      theme === 'dark' ? 'text-white/60' : 'text-slate-600'
                    }`}
                  >
                    橡皮筋边界效果
                  </p>
                </div>
              </div>
            </DraggableCard>

            <DraggableCard>
              <div className="flex items-center gap-3">
                <Activity
                  size={24}
                  className={
                    theme === 'dark' ? 'text-brand-green-400' : 'text-brand-green-500'
                  }
                />
                <div>
                  <h4
                    className={`font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    可拖拽卡片 2
                  </h4>
                  <p
                    className={`text-xs ${
                      theme === 'dark' ? 'text-white/60' : 'text-slate-600'
                    }`}
                  >
                    透明度随距离变化
                  </p>
                </div>
              </div>
            </DraggableCard>
          </div>
        </div>
      </section>

      {/* Section 4: 滚动橡皮筋效果 */}
      <section>
        <h2
          className={`text-xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}
        >
          4. 滚动边界触觉反馈
        </h2>

        <div
          className="rounded-2xl border p-6"
          style={getGlassStyle('CARD', theme)}
        >
          <p
            className={`text-sm mb-4 ${
              theme === 'dark' ? 'text-white/70' : 'text-slate-600'
            }`}
          >
            💡 滚动到顶部/底部时会触发橡皮筋回弹效果
          </p>

          <HapticScrollContainer maxHeight="300px" enableBounce>
            <div className="space-y-3 p-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-4 rounded-xl ${
                    theme === 'dark' ? 'bg-white/5' : 'bg-black/5'
                  }`}
                >
                  <p
                    className={
                      theme === 'dark' ? 'text-white/80' : 'text-slate-700'
                    }
                  >
                    列表项 #{i + 1}
                  </p>
                </motion.div>
              ))}
            </div>
          </HapticScrollContainer>
        </div>
      </section>

      {/* Section 5: 通知触觉反馈 */}
      <section>
        <h2
          className={`text-xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}
        >
          5. 状态反馈动画
        </h2>

        <div
          className="rounded-2xl border p-6 space-y-6"
          style={getGlassStyle('CARD', theme)}
        >
          <div>
            <h3
              className={`text-sm font-medium mb-3 ${
                theme === 'dark' ? 'text-white/80' : 'text-slate-700'
              }`}
            >
              成功/错误反馈
            </h3>
            <div className="flex flex-wrap gap-3">
              <motion.button
                variants={successHapticFeedback}
                initial="initial"
                whileTap="success"
                className="px-6 py-2.5 rounded-xl font-medium bg-brand-green-500 text-white hover:bg-brand-green-600 transition-colors"
                onClick={() => toast.success('成功', '操作已完成')}
              >
                成功动画 (放大 + 旋转)
              </motion.button>

              <motion.button
                variants={errorHapticFeedback}
                initial="initial"
                whileTap="error"
                className="px-6 py-2.5 rounded-xl font-medium bg-brand-red-500 text-white hover:bg-brand-red-600 transition-colors"
                onClick={() => toast.error('错误', '操作失败')}
              >
                错误动画 (震动)
              </motion.button>
            </div>
          </div>

          <div>
            <h3
              className={`text-sm font-medium mb-3 ${
                theme === 'dark' ? 'text-white/80' : 'text-slate-700'
              }`}
            >
              通知到达动画
            </h3>
            <motion.button
              variants={notificationArrivalFeedback}
              initial="initial"
              whileTap="arrive"
              className={`px-6 py-2.5 rounded-xl font-medium border transition-colors ${
                theme === 'dark'
                  ? 'border-white/20 text-white hover:bg-white/10'
                  : 'border-black/10 text-slate-700 hover:bg-black/5'
              }`}
              onClick={() =>
                toast.info('新通知', '您有一条新消息', 0)
              }
            >
              触发通知 (左右震动)
            </motion.button>
          </div>

          <div>
            <h3
              className={`text-sm font-medium mb-3 ${
                theme === 'dark' ? 'text-white/80' : 'text-slate-700'
              }`}
            >
              脉冲吸引注意
            </h3>
            <motion.div
              variants={pulseFeedback}
              initial="initial"
              animate="pulse"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-yellow-500/20 border border-brand-yellow-500/30"
            >
              <Bell size={16} className="text-brand-yellow-500" />
              <span
                className={
                  theme === 'dark' ? 'text-brand-yellow-300' : 'text-brand-yellow-700'
                }
              >
                持续脉冲动画
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section 6: 长按触觉反馈 */}
      <section>
        <h2
          className={`text-xl font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}
        >
          6. 长按触觉反馈
        </h2>

        <div
          className="rounded-2xl border p-6"
          style={getGlassStyle('CARD', theme)}
        >
          <p
            className={`text-sm mb-4 ${
              theme === 'dark' ? 'text-white/70' : 'text-slate-600'
            }`}
          >
            💡 按住按钮体验：持续压缩 + 释放弹出
          </p>

          <motion.button
            variants={longPressFeedback}
            initial="initial"
            whileTap="pressing"
            onTap={() => {
              toast.info('长按', '检测到长按操作');
            }}
            className={`px-8 py-4 rounded-xl font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-brand-purple-500 text-white hover:bg-brand-purple-600'
                : 'bg-brand-purple-400 text-white hover:bg-brand-purple-500'
            }`}
          >
            按住我 (长按反馈)
          </motion.button>
        </div>
      </section>

      {/* Section 7: 交互提示 */}
      <section>
        <div
          className="rounded-2xl border p-6"
          style={getGlassStyle('CARD', theme)}
        >
          <div
            className={`text-sm ${
              theme === 'dark' ? 'text-white/70' : 'text-slate-600'
            }`}
          >
            <p className="mb-2">
              💡 <strong>触觉反馈原理：</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>通过 Scale 变换模拟物理按压感觉</li>
              <li>Spring 动画模拟弹性回弹</li>
              <li>旋转/位移模拟震动效果</li>
              <li>阴影变化增强深度感知</li>
              <li>橡皮筋边界模拟滚动阻尼</li>
              <li>所有动画遵循 Apple Taptic Engine 设计规范</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
