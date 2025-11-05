/**
 * 背景模糊效果演示页面
 * 
 * 展示 Task 2.4 实现的所有背景模糊效果
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './theme-provider';
import { getGlassStyle } from '../utils/glass-layers';
import {
  getBlurStyle,
  getModalBackdropBlur,
  getDropdownBlur,
  getTooltipBlur,
  supportsBackdropFilter,
  BlurIntensity,
  BlurLayer,
} from '../utils/blur-effects';
import { GlassButton } from './ui/glass-button';
import { Modal } from './ui/modal';
import { Dropdown } from './ui/dropdown';
import { useToast, ToastContainer } from './ui/toast';
import {
  Layers,
  Maximize,
  Menu,
  MessageSquare,
  Settings,
  User,
  Sparkles,
} from 'lucide-react';

export function BlurEffectsDemo() {
  const { theme } = useTheme();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIntensity, setSelectedIntensity] = useState<BlurIntensity>('medium');
  const [selectedLayer, setSelectedLayer] = useState<BlurLayer>('panel');

  const intensities: BlurIntensity[] = ['subtle', 'light', 'medium', 'strong', 'ultra'];
  const layers: BlurLayer[] = ['titlebar', 'sidebar', 'panel', 'modal', 'dropdown', 'tooltip', 'card', 'overlay'];

  return (
    <div className="p-8 space-y-12 relative">
      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />

      {/* 背景图片用于测试模糊效果 */}
      <div
        className="fixed inset-0 z-0 opacity-30"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.8)',
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div>
          <h1
            className={`text-3xl font-bold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}
          >
            🌫️ 背景模糊效果
          </h1>
          <p
            className={`text-sm ${
              theme === 'dark' ? 'text-white/60' : 'text-slate-600'
            }`}
          >
            Task 2.4: Apple 风格背景模糊优化
          </p>
          
          {/* 浏览器支持检测 */}
          <div
            className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl ${
              supportsBackdropFilter()
                ? 'bg-brand-green-500/20 border border-brand-green-500/30'
                : 'bg-brand-yellow-500/20 border border-brand-yellow-500/30'
            }`}
          >
            <Sparkles
              size={16}
              className={
                supportsBackdropFilter()
                  ? 'text-brand-green-500'
                  : 'text-brand-yellow-500'
              }
            />
            <span
              className={`text-sm ${
                theme === 'dark' ? 'text-white/80' : 'text-slate-700'
              }`}
            >
              {supportsBackdropFilter()
                ? '✓ 您的浏览器完美支持 backdrop-filter'
                : '⚠ 您的浏览器不支持 backdrop-filter，已启用降级方案'}
            </span>
          </div>
        </div>

        {/* Section 1: 模糊强度对比 */}
        <section>
          <h2
            className={`text-xl font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}
          >
            1. 模糊强度等级
          </h2>

          <div
            className="rounded-2xl border p-6 space-y-4"
            style={getGlassStyle('CARD', theme)}
          >
            <p
              className={`text-sm mb-4 ${
                theme === 'dark' ? 'text-white/70' : 'text-slate-600'
              }`}
            >
              💡 5 个模糊强度等级：subtle → light → medium → strong → ultra
            </p>

            <div className="grid grid-cols-5 gap-3">
              {intensities.map((intensity) => (
                <motion.div
                  key={intensity}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-xl border p-6 cursor-pointer"
                  style={getBlurStyle('panel', theme, intensity)}
                  onClick={() => setSelectedIntensity(intensity)}
                >
                  <div className="text-center">
                    <Layers
                      size={24}
                      className={`mx-auto mb-2 ${
                        selectedIntensity === intensity
                          ? 'text-brand-blue-400'
                          : theme === 'dark'
                          ? 'text-white/60'
                          : 'text-slate-600'
                      }`}
                    />
                    <p
                      className={`text-xs font-medium capitalize ${
                        theme === 'dark' ? 'text-white/80' : 'text-slate-700'
                      }`}
                    >
                      {intensity}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: 模糊层级展示 */}
        <section>
          <h2
            className={`text-xl font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}
          >
            2. 模糊层级类型
          </h2>

          <div
            className="rounded-2xl border p-6 space-y-4"
            style={getGlassStyle('CARD', theme)}
          >
            <p
              className={`text-sm mb-4 ${
                theme === 'dark' ? 'text-white/70' : 'text-slate-600'
              }`}
            >
              💡 8 种预设模糊层级，适用于不同 UI 元素
            </p>

            <div className="grid grid-cols-4 gap-4">
              {layers.map((layer) => (
                <motion.div
                  key={layer}
                  whileHover={{ scale: 1.02 }}
                  className="rounded-xl border p-4"
                  style={getBlurStyle(layer, theme, 'medium')}
                  onClick={() => setSelectedLayer(layer)}
                >
                  <div
                    className={`text-sm font-medium capitalize ${
                      theme === 'dark' ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    {layer}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      theme === 'dark' ? 'text-white/50' : 'text-slate-500'
                    }`}
                  >
                    {getBlurDescription(layer)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: 实际应用演示 */}
        <section>
          <h2
            className={`text-xl font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}
          >
            3. 实际应用演示
          </h2>

          <div className="grid grid-cols-2 gap-6">
            {/* Modal 模糊 */}
            <div
              className="rounded-2xl border p-6 space-y-4"
              style={getGlassStyle('CARD', theme)}
            >
              <div className="flex items-center gap-3 mb-4">
                <Maximize
                  size={20}
                  className={
                    theme === 'dark' ? 'text-brand-blue-400' : 'text-brand-blue-500'
                  }
                />
                <h3
                  className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  Modal 背景模糊
                </h3>
              </div>
              <p
                className={`text-sm ${
                  theme === 'dark' ? 'text-white/70' : 'text-slate-600'
                }`}
              >
                20px blur + 降低亮度
              </p>
              <GlassButton
                variant="primary"
                onClick={() => setModalOpen(true)}
              >
                打开 Modal 测试
              </GlassButton>
            </div>

            {/* Dropdown 模糊 */}
            <div
              className="rounded-2xl border p-6 space-y-4"
              style={getGlassStyle('CARD', theme)}
            >
              <div className="flex items-center gap-3 mb-4">
                <Menu
                  size={20}
                  className={
                    theme === 'dark' ? 'text-brand-green-400' : 'text-brand-green-500'
                  }
                />
                <h3
                  className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  Dropdown 模糊
                </h3>
              </div>
              <p
                className={`text-sm ${
                  theme === 'dark' ? 'text-white/70' : 'text-slate-600'
                }`}
              >
                24px blur + 高饱和度
              </p>
              <Dropdown
                items={[
                  {
                    id: '1',
                    label: '个人资料',
                    icon: <User size={16} />,
                    onClick: () => toast.info('导航', '前往个人资料'),
                  },
                  {
                    id: '2',
                    label: '设置',
                    icon: <Settings size={16} />,
                    onClick: () => toast.info('导航', '前往设置'),
                  },
                ]}
                trigger={
                  <GlassButton variant="secondary">
                    打开菜单测试
                  </GlassButton>
                }
              />
            </div>

            {/* Toast 模糊 */}
            <div
              className="rounded-2xl border p-6 space-y-4"
              style={getGlassStyle('CARD', theme)}
            >
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare
                  size={20}
                  className={
                    theme === 'dark' ? 'text-brand-purple-400' : 'text-brand-purple-500'
                  }
                />
                <h3
                  className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  Toast 模糊
                </h3>
              </div>
              <p
                className={`text-sm ${
                  theme === 'dark' ? 'text-white/70' : 'text-slate-600'
                }`}
              >
                16px blur + 高亮度
              </p>
              <GlassButton
                variant="success"
                onClick={() => toast.success('测试通知', '这是一个带有模糊效果的 Toast')}
              >
                触发 Toast 测试
              </GlassButton>
            </div>

            {/* 动态强度测试 */}
            <div
              className="rounded-2xl border p-6 space-y-4"
              style={getGlassStyle('CARD', theme)}
            >
              <div className="flex items-center gap-3 mb-4">
                <Sparkles
                  size={20}
                  className={
                    theme === 'dark' ? 'text-brand-yellow-400' : 'text-brand-yellow-500'
                  }
                />
                <h3
                  className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  动态模糊预览
                </h3>
              </div>
              <div
                className="rounded-xl p-4 text-center"
                style={getBlurStyle(selectedLayer, theme, selectedIntensity)}
              >
                <p
                  className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  {selectedLayer} / {selectedIntensity}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: 技术说明 */}
        <section>
          <div
            className="rounded-2xl border p-6"
            style={getGlassStyle('CARD', theme)}
          >
            <h3
              className={`text-lg font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-slate-800'
              }`}
            >
              🔧 技术实现
            </h3>
            <div
              className={`text-sm space-y-2 ${
                theme === 'dark' ? 'text-white/70' : 'text-slate-600'
              }`}
            >
              <p>
                <strong>backdrop-filter: blur(Xpx)</strong> - 核心模糊效果
              </p>
              <p>
                <strong>brightness(X)</strong> - 调整透过模糊的亮度
              </p>
              <p>
                <strong>saturate(X)</strong> - 增强色彩饱和度
              </p>
              <p>
                <strong>自动降级</strong> - 不支持的浏览器自动增加不透明度
              </p>
              <p className="mt-4">
                <strong>参考标准：</strong>
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>macOS: systemMaterial (40-80px blur)</li>
                <li>iOS: ultraThinMaterial (40-60px blur)</li>
                <li>Fluent Design: Acrylic (30px blur)</li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* Modal 实例 */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="背景模糊测试"
        size="md"
      >
        <div className={theme === 'dark' ? 'text-white/70' : 'text-slate-600'}>
          <p className="mb-4">
            注意观察 Modal 背后的背景图片被模糊处理的效果。
          </p>
          <p className="mb-4">
            这种效果遵循 Apple macOS Big Sur 的设计规范，使用了 20px 的模糊强度。
          </p>
          <p>
            同时降低了亮度，确保前景内容的可读性。
          </p>
        </div>
      </Modal>
    </div>
  );
}

function getBlurDescription(layer: BlurLayer): string {
  const descriptions: Record<BlurLayer, string> = {
    titlebar: '60px - 最强模糊',
    sidebar: '40px - 侧边栏',
    panel: '30px - 面板容器',
    modal: '20px - 对话框',
    dropdown: '24px - 下拉菜单',
    tooltip: '16px - 提示框',
    card: '12px - 卡片组件',
    overlay: '12px - 遮罩层',
  };
  return descriptions[layer];
}
