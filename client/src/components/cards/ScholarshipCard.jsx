import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarClock, Check, ExternalLink, Sparkles } from 'lucide-react';

import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import { PATHS } from '../../constants/routes.js';
import { degreeLabel, formatInr } from '../../constants/domain.js';
import cn from '../../utils/cn.js';

/** Award value as a single readable phrase, whatever shape the award takes. */
const awardLabel = (award) => {
  if (award.type === 'full') return 'Full tuition';
  if (award.type === 'percentage') return `${award.percentOfTuition}% of tuition`;
  return `${formatInr(award.amountInr ?? 0)}${award.recurrence === 'per_year' ? ' / year' : ''}`;
};

/** Deadline urgency drives colour — 7 days and 45 days are not the same news. */
const deadlineTone = (days) => {
  if (days == null) return { tone: 'neutral', label: 'No deadline' };
  if (days <= 7) return { tone: 'danger', label: `${days} day${days === 1 ? '' : 's'} left` };
  if (days <= 30) return { tone: 'warning', label: `${days} days left` };
  return { tone: 'neutral', label: `${days} days left` };
};

export default function ScholarshipCard({ scholarship, className }) {
  const { award, eligibility, match } = scholarship;
  const days = match?.daysRemaining ?? scholarship.daysRemaining;
  const deadline = deadlineTone(days);

  return (
    <article
      className={cn(
        'flex h-full flex-col rounded-2xl bg-surface p-5 shadow-sm transition-shadow duration-200 hairline hover:shadow-lg',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base leading-snug font-semibold text-navy-950">{scholarship.name}</h3>
          <p className="mt-1 text-sm text-navy-500">{scholarship.provider}</p>
        </div>
        {match && (
          <span className="flex size-13 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-50 text-primary-700">
            <span className="text-base font-semibold">{match.score}</span>
            <span className="text-2xs font-medium">match</span>
          </span>
        )}
      </div>

      {/* The brand's gold, used as a fill rather than as text: gold reads at only
          3.98:1 on white even at its darkest step, but navy on gold is 8.51:1.
          A filled pill also makes the money the first thing the eye lands on,
          which is the right emphasis on a funding card. */}
      <p className="mt-4">
        <span className="inline-flex items-center rounded-lg bg-gold-500 px-2.5 py-1 font-display text-xl font-semibold tracking-[-0.01em] text-navy-950">
          {awardLabel(award)}
        </span>
      </p>
      {scholarship.coverage?.length > 0 && (
        <p className="mt-1 text-xs text-navy-500">Covers {scholarship.coverage.join(' · ').toLowerCase()}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone={deadline.tone} size="sm" icon={CalendarClock}>
          {deadline.label}
        </Badge>
        {scholarship.automatic && (
          <Badge tone="success" size="sm">
            Automatic
          </Badge>
        )}
        {eligibility?.degreeLevels?.length > 0 && (
          <Badge tone="neutral" size="sm">
            {eligibility.degreeLevels.map(degreeLabel).join(', ')}
          </Badge>
        )}
        {scholarship.countryName && (
          <Badge tone="neutral" size="sm">
            {scholarship.countryName}
          </Badge>
        )}
      </div>

      {/* Reasons and gaps together: the card says why it fits *and* what is
          missing, because a student needs both to decide whether to bother. */}
      {match && (match.reasons.length > 0 || match.gaps.length > 0) && (
        <ul className="mt-4 space-y-1.5 border-t border-navy-100 pt-4">
          {match.reasons.slice(0, 2).map((reason) => (
            <li key={reason} className="flex items-start gap-2 text-xs leading-relaxed text-navy-600">
              <Check className="mt-0.5 size-3.5 shrink-0 text-success-600" aria-hidden="true" />
              {reason}
            </li>
          ))}
          {match.gaps.slice(0, 2).map((gap) => (
            <li key={gap} className="flex items-start gap-2 text-xs leading-relaxed text-warning-700">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {gap}
            </li>
          ))}
        </ul>
      )}

      {!match && scholarship.description && (
        <p className="mt-4 border-t border-navy-100 pt-4 text-xs leading-relaxed text-navy-600">
          {scholarship.description}
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <Button as={Link} to={`${PATHS.costCalculator}?scholarship=${scholarship.slug}`} size="sm" leftIcon={Sparkles}>
          Model the saving
        </Button>
        {scholarship.applicationUrl && (
          <Button
            as="a"
            href={scholarship.applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            variant="outline"
            rightIcon={ExternalLink}
          >
            Apply
          </Button>
        )}
      </div>
    </article>
  );
}
