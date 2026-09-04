import type { Variants, Transition } from 'motion/react';

/**
 * Shared animation constants for StyleFlow.
 * All animations use motion/react (formerly framer-motion).
 */

// ── Page & Modal Transitions ─────────────────────────────────────────
export const pageTransitionVariants = {
  initial: { opacity: 0, scale: 0.98, y: 6 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] }, // easeOutExpo
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 4,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

// ── List Staggering ─────────────────────────────────────────────────
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

// ── Card Hover ──────────────────────────────────────────────────────
export const cardHoverTransition: Transition = { duration: 0.2 };

// ── Button Feedback ─────────────────────────────────────────────────
export const buttonWhileHover = { scale: 1.01 } as const;
export const buttonWhileTap = { scale: 0.99 } as const;
