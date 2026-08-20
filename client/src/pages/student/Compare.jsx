import { Link, useSearchParams } from 'react-router-dom';
import { Award, Check, Crown, GitCompareArrows, X } from 'lucide-react';

import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import useQuery from '../../hooks/useQuery.js';
import catalogueService from '../../services/catalogueService.js';
import { PATHS } from '../../constants/routes.js';
import { bandOf, degreeLabel, fieldLabel, formatDuration, formatInr } from '../../constants/domain.js';
import cn from '../../utils/cn.js';

/**
 * Side-by-side course comparison.
 *
 * Selection lives in the URL (`?slugs=a,b,c`), so a comparison is shareable and
 * survives a reload — a student comparing four courses will want to send that
 * screen to a parent.
 *
 * Per-dimension winners come from the server: "cheapest" is total programme cost
 * across differing durations, not the smallest tuition figure, and that
 * arithmetic belongs where the costs are computed.
 */
export default function Compare() {
  const [params, setParams] = useSearchParams();
  const slugs = (params.get('slugs') ?? '').split(',').filter(Boolean);
  const enabled = slugs.length >= 2;

  const { data, isLoading, isError, error, refetch } = useQuery(
    (signal) => catalogueService.compare(slugs.join(','), signal),
    [params.get('slugs')],
    { enabled }
  );

  const remove = (slug) => {
    const next = slugs.filter((entry) => entry !== slug);
    if (next.length) setParams({ slugs: next.join(',') }, { replace: true });
    else setParams({}, { replace: true });
  };

  if (!enabled) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy-950 md:text-3xl">Compare courses</h1>
        <EmptyState
          className="mt-8"
          icon={GitCompareArrows}
          title="Pick at least two courses"
          description="Add courses from your shortlist or matches, and Orbitwise will line them up on cost, entry requirements, duration and fit."
          action={
            <>
              <Button as={Link} to={PATHS.studentShortlist}>
                Go to my shortlist
              </Button>
              <Button as={Link} to={PATHS.studentCourses} variant="outline">
                Browse matches
              </Button>
            </>
          }
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-6 h-96" rounded="rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <ErrorState error={error} onRetry={refetch} title="Couldn’t build that comparison" />
        <Button as={Link} to={PATHS.studentShortlist} variant="outline" className="mt-6">
          Back to shortlist
        </Button>
      </div>
    );
  }

  const { items, bestBy, recommended, personalized } = data;

  /** A cell wins its row when the server named it — highlighted, not just bolded. */
  const winnerCell = (slug, dimension) => bestBy[dimension] === slug;

  const ROWS = [
    { key: 'match', label: 'OrbitMatch', render: (c) => (c.match ? `${c.match.score}%` : '—') },
    { key: 'totalCost', label: 'Total programme cost', render: (c) => formatInr(c.programmeCostInr) },
    { key: 'tuition', label: 'Tuition / year', render: (c) => formatInr(c.tuitionPerYearInr) },
    { key: 'duration', label: 'Duration', render: (c) => formatDuration(c.durationMonths) },
    { key: 'entryRequirement', label: 'IELTS required', render: (c) => c.requirements?.minIelts ?? '—' },
    { key: 'ranking', label: 'World ranking', render: (c) => (c.university?.worldRanking ? `#${c.university.worldRanking}` : '—') },
    { key: 'acceptanceRate', label: 'Acceptance rate', render: (c) => (c.university?.acceptanceRate != null ? `${c.university.acceptanceRate}%` : '—') },
    { key: null, label: 'Level', render: (c) => degreeLabel(c.degreeLevel) },
    { key: null, label: 'Subject', render: (c) => fieldLabel(c.field) },
    { key: null, label: 'Scholarship', render: (c) => (c.scholarship?.available ? `Up to ${c.scholarship.maxPercentOfTuition}%` : 'None listed') },
    { key: null, label: 'Intakes', render: (c) => c.intakes?.join(', ') || '—' },
  ];

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy-950 md:text-3xl">
            Comparing {items.length} courses
          </h1>
          <p className="mt-2 text-sm text-navy-500">
            Highlighted cells are the best value in each row.
            {personalized ? '' : ' Build your profile for a fit-based recommendation.'}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setParams({}, { replace: true })}>
          Clear comparison
        </Button>
      </header>

      {recommended && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-primary-50 p-5">
          <Crown className="mt-0.5 size-5 shrink-0 text-primary-700" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-navy-950">
              Best overall: {items.find((item) => item.slug === recommended.slug)?.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-navy-600">{recommended.reason}</p>
          </div>
        </div>
      )}

      <div className="scrollbar-slim mt-8 overflow-x-auto rounded-2xl bg-surface shadow-sm hairline">
        <table className="w-full min-w-[44rem] text-sm">
          <caption className="sr-only">Courses compared by cost, requirements, duration and fit</caption>
          <thead>
            <tr className="border-b border-navy-100">
              <th scope="col" className="w-44 px-5 py-4 text-left text-2xs font-semibold tracking-wider text-navy-400 uppercase">
                Course
              </th>
              {items.map((course) => (
                <th key={course.slug} scope="col" className="px-5 py-4 text-left align-top">
                  <span className="flex items-start justify-between gap-2">
                    <Link to={PATHS.course(course.slug)} className="text-sm leading-snug font-semibold text-navy-950 hover:text-primary-800">
                      {course.title}
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(course.slug)}
                      aria-label={`Remove ${course.title} from comparison`}
                      className="shrink-0 rounded-md p-1 text-navy-400 transition-colors hover:bg-navy-100 hover:text-navy-700"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </span>
                  <span className="mt-1 block text-xs font-normal text-navy-500">{course.universityName}</span>
                  {course.match && (
                    <Badge tone={bandOf(course.match.band).tone ?? 'primary'} size="sm" className="mt-2">
                      {course.match.bandLabel}
                    </Badge>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100">
            {ROWS.map((row) => (
              <tr key={row.label}>
                <th scope="row" className="px-5 py-3.5 text-left font-medium text-navy-500">
                  {row.label}
                </th>
                {items.map((course) => {
                  const isWinner = row.key ? winnerCell(course.slug, row.key) : false;
                  return (
                    <td
                      key={course.slug}
                      className={cn(
                        'px-5 py-3.5',
                        isWinner ? 'bg-success-50 font-semibold text-success-800' : 'text-navy-800'
                      )}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {isWinner && <Check className="size-3.5 shrink-0" aria-hidden="true" />}
                        {row.render(course)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <th scope="row" className="px-5 py-4 text-left font-medium text-navy-500">
                <span className="inline-flex items-center gap-1.5">
                  <Award className="size-3.5" aria-hidden="true" />
                  Action
                </span>
              </th>
              {items.map((course) => (
                <td key={course.slug} className="px-5 py-4">
                  <Button as={Link} to={PATHS.course(course.slug)} size="sm" variant="outline">
                    View course
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
