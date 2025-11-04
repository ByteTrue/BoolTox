/**
 * 微交互动画展示页面
 * 
 * 展示 Task 2.2 实现的所有增强动画效果
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './theme-provider';
import { getGlassStyle } from '../utils/glass-layers';
import { GlassButton } from './ui/glass-button';
import { Toggle } from './ui/toggle';
import { Input } from './ui/input';
import { useToast, ToastContainer } from './ui/toast';
import { Modal, ConfirmDialog } from './ui/modal';
import { Dropdown, Select } from './ui/dropdown';
import { 
  Download, 
  RefreshCw, 
  Trash2, 
  Search, 
  Mail,
  Lock,
  User,
  Heart,
  Star,
  Settings,
  Bell,
  Share2,
  Copy,
  MoreVertical,
} from 'lucide-react';

export function MicroInteractionsDemo() {
  const { theme } = useTheme();
  const toast = useToast();
  const [toggle1, setToggle1] = useState(false);
  const [toggle2, setToggle2] = useState(true);
  const [toggle3, setToggle3] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectValue, setSelectValue] = useState('option1');

  return (
    <div className="p-8 space-y-12">
      {/* Toast Container */}
      <ToastContainer toasts={toast.toasts} onRemove={toast.remove} />

      {/* Header */}
      <div>
        <h1 className={`text-3xl font-bold mb-2 ${
          theme === 'dark' ? 'text-white' : 'text-slate-800'
        }`}>
          🎨 微交互动画展示
        </h1>
        <p className={`text-sm ${
          theme === 'dark' ? 'text-white/60' : 'text-slate-600'
        }`}>
          Task 2.2: Apple 风格微交互动画增强效果
        </p>
      </div>

      {/* Section 1: 按钮动画 */}
      <section>
        <h2 className={`text-xl font-bold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-slate-800'
        }`}>
          1. 按钮微交互动画
        </h2>
        
        <div
          className="rounded-2xl border p-6 space-y-4"
          style={getGlassStyle('CARD', theme)}
        >
          <div>
            <h3 className={`text-sm font-medium mb-3 ${
              theme === 'dark' ? 'text-white/80' : 'text-slate-700'
            }`}>
              Primary 按钮（放大 1.05x + 品牌色光晕）
            </h3>
            <div className="flex flex-wrap gap-3">
              <GlassButton variant="primary" icon={<Download size={16} />}>
                立即下载
              </GlassButton>
              <GlassButton variant="primary" icon={<RefreshCw size={16} />}>
                刷新数据
              </GlassButton>
              <GlassButton variant="primary" iconRight={<Heart size={16} />}>
                收藏
              </GlassButton>
            </div>
          </div>

          <div>
            <h3 className={`text-sm font-medium mb-3 ${
              theme === 'dark' ? 'text-white/80' : 'text-slate-700'
            }`}>
              Secondary 按钮（微妙放大 1.02x）
            </h3>
            <div className="flex flex-wrap gap-3">
              <GlassButton variant="secondary" icon={<Settings size={16} />}>
                设置
              </GlassButton>
              <GlassButton variant="secondary">取消</GlassButton>
              <GlassButton variant="secondary" size="sm">
                小按钮
              </GlassButton>
            </div>
          </div>

          <div>
            <h3 className={`text-sm font-medium mb-3 ${
              theme === 'dark' ? 'text-white/80' : 'text-slate-700'
            }`}>
              其他变体
            </h3>
            <div className="flex flex-wrap gap-3">
              <GlassButton variant="success" icon={<Star size={16} />}>
                成功
              </GlassButton>
              <GlassButton variant="danger" icon={<Trash2 size={16} />}>
                删除
              </GlassButton>
              <GlassButton variant="ghost">幽灵按钮</GlassButton>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Toggle 开关 */}
      <section>
        <h2 className={`text-xl font-bold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-slate-800'
        }`}>
          2. Toggle 开关动画
        </h2>
        
        <div
          className="rounded-2xl border p-6 space-y-6"
          style={getGlassStyle('CARD', theme)}
        >
          <div>
            <h3 className={`text-sm font-medium mb-3 ${
              theme === 'dark' ? 'text-white/80' : 'text-slate-700'
            }`}>
              Spring 弹性动画 + 颜色过渡
            </h3>
            <div className="space-y-4">
              <Toggle
                checked={toggle1}
                onChange={setToggle1}
                label="启用功能"
              />
              <Toggle
                checked={toggle2}
                onChange={setToggle2}
                label="自动更新"
                size="lg"
              />
              <Toggle
                checked={toggle3}
                onChange={setToggle3}
                label="推送通知"
                size="sm"
              />
              <Toggle
                checked={false}
                onChange={() => {}}
                label="禁用状态"
                disabled
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: 输入框 Focus 动画 */}
      <section>
        <h2 className={`text-xl font-bold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-slate-800'
        }`}>
          3. 输入框 Focus 光晕效果
        </h2>
        
        <div
          className="rounded-2xl border p-6 space-y-6"
          style={getGlassStyle('CARD', theme)}
        >
          <div className="space-y-4">
            <Input
              label="用户名"
              placeholder="请输入用户名"
              leftIcon={<User size={16} />}
              value={inputValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
              maxLength={20}
              showCount
              helpText="用户名将用于登录"
            />

            <Input
              label="邮箱"
              type="email"
              placeholder="your@email.com"
              leftIcon={<Mail size={16} />}
              value={emailValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailValue(e.target.value)}
              success={emailValue.includes('@')}
            />

            <Input
              label="密码"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock size={16} />}
              value={passwordValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordValue(e.target.value)}
              error={passwordValue && passwordValue.length < 6 ? '密码长度至少 6 位' : undefined}
            />

            <Input
              placeholder="搜索..."
              leftIcon={<Search size={16} />}
              size="lg"
            />

            <Input
              placeholder="禁用状态"
              disabled
            />
          </div>
        </div>
      </section>

      {/* Section 4: Toast 通知 */}
      <section>
        <h2 className={`text-xl font-bold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-slate-800'
        }`}>
          4. Toast 通知动画
        </h2>
        
        <div
          className="rounded-2xl border p-6"
          style={getGlassStyle('CARD', theme)}
        >
          <div className="space-y-3">
            <h3 className={`text-sm font-medium mb-3 ${
              theme === 'dark' ? 'text-white/80' : 'text-slate-700'
            }`}>
              从右侧滑入 + 自动消失 + 进度条
            </h3>
            <div className="flex flex-wrap gap-3">
              <GlassButton
                variant="secondary"
                onClick={() => toast.info('信息提示', '这是一条普通信息提示')}
              >
                Info Toast
              </GlassButton>
              <GlassButton
                variant="success"
                onClick={() => toast.success('操作成功', '您的操作已成功完成')}
              >
                Success Toast
              </GlassButton>
              <GlassButton
                variant="secondary"
                onClick={() => toast.warning('注意', '请注意检查相关设置')}
              >
                Warning Toast
              </GlassButton>
              <GlassButton
                variant="danger"
                onClick={() => toast.error('错误', '操作失败，请重试')}
              >
                Error Toast
              </GlassButton>
              <GlassButton
                variant="ghost"
                onClick={() => toast.info('持久提示', '此消息不会自动消失', 0)}
              >
                持久 Toast (duration=0)
              </GlassButton>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Modal 对话框 */}
      <section>
        <h2 className={`text-xl font-bold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-slate-800'
        }`}>
          5. Modal 对话框动画
        </h2>
        
        <div
          className="rounded-2xl border p-6"
          style={getGlassStyle('CARD', theme)}
        >
          <div className="space-y-3">
            <h3 className={`text-sm font-medium mb-3 ${
              theme === 'dark' ? 'text-white/80' : 'text-slate-700'
            }`}>
              背景模糊 + 缩放进入
            </h3>
            <div className="flex flex-wrap gap-3">
              <GlassButton variant="primary" onClick={() => setModalOpen(true)}>
                打开 Modal
              </GlassButton>
              <GlassButton variant="danger" onClick={() => setConfirmOpen(true)}>
                确认对话框
              </GlassButton>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Dropdown 下拉菜单 */}
      <section>
        <h2 className={`text-xl font-bold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-slate-800'
        }`}>
          6. Dropdown 下拉菜单动画
        </h2>
        
        <div
          className="rounded-2xl border p-6"
          style={getGlassStyle('CARD', theme)}
        >
          <div className="space-y-6">
            <div>
              <h3 className={`text-sm font-medium mb-3 ${
                theme === 'dark' ? 'text-white/80' : 'text-slate-700'
              }`}>
                自定义 Dropdown
              </h3>
              <Dropdown
                items={[
                  {
                    id: 'profile',
                    label: '个人资料',
                    icon: <User size={16} />,
                    onClick: () => toast.info('导航', '前往个人资料页面'),
                  },
                  {
                    id: 'settings',
                    label: '设置',
                    icon: <Settings size={16} />,
                    onClick: () => toast.info('导航', '前往设置页面'),
                    divider: true,
                  },
                  {
                    id: 'share',
                    label: '分享',
                    icon: <Share2 size={16} />,
                    onClick: () => toast.success('分享', '分享链接已复制'),
                  },
                  {
                    id: 'copy',
                    label: '复制链接',
                    icon: <Copy size={16} />,
                    onClick: () => toast.success('复制', '链接已复制到剪贴板'),
                    divider: true,
                  },
                  {
                    id: 'logout',
                    label: '退出登录',
                    danger: true,
                    onClick: () => toast.warning('退出', '您已退出登录'),
                  },
                ]}
                trigger={
                  <GlassButton variant="secondary" iconRight={<MoreVertical size={16} />}>
                    操作菜单
                  </GlassButton>
                }
              />
            </div>

            <div>
              <h3 className={`text-sm font-medium mb-3 ${
                theme === 'dark' ? 'text-white/80' : 'text-slate-700'
              }`}>
                Select 选择器
              </h3>
              <Select
                value={selectValue}
                onChange={setSelectValue}
                options={[
                  { value: 'option1', label: '选项 1' },
                  { value: 'option2', label: '选项 2' },
                  { value: 'option3', label: '选项 3' },
                  { value: 'option4', label: '禁用选项', disabled: true },
                ]}
                placeholder="请选择"
                className="w-64"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 7: 交互提示 */}
      <section>
        <div
          className="rounded-2xl border p-6"
          style={getGlassStyle('CARD', theme)}
        >
          <div className={`text-sm ${
            theme === 'dark' ? 'text-white/70' : 'text-slate-600'
          }`}>
            <p className="mb-2">💡 <strong>交互提示：</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Hover 按钮观察放大效果和阴影变化</li>
              <li>点击按钮体验按下缩小的触觉反馈</li>
              <li>切换 Toggle 开关观察 Spring 弹性动画</li>
              <li>聚焦输入框查看品牌色光晕效果</li>
              <li>输入内容测试字符计数和错误提示动画</li>
              <li>触发 Toast 通知观察滑入动画和进度条</li>
              <li>打开 Modal 查看背景模糊 + 缩放进入效果</li>
              <li>使用 Dropdown 测试键盘导航（↑↓ + Enter）</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Modal 实例 */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="示例对话框"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <GlassButton variant="secondary" onClick={() => setModalOpen(false)}>
              取消
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={() => {
                toast.success('提交成功', '您的更改已保存');
                setModalOpen(false);
              }}
            >
              确认
            </GlassButton>
          </div>
        }
      >
        <div className={theme === 'dark' ? 'text-white/70' : 'text-slate-600'}>
          <p className="mb-4">
            这是一个带有背景模糊效果的 Modal 对话框示例。
          </p>
          <p className="mb-4">
            点击背景或按下 ESC 键可以关闭对话框。
          </p>
          <p>
            Modal 使用了 <code className="px-2 py-0.5 rounded bg-brand-blue-500/10 text-brand-blue-400">
              backdrop-filter: blur(12px)
            </code> 实现背景模糊效果。
          </p>
        </div>
      </Modal>

      {/* 确认对话框实例 */}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          toast.success('已确认', '您已确认删除操作');
        }}
        title="确认删除"
        description="此操作不可撤销，确定要继续吗？"
        confirmText="删除"
        cancelText="取消"
        confirmVariant="danger"
      />
    </div>
  );
}
