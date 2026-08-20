import { ResponsiveContainer } from 'recharts';

import EmptyState from '../ui/EmptyState.jsx';
import cn from '../../utils/cn.js';

/**
 * The shell every admin chart sits in.
 *
 * Exists so the six visuals share one card, one heading treatment and — most
 * importantly — one empty state. A chart handed an empty array renders as a bare
 * set of axes, which reads as a broken component rather than as "no data yet".
 *
 * `ResponsiveContainer` needs a parent with a resolved height, so the height is
 * set here rather than left to each caller to remember.
 */
export default function ChartCard({
  title,
  subtitle,
  isEmpty = false,
  emptyLabel = 'Nothing to chart yet',
  height = 260,
  className,
  children,
}) {
  return (
    <section className={cn('rounded-2xl bg-surface p-5 shadow-sm hairline', className)}>
      <header>
        <h2 className="text-sm font-semibold text-navy-950">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-navy-500">{subtitle}</p>}
      </header>

      {isEmpty ? (
        <div className="flex items-center justify-center" style={{ height }}>
          <EmptyState size="sm" title={emptyLabel} description="It will appear here as soon as there is data." />
        </div>
      ) : (
        <div className="mt-4" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            {children}
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
