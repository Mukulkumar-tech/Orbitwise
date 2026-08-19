import { Inbox } from 'lucide-react';
import cn from '../../utils/cn.js';

/**
 * Shown when a request succeeded but there is nothing to display.
 *
 * An empty state should always offer a way forward — an empty shortlist that
 * says only "No shortlisted courses yet" is a dead end, while one with a
 * "Browse courses" action is the start of a journey. `action` is therefore the
 * point of this component, not an optional extra.
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  size = 'md',
  className,
}) {
  const compact = size === 'sm';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-navy-200 bg-navy-50/50 text-center',
        compact ? 'px-5 py-10' : 'px-6 py-16',
        className
      )}
    >
      <span
        className={cn(
          'flex items-center justify-center rounded-2xl bg-white text-navy-400 shadow-xs',
          compact ? 'size-11' : 'size-14'
        )}
      >
        <Icon className={compact ? 'size-5' : 'size-6'} aria-hidden="true" />
      </span>

      <h3 className={cn('mt-5 font-semibold text-navy-900', compact ? 'text-sm' : 'text-base')}>{title}</h3>

      {description && (
        <p className={cn('mt-1.5 max-w-sm leading-relaxed text-navy-500', compact ? 'text-xs' : 'text-sm')}>
          {description}
        </p>
      )}

      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
