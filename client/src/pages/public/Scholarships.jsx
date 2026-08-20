import { Link, useSearchParams } from 'react-router-dom';
import { Award, Info } from 'lucide-react';

import PageHero from '../../components/shared/PageHero.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Select from '../../components/ui/Select.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ScholarshipCard from '../../components/cards/ScholarshipCard.jsx';
import useQuery from '../../hooks/useQuery.js';
import { useAuth } from '../../hooks/useAuth.js';
import scholarshipService from '../../services/scholarshipService.js';
import catalogueService from '../../services/catalogueService.js';
import { PATHS } from '../../constants/routes.js';
import { DEGREE_LEVELS, FIELDS, degreeLabel, fieldLabel } from '../../constants/domain.js';

/**
 * Scholarships — public catalogue, personalized for a signed-in student.
 *
 * When the API returns `personalized`, awards are scored and the ineligible ones
 * are reported as a count with reasons rather than silently dropped. Telling a
 * student "6 awards are hidden because they are master's-only" is more honest
 * than a shorter list they cannot account for.
 */
export default function Scholarships() {
  const [params, setParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const filters = {
    countryCode: params.get('countryCode') ?? '',
    degreeLevel: params.get('degreeLevel') ?? '',
    field: params.get('field') ?? '',
  };
  const page = Number(params.get('page') ?? 1);

  const { data: countries } = useQuery((signal) => catalogueService.listCountries(signal), []);
  const { data, isLoading, isError, error, refetch } = useQuery(
    (signal) =>
      scholarshipService.list(
        { ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), page, limit: 12 },
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

  const goToPage = (nextPage) => {
    const next = new URLSearchParams(params);
    next.set('page', String(nextPage));
    setParams(next);
  };

  const items = data?.items ?? [];
  const meta = data?.meta;

  return (
    <>
      <PageHero
        eyebrow="Scholarships"
        title="Funding you are actually eligible for"
        description="Awards for Class 12 leavers as well as graduates, with the marks and English score each one asks for stated up front."
        breadcrumbs={[{ label: 'Home', to: PATHS.home }, { label: 'Scholarships' }]}
      />

      <div className="container-page py-14 md:py-20">
        {!isAuthenticated && (
          <Alert tone="info" className="mb-8" title="Showing every published award">
            Build a free profile and this list is scored against your marks, English level and destinations —{' '}
            <Link to={PATHS.register} className="font-semibold underline">
              start now
            </Link>
            .
          </Alert>
        )}

        {meta?.personalized && (
          <Alert tone="success" className="mb-8" title="Scored for your profile">
            Ranked by fit.
            {meta.urgentCount > 0 && ` ${meta.urgentCount} close within 30 days.`}
            {meta.ineligibleCount > 0 &&
              ` ${meta.ineligibleCount} award${meta.ineligibleCount === 1 ? '' : 's'} hidden because you are not eligible.`}
          </Alert>
        )}

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

        <p className="mt-6 text-sm text-navy-500">
          {meta ? `${meta.total} award${meta.total === 1 ? '' : 's'}` : 'Loading…'}
        </p>

        {isLoading && (
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-80" rounded="rounded-2xl" />
            ))}
          </div>
        )}

        {isError && <ErrorState className="mt-6" error={error} onRetry={refetch} title="Couldn’t load scholarships" />}

        {data && items.length === 0 && (
          <EmptyState
            className="mt-6"
            icon={Award}
            title="No awards match those filters"
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
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {items.map((scholarship) => (
                <ScholarshipCard key={scholarship.slug} scholarship={scholarship} />
              ))}
            </div>

            {meta?.totalPages > 1 && (
              <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3">
                <Button variant="outline" size="sm" disabled={!meta.hasPrevPage} onClick={() => goToPage(page - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-navy-500">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={!meta.hasNextPage} onClick={() => goToPage(page + 1)}>
                  Next
                </Button>
              </nav>
            )}
          </>
        )}

        {/* Hidden awards, explained. */}
        {meta?.ineligibleSample?.length > 0 && (
          <section className="mt-14 rounded-2xl border border-dashed border-navy-200 bg-navy-50/60 p-6">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-navy-950">
              <Info className="size-4 text-navy-400" aria-hidden="true" />
              Not eligible yet ({meta.ineligibleCount})
            </h2>
            <ul className="mt-4 space-y-2.5">
              {meta.ineligibleSample.map((award) => (
                <li key={award.slug} className="text-sm text-navy-600">
                  <span className="font-medium text-navy-800">{award.name}</span> — {award.reason}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-14 flex flex-col items-center gap-4 rounded-2xl bg-primary-50 px-6 py-12 text-center">
          <h2 className="max-w-lg font-display text-2xl font-semibold text-navy-950">
            See what an award actually saves you
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-navy-600">
            A 50% scholarship does not halve your costs — it halves tuition. The calculator shows the real total,
            including living, visa and flights.
          </p>
          <Button as={Link} to={PATHS.costCalculator} size="lg" className="mt-2">
            Open the cost calculator
          </Button>
        </section>
      </div>
    </>
  );
}
