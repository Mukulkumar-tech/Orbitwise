import { useId, useState } from 'react';
import { Bookmark, BookmarkCheck, Building2, CalendarDays, CheckCircle2, ChevronDown, Clock, FileText, GraduationCap, Sparkles, TrendingUp, Wallet } from 'lucide-react';

import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import ProgressRing from '../ui/ProgressRing.jsx';
import MatchBreakdown from './MatchBreakdown.jsx';
import {
  bandOf,
  degreeLabel,
  fieldLabel,
  formatDuration,
  formatInr,
  routeOf,
} from '../../constants/domain.js';
import cn from '../../utils/cn.js';

/**
 * A recommended course.
 *
 * The card answers four questions in the order a student asks them: how well does
 * this fit me, what and where is it, what will it cost, and what do I have to
 * watch out for. The score sits top-right with its band spelled out, because a
 * number alone means nothing on first read.
 *
 * The breakdown is collapsed by default and expands in place. Six cards with
 * seven scorers each unfolded is a wall of text; one expanded on demand is an
 * explanation.
 */
export default function CourseCard({
  course,
  isShortlisted = false,
  onShortlistToggle,
  onApply,
  appliedTo = false,
  pending = false,
  applying = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();

  const { match, country, university } = course;
  const band = bandOf(match?.band);
  const route = routeOf(match?.route);
  const annualCost = match?.costs.total;

  return (
    <article
      className={cn(
        'flex flex-col rounded-2xl bg-surface p-5 shadow-sm hairline transition-shadow duration-200',
        'hover:shadow-md'
      )}
    >
      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral" size="sm">
              {degreeLabel(course.degreeLevel)}
            </Badge>
            {course.isPopular && (
              <Badge tone="primary" size="sm" icon={Sparkles}>
                Popular
              </Badge>
            )}
            {match && match.route !== 'direct' && (
              <Badge tone={route.tone} size="sm">
                {route.label}
              </Badge>
            )}
          </div>

          <h3 className="mt-2.5 text-base leading-snug font-semibold text-navy-950">{course.title}</h3>

          <p className="mt-1 flex items-center gap-1.5 text-sm text-navy-600">
            <Building2 className="size-3.5 shrink-0 text-navy-400" aria-hidden="true" />
            <span className="truncate">{university?.name ?? course.universityName}</span>
          </p>
          <p className="mt-0.5 text-xs text-navy-500">
            {course.city}
            {country ? ` · ${country.flag} ${country.name}` : ''}
            {university?.worldRanking ? ` · World #${university.worldRanking}` : ''}
          </p>
        </div>

        {match && (
          <div className="flex shrink-0 flex-col items-center gap-1">
            <ProgressRing
              value={match.score}
              size="md"
              className={band.ring}
              label={`OrbitMatch score ${match.score} out of 100 — ${match.bandLabel}`}
            />
            <span className={cn('rounded-full px-2 py-0.5 text-2xs font-semibold whitespace-nowrap', band.chip)}>
              {match.bandLabel}
            </span>
          </div>
        )}
      </div>

      {/* ─── Facts ────────────────────────────────────────────────────────── */}
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-navy-100 pt-4 text-xs">
        {[
          [Clock, 'Duration', formatDuration(course.durationMonths)],
          [GraduationCap, 'Subject', fieldLabel(course.field)],
          [
            Wallet,
            'Per year, all in',
            annualCost ? formatInr(annualCost) : formatInr(course.tuitionPerYearInr),
            annualCost ? `${formatInr(course.tuitionPerYearInr)} tuition` : 'tuition only',
          ],
          [CalendarDays, 'Intakes', course.intakes?.join(', ') || 'Not published'],
        ].map(([Icon, label, value, hint]) => (
          <div key={label} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-2xs font-semibold tracking-wide text-navy-400 uppercase">
              <Icon className="size-3" aria-hidden="true" />
              {label}
            </dt>
            <dd className="mt-1 truncate font-medium text-navy-800">{value}</dd>
            {hint && <dd className="text-2xs text-navy-400">{hint}</dd>}
          </div>
        ))}
      </dl>

      {/* ─── Headlines from the match ─────────────────────────────────────── */}
      {match?.conditionalNote && (
        <p className="mt-4 rounded-lg bg-info-50 px-3 py-2 text-xs leading-relaxed text-info-600">
          {match.conditionalNote}
        </p>
      )}

      {match?.watchouts?.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {match.watchouts.slice(0, 2).map((watchout) => (
            <li key={watchout} className="flex gap-2 text-xs leading-relaxed text-warning-700">
              <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning-500" />
              {watchout}
            </li>
          ))}
        </ul>
      )}

      {course.scholarship?.available && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-success-700">
          <TrendingUp className="size-3.5 shrink-0" aria-hidden="true" />
          Scholarship up to {course.scholarship.maxPercentOfTuition}% of tuition
        </p>
      )}

      {/* ─── Actions ──────────────────────────────────────────────────────────
          The `mt-auto` wrapper pins this row to the bottom of the card. Cards in a
          grid row stretch to the tallest one, so without it a course with no
          watchouts leaves its buttons floating halfway up a column of whitespace.
          `pt-5` keeps a real gap above the divider when there is no slack to absorb. */}
      <div className="mt-auto pt-5">
        <div className="flex flex-wrap items-center gap-2 border-t border-navy-100 pt-4">
          {match && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((open) => !open)}
              aria-expanded={expanded}
              aria-controls={detailsId}
              rightIcon={ChevronDown}
              className={cn('[&>svg:last-child]:transition-transform', expanded && '[&>svg:last-child]:rotate-180')}
            >
              {expanded ? 'Hide' : 'Why this matches'}
            </Button>
          )}

          {onShortlistToggle && (
            <Button
              variant={isShortlisted ? 'subtle' : 'outline'}
              size="sm"
              leftIcon={isShortlisted ? BookmarkCheck : Bookmark}
              isLoading={pending}
              onClick={() => onShortlistToggle(course)}
              className={cn(!onApply && 'ml-auto')}
            >
              {isShortlisted ? 'Shortlisted' : 'Shortlist'}
            </Button>
          )}

          {/* Only rendered when a caller supplies a handler, so the public
              catalogue — where there is nobody to apply as — is unchanged.
              Already-applied courses link to the record instead of offering a
              second attempt the API would reject with a 409. */}
          {onApply && (
            <Button
              variant={appliedTo ? 'subtle' : 'primary'}
              size="sm"
              leftIcon={appliedTo ? CheckCircle2 : FileText}
              isLoading={applying}
              onClick={() => onApply(course)}
              className="ml-auto"
            >
              {appliedTo ? 'View application' : 'Apply'}
            </Button>
          )}
        </div>
      </div>

      {expanded && match && (
        <div id={detailsId} className="mt-4 rounded-xl bg-navy-50/70 p-4">
          <p className="text-2xs font-semibold tracking-wide text-navy-400 uppercase">
            How this score is built · {match.score}/100
          </p>
          <MatchBreakdown breakdown={match.breakdown} className="mt-3.5" />

          {course.summary && <p className="mt-4 border-t border-navy-200/70 pt-3.5 text-xs leading-relaxed text-navy-600">{course.summary}</p>}

          {course.requirements?.additional?.length > 0 && (
            <div className="mt-3.5">
              <p className="text-2xs font-semibold tracking-wide text-navy-400 uppercase">Also required</p>
              <ul className="mt-1.5 space-y-1">
                {course.requirements.additional.map((requirement) => (
                  <li key={requirement} className="flex gap-2 text-xs leading-relaxed text-navy-600">
                    <span aria-hidden="true" className="mt-1.5 size-1 shrink-0 rounded-full bg-navy-400" />
                    {requirement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {course.careerOutcomes?.length > 0 && (
            <p className="mt-3.5 text-xs leading-relaxed text-navy-600">
              <span className="font-semibold text-navy-700">Leads to: </span>
              {course.careerOutcomes.join(' · ')}
              {course.averageStartingSalaryInr
                ? ` · typical start ${formatInr(course.averageStartingSalaryInr)}/yr`
                : ''}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
