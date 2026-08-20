import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Clock, GraduationCap } from 'lucide-react';

import PageHero from '../../components/shared/PageHero.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import useQuery from '../../hooks/useQuery.js';
import catalogueService from '../../services/catalogueService.js';
import { PATHS } from '../../constants/routes.js';
import { formatInr } from '../../constants/domain.js';

/**
 * Destination comparison.
 *
 * A table on desktop and cards on mobile, from one data source. Comparing eight
 * countries on cost is a table job — but a table that scrolls sideways on a phone
 * is unusable, and this is the page a student opens on a phone.
 */
export default function Countries() {
  const {
    data: countries,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery((signal) => catalogueService.listCountries(signal), []);

  return (
    <>
      <PageHero
        eyebrow="Destinations"
        title="Compare study destinations on the same scale"
        description="Tuition and living costs converted to rupees, with work rights and visa approval rates — so the comparison is about your budget, not about currency conversion."
        breadcrumbs={[{ label: 'Home', to: PATHS.home }, { label: 'Countries' }]}
      />

      <div className="container-page py-14 md:py-20">
        {isLoading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-64" rounded="rounded-2xl" />
            ))}
          </div>
        )}

        {isError && <ErrorState error={error} onRetry={refetch} title="Couldn’t load destinations" />}

        {countries && countries.length === 0 && (
          <EmptyState
            icon={GraduationCap}
            title="No destinations available yet"
            description="The catalogue is empty. Run the seed script to populate destinations."
          />
        )}

        {countries && countries.length > 0 && (
          <>
            {/* ─── Desktop table ─────────────────────────────────────── */}
            <div className="hidden overflow-hidden rounded-2xl bg-surface shadow-sm hairline lg:block">
              <table className="w-full text-sm">
                <caption className="sr-only">Study destinations compared by cost, work rights and visa approval</caption>
                <thead className="bg-navy-50 text-left">
                  <tr className="text-2xs font-semibold tracking-wider text-navy-500 uppercase">
                    <th scope="col" className="px-6 py-4">Destination</th>
                    <th scope="col" className="px-6 py-4">Tuition / yr</th>
                    <th scope="col" className="px-6 py-4">Living / yr</th>
                    <th scope="col" className="px-6 py-4">Work rights</th>
                    <th scope="col" className="px-6 py-4">Visa approval</th>
                    <th scope="col" className="px-6 py-4">PR route</th>
                    <th scope="col" className="px-6 py-4"><span className="sr-only">Explore</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100">
                  {countries.map((country) => (
                    <tr key={country.code} className="transition-colors duration-150 hover:bg-navy-50/60">
                      <th scope="row" className="px-6 py-4 text-left">
                        <span className="flex items-center gap-3">
                          <span className="text-2xl leading-none" aria-hidden="true">{country.flag}</span>
                          <span className="font-semibold text-navy-950">{country.name}</span>
                        </span>
                      </th>
                      <td className="px-6 py-4 text-navy-700">
                        {formatInr(country.tuitionRangeInr.min)}–{formatInr(country.tuitionRangeInr.max)}
                      </td>
                      <td className="px-6 py-4 text-navy-700">{formatInr(country.livingCostPerYearInr)}</td>
                      <td className="px-6 py-4 text-navy-700">
                        {country.workRights.hoursPerWeekDuringStudy}h/wk · {country.workRights.postStudyWorkYears}y after
                      </td>
                      <td className="px-6 py-4 text-navy-700">
                        {country.visaSuccessRate != null ? `${country.visaSuccessRate}%` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {country.prPathway ? <Badge tone="success" size="sm">Available</Badge> : <span className="text-navy-400">—</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={PATHS.country(country.slug)}
                          className="inline-flex items-center gap-1.5 rounded-lg font-semibold text-primary-700 transition-colors hover:text-primary-800"
                        >
                          Explore
                          <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ─── Mobile cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:hidden">
              {countries.map((country) => (
                <Link
                  key={country.code}
                  to={PATHS.country(country.slug)}
                  className="group flex flex-col rounded-2xl bg-surface p-5 shadow-sm transition-all duration-200 hairline hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-3xl leading-none" aria-hidden="true">{country.flag}</span>
                    {country.prPathway && <Badge tone="success" size="sm">PR pathway</Badge>}
                  </div>
                  <h2 className="mt-4 text-base font-semibold text-navy-950">{country.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-navy-500">{country.summary}</p>

                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <dt className="text-navy-500">Tuition / yr</dt>
                      <dd className="font-semibold text-navy-900">
                        {formatInr(country.tuitionRangeInr.min)}–{formatInr(country.tuitionRangeInr.max)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-navy-500">Living / yr</dt>
                      <dd className="font-semibold text-navy-900">{formatInr(country.livingCostPerYearInr)}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-3 border-t border-navy-100 pt-4 text-xs text-navy-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase className="size-3.5" aria-hidden="true" />
                      {country.workRights.hoursPerWeekDuringStudy}h/week
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5" aria-hidden="true" />
                      {country.workRights.postStudyWorkYears}y post-study
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
