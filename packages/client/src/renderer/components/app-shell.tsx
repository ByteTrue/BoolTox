"use client";

import type { ReactNode } from "react";
import { lazy, Suspense, useCallback, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSpotlightBackground } from "@/components/ui/spotlight";
import { useSpotlight } from "@/contexts/spotlight-context";
import { useModulePlatform } from "@/contexts/module-context";
import { ModuleHost } from "@/components/module-host";
import { WindowTitlebar } from "./window-titlebar";
import { useTheme } from "./theme-provider";
import { getGlassStyle, getGlassShadow, getGlassActiveStyle, GLASS_BORDERS } from "@/utils/glass-layers";
import { getBlurStyle } from "@/utils/blur-effects";
import { pageTransitionPresets, staggerPresets } from "@/utils/fluid-animations";
import { Boxes } from "lucide-react";
import { GlassButton } from "./ui/glass-button";
import { UpdateBanner } from "./ui/update-banner";
import { GlassLoadingFallback } from "./ui/glass-loading-fallback";
import { ErrorBoundary } from "./error-boundary";
import { SPRING, DELAY, getSpring } from "@/config/animation.config";
import {
  useKeyboardNavigation,
  useFocusTrap,
  useScreenReaderAnnounce,
  initKeyboardNavigationDetection,
} from "@/utils/accessibility";

import { getPrimaryNav } from "@/config/navigation";

// 路由懒加载 - 优化首屏加载性能
const OverviewPanel = lazy(() => import("./overview-panel").then(m => ({ default: m.OverviewPanel })));
const ModuleCenter = lazy(() => import("./module-center").then(m => ({ default: m.ModuleCenter })));
const SettingsPanel = lazy(() => import("./settings-panel").then(m => ({ default: m.SettingsPanel })));
// NOTE: 动态内容抽离：以下常量统一改为引用 content/home-content.ts 中的配置，后续可由 CMS / API 返回


type NavIconName = "grid" | "layers" | "palette" | "pulse" | "flow" | "book" | "spark";
type NavItem = {
  key: string;
  label: string;
  description?: string;
  icon: NavIconName;
  badge?: string;
  tone?: "accent" | "neutral";
};

// 动态主导航（基于配置服务+环境变量裁剪）
const primaryNav: NavItem[] = getPrimaryNav();

// 统一的图标动画配置
const iconSpring = getSpring(SPRING.swift);

// Overview 相关类型和映射已移除，使用 OverviewPanel 组件替代
function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

