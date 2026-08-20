import { Link } from 'react-router-dom';
import { ArrowRight, FileText, GraduationCap, MapPin } from 'lucide-react';

import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import StatTile from '../../components/cards/StatTile.jsx';
import useQuery from '../../hooks/useQuery.js';
import applicationService from '../../services/applicationService.js';
import { PATHS } from '../../constants/routes.js';
import { APPLICATION_STATUS_TONES as TONE, degreeLabel, formatInr } from '../../constants/domain.js';

export default function Applications() {
  const { data: applications, isLoading, isError, error, refetch } = useQuery(
    (signal) => applicationService.list({}, signal),
    []
  );
  const { data: stats } = useQuery((signal) => applicationService.stats(signal), []);

  return (
    <div>
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy-950 md:text-3xl">
          My applications
        </h1>
        <p className="mt-2 text-sm text-navy-500">
          Every application, its stage, and what it needs from you next.
        </p>
      </header>

      {stats && stats.total > 0 && (
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Total" value={stats.total} />
          <StatTile label="In progress" value={stats.active} tone="warning" />
          <StatTile label="With university" value={stats.inProgress} tone="info" />
          <StatTile label="Offers" value={stats.offers} tone="success" />
        </div>
      )}

      {isLoading && (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-32" rounded="rounded-2xl" />
          ))}
        </div>
      )}

      {isError && <ErrorState className="mt-8" error={error} onRetry={refetch} title="Couldn’t load your applications" />}

      {applications && applications.length === 0 && (
        <EmptyState
          className="mt-8"
          icon={FileText}
          title="No applications yet"
          description="When you find a course worth applying to, start an application and Orbitwise will track its documents, deadlines and status for you."
          action={
            <Button as={Link} to={PATHS.studentCourses} rightIcon={ArrowRight}>
              Browse my matches
            </Button>
          }
        />
      )}

      {applications && applications.length > 0 && (
        <ul className="mt-8 space-y-4">
          {applications.map((application) => {
            const snap = application.snapshot;
            return (
              <li key={application._id}>
                <Link
                  to={PATHS.application(application._id)}
                  className="group block rounded-2xl bg-surface p-5 shadow-sm transition-all duration-200 hairline hover:-translate-y-0.5 hover:shadow-lg md:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-base leading-snug font-semibold text-navy-950">{snap.courseTitle}</h2>
                      <p className="mt-1 inline-flex flex-wrap items-center gap-x-2 text-sm text-navy-500">
                        <GraduationCap className="size-3.5 shrink-0" aria-hidden="true" />
                        {snap.universityName}
                        <MapPin className="ml-1 size-3.5 shrink-0" aria-hidden="true" />
                        {snap.city}
                        {snap.countryName ? `, ${snap.countryName}` : ''}
                      </p>
                    </div>
                    <Badge tone={TONE[application.status] ?? 'neutral'}>{application.statusLabel}</Badge>
                  </div>

                  <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 border-t border-navy-100 pt-4 text-sm">
                    <div>
                      <dt className="text-2xs font-semibold tracking-wide text-navy-400 uppercase">Level</dt>
                      <dd className="mt-0.5 font-medium text-navy-800">{degreeLabel(snap.degreeLevel)}</dd>
                    </div>
                    <div>
                      <dt className="text-2xs font-semibold tracking-wide text-navy-400 uppercase">Total cost</dt>
                      <dd className="mt-0.5 font-medium text-navy-800">
                        {snap.programmeCostInr ? formatInr(snap.programmeCostInr) : '—'}
                      </dd>
                    </div>
                    {application.intake?.season && (
                      <div>
                        <dt className="text-2xs font-semibold tracking-wide text-navy-400 uppercase">Intake</dt>
                        <dd className="mt-0.5 font-medium text-navy-800">
                          {application.intake.season} {application.intake.year ?? ''}
                        </dd>
                      </div>
                    )}
                    {snap.matchScoreAtApply != null && (
                      <div>
                        <dt className="text-2xs font-semibold tracking-wide text-navy-400 uppercase">Match then</dt>
                        <dd className="mt-0.5 font-medium text-navy-800">{snap.matchScoreAtApply}%</dd>
                      </div>
                    )}
                  </dl>

                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700">
                    Open application
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
