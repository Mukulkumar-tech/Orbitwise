import { CircleHelp, TriangleAlert } from 'lucide-react';

import { VERDICT_STYLES } from '../../constants/domain.js';
import cn from '../../utils/cn.js';

/**
 * The seven scorers behind a match score, each with its sentence.
 *
 * This component is the reason the score is trustworthy. A bare "82" invites a
 * student to either over-trust it or dismiss it; "Academic fit 23/25 — your 84%
 * clears the 75% requirement" is a fact they can check, argue with, and act on.
 *
 * Weight is shown as bar width, not just as a number, so it is obvious at a glance
 * that budget outweighs intake timing by two and a half times.
 */
export default function MatchBreakdown({ breakdown = [], className }) {
  const maxWeight = Math.max(...breakdown.map((item) => item.max), 1);

  return (
    <ul className={cn('space-y-3.5', className)}>
      {breakdown.map((item) => {
        const style = VERDICT_STYLES[item.verdict] ?? VERDICT_STYLES.unknown;
        const filled = item.max > 0 ? (item.score / item.max) * 100 : 0;

        return (
          <li key={item.key}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-navy-800">
                {item.label}
                {item.verdict === 'unknown' && (
                  <CircleHelp className="size-3.5 text-navy-400" aria-label="Not enough information yet" />
                )}
                {item.watchout && (
                  <TriangleAlert className="size-3.5 text-warning-700" aria-label="Needs planning" />
                )}
              </p>
              <p className="shrink-0 text-2xs font-semibold text-navy-500 tabular-nums">
                {item.score}
                <span className="text-navy-300">/{item.max}</span>
              </p>
            </div>

            {/* Track width is proportional to the scorer's weight in the total, so
                the bars communicate importance as well as performance. */}
            <div className="mt-1.5 flex items-center gap-2">
              <div
                className="h-1.5 overflow-hidden rounded-full bg-navy-100"
                style={{ width: `${(item.max / maxWeight) * 100}%` }}
              >
                <div
                  className={cn('h-full rounded-full transition-[width] duration-500 ease-out', style.bar)}
                  style={{ width: `${filled}%` }}
                />
              </div>
            </div>

            <p className={cn('mt-1.5 text-xs leading-relaxed', style.text)}>{item.reason}</p>
          </li>
        );
      })}
    </ul>
  );
}