function NavIcon({ name, active, isHovering, className }: { name: NavIconName; active: boolean; isHovering: boolean; className?: string }) {
  const { theme } = useTheme();
  const stroke = active
    ? 'currentColor'
    : (theme === 'dark' ? 'rgba(101, 187, 233, 0.7)' : 'rgba(81, 169, 213, 0.7)');
  const fillActive = active
    ? 'currentColor'
    : 'none';

  if (name === "grid") {
    return (
      <svg className={cx("h-5 w-5", className)} viewBox="0 0 20 20" aria-hidden="true">
        <motion.rect x="2.5" y="2.5" width="6" height="6" rx="1.2" stroke={stroke} strokeWidth="1.4" fill={fillActive}
          animate={{ rotate: isHovering ? 90 : 0 }}
          transition={{ type: "spring", ...iconSpring }}
        />
        <motion.rect x="11.5" y="2.5" width="6" height="6" rx="1.2" stroke={stroke} strokeWidth="1.4" fill={fillActive} 
          animate={{ rotate: isHovering ? 90 : 0 }}
          transition={{ type: "spring", ...iconSpring, delay: DELAY.tiny }}
        />
        <motion.rect x="2.5" y="11.5" width="6" height="6" rx="1.2" stroke={stroke} strokeWidth="1.4" fill="none" 
          animate={{ rotate: isHovering ? 90 : 0 }}
          transition={{ type: "spring", ...iconSpring, delay: DELAY.small }}
        />
        <motion.rect x="11.5" y="11.5" width="6" height="6" rx="1.2" stroke={stroke} strokeWidth="1.4" fill="none" 
          animate={{ rotate: isHovering ? 90 : 0 }}
          transition={{ type: "spring", ...iconSpring, delay: DELAY.medium }}
        />
      </svg>
    );
  }

  if (name === "layers") {
    return (
      <svg className={cx("h-5 w-5", className)} viewBox="0 0 24 24" aria-hidden="true">
        <motion.path d="M4.5 8.5 12 4l7.5 4.5L12 13z" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round"
          animate={{ y: isHovering ? -1 : 0 }}
          transition={{ type: "spring", ...iconSpring }}
        />
        <motion.path d="M4.5 12.5 12 17l7.5-4.5" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"
          animate={{ y: isHovering ? 1 : 0 }}
          transition={{ type: "spring", ...iconSpring }}
        />
      </svg>
    );
  }

  if (name === "palette") {
    return (
      <svg className={cx("h-5 w-5", className)} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 4.5a7.5 7.5 0 1 0 0 15c1 0 1.8-.7 1.8-1.5 0-.6-.4-1.1-.4-1.6 0-.7.6-1.2 1.3-1.2h1.1a2.7 2.7 0 0 0 0-5.4h-.3" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <motion.circle cx="8.2" cy="9" r="1.1" fill={stroke} 
          animate={{ y: isHovering ? -1.5 : 0 }}
          transition={{ type: "spring", ...iconSpring, delay: DELAY.small }}
        />
        <motion.circle cx="12" cy="7.4" r="1.1" fill={stroke} 
          animate={{ y: isHovering ? -1.5 : 0 }}
          transition={{ type: "spring", ...iconSpring }}
        />
        <motion.circle cx="15.2" cy="10.2" r="1.1" fill={stroke} 
          animate={{ y: isHovering ? -1.5 : 0 }}
          transition={{ type: "spring", ...iconSpring, delay: DELAY.large }}
        />
      </svg>
    );
  }

  if (name === "pulse") {
    return (
      <svg className={cx("h-5 w-5", className)} viewBox="0 0 24 24" aria-hidden="true">
        <motion.path d="M3.5 13h3l2.2-6.5 3.6 12 2.7-7.5 1.3 2.5h4.2" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" 
          animate={{ y: isHovering ? -1.5 : 0 }}
          transition={{ type: "spring", ...iconSpring }}
        />
      </svg>
    );
  }

  if (name === "flow") {
    return (
      <svg className={cx("h-5 w-5", className)} viewBox="0 0 24 24" aria-hidden="true">
        <motion.path d="M5 6h7a3 3 0 0 1 0 6H8.2a3.2 3.2 0 0 0 0 6H21" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" 
          animate={{ y: isHovering ? -1.5 : 0 }}
          transition={{ type: "spring", ...iconSpring }}
        />
        <circle cx="5" cy="6" r="2" fill={stroke} />
        <circle cx="19" cy="18" r="2" fill={stroke} />
      </svg>
    );
  }

  if (name === "book") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <motion.path d="M6 5h6a2 2 0 0 1 2 7v14a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2V7a2 2 0 0 1 2-2z" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" 
          animate={{ y: isHovering ? -1.5 : 0 }}
          transition={{ type: "spring", ...iconSpring, delay: DELAY.small }}
        />
        <motion.path d="M12 5h6a2 2 0 0 1 2 7v14a2 2 0 0 0-2-2h-6" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" 
          animate={{ y: isHovering ? -1.5 : 0 }}
          transition={{ type: "spring", ...iconSpring }}
        />
      </svg>
    );
  }

  if (name === "spark") {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <motion.path d="M12 3.8 13.6 9l5.1.4-4 3.2 1.4 5-4-2.7-4 2.7 1.4-5-4-3.2 5.1-.4z" fill="none" stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" 
          animate={{ y: isHovering ? -1.5 : 0, scale: isHovering ? 1.1 : 1, rotate: isHovering ? 15 : 0 }}
          transition={{ type: "spring", ...iconSpring }}
        />
      </svg>
    );
  }

  return null;
}

