import { Link, useSearchParams } from 'react-router-dom';
import { GraduationCap, SlidersHorizontal } from 'lucide-react';

import PageHero from '../../components/shared/PageHero.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Select from '../../components/ui/Select.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import CourseCard from '../../components/cards/CourseCard.jsx';
import useQuery from '../../hooks/useQuery.js';
import { useAuth } from '../../hooks/useAuth.js';
import catalogueService from '../../services/catalogueService.js';
import { PATHS } from '../../constants/routes.js';
import { DEGREE_LEVELS, FIELDS, degreeLabel, fieldLabel } from '../../constants/domain.js';

/**
 * Public course catalogue.
 *
 * The same endpoint powers the student portal: signed in, the API attaches an
 * OrbitMatch score and filters to eligible levels, so this page quietly becomes
 * personalized without a second implementation.
 */
export default function Courses() {
  const [params, setParams] = useSearchParams();
  const { isAuthenticated, isStudent } = useAuth();

  const filters = {
    countryCode: params.get('countryCode') ?? '',
    degreeLevel: params.get('degreeLevel') ?? '',
    field: params.get('field') ?? '',
  };
  const page = Number(params.get('page') ?? 1);

  const { data: countries } = useQuery((signal) => catalogueService.listCountries(signal), []);
  const { data, isLoading, isError, error, refetch } = useQuery(
    (signal) =>
      catalogueService.listCourses(
        {
          ...Object.fromEntries(Object.entries(filters).filter(([, value]) => value)),
          page,
          limit: 12,
        },
        signal
      ),
    [filters.countryCode, filters.degreeLevel, filters.field, page]
  );

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next, { replace: true });
  };

  const items = data?.items ?? [];
  const meta = data?.meta;
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <>
      <PageHero
        eyebrow="Courses"
        title="Find a course you can actually get into"
        description="Every listing shows its entry requirements, total cost and intakes up front. Sign in and each one gets an OrbitMatch score explaining how it fits you."
        breadcrumbs={[{ label: 'Home', to: PATHS.home }, { label: 'Courses' }]}
      />

      <div className="container-page py-14 md:py-20">
        {!isAuthenticated && (
          <Alert tone="info" className="mb-8" title="Browsing the full catalogue">
            You are seeing every course. Build a free profile and this list narrows to programmes you are eligible for,
            ranked by fit —{' '}
            <Link to={PATHS.register} className="font-semibold underline">
              start now
            </Link>
            .
          </Alert>
        )}

        {isStudent && meta?.personalized && (
          <Alert tone="success" className="mb-8" title="Personalized for you">
            Filtered to programmes matching your education level and scored by OrbitMatch.
          </Alert>
        )}

        {/* ─── Filters ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 rounded-2xl bg-surface p-5 shadow-sm hairline sm:grid-cols-3">
          <Select label="Destination" value={filters.countryCode} onChange={(e) => update('countryCode', e.target.value)}>
            <option value="">All destinations</option>
            {(countries ?? []).map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </Select>

          <Select label="Level" value={filters.degreeLevel} onChange={(e) => update('degreeLevel', e.target.value)}>
            <option value="">All levels</option>
            {Object.keys(DEGREE_LEVELS).map((slug) => (
              <option key={slug} value={slug}>
                {degreeLabel(slug)}
              </option>
            ))}
          </Select>

          <Select label="Subject" value={filters.field} onChange={(e) => update('field', e.target.value)}>
            <option value="">All subjects</option>
            {Object.keys(FIELDS).map((slug) => (
              <option key={slug} value={slug}>
                {fieldLabel(slug)}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-navy-500">
            {meta ? `${meta.total} course${meta.total === 1 ? '' : 's'}` : 'Loading…'}
          </p>
          {activeCount > 0 && (
            <Button variant="ghost" size="sm" leftIcon={SlidersHorizontal} onClick={() => setParams({}, { replace: true })}>
              Clear {activeCount} filter{activeCount === 1 ? '' : 's'}
            </Button>
          )}
        </div>

        {isLoading && (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-72" rounded="rounded-2xl" />
            ))}
          </div>
        )}

        {isError && <ErrorState className="mt-6" error={error} onRetry={refetch} title="Couldn’t load courses" />}

        {data && items.length === 0 && (
          <EmptyState
            className="mt-6"
            icon={GraduationCap}
            title="No courses match those filters"
            description="Try widening the destination or level."
            action={
              <Button variant="outline" onClick={() => setParams({}, { replace: true })}>
                Clear filters
              </Button>
            }
          />
        )}

        {items.length > 0 && (
          <>
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>

            {meta && meta.totalPages > 1 && (
              <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasPrevPage}
                  onClick={() => {
                    const next = new URLSearchParams(params);
                    next.set('page', String(page - 1));
                    setParams(next);
                  }}
                >
                  Previous
                </Button>
                <span className="text-sm text-navy-500">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasNextPage}
                  onClick={() => {
                    const next = new URLSearchParams(params);
                    next.set('page', String(page + 1));
                    setParams(next);
                  }}
                >
                  Next
                </Button>
              </nav>
            )}
          </>
        )}
      </div>
    </>
  );
}
