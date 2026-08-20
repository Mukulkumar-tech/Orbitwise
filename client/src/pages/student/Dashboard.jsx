import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Bookmark,
  Compass,
  GraduationCap,
  Globe2,
  ListChecks,
  Sparkles,
  Target,
  Wallet,
} from 'lucide-react';

import Alert from '../../components/ui/Alert.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import ProgressRing from '../../components/ui/ProgressRing.jsx';
import { SkeletonCard, SkeletonText } from '../../components/ui/Skeleton.jsx';
import CourseCard from '../../components/cards/CourseCard.jsx';
import StatTile from '../../components/cards/StatTile.jsx';

import useQuery from '../../hooks/useQuery.js';
import studentService from '../../services/studentService.js';
import { useAuth } from '../../hooks/useAuth.js';
import { PATHS } from '../../constants/routes.js';
import {
  JOURNEY_STAGE_LABELS,
  bandOf,
  degreeLabel,
  educationLabel,
  formatInr,
} from '../../constants/domain.js';
import cn from '../../utils/cn.js';

/** Deep link into the wizard step that fills a specific gap. */
const stepLink = (step) => `${PATHS.studentProfile}?step=${step}`;

/**
 * The student dashboard.
 *
 * Ordered by what a student needs to know rather than by what is easy to render:
 * where they stand, what their qualification opens, what to do next, and only then
 * the matches themselves. The whole page is one request — see dashboardService —
 * so it paints once instead of settling in six stages.
 */
