import { useSearchParams, Link } from 'react-router-dom';
import { Award, Building2, MapPin, Users } from 'lucide-react';

import PageHero from '../../components/shared/PageHero.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Select from '../../components/ui/Select.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import useQuery from '../../hooks/useQuery.js';
import catalogueService from '../../services/catalogueService.js';
import { PATHS } from '../../constants/routes.js';

/**
 * University index.
 *
 * The country filter lives in the URL rather than in component state, so a
 * filtered view can be shared, bookmarked and reached from a country page — and
 * the back button behaves the way a visitor expects.
 */
export default function Universities() {
  const [params, setParams] = useSearchParams();
  const countryCode = params.get('countryCode') ?? '';
  const page = Number(params.get('page') ?? 1);

  const { data: countries } = useQuery((signal) => catalogueService.listCountries(signal), []);
  const { data, isLoading, isError, error, refetch } = useQuery(
    (signal) => catalogueService.listUniversities({ ...(countryCode ? { countryCode } : {}), page, limit: 12 }, signal),
    [countryCode, page]
  );

  const setFilter = (code) => {
    const next = new URLSearchParams(params);
    if (code) next.set('countryCode', code);
    else next.delete('countryCode');
    next.delete('page'); // A new filter invalidates the old page number.
    setParams(next, { replace: true });
  };

  const goToPage = (nextPage) => {
    const next = new URLSearchParams(params);
    next.set('page', String(nextPage));
    setParams(next);
  };

  const items = data?.items ?? [];
  const meta = data?.meta;
  const selected = countries?.find((c) => c.code === countryCode);

  return (
    <>
      <PageHero
        eyebrow="Universities"
        title={selected ? `Universities in ${selected.name}` : 'Partner universities'}
        description="Rankings, acceptance rates and scholarship availability — the three things that decide whether an application is worth the fee."
        breadcrumbs={[{ label: 'Home', to: PATHS.home }, { label: 'Universities' }]}
      />

      <div className="container-page py-14 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <p className="text-sm text-navy-500">
            {meta ? `${meta.total} universit${meta.total === 1 ? 'y' : 'ies'}` : 'Loading…'}
          </p>

          <Select
            label="Destination"
            value={countryCode}
            onChange={(event) => setFilter(event.target.value)}
            containerClassName="w-full sm:w-64"
          >
            <option value="">All destinations</option>
            {(countries ?? []).map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </Select>
        </div>

        {isLoading && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-52" rounded="rounded-2xl" />
            ))}
          </div>
        )}

        {isError && <ErrorState className="mt-8" error={error} onRetry={refetch} title="Couldn’t load universities" />}

        {data && items.length === 0 && (
          <EmptyState
            className="mt-8"
            icon={Building2}
            title="No universities match that filter"
            description="Try a different destination, or browse all of them."
            action={
              <Button variant="outline" onClick={() => setFilter('')}>
                Clear filter
              </Button>
            }
          />
        )}

        {items.length > 0 && (
          <>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((university) => (
                <Link
                  key={university.slug}
                  to={PATHS.university(university.slug)}
                  className="group flex flex-col rounded-2xl bg-surface p-6 shadow-sm transition-all duration-200 hairline hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-navy-950 text-base font-semibold text-white">
                      {university.name
                        .replace(/^(The|University of)\s+/i, '')
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((word) => word[0]?.toUpperCase())
                        .join('')}
                    </span>
                    {university.scholarshipAvailable && (
                      <Badge tone="primary" size="sm">
                        Scholarships
                      </Badge>
                    )}
                  </div>

                  <h2 className="mt-4 text-base leading-snug font-semibold text-navy-950">{university.name}</h2>
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-navy-500">
                    <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                    {university.city}
                  </p>

                  <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-navy-100 pt-4 pt-5 text-sm">
                    <div>
                      <dt className="inline-flex items-center gap-1.5 text-2xs font-semibold tracking-wide text-navy-400 uppercase">
                        <Award className="size-3" aria-hidden="true" />
                        Ranking
                      </dt>
                      <dd className="mt-0.5 font-semibold text-navy-900">
                        {university.worldRanking ? `#${university.worldRanking}` : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline-flex items-center gap-1.5 text-2xs font-semibold tracking-wide text-navy-400 uppercase">
                        <Users className="size-3" aria-hidden="true" />
                        Accepts
                      </dt>
                      <dd className="mt-0.5 font-semibold text-navy-900">
                        {university.acceptanceRate != null ? `${university.acceptanceRate}%` : '—'}
                      </dd>
                    </div>
                  </dl>
                </Link>
              ))}
            </div>

            {meta && meta.totalPages > 1 && (
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
      </div>
    </>
  );
}
