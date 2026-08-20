import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Briefcase, CalendarDays, Clock, MapPin, ShieldCheck, Wallet } from 'lucide-react';

import PageHero from '../../components/shared/PageHero.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import useQuery from '../../hooks/useQuery.js';
import publicService from '../../services/publicService.js';
import { PATHS } from '../../constants/routes.js';
import { degreeLabel, fieldLabel, formatInr } from '../../constants/domain.js';

export default function CountryDetail() {
  const { slug } = useParams();
  const { data, isLoading, isError, error, refetch } = useQuery(() => publicService.country(slug), [slug]);

  if (isLoading) {
    return (
      <div className="container-page py-20">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="mt-6 h-40" rounded="rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container-page py-20">
        <ErrorState error={error} onRetry={refetch} title="Couldn’t load this destination" />
        <div className="mt-6 flex justify-center">
          <Button as={Link} to={PATHS.countries} variant="outline">
            All destinations
          </Button>
        </div>
      </div>
    );
  }

  const { country, universities, courseCount, byDegreeLevel, popularFields } = data;
  const total = country.tuitionRangeInr.min + country.livingCostPerYearInr;

  return (
    <>
      <PageHero
        eyebrow={`${country.flag} ${country.currency}`}
        title={`Study in ${country.name}`}
        description={country.summary}
        breadcrumbs={[
          { label: 'Home', to: PATHS.home },
          { label: 'Countries', to: PATHS.countries },
          { label: country.name },
        ]}
      >
        <div className="flex flex-wrap gap-2.5">
          {country.prPathway && (
            <Badge tone="success" icon={ShieldCheck}>
              PR pathway available
            </Badge>
          )}
          <Badge tone="primary">{courseCount} courses</Badge>
          <Badge tone="neutral" className="bg-white/10 text-navy-200">
            Typical IELTS {country.typicalIelts}
          </Badge>
        </div>
      </PageHero>

      <div className="container-page py-14 md:py-20">
        {/* ─── Cost of studying ───────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-navy-950">What a year costs</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-navy-500">
            Indicative figures in rupees. Tuition varies by university and course; living costs assume shared
            accommodation outside the most expensive city.
          </p>

          <dl className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: Wallet, label: 'Tuition / year', value: `${formatInr(country.tuitionRangeInr.min)}–${formatInr(country.tuitionRangeInr.max)}` },
              { icon: MapPin, label: 'Living / year', value: formatInr(country.livingCostPerYearInr) },
              { icon: CalendarDays, label: 'From, all-in / year', value: formatInr(total) },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-surface p-5 shadow-sm hairline">
                <dt className="inline-flex items-center gap-2 text-2xs font-semibold tracking-wide text-navy-400 uppercase">
                  <item.icon className="size-3.5" aria-hidden="true" />
                  {item.label}
                </dt>
                <dd className="mt-2 text-xl font-semibold text-navy-950">{item.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ─── What you can study, by level ───────────────────────────
            The question a school student arrives with is "can I go here after
            12th?" — so the level breakdown comes before the university list. */}
        {byDegreeLevel.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-semibold text-navy-950">What you can study</h2>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {byDegreeLevel.map((level) => (
                <Link
                  key={level.degreeLevel}
                  to={`${PATHS.courses}?countryCode=${country.code}&degreeLevel=${encodeURIComponent(level.degreeLevel)}`}
                  className="group rounded-2xl bg-surface p-5 shadow-sm transition-all duration-200 hairline hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <p className="text-sm font-semibold text-navy-950">{degreeLabel(level.degreeLevel)}</p>
                  <p className="mt-1 text-2xs font-medium tracking-wide text-navy-400 uppercase">
                    {level.count} course{level.count === 1 ? '' : 's'}
                  </p>
                  <p className="mt-3 text-sm text-navy-600">From {formatInr(level.fromInr)}/yr</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700">
                    Browse
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ─── Work rights ────────────────────────────────────────────── */}
        <section className="mt-14 rounded-2xl bg-navy-950 p-6 md:p-8">
          <h2 className="text-lg font-semibold text-white">Working during and after study</h2>
          <dl className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { icon: Briefcase, label: 'During study', value: `${country.workRights.hoursPerWeekDuringStudy} hrs / week` },
              { icon: Clock, label: 'After graduation', value: `${country.workRights.postStudyWorkYears} year${country.workRights.postStudyWorkYears === 1 ? '' : 's'}` },
              { icon: ShieldCheck, label: 'Visa approval rate', value: country.visaSuccessRate != null ? `${country.visaSuccessRate}%` : 'Not published' },
            ].map((item) => (
              <div key={item.label}>
                <dt className="inline-flex items-center gap-2 text-2xs font-semibold tracking-wide text-navy-400 uppercase">
                  <item.icon className="size-3.5" aria-hidden="true" />
                  {item.label}
                </dt>
                <dd className="mt-1.5 text-lg font-semibold text-white">{item.value}</dd>
              </div>
            ))}
          </dl>
          {country.intakes?.length > 0 && (
            <p className="mt-6 border-t border-white/10 pt-5 text-sm text-navy-300">
              Intakes: {country.intakes.join(' · ')}
            </p>
          )}
        </section>

        {popularFields.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-semibold text-navy-950">Popular subjects here</h2>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {popularFields.map((entry) => (
                <Link
                  key={entry.field}
                  to={`${PATHS.courses}?countryCode=${country.code}&field=${entry.field}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-navy-700 shadow-sm transition-colors hairline hover:bg-primary-50 hover:text-primary-800"
                >
                  {fieldLabel(entry.field)}
                  <span className="text-xs text-navy-400">{entry.count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {universities.length > 0 && (
          <section className="mt-14">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="text-xl font-semibold text-navy-950">Universities in {country.name}</h2>
              <Button as={Link} to={`${PATHS.universities}?countryCode=${country.code}`} variant="ghost" size="sm" rightIcon={ArrowRight}>
                See all
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {universities.map((university) => (
                <Link
                  key={university.slug}
                  to={PATHS.university(university.slug)}
                  className="rounded-2xl bg-surface p-5 shadow-sm transition-all duration-200 hairline hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <h3 className="text-sm leading-snug font-semibold text-navy-950">{university.name}</h3>
                  <p className="mt-1 text-xs text-navy-500">{university.city}</p>
                  <p className="mt-3 text-xs text-navy-600">
                    {university.worldRanking ? `World #${university.worldRanking}` : 'Ranking not published'}
                    {university.acceptanceRate != null ? ` · accepts ${university.acceptanceRate}%` : ''}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-16 flex flex-col items-center gap-4 rounded-2xl bg-primary-50 px-6 py-12 text-center">
          <h2 className="max-w-lg font-display text-2xl font-semibold text-navy-950">
            See which {country.name} courses you actually qualify for
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-navy-600">
            Build your profile and OrbitMatch filters this list down to programmes matching your marks, budget and
            English score — then explains each result.
          </p>
          <Button as={Link} to={PATHS.register} size="lg" rightIcon={ArrowRight} className="mt-2">
            Find my course
          </Button>
        </section>
      </div>
    </>
  );
}
