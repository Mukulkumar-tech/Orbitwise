import { motion, useReducedMotion } from 'framer-motion';

import { fadeUp, inView, resolve } from '../../utils/motion.js';
import cn from '../../utils/cn.js';

/**
 * Standard section header: eyebrow, title, supporting line.
 *
 * Exists so every section on the public site shares one type scale and one
 * reveal timing. Hand-rolling a heading per section is how a landing page ends up
 * with four different h2 sizes.
 */
export default function SectionHeading({ eyebrow, title, description, align = 'center', tone = 'light', className }) {
  const reduce = useReducedMotion();
  const centered = align === 'center';

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={inView}
      variants={resolve(fadeUp, reduce)}
      className={cn('max-w-2xl', centered && 'mx-auto text-center', className)}
    >
      {eyebrow && (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase',
            tone === 'dark' ? 'bg-white/10 text-primary-300' : 'bg-primary-50 text-primary-700'
          )}
        >
          {eyebrow}
        </span>
      )}

      <h2
        className={cn(
          'mt-5 font-display text-3xl leading-tight font-semibold tracking-[-0.03em] md:text-display-sm',
          tone === 'dark' ? 'text-white' : 'text-navy-950'
        )}
      >
        {title}
      </h2>

      {description && (
        <p className={cn('mt-4 text-base leading-relaxed md:text-lg', tone === 'dark' ? 'text-navy-300' : 'text-navy-500')}>
          {description}
        </p>
      )}
    </motion.div>
  );
}
