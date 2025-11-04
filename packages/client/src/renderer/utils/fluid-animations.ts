/**
 * 流体动画系统 - Task 2.5
 * 
 * 实现 Apple 风格的流畅动画效果：
 * 1. 路由切换过渡动画
 * 2. 列表项交错动画 (Stagger)
 * 3. 卡片 3D 倾斜效果
 * 4. 按钮光泽扫过效果
 * 
 * 参考标准：
 * - iOS UIView animations (spring damping)
 * - macOS NSAnimation (timing functions)
 * - Material Motion (choreography)
 */

import { Variants, Transition } from 'framer-motion';

// ============================================
// 1. 路由切换过渡动画 (Page Transitions)
// ============================================

/**
 * 页面切换方向
 */
export type PageTransitionDirection = 'left' | 'right' | 'up' | 'down' | 'fade';

/**
 * 页面切换动画配置
 */
export interface PageTransitionConfig {
  direction?: PageTransitionDirection;
  duration?: number;
  stiffness?: number;
  damping?: number;
}

/**
 * 获取页面切换动画变体
 * 
 * @example
 * <motion.div
 *   variants={getPageTransitionVariants('right')}
 *   initial="initial"
 *   animate="animate"
 *   exit="exit"
 * >
 */
export function getPageTransitionVariants(
  direction: PageTransitionDirection = 'right',
  config?: Omit<PageTransitionConfig, 'direction'>
): Variants {
  const { duration = 0.35, stiffness = 300, damping = 30 } = config || {};

  const transition: Transition = {
    type: 'spring',
    stiffness,
    damping,
    mass: 1,
  };

  // 方向映射
  const directionMap = {
    left: { x: -40, y: 0 },
    right: { x: 40, y: 0 },
    up: { x: 0, y: -40 },
    down: { x: 0, y: 40 },
    fade: { x: 0, y: 0 },
  };

  const offset = directionMap[direction];

  return {
    initial: {
      opacity: 0,
      x: offset.x,
      y: offset.y,
      scale: 0.96,
      filter: 'blur(4px)',
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        ...transition,
        duration,
      },
    },
    exit: {
      opacity: 0,
      x: -offset.x,
      y: -offset.y,
      scale: 0.96,
      filter: 'blur(4px)',
      transition: {
        duration: duration * 0.8, // 退出动画稍快
        ease: 'easeIn',
      },
    },
  };
}

/**
 * 预设的页面切换动画
 */
export const pageTransitionPresets = {
  // 从右滑入（默认）
  slideRight: getPageTransitionVariants('right'),
  
  // 从左滑入
  slideLeft: getPageTransitionVariants('left'),
  
  // 从下滑入
  slideUp: getPageTransitionVariants('up'),
  
  // 淡入
  fade: getPageTransitionVariants('fade'),
  
  // 快速滑动（iOS 风格）
  swiftSlide: getPageTransitionVariants('right', { duration: 0.25, stiffness: 400, damping: 35 }),
  
  // 柔和滑动（macOS 风格）
  smoothSlide: getPageTransitionVariants('right', { duration: 0.45, stiffness: 250, damping: 28 }),
};

// ============================================
// 2. 列表交错动画 (Stagger Animations)
// ============================================

/**
 * 列表交错动画配置
 */
export interface StaggerConfig {
  /** 每个子项延迟时间 */
  staggerDelay?: number;
  /** 初始延迟 */
  initialDelay?: number;
  /** 动画持续时间 */
  duration?: number;
  /** 动画方向 */
  direction?: 'top' | 'bottom' | 'left' | 'right' | 'scale';
  /** 淡入效果 */
  fade?: boolean;
  /** 模糊效果 */
  blur?: boolean;
}

/**
 * 获取列表容器动画变体
 * 
 * @example
 * <motion.ul variants={getStaggerContainerVariants()}>
 *   {items.map(item => (
 *     <motion.li key={item.id} variants={getStaggerItemVariants()}>
 *       {item.content}
 *     </motion.li>
 *   ))}
 * </motion.ul>
 */
export function getStaggerContainerVariants(config?: StaggerConfig): Variants {
  const { staggerDelay = 0.05, initialDelay = 0 } = config || {};

  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: initialDelay,
      },
    },
  };
}

/**
 * 获取列表项动画变体
 */
