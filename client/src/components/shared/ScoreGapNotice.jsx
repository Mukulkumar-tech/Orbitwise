import { Link } from 'react-router-dom';
import { ArrowRight, Gauge } from 'lucide-react';

import Button from '../ui/Button.jsx';
import { PATHS } from '../../constants/routes.js';
import { isTrustedMatch, joinReadable, matchGapLabel } from '../../constants/domain.js';
import cn from '../../utils/cn.js';

/**
 * Explains, once per page, why no match percentages are showing.
 *
 * Deliberately not per card. The first version put this banner inside
 * `CourseCard`, which meant twelve identical copies on one screen — it buried the
 * course facts and read as an error rather than a next step. The card keeps only
 * a compact "Score your profile" placeholder where the ring would be; the reason
 * belongs here, stated once.
 *
 * Renders nothing when the matches can be trusted, so callers can drop it in
 * unconditionally rather than duplicating the confidence check.
 */
export default function ScoreGapNotice({ matches = [], className }) {
  const untrusted = matches.filter((item) => item.match && !isTrustedMatch(item.match));
  if (untrusted.length === 0) return null;

  // The gaps are the same across every course on the page — they come from the
  // profile, not the course — so the widest set is the honest one to name.
  const gaps = untrusted
    .reduce((widest, item) => (item.match.missing.length > widest.length ? item.match.missing : widest), [])
    .map((item) => matchGapLabel(item.key));

  return (
    <div
      className={cn(
        'flex flex-wrap items-start gap-4 rounded-2xl bg-warning-50 p-5 ring-1 ring-warning-200',
        className
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning-100">
        <Gauge className="size-5 text-warning-800" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-warning-800">Match scores are hidden until your profile can carry them</p>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-navy-700">
          Every course below is one you are eligible for. Scoring them needs your{' '}
          {joinReadable(gaps)} — without those, a percentage here would be a guess dressed up as a
          number, so we would rather show you nothing.
        </p>
      </div>

      <Button as={Link} to={PATHS.onboarding} rightIcon={ArrowRight} className="shrink-0">
        Finish your profile
      </Button>
    </div>
  );
}