export default function Dashboard() {
  const { user } = useAuth();
  const [pendingId, setPendingId] = useState(null);

  const { data, isLoading, isError, error, refetch, revalidate } = useQuery(
    (signal) => studentService.getDashboard(signal),
    []
  );

  const shortlistedIds = new Set((data?.shortlist ?? []).map((course) => course._id));

  const toggleShortlist = async (course) => {
    const isShortlisted = shortlistedIds.has(course._id);
    setPendingId(course._id);

    try {
      if (isShortlisted) {
        await studentService.removeFromShortlist(course._id);
        toast.success('Removed from your shortlist');
      } else {
        await studentService.addToShortlist(course._id);
        toast.success('Added to your shortlist');
      }
      // Revalidate rather than patch locally: shortlisting changes the journey
      // stage and the tile counts, and re-deriving those here would duplicate the
      // server's rules.
      await revalidate();
    } catch (mutationError) {
      toast.error(mutationError.message);
    } finally {
      setPendingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <SkeletonText lines={2} className="max-w-md" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="rounded-2xl bg-surface p-5 shadow-sm hairline">
              <SkeletonText lines={2} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={refetch} />;

  const { profile, completion, guidance, journeyStage, stats, matches, insights } = data;
  const hasProfile = Boolean(profile.education?.level);

  /** The admission routes this student actually has, in order of immediacy. */
  const routeGroups = [
    ['Open to you now', guidance.eligibleDegreeLevels, 'success', 'Apply today'],
    ['Conditional offers', guidance.conditionalDegreeLevels, 'info', 'Apply on predicted grades'],
    ['After your result', guidance.futureDegreeLevels, 'neutral', 'Plan for it now'],
  ].filter(([, levels]) => levels?.length);

  return (
    <div className="space-y-8">
      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.03em] text-navy-950 sm:text-3xl">
            Good to see you, {user.name.split(' ')[0]}
          </h1>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Badge tone="primary" dot>
              {JOURNEY_STAGE_LABELS[journeyStage] ?? journeyStage}
            </Badge>
            {hasProfile && <Badge tone="neutral">{educationLabel(profile.education.level)}</Badge>}
            {profile.goal?.degreeLevel && <Badge tone="neutral">{degreeLabel(profile.goal.degreeLevel)}</Badge>}
          </div>
        </div>

        <Link
          to={PATHS.studentProfile}
          className="flex items-center gap-3 rounded-2xl bg-surface p-3 pr-4 shadow-sm hairline transition-shadow duration-200 hover:shadow-md"
        >
          <ProgressRing
            value={completion.percent}
            size="sm"
            suffix="%"
            className={completion.percent === 100 ? 'text-success-700' : 'text-primary-700'}
            label={`Profile ${completion.percent}% complete`}
          />
          <span>
            <span className="block text-xs font-semibold text-navy-900">Profile complete</span>
            <span className="block text-2xs text-navy-500">
              {completion.percent === 100 ? 'Nothing left to add' : `${completion.missing.length} answers left`}
            </span>
          </span>
        </Link>
      </header>

      {/* ─── No profile yet: the one thing to do ──────────────────────────── */}
      {!hasProfile && (
        <section className="overflow-hidden rounded-2xl bg-navy-950 p-6 md:p-9">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-2xs font-semibold text-primary-300 ring-1 ring-white/10">
              <Sparkles className="size-3" aria-hidden="true" />
              Takes about two minutes
            </span>
            <h2 className="mt-4 font-display text-2xl leading-tight font-semibold tracking-[-0.03em] text-white sm:text-3xl">
              Tell us where you are, and we’ll show you exactly what you can study
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-navy-300">
              Five steps: your marks, what you want to study, where, your budget and your English test. We score every
              one of {stats.eligibleCourses} courses across {stats.universities} universities against your real profile —
              and show you why each one scored the way it did.
            </p>
            <Button as={Link} to={PATHS.onboarding} size="lg" rightIcon={ArrowRight} className="mt-7">
              Build my profile
            </Button>
          </div>
        </section>
      )}

      {/* ─── What your qualification opens ───────────────────────────────── */}
      {hasProfile && guidance.known && (
        <section className="rounded-2xl bg-surface p-6 shadow-sm hairline md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-navy-950">{guidance.headline}</h2>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-navy-600">{guidance.note}</p>
            </div>
            {guidance.milestone && (
              <Badge tone="warning">Next milestone: {guidance.milestone}</Badge>
            )}
          </div>

          {/* Columns match the number of populated groups. A fixed three-column
              grid leaves a Class 12 leaver — who has only "open to you now" —
              staring at two thirds of an empty panel. */}
          <div
            className={cn(
              'mt-5 grid gap-4',
              routeGroups.length === 2 && 'sm:grid-cols-2',
              routeGroups.length >= 3 && 'sm:grid-cols-3'
            )}
          >
            {routeGroups.map(([label, levels, tone, hint]) => (
              <div key={label} className="rounded-xl bg-navy-50/70 p-4">
                <p className="text-2xs font-semibold tracking-wide text-navy-400 uppercase">{label}</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {levels.map((level) => (
                    <li key={level}>
                      <Badge tone={tone} size="sm">
                        {degreeLabel(level)}
                      </Badge>
                    </li>
                  ))}
                </ul>
                <p className="mt-2.5 text-xs text-navy-500">{hint}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Numbers ──────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={Target}
          tone="primary"
          label="Courses matched"
          value={hasProfile ? stats.matchingCourses : stats.eligibleCourses}
          hint={hasProfile ? 'Eligible, in your destinations and subjects' : 'Across the whole catalogue'}
        />
        <StatTile
          icon={Sparkles}
          tone={insights?.bestScore >= 75 ? 'success' : 'warning'}
          label="Best match"
          value={insights?.bestScore != null ? `${insights.bestScore}/100` : '—'}
          hint={insights?.bestBand ? bandOf(insights.bestBand).label : 'Finish your profile to see this'}
        />
        <StatTile
          icon={Wallet}
          label="Typical cost a year"
          value={insights?.typicalAnnualCostInr ? formatInr(insights.typicalAnnualCostInr) : '—'}
          hint="Tuition plus living, across your top matches"
        />
        <StatTile
          icon={Bookmark}
          label="Shortlisted"
          value={stats.shortlisted ?? 0}
          hint={stats.shortlisted ? 'Review and compare them' : 'Aim for three to five'}
        />
      </section>

      {/* ─── Next steps ───────────────────────────────────────────────────── */}
      {guidance.actions?.length > 0 && (
        <section className="rounded-2xl bg-surface p-6 shadow-sm hairline md:p-7">
          <h2 className="flex items-center gap-2 text-base font-semibold text-navy-950">
            <ListChecks className="size-4.5 text-primary-700" aria-hidden="true" />
            Your next steps
          </h2>

          <ol className="mt-4 space-y-3">
            {guidance.actions.map((action, index) => (
              <li key={action.label} className="flex gap-3.5">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-2xs font-bold text-primary-700"
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy-900">
                    {action.step ? (
                      <Link to={stepLink(action.step)} className="rounded hover:text-primary-800 hover:underline">
                        {action.label}
                      </Link>
                    ) : (
                      action.label
                    )}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-navy-500">{action.hint}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ─── Sharpen the score ────────────────────────────────────────────── */}
      {hasProfile && insights?.unknowns?.length > 0 && (
        <Alert
          tone="info"
          title="Your scores are provisional"
          action={
            <Button as={Link} to={PATHS.studentProfile} size="sm" variant="outline">
              Complete profile
            </Button>
          }
        >
          {insights.unknowns.join(', ')} {insights.unknowns.length === 1 ? 'is' : 'are'} still scored on partial credit.
          Filling {completion.missing.map((item) => item.label.toLowerCase()).slice(0, 3).join(', ')} makes every match
          score exact.
        </Alert>
      )}

      {/* ─── Matches ──────────────────────────────────────────────────────── */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-navy-950">
              {hasProfile ? 'Your top matches' : 'Popular right now'}
            </h2>
            <p className="mt-1 text-sm text-navy-500">
              {hasProfile
                ? `Scored against your profile out of ${stats.matchingCourses} eligible courses. ${insights?.directOffers ?? 0} of these are direct-entry.`
                : 'Build your profile to see how each of these scores for you.'}
            </p>
          </div>

          {matches.length > 0 && (
            <Button as={Link} to={PATHS.studentCourses} variant="outline" size="sm" rightIcon={ArrowRight}>
              See all matches
            </Button>
          )}
        </div>

        {matches.length === 0 ? (
          <EmptyState
            icon={hasProfile ? Compass : GraduationCap}
            title={hasProfile ? 'No courses match those filters yet' : 'Your matches are one step away'}
            description={
              hasProfile
                ? 'Widening your destinations or budget is usually enough. Nothing is lost — your profile stays as it is.'
                : 'Tell us your marks, subject and budget, and every course in the catalogue gets scored against them.'
            }
            className="mt-5"
            action={
              <Button as={Link} to={hasProfile ? PATHS.studentCourses : PATHS.onboarding} rightIcon={ArrowRight}>
                {hasProfile ? 'Adjust your filters' : 'Build my profile'}
              </Button>
            }
          />
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {matches.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                isShortlisted={shortlistedIds.has(course._id)}
                pending={pendingId === course._id}
                onShortlistToggle={toggleShortlist}
              />
            ))}
          </div>
        )}
      </section>

      {/* ─── Reach ────────────────────────────────────────────────────────── */}
      <section className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-2xl bg-navy-950 px-6 py-5">
        {[
          [Globe2, stats.countries, 'destinations'],
          [GraduationCap, stats.universities, 'universities'],
          [Compass, stats.eligibleCourses, 'courses open to you'],
        ].map(([Icon, value, label]) => (
          <div key={label} className="flex items-center gap-2.5">
            <Icon className="size-4 text-primary-400" aria-hidden="true" />
            <p className="text-sm text-navy-300">
              <span className="font-semibold text-white tabular-nums">{value}</span> {label}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