export function getStaggerItemVariants(config?: StaggerConfig): Variants {
  const {
    duration = 0.4,
    direction = 'top',
    fade = true,
    blur = true,
  } = config || {};

  // 方向映射
  const directionMap = {
    top: { x: 0, y: -16 },
    bottom: { x: 0, y: 16 },
    left: { x: -16, y: 0 },
    right: { x: 16, y: 0 },
    scale: { x: 0, y: 0 },
  };

  const offset = directionMap[direction];

  return {
    hidden: {
      opacity: fade ? 0 : 1,
      x: offset.x,
      y: offset.y,
      scale: direction === 'scale' ? 0.9 : 1,
      filter: blur ? 'blur(4px)' : 'blur(0px)',
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        stiffness: 350,
        damping: 30,
        mass: 0.8,
        duration,
      },
    },
  };
}

/**
 * 预设的列表交错动画
 */
export const staggerPresets = {
  // 快速交错（卡片列表）
  fast: {
    container: getStaggerContainerVariants({ staggerDelay: 0.03 }),
    item: getStaggerItemVariants({ duration: 0.3, direction: 'top' }),
  },
  
  // 标准交错（导航项）
  default: {
    container: getStaggerContainerVariants({ staggerDelay: 0.05 }),
    item: getStaggerItemVariants({ duration: 0.4, direction: 'top' }),
  },
  
  // 缓慢交错（主内容区）
  slow: {
    container: getStaggerContainerVariants({ staggerDelay: 0.08, initialDelay: 0.1 }),
    item: getStaggerItemVariants({ duration: 0.5, direction: 'bottom' }),
  },
  
  // 缩放交错（图标网格）
  scale: {
    container: getStaggerContainerVariants({ staggerDelay: 0.04 }),
    item: getStaggerItemVariants({ duration: 0.35, direction: 'scale', blur: false }),
  },
};

// ============================================
// 3. 卡片 3D 倾斜效果 (Card Tilt)
// ============================================

/**
 * 卡片倾斜配置
 */
export interface CardTiltConfig {
  /** 最大倾斜角度 (deg) */
  maxTilt?: number;
  /** 最大缩放 */
  maxScale?: number;
  /** 透视距离 (px) */
  perspective?: number;
  /** 光泽强度 (0-1) */
  glareIntensity?: number;
  /** 阴影强度 (0-1) */
  shadowIntensity?: number;
  /** 过渡时间 (s) */
  transitionDuration?: number;
}

/**
 * 计算卡片倾斜样式
 * 
 * @param mouseX 鼠标 X 坐标 (0-1)
 * @param mouseY 鼠标 Y 坐标 (0-1)
 * @param config 倾斜配置
 * @returns CSS 样式对象
 * 
 * @example
 * const [tilt, setTilt] = useState({ x: 0.5, y: 0.5 });
 * 
 * <motion.div
 *   style={getCardTiltStyle(tilt.x, tilt.y)}
 *   onMouseMove={(e) => {
 *     const rect = e.currentTarget.getBoundingClientRect();
 *     setTilt({
 *       x: (e.clientX - rect.left) / rect.width,
 *       y: (e.clientY - rect.top) / rect.height,
 *     });
 *   }}
 *   onMouseLeave={() => setTilt({ x: 0.5, y: 0.5 })}
 * >
 */
export function getCardTiltStyle(
  mouseX: number,
  mouseY: number,
  config?: CardTiltConfig
) {
  const {
    maxTilt = 12,
    maxScale = 1.05,
    perspective = 1000,
  } = config || {};

  // 中心点为 0，边缘为 ±1
  const centerX = (mouseX - 0.5) * 2;
  const centerY = (mouseY - 0.5) * 2;

  // 计算倾斜角度
  const rotateY = centerX * maxTilt;
  const rotateX = -centerY * maxTilt;

  return {
    transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${maxScale})`,
  };
}

/**
 * 获取卡片倾斜动画变体
 */
export function getCardTiltVariants(config?: CardTiltConfig): Variants {
  const {
    maxScale = 1.05,
    perspective = 1000,
    transitionDuration = 0.15,
  } = config || {};

  return {
    initial: {
      transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`,
    },
    hover: {
      scale: maxScale,
      transition: {
        duration: transitionDuration,
        ease: 'easeOut',
      },
    },
    tap: {
      scale: 0.98,
      transition: {
        duration: 0.1,
        ease: 'easeInOut',
      },
    },
  };
}

/**
 * 计算卡片光泽位置
 */
export function getCardGlareStyle(
  mouseX: number,
  mouseY: number,
  config?: CardTiltConfig
) {
  const { glareIntensity = 0.3 } = config || {};

  return {
    background: `radial-gradient(circle at ${mouseX * 100}% ${mouseY * 100}%, rgba(255,255,255,${glareIntensity}) 0%, transparent 60%)`,
    opacity: glareIntensity,
  };
}

