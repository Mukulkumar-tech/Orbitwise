import { Check, CircleDot, Clock, X } from 'lucide-react';

import cn from '../../utils/cn.js';

const STATE_STYLE = {
  complete: { ring: 'bg-success-600 text-white', line: 'bg-success-600', icon: Check, label: 'text-navy-900' },
  current: { ring: 'bg-primary-500 text-navy-950', line: 'bg-navy-200', icon: CircleDot, label: 'text-navy-900' },
  rejected: { ring: 'bg-danger-600 text-white', line: 'bg-navy-200', icon: X, label: 'text-danger-700' },
  pending: { ring: 'bg-navy-100 text-navy-400', line: 'bg-navy-200', icon: Clock, label: 'text-navy-400' },
};

const formatWhen = (value) =>
  new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

/**
 * The application's progress, as stages plus the raw event history.
 *
 * Two views of the same truth: the stage rail answers "where am I", the history
 * answers "what happened and when". Both are projections of the server's
 * append-only timeline, so neither can drift from the record.
 */
export default function ApplicationTimeline({ stages = [], history = [], statusLabels = {} }) {
  return (
    <div>
      <ol className="relative">
        {stages.map((stage, index) => {
          const style = STATE_STYLE[stage.state] ?? STATE_STYLE.pending;
          const Icon = style.icon;
          const isLast = index === stages.length - 1;

          return (
            <li key={stage.key} className="relative flex gap-4 pb-7 last:pb-0">
              {!isLast && (
                <span aria-hidden="true" className={cn('absolute top-8 left-[0.9375rem] h-full w-0.5', style.line)} />
              )}
              <span
                className={cn('relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full', style.ring)}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <div className="pt-1">
                <p className={cn('text-sm font-semibold', style.label)}>{stage.label}</p>
                {stage.state === 'current' && <p className="mt-0.5 text-xs text-primary-700">In progress</p>}
              </div>
            </li>
          );
        })}
      </ol>

      {history.length > 0 && (
        <div className="mt-8 border-t border-navy-100 pt-6">
          <h3 className="text-2xs font-semibold tracking-wider text-navy-400 uppercase">Full history</h3>
          <ul className="mt-4 space-y-3">
            {[...history].reverse().map((entry) => (
              <li key={entry._id ?? `${entry.status}-${entry.at}`} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span className="font-medium text-navy-800">{statusLabels[entry.status] ?? entry.status}</span>
                <span className="text-xs text-navy-400">{formatWhen(entry.at)}</span>
                {entry.actor && entry.actor !== 'system' && (
                  <span className="text-xs text-navy-400">· by {entry.actor}</span>
                )}
                {entry.note && <span className="w-full text-xs leading-relaxed text-navy-500">{entry.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
