import { Link } from 'react-router-dom';
import cn from '../../utils/cn.js';

const MARK_SIZES = { sm: 'size-7', md: 'size-8', lg: 'size-10' };
const TEXT_SIZES = { sm: 'text-base', md: 'text-lg', lg: 'text-xl' };

/**
 * The Orbitwise mark: an orbital ring around a core, with a satellite.
 *
 * Drawn inline as SVG rather than shipped as an image file so it inherits
 * colour from its context — a light mark on navy sections, dark on white —
 * without maintaining two assets.
 */
export function LogoMark({ size = 'md', className, tone = 'brand' }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-xl',
        tone === 'brand' && 'bg-navy-950',
        tone === 'light' && 'bg-white/10 ring-1 ring-white/15',
        MARK_SIZES[size],
        className
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="size-[68%]" fill="none">
        <ellipse
          cx="16"
          cy="16"
          rx="12"
          ry="5.5"
          stroke="var(--color-primary-400)"
          strokeWidth="2"
          transform="rotate(-28 16 16)"
        />
        <circle cx="16" cy="16" r="4.5" fill="white" />
        <circle cx="26" cy="9.8" r="2.6" fill="var(--color-primary-500)" />
      </svg>
    </span>
  );
}

export default function Logo({ size = 'md', tone = 'brand', to = '/', className, showWordmark = true }) {
  const isLight = tone === 'light';

  return (
    <Link
      to={to}
      className={cn('inline-flex items-center gap-2.5 rounded-lg', className)}
      aria-label="Orbitwise — home"
    >
      <LogoMark size={size} tone={tone} />
      {showWordmark && (
        <span
          className={cn(
            'font-semibold tracking-[-0.03em]',
            TEXT_SIZES[size],
            isLight ? 'text-white' : 'text-navy-950'
          )}
        >
          Orbitwise
        </span>
      )}
    </Link>
  );
}
