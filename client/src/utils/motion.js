/**
 * Shared Framer Motion presets.
 *
 * Centralized so timing stays consistent across the product: micro-interactions
 * 150–200ms, entrances 400–600ms with a short stagger. Nothing here scales or
 * rotates text — movement is vertical and small, which reads as polish rather
 * than as decoration.
 *
 * Components pair these with `useReducedMotion()`; see `resolve()` below.
 */

export const EASE_OUT = [0.22, 1, 0.36, 1];

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: EASE_OUT } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: EASE_OUT } },
};

/** Parent wrapper that releases children one after another. */
export const staggerParent = (stagger = 0.07, delayChildren = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
});

/** Whole-page entrance, kept short so navigation never feels sluggish. */
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE_OUT } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: EASE_OUT } },
};

/** Default `whileInView` config: fire once, slightly before fully on screen. */
export const inView = { once: true, amount: 0.25, margin: '0px 0px -80px 0px' };

/**
 * Strips motion from a variant set when the user has asked for reduced motion.
 *
 * Returns variants that still drive opacity — content must remain visible and
 * animations must still "complete" — but with no movement and no duration.
 *
 *   const reduce = useReducedMotion()
 *   <motion.div variants={resolve(fadeUp, reduce)} />
 */
export const resolve = (variants, shouldReduce) => {
  if (!shouldReduce) return variants;
  return {
    hidden: { opacity: 1 },
    visible: { opacity: 1, transition: { duration: 0 } },
  };
};
