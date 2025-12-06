/**
 * Simplified Animation Config
 * Focus: Snappy, performant, immediate feedback.
 */

import type { Variants } from 'framer-motion';

// Fast, snappy spring
export const SPRING_FAST = {
  type: 'spring',
  stiffness: 400,
  damping: 40, // High damping = less bounce, faster settlement
  mass: 1,
};

// Standard spring for layout changes
export const SPRING_STANDARD = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

// Container stagger - NO initial delay
export const staggerContainer: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03, // Very fast stagger (30ms)
      delayChildren: 0,      // No artificial delay
    },
  },
};

// Item entry - Subtle movement (5px), not 20px
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 5 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    }
  },
};

// Simple fade in
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

// Drawer Slide In (Left)
export const drawerAnimation: Variants = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '-100%' },
  transition: { type: 'tween', duration: 0.3, ease: 'easeOut' }
};

// Modal Backdrop Fade
export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

// Modal Content Scale In
export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { type: 'spring', stiffness: 300, damping: 30 }
};

// Card hover - CSS scale is often better, but if using framer:
export const cardHover: Variants = {
  whileHover: {
    y: -2,
    transition: { duration: 0.1, ease: 'easeOut' },
  },
  whileTap: {
    scale: 0.99,
    transition: { duration: 0.05, ease: 'easeOut' },
  },
};

export const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
};

export const ANIMATION_CONFIG = {
  spring: SPRING_FAST,
  stagger: staggerContainer,
  item: staggerItem,
};

export default ANIMATION_CONFIG;

