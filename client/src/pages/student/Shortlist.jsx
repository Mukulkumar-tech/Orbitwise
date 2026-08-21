import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, Bookmark, Wallet } from 'lucide-react';

import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import { SkeletonGrid } from '../../components/ui/Skeleton.jsx';
import CourseCard from '../../components/cards/CourseCard.jsx';
import StatTile from '../../components/cards/StatTile.jsx';

import useQuery from '../../hooks/useQuery.js';
import useApply from '../../hooks/useApply.js';
import studentService from '../../services/studentService.js';
import { PATHS } from '../../constants/routes.js';
import { bandOf, formatInr } from '../../constants/domain.js';

/**
 * The student's own shortlist.
 *
 * Held in profile order rather than re-sorted by score: this is the list they
 * built, and silently reordering it because a score moved would lose the reasoning
 * behind the order. Scores are still refreshed on every read, so an edited profile
 * is reflected here immediately.
 */
export default function Shortlist() {
  const { apply, hasApplied, applyingSlug } = useApply();
  const [pendingId, setPendingId] = useState(null);
  const { data, isLoading, isError, error, refetch, revalidate } = useQuery(
    (signal) => studentService.getShortlist(signal),
    []
  );

  const courses = data ?? [];

  const remove = async (course) => {
    setPendingId(course._id);
    try {
      await studentService.removeFromShortlist(course._id);
      toast.success('Removed from your shortlist');
      await revalidate();
    } catch (mutationError) {
      toast.error(mutationError.message);
    } finally {
      setPendingId(null);
    }
  };

  const annualTotals = courses.map((course) => course.match?.costs.total ?? 0).filter(Boolean);
  const cheapest = annualTotals.length ? Math.min(...annualTotals) : null;
  const bestScore = courses.length ? Math.max(...courses.map((course) => course.match?.score ?? 0)) : null;
  const bestBand = courses.find((course) => course.match?.score === bestScore)?.match?.band;

  return (
    <div className="space-y-7">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.03em] text-navy-950 sm:text-3xl">
          Your shortlist
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy-500">
          A good shortlist spreads the risk: one or two ambitious choices, two or three strong ones, and one you are
          confident of. Aim for three to five.
        </p>
      </header>

      {isError ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : isLoading ? (
        <SkeletonGrid count={4} className="xl:grid-cols-2" />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Nothing shortlisted yet"
          description="Shortlisting keeps a course to hand while you compare costs, deadlines and requirements — and it is where applications will start from."
          action={
            <Button as={Link} to={PATHS.studentCourses} rightIcon={ArrowRight}>
              Find courses
            </Button>
          }
        />
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatTile icon={Bookmark} tone="primary" label="Shortlisted" value={courses.length} hint="Cap is 20" />
            <StatTile
              label="Best match"
              value={bestScore != null ? `${bestScore}/100` : '—'}
              hint={bestBand ? bandOf(bestBand).label : undefined}
              tone={bestScore >= 75 ? 'success' : 'warning'}
            />
            <StatTile
              icon={Wallet}
              label="Cheapest per year"
              value={cheapest ? formatInr(cheapest) : '—'}
              hint="Tuition plus living costs"
            />
          </section>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {courses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                isShortlisted
                pending={pendingId === course._id}
                onShortlistToggle={remove}
                onApply={apply}
                appliedTo={hasApplied(course)}
                applying={applyingSlug === course.slug}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
