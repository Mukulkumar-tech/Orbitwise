import cn from '../../utils/cn.js';

const TONES = {
  neutral: 'bg-navy-50 text-navy-500',
  primary: 'bg-primary-50 text-primary-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
};

/**
 * One number on the dashboard.
 *
 * The label sits above the value rather than below it: scanning a row of tiles,
 * the eye lands on the large text first, and a value with its meaning already read
 * is faster than a number that has to be explained after the fact.
 */
export default function StatTile({ icon: Icon, label, value, hint, tone = 'neutral', className }) {
  return (
    <div className={cn('rounded-2xl bg-surface p-4 shadow-sm hairline sm:p-5', className)}>
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', TONES[tone])}>
            <Icon className="size-4" aria-hidden="true" />
          </span>
        )}
        <p className="text-2xs font-semibold tracking-wide text-navy-400 uppercase">{label}</p>
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-navy-950 tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs leading-relaxed text-navy-500">{hint}</p>}
    </div>
  );
}
