import { type Variants, type Transition } from 'framer-motion';

// --- Transition presets ---
export const SPRING_SNAPPY: Transition = { type: 'spring', stiffness: 350, damping: 30 };
export const SPRING_BOUNCY: Transition = { type: 'spring', stiffness: 300, damping: 24 };
export const TWEEN_FAST: Transition = { duration: 0.15, ease: 'easeOut' };
export const TWEEN_NORMAL: Transition = { duration: 0.25, ease: 'easeOut' };

/** Pop-in depuis scale 0 (reveal de carte, achievement unlock) */
export const pixelPop: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: SPRING_BOUNCY },
  exit: { scale: 0.85, opacity: 0, transition: TWEEN_FAST },
};

/** Fade avec léger glissement vertical (tabs, listes, sections) */
export const pixelFade: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: TWEEN_NORMAL },
  exit: { opacity: 0, y: -4, transition: TWEEN_FAST },
};

/** Slide depuis une direction (drawers, panels) */
export const pixelSlide = (direction: 'left' | 'right' | 'up' | 'down' = 'right', distance = 300): Variants => {
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
  const sign = direction === 'right' || direction === 'down' ? 1 : -1;
  return {
    hidden: { [axis]: sign * distance, opacity: 0 },
    visible: { [axis]: 0, opacity: 1, transition: SPRING_SNAPPY },
    exit: { [axis]: sign * distance, opacity: 0, transition: TWEEN_NORMAL },
  };
};

/** Overlay/modal backdrop */
export const overlayBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: TWEEN_FAST },
  exit: { opacity: 0, transition: TWEEN_FAST },
};

/** Overlay/modal content card */
export const overlayContent: Variants = {
  hidden: { scale: 0.85, opacity: 0, y: 16 },
  visible: { scale: 1, opacity: 1, y: 0, transition: SPRING_BOUNCY },
  exit: { scale: 0.9, opacity: 0, y: 8, transition: TWEEN_FAST },
};

/** Stagger container pour listes */
export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

/** Item enfant du stagger */
export const staggerItem: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: TWEEN_NORMAL },
};