// ============================================
// 4. 按钮光泽扫过效果 (Button Shine)
// ============================================

/**
 * 按钮光泽配置
 */
export interface ButtonShineConfig {
  /** 光泽宽度 (%) */
  width?: number;
  /** 光泽角度 (deg) */
  angle?: number;
  /** 光泽颜色 */
  color?: string;
  /** 光泽强度 (0-1) */
  intensity?: number;
  /** 动画持续时间 (s) */
  duration?: number;
  /** 动画延迟 (s) */
  delay?: number;
}

/**
 * 获取按钮光泽动画变体
 * 
 * @example
 * <motion.button style={{ position: 'relative', overflow: 'hidden' }}>
 *   <motion.div
 *     variants={getButtonShineVariants()}
 *     initial="initial"
 *     whileHover="hover"
 *     style={{
 *       position: 'absolute',
 *       inset: 0,
 *       background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
 *     }}
 *   />
 *   Button Text
 * </motion.button>
 */
export function getButtonShineVariants(config?: ButtonShineConfig): Variants {
  const {
    duration = 0.6,
    delay = 0,
  } = config || {};

  return {
    initial: {
      x: '-200%',
      opacity: 0,
    },
    hover: {
      x: '200%',
      opacity: [0, 1, 0],
      transition: {
        duration,
        delay,
        ease: 'easeInOut',
      },
    },
  };
}

/**
 * 生成按钮光泽渐变样式
 */
export function getButtonShineGradient(config?: ButtonShineConfig) {
  const {
    width = 30,
    angle = 90,
    color = 'rgba(255, 255, 255, 0.4)',
    intensity = 1,
  } = config || {};

  return {
    background: `linear-gradient(${angle}deg, transparent ${50 - width / 2}%, ${color} 50%, transparent ${50 + width / 2}%)`,
    opacity: intensity,
  };
}

/**
 * 预设的按钮光泽效果
 */
export const buttonShinePresets = {
  // 快速扫过（主按钮）
  fast: {
    variants: getButtonShineVariants({ duration: 0.5 }),
    gradient: getButtonShineGradient({ width: 25, color: 'rgba(255, 255, 255, 0.5)' }),
  },
  
  // 标准扫过（次要按钮）
  default: {
    variants: getButtonShineVariants({ duration: 0.6 }),
    gradient: getButtonShineGradient({ width: 30, color: 'rgba(255, 255, 255, 0.4)' }),
  },
  
  // 缓慢扫过（大按钮）
  slow: {
    variants: getButtonShineVariants({ duration: 0.8, delay: 0.1 }),
    gradient: getButtonShineGradient({ width: 40, color: 'rgba(255, 255, 255, 0.3)' }),
  },
  
  // 对角扫过
  diagonal: {
    variants: getButtonShineVariants({ duration: 0.65 }),
    gradient: getButtonShineGradient({ width: 35, angle: 45, color: 'rgba(255, 255, 255, 0.35)' }),
  },
  
  // 垂直扫过
  vertical: {
    variants: getButtonShineVariants({ duration: 0.55 }),
    gradient: getButtonShineGradient({ width: 25, angle: 0, color: 'rgba(255, 255, 255, 0.45)' }),
  },
};

// ============================================
// 辅助工具函数
// ============================================

/**
 * 创建统一的弹簧动画配置
 */
export function createSpringTransition(
  stiffness = 300,
  damping = 30,
  mass = 1
): Transition {
  return {
    type: 'spring',
    stiffness,
    damping,
    mass,
  };
}

/**
 * 创建统一的缓动动画配置
 */
export function createEaseTransition(
  duration = 0.3,
  ease: 'easeIn' | 'easeOut' | 'easeInOut' | [number, number, number, number] = 'easeOut'
): Transition {
  return {
    duration,
    ease: ease as any,
  };
}

/**
 * 检测是否支持 3D 变换
 */
export function supportsTransform3D(): boolean {
  if (typeof window === 'undefined') return false;
  
  const element = document.createElement('div');
  const transforms = [
    'perspective(1px)',
    '-webkit-perspective(1px)',
  ];

  for (const transform of transforms) {
    element.style.transform = transform;
    if (element.style.transform !== '') {
      return true;
    }
  }

  return false;
}

/**
 * 计算元素中心点
 */
export function getElementCenter(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

/**
 * 计算鼠标相对于元素的位置 (0-1)
 */
export function getMousePosition(
  event: React.MouseEvent<HTMLElement>,
  element: HTMLElement
) {
  const rect = element.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / rect.width,
    y: (event.clientY - rect.top) / rect.height,
  };
}