// OverviewMetricsGrid, OverviewTimelineList, getTimelineStatusLabel 已移除

// OverviewContent 组件已移除，使用 OverviewPanel 替代

// --- Shell 结构回补 ---
export function AppShell() {
  return <AppShellContent />;
}

function AppShellContent() {
  const { setSpotlight } = useSpotlight();
  useSpotlightBackground();
  const { theme } = useTheme();
  const { quickAccessModules, activeModuleId, setActiveModuleId, getModuleById, updateQuickAccessOrder } = useModulePlatform();
  const [activeNav, setActiveNav] = useState<string>('overview');

  // 屏幕阅读器公告
  const announce = useScreenReaderAnnounce();

  // 键盘导航检测初始化
  useEffect(() => {
    const cleanup = initKeyboardNavigationDetection();
    return cleanup;
  }, []);

  const explorationNav = useMemo<NavItem[]>(() => quickAccessModules
    .map(module => ({
      key: `module:${module.id}`,
      label: module.definition.name,
      description: module.definition.description ?? '模块入口',
      icon: 'spark' as const,
      badge: module.runtime.component ? undefined : '加载中',
      tone: 'accent',
    } satisfies NavItem)), [quickAccessModules]);

  const handleNavSelect = useCallback((value: string) => {
    if (value.startsWith('module:')) {
      const moduleId = value.replace('module:', '');
      setActiveNav('');
      setActiveModuleId(moduleId);
      // 屏幕阅读器公告
      const module = getModuleById(moduleId);
      if (module) {
        announce(`已切换到模块：${module.definition.name}`, 'polite');
      }
      return;
    }
    setActiveModuleId(null);
    setActiveNav(value);
    // 屏幕阅读器公告
    const navItem = primaryNav.find(item => item.key === value);
    if (navItem) {
      announce(`已切换到：${navItem.label}`, 'polite');
    }
  }, [setActiveModuleId, announce, getModuleById]);

  // 处理快速访问拖拽排序
  const handleQuickAccessReorder = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = explorationNav.findIndex(item => item.key === active.id);
      const newIndex = explorationNav.findIndex(item => item.key === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(explorationNav, oldIndex, newIndex);
        const orderedIds = newOrder.map(item => item.key.replace('module:', ''));
        updateQuickAccessOrder(orderedIds);
      }
    }
  }, [explorationNav, updateQuickAccessOrder]);

  const activeModule = useMemo(() => (activeModuleId ? getModuleById(activeModuleId) ?? null : null), [activeModuleId, getModuleById]);
  const activeKey = activeModule ? `module:${activeModule.id}` : activeNav;

  return (
    <div
      className={`relative flex h-dvh min-h-[720px] flex-col overflow-hidden rounded-xl transition-colors duration-500 ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900'
          : 'bg-gradient-to-br from-blue-100 via-pink-50 to-blue-100'
      }`}
      style={{ minWidth: '960px' }} // 确保最小宽度：侧边栏 268px + 内容区 650px + 间距
    >
      {/* 网格渐变背景 - 玻璃拟态标准设计 */}
      <div className="wave-bg">
        {/* 光斑 1 - 蓝色系 */}
        <div
          className="wave-layer"
          style={{
            width: '700px',
            height: '700px',
            left: '5%',
            top: '15%',
            background: theme === 'dark'
              ? 'radial-gradient(circle, rgba(50, 100, 180, 0.4) 0%, rgba(60, 110, 190, 0.25) 40%, rgba(40, 80, 150, 0.1) 70%, transparent 100%)'
              : 'radial-gradient(circle, rgba(101, 187, 233, 0.7) 0%, rgba(138, 206, 241, 0.45) 40%, rgba(150, 215, 245, 0.2) 70%, transparent 100%)',
            animation: 'blob-float-1 12s ease-in-out infinite',
          }}
        />
        {/* 光斑 2 - 紫色系 */}
        <div
          className="wave-layer"
          style={{
            width: '650px',
            height: '650px',
            right: '10%',
            top: '5%',
            background: theme === 'dark'
              ? 'radial-gradient(circle, rgba(100, 70, 130, 0.35) 0%, rgba(110, 80, 140, 0.22) 40%, rgba(90, 60, 120, 0.08) 70%, transparent 100%)'
              : 'radial-gradient(circle, rgba(249, 193, 207, 0.65) 0%, rgba(251, 207, 232, 0.4) 40%, rgba(253, 220, 240, 0.18) 70%, transparent 100%)',
            animation: 'blob-float-2 15s ease-in-out infinite',
          }}
        />
        {/* 光斑 3 - 混合色 */}
        <div
          className="wave-layer"
          style={{
            width: '750px',
            height: '750px',
            left: '45%',
            bottom: '5%',
            background: theme === 'dark'
              ? 'radial-gradient(circle, rgba(70, 90, 150, 0.38) 0%, rgba(80, 100, 160, 0.23) 40%, rgba(60, 80, 140, 0.09) 70%, transparent 100%)'
              : 'radial-gradient(circle, rgba(150, 200, 240, 0.68) 0%, rgba(180, 190, 230, 0.42) 40%, rgba(200, 180, 220, 0.19) 70%, transparent 100%)',
            animation: 'blob-float-3 18s ease-in-out infinite',
          }}
        />
      </div>

      <WindowTitlebar />
      <div
        className="relative z-10 flex flex-1 gap-3 overflow-hidden px-3 pb-3 pt-3"
        onMouseMove={(e) => setSpotlight({ x: e.clientX, y: e.clientY, visible: true })}
        onMouseLeave={() => setSpotlight({ visible: false })}
      >
        {/* 侧边栏 */}
        <aside
          role="navigation"
          aria-label="主导航"
          aria-expanded={true}
          className={`flex h-full flex-col overflow-hidden rounded-3xl border p-5 transition-[colors,border-color,box-shadow] duration-500 ease-gentle ${getGlassShadow(theme)}`}
          style={{
            width: '268px',
            minWidth: '268px',
            ...getGlassStyle('PANEL', theme),
            ...getBlurStyle('sidebar', theme, 'medium'),
          }}
        >
          {/* Logo 区域 */}
          <div
            className={`mb-6 rounded-2xl border p-5 transition-[transform,box-shadow] duration-250 ease-swift hover:scale-[1.01] ${theme === 'dark' ? 'shadow-unified-xl-dark' : 'shadow-unified-xl'}`}
            style={{
              ...getGlassStyle('CARD', theme),
              background: theme === 'dark'
                ? 'linear-gradient(135deg, rgba(101, 187, 233, 0.12) 0%, rgba(249, 193, 207, 0.12) 100%), rgba(28, 30, 35, 0.78)'
                : 'linear-gradient(135deg, rgba(101, 187, 233, 0.12) 0%, rgba(249, 193, 207, 0.12) 100%), rgba(255, 255, 255, 0.55)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-xl bg-brand-gradient p-2.5 shadow-unified-md dark:shadow-unified-md-dark text-white">
                <Boxes className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-blue-300 dark:text-brand-blue-300">BOOLTOX</p>
                <p className={`text-lg font-bold drop-shadow ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>不二工具箱</p>
              </div>
            </div>
          </div>

          {/* 导航区域 - 添加 padding 防止阴影被截断 */}
          <div className="elegant-scroll flex-1 overflow-y-auto pr-3 py-2">
            <nav className="flex flex-col gap-6 px-1">
              <NavSection title="管理中心" items={primaryNav} active={activeKey} onSelect={handleNavSelect} />
              <NavSection 
                title="快速访问" 
                items={explorationNav} 
                active={activeKey} 
                onSelect={handleNavSelect} 
                onReorder={handleQuickAccessReorder}
                sortable={true}
              />
            </nav>
          </div>
        </aside>
        {/* 外层：固定容器 */}
        <div className="relative flex min-h-0 min-w-0 flex-1">
          {/* 内层：内容卡片（固定位置，内部滚动） */}
          <main
            id="main-content"
            role="main"
            aria-label="主要内容"
            className={`flex-1 flex flex-col rounded-3xl border transition-[colors,box-shadow,border-color] duration-350 ease-gentle mr-2 overflow-hidden py-3 ${getGlassShadow(theme)}`}
            style={getGlassStyle('BACKGROUND', theme)}
          >
            <div className="flex-1 overflow-y-auto elegant-scroll px-3 md:px-4 pb-1 pt-3 space-y-4">
              <UpdateBanner onNavigate={handleNavSelect} />
              {/* 页面切换动画 */}
              <AnimatePresence mode="wait" initial={false}>
                {activeModule ? (
                  <motion.div
                    key={`module-${activeModule.id}`}
                    variants={pageTransitionPresets.swiftSlide}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <ModuleHost module={activeModule} />
                  </motion.div>
                ) : (
                  <motion.div
                    key={`platform-${activeNav}`}
                    variants={pageTransitionPresets.swiftSlide}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <PlatformContent activeNav={activeNav || 'overview'} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function PlatformContent({ activeNav }: { activeNav: string }) {
  return (
    <ErrorBoundary name={`Route: ${activeNav}`} showHomeButton={true}>
      <Suspense fallback={<GlassLoadingFallback />}>
        <PlatformContentInner activeNav={activeNav} />
      </Suspense>
    </ErrorBoundary>
  );
}

function PlatformContentInner({ activeNav }: { activeNav: string }) {
  switch (activeNav) {
    case 'module-center':
      return <ModuleCenter />;
    case 'settings':
      return <SettingsPanel />;
    default:
      return <OverviewPanel />;
  }
}

function NavSection({
  title,
  items,
  active,
  onSelect,
  onReorder,
  sortable = false,
}: {
  title: string;
  items: NavItem[];
  active: string;
  onSelect: (value: string) => void;
  onReorder?: (event: DragEndEvent) => void;
  sortable?: boolean;
}) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { theme } = useTheme();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const renderNavItem = (item: NavItem) => {
    const isActive = active === item.key;

    const content = (
      <button
        key={item.key}
        type="button"
        onClick={() => onSelect(item.key)}
        onPointerDown={(e) => {
          // 阻止拖拽，优先处理点击
          e.stopPropagation();
        }}
        onMouseEnter={() => setHoveredItem(item.key)}
        onMouseLeave={() => setHoveredItem(null)}
        className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 transition-[transform,box-shadow,background-color] duration-250 ease-swift hover:shadow-unified-xl hover:dark:shadow-unified-xl-dark focus-visible:outline-none hover-optimized ${theme === 'dark' ? 'shadow-unified-md-dark' : 'shadow-unified-md'}`}
        style={{
          ...(isActive ? getGlassActiveStyle() : getGlassStyle('BUTTON', theme)),
          ...(hoveredItem === item.key && !isActive ? {
            background: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.10)',
            transform: 'translateY(-1px) translateZ(0)',
          } : {}),
        }}
      >
        <div
          className={`inline-flex rounded-lg p-2 transition-[box-shadow,background-color,backdrop-filter] duration-250 ease-swift ${
            isActive
              ? 'shadow-unified-lg dark:shadow-unified-lg-dark'
              : 'shadow-unified-sm dark:shadow-unified-sm-dark'
          }`}
          style={{
            background: isActive
              ? 'linear-gradient(135deg, rgba(101, 187, 233, 0.9) 0%, rgba(249, 193, 207, 0.8) 100%)'
              : theme === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0.6)',
            backdropFilter: isActive ? 'blur(12px)' : 'blur(8px)',
            WebkitBackdropFilter: isActive ? 'blur(12px)' : 'blur(8px)',
          }}
        >
          <NavIcon
            name={item.icon}
            active={isActive}
            isHovering={hoveredItem === item.key}
            className={isActive ? 'text-white' : 'text-brand-blue-400 dark:text-brand-blue-400'}
          />
        </div>
        <div className="flex-1 text-left">
          <p className={`text-sm font-semibold ${isActive ? (theme === 'dark' ? 'text-white' : 'text-slate-800') : (theme === 'dark' ? 'text-white' : 'text-slate-800')}`}>
            {item.label}
          </p>
          {item.description && (
            <p className={`text-xs ${theme === 'dark' ? 'text-white/80' : 'text-slate-600'}`}>
              {item.description}
            </p>
          )}
        </div>
        {item.badge && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold shadow-unified-sm dark:shadow-unified-sm-dark border ${
              item.tone === "accent"
                ? 'bg-blue-500/20 text-blue-500 border-blue-500/30'
                : (theme === 'dark' ? 'bg-white/10 text-white/80' : 'bg-slate-200 text-slate-700')
            }`}
            style={item.tone !== "accent" ? {
              borderColor: theme === 'dark' ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT
            } : undefined}
          >
            {item.badge}
          </span>
        )}
      </button>
    );

    if (sortable) {
      return <SortableNavItem key={item.key} id={item.key}>{content}</SortableNavItem>;
    }

    return content;
  };

  return (
    <div className="flex flex-col gap-3">
      <p className={`text-xs font-semibold uppercase tracking-[0.26em] ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>{title}</p>
      
      {sortable && onReorder ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onReorder}
        >
          <SortableContext items={items.map(item => item.key)} strategy={verticalListSortingStrategy}>
            {/* 列表交错动画 */}
            <motion.div
              className="flex flex-col gap-2.5"
              variants={staggerPresets.fast.container}
              initial="hidden"
              animate="visible"
            >
              {items.length === 0 && title === "快速访问" && (
                <motion.div
                  variants={staggerPresets.fast.item}
                  className={`rounded-2xl border p-4 text-xs shadow-unified-md dark:shadow-unified-md-dark ${theme === 'dark' ? 'text-white/80' : 'text-slate-600'}`}
                  style={getGlassStyle('BUTTON', theme)}
                >
                  <p className={`mb-3 ${theme === 'dark' ? 'text-white/80' : 'text-slate-600'}`}>
                    暂无快速访问模块，在模块中心点击"📌"图标添加常用模块。
                  </p>
                  <GlassButton
                    variant="primary"
                    size="sm"
                    fullRounded
                    onClick={() => onSelect('module-center')}
                  >
                    前往安装 →
                  </GlassButton>
                </motion.div>
              )}
              {items.map((item) => (
                <motion.div key={item.key} variants={staggerPresets.fast.item}>
                  {renderNavItem(item)}
                </motion.div>
              ))}
            </motion.div>
          </SortableContext>
        </DndContext>
      ) : (
        // 列表交错动画 - 非拖拽模式
        <motion.div
          className="flex flex-col gap-2.5"
          variants={staggerPresets.default.container}
          initial="hidden"
          animate="visible"
        >
          {items.map((item) => (
            <motion.div key={item.key} variants={staggerPresets.default.item}>
              {renderNavItem(item)}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// 可排序的导航项组件
function SortableNavItem({ id, children }: { id: string; children: ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className="touch-none"
    >
      {children}
    </div>
  );
}
