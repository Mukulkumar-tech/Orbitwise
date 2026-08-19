import cn from '../../utils/cn.js';

const SIZES = {
  sm: { box: 44, stroke: 4, text: 'text-xs' },
  md: { box: 64, stroke: 5, text: 'text-sm' },
  lg: { box: 96, stroke: 6, text: 'text-xl' },
};

/**
 * Circular percentage indicator — profile completion and match scores.
 *
 * Drawn with `stroke-dasharray` on a rotated circle rather than a chart library:
 * one SVG element, no layout thrash, and it inherits `currentColor` so a band
 * colour is a class on the parent rather than a prop threaded through.
 *
 * The number is always rendered as text inside the ring, so the value survives
 * greyscale printing, colour blindness and a screen reader — the arc is decoration.
 */
export default function ProgressRing({
  value = 0,
  size = 'md',
  label,
  className,
  trackClassName = 'text-navy-100',
  showValue = true,
  suffix = '',
}) {
  const { box, stroke, text } = SIZES[size] ?? SIZES.md;
  const radius = (box - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className={cn('relative inline-flex shrink-0 items-center justify-center', className)}>
      <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} className="-rotate-90" aria-hidden="true">
        <circle
          cx={box / 2}
          cy={box / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          stroke="currentColor"
          className={trackClassName}
        />
        <circle
          cx={box / 2}
          cy={box / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          stroke="currentColor"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          // Reduced motion is handled globally in theme.css, which zeroes every
          // transition duration — no per-component check needed.
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>

      {showValue && (
        <span className={cn('absolute font-semibold tabular-nums', text)}>
          {Math.round(clamped)}
          {suffix}
        </span>
      )}

      {label && <span className="sr-only">{label}</span>}
    </div>
  );
}
