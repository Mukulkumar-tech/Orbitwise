import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, ChevronLeft, ChevronRight, Compass, RotateCcw, Search } from 'lucide-react';

import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import { SkeletonGrid } from '../../components/ui/Skeleton.jsx';
import CourseCard from '../../components/cards/CourseCard.jsx';

import useQuery from '../../hooks/useQuery.js';
import studentService from '../../services/studentService.js';
import catalogueService from '../../services/catalogueService.js';
import { PATHS } from '../../constants/routes.js';
import { FIELDS, degreeLabel } from '../../constants/domain.js';

const PAGE_SIZE = 12;

/**
 * Course discovery, with the student's profile as the starting point.
 *
 * Filters live in the URL rather than in component state: the back button works,
 * a filtered list can be sent to a parent or a counsellor, and a refresh does not
 * silently reset to "everything". Empty values are removed from the query string so
 * a shared link carries only what was actually chosen.
 */
export default function Matches() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pendingId, setPendingId] = useState(null);
  const [searchDraft, setSearchDraft] = useState(searchParams.get('q') ?? '');

  const filters = useMemo(
    () => ({
      q: searchParams.get('q') ?? '',
      countryCode: searchParams.get('countryCode') ?? '',
      field: searchParams.get('field') ?? '',
      degreeLevel: searchParams.get('degreeLevel') ?? '',
      allFields: searchParams.get('allFields') === 'true',
      page: Number(searchParams.get('page')) || 1,
    }),
    [searchParams]
  );

  const options = useQuery((signal) => catalogueService.getOptions(signal), []);
  const profileQuery = useQuery((signal) => studentService.getProfile(signal), []);
  const shortlistQuery = useQuery((signal) => studentService.getShortlist(signal), []);

  const results = useQuery(
    (signal) =>
      studentService.getRecommendations(
        {
          page: filters.page,
          limit: PAGE_SIZE,
          ...(filters.q ? { q: filters.q } : {}),
          ...(filters.countryCode ? { countryCode: filters.countryCode } : {}),
          ...(filters.field ? { field: filters.field } : {}),
          ...(filters.degreeLevel ? { degreeLevel: filters.degreeLevel } : {}),
          ...(filters.allFields ? { allFields: 'true' } : {}),
        },
        signal
      ),
    [filters.page, filters.q, filters.countryCode, filters.field, filters.degreeLevel, filters.allFields],
    // Keeping the previous page on screen while the next loads stops the layout
    // collapsing to a spinner on every filter change.
    { keepPreviousData: true }
  );

  const shortlistedIds = new Set((shortlistQuery.data ?? []).map((course) => course._id));

  const setFilter = (patch) => {
    const next = new URLSearchParams(searchParams);

    for (const [key, value] of Object.entries(patch)) {
      if (value === '' || value == null || value === false) next.delete(key);
      else next.set(key, String(value));
    }
    // Any filter change invalidates the page number — page 4 of a narrower result
    // set is usually empty, which reads as "no matches" when the truth is "wrong page".
    if (!('page' in patch)) next.delete('page');

    setSearchParams(next, { replace: true });
  };

  const clearFilters = () => {
    setSearchDraft('');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const toggleShortlist = async (course) => {
    setPendingId(course._id);
    try {
      if (shortlistedIds.has(course._id)) {
        await studentService.removeFromShortlist(course._id);
        toast.success('Removed from your shortlist');
      } else {
        await studentService.addToShortlist(course._id);
        toast.success('Added to your shortlist');
      }
      await shortlistQuery.revalidate();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPendingId(null);
    }
  };

  const eligibleLevels = profileQuery.data?.eligibleDegreeLevels ?? [];
  const hasProfile = Boolean(profileQuery.data?.profile?.education?.level);
  // getRecommendations returns { items, meta } as its payload, so pagination facts
  // live under data.meta rather than on the query result itself.
  const items = results.data?.items ?? [];
  const meta = results.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 1;

  const activeFilterCount = [filters.q, filters.countryCode, filters.field, filters.degreeLevel].filter(Boolean).length;

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.03em] text-navy-950 sm:text-3xl">
            Find your course
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy-500">
            {hasProfile
              ? 'Every course here is one you can be admitted to, scored against your marks, budget, English test and destinations.'
              : 'Build your profile and every course gets a score explaining how well it fits you.'}
          </p>
        </div>

        {!hasProfile && (
          <Button as={Link} to={PATHS.onboarding} rightIcon={ArrowRight}>
            Build my profile
          </Button>
        )}
      </header>

      {/* ─── Filters ──────────────────────────────────────────────────────── */}
      <section className="rounded-2xl bg-surface p-4 shadow-sm hairline md:p-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setFilter({ q: searchDraft.trim() });
          }}
          className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"
        >
          <Input
            label="Search"
            leftIcon={Search}
            placeholder="Course or university"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            // Submitted rather than debounced: a search that fires per keystroke
            // sends six requests for "canada" and shows the wrong one if they race.
            hint="Press Enter to search"
          />

          <Select
            label="Destination"
            placeholder="Any of my destinations"
            options={(options.data?.countries ?? []).map((country) => ({
              value: country.code,
              label: `${country.flag} ${country.name}`,
            }))}
            value={filters.countryCode}
            onChange={(event) => setFilter({ countryCode: event.target.value })}
          />

          <Select
            label="Subject area"
            placeholder="My subjects and related"
            options={Object.entries(FIELDS).map(([value, label]) => ({ value, label }))}
            value={filters.field}
            onChange={(event) => setFilter({ field: event.target.value })}
          />

          <Select
            label="Qualification"
            placeholder="Anything I'm eligible for"
            options={eligibleLevels.map((level) => ({ value: level, label: degreeLabel(level) }))}
            value={filters.degreeLevel}
            onChange={(event) => setFilter({ degreeLevel: event.target.value })}
          />
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-navy-100 pt-3.5">
          <label className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-navy-600">
            <input
              type="checkbox"
              checked={filters.allFields}
              onChange={(event) => setFilter({ allFields: event.target.checked })}
              className="size-4 rounded border-navy-300 accent-primary-600"
            />
            Search every subject, not just mine
          </label>

          <div className="flex items-center gap-3">
            <p className="text-xs text-navy-500 tabular-nums">
              {results.isLoading ? 'Scoring…' : `${total} course${total === 1 ? '' : 's'}`}
            </p>
            {(activeFilterCount > 0 || filters.allFields) && (
              <Button variant="ghost" size="sm" leftIcon={RotateCcw} onClick={clearFilters}>
                Reset
              </Button>
            )}
          </div>
        </div>
      </section>

      {meta?.capped && (
        <Alert tone="info" title="Showing the first 500 candidates">
          Your filters match more courses than we score in one pass. Narrowing the destination or subject gives a complete
          ranking rather than a partial one.
        </Alert>
      )}

      {/* ─── Results ──────────────────────────────────────────────────────── */}
      {results.isError ? (
        <ErrorState error={results.error} onRetry={results.refetch} />
      ) : results.isLoading && items.length === 0 ? (
        <SkeletonGrid count={6} className="xl:grid-cols-2" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="Nothing matches those filters"
          description={
            filters.degreeLevel && !eligibleLevels.includes(filters.degreeLevel)
              ? 'That qualification is not open to you at your current education level — which is why the list is empty rather than optimistic.'
              : 'Try a different destination, widen the subject areas, or reset the filters and start from your profile.'
          }
          action={
            <Button variant="outline" leftIcon={RotateCcw} onClick={clearFilters}>
              Reset filters
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {items.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                isShortlisted={shortlistedIds.has(course._id)}
                pending={pendingId === course._id}
                onShortlistToggle={toggleShortlist}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <nav aria-label="Results pages" className="flex items-center justify-between gap-4 pt-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={ChevronLeft}
                disabled={filters.page <= 1}
                onClick={() => setFilter({ page: filters.page - 1 })}
              >
                Previous
              </Button>

              <p className="text-xs font-medium text-navy-500 tabular-nums">
                Page {filters.page} of {totalPages}
              </p>

              <Button
                variant="outline"
                size="sm"
                rightIcon={ChevronRight}
                disabled={filters.page >= totalPages}
                onClick={() => setFilter({ page: filters.page + 1 })}
              >
                Next
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
