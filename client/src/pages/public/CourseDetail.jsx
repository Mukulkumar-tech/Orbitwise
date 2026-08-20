import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Award, CalendarDays, Coins, GraduationCap, Languages, Timer } from 'lucide-react';

import PageHero from '../../components/shared/PageHero.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import MatchBreakdown from '../../components/cards/MatchBreakdown.jsx';
import useQuery from '../../hooks/useQuery.js';
import { useAuth } from '../../hooks/useAuth.js';
import catalogueService from '../../services/catalogueService.js';
import { PATHS } from '../../constants/routes.js';
import { degreeLabel, fieldLabel, formatDuration, formatInr } from '../../constants/domain.js';

export default function CourseDetail() {
  const { slug } = useParams();
  const { isAuthenticated } = useAuth();
  const { data: course, isLoading, isError, error, refetch } = useQuery(
    (signal) => catalogueService.getCourse(slug, signal),
    [slug]
  );

  if (isLoading) {
    return (
      <div className="container-page py-20">
        <Skeleton className="h-10 w-96" />
        <Skeleton className="mt-6 h-56" rounded="rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container-page py-20">
        <ErrorState error={error} onRetry={refetch} title="Couldn’t load this course" />
        <div className="mt-6 flex justify-center">
          <Button as={Link} to={PATHS.courses} variant="outline">
            Browse all courses
          </Button>
        </div>
      </div>
    );
  }

  const { requirements: req, country, university, match } = course;

  return (
    <>
      <PageHero
        eyebrow={`${degreeLabel(course.degreeLevel)} · ${fieldLabel(course.field)}`}
        title={course.title}
        description={`${course.universityName} · ${course.city}${country ? `, ${country.name}` : ''}`}
        breadcrumbs={[
          { label: 'Home', to: PATHS.home },
          { label: 'Courses', to: PATHS.courses },
          { label: course.title },
        ]}
      >
        <div className="flex flex-wrap gap-2.5">
          {course.scholarship?.available && (
            <Badge tone="success">Scholarship up to {course.scholarship.maxPercentOfTuition}%</Badge>
          )}
          {match && (
            <Badge tone="primary">
              {match.score}% — {match.bandLabel}
            </Badge>
          )}
          {match?.conditional && <Badge tone="warning">Conditional offer route</Badge>}
        </div>
      </PageHero>

      <div className="container-page py-14 md:py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
          <div>
            {/* ─── Key facts ─────────────────────────────────────── */}
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                { icon: Coins, label: 'Tuition / year', value: `${formatInr(course.tuitionPerYearInr)}` },
                { icon: Timer, label: 'Duration', value: formatDuration(course.durationMonths) },
                { icon: Languages, label: 'English requirement', value: req?.minIelts ? `IELTS ${req.minIelts}` : 'Not stated' },
                { icon: CalendarDays, label: 'Intakes', value: course.intakes?.join(' · ') || 'Not stated' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-surface p-5 shadow-sm hairline">
                  <dt className="inline-flex items-center gap-2 text-2xs font-semibold tracking-wide text-navy-400 uppercase">
                    <item.icon className="size-3.5" aria-hidden="true" />
                    {item.label}
                  </dt>
                  <dd className="mt-2 font-semibold text-navy-950">{item.value}</dd>
                </div>
              ))}
            </dl>

            {course.summary && (
              <section className="mt-12">
                <h2 className="text-xl font-semibold text-navy-950">About this course</h2>
                <p className="mt-3 text-base leading-relaxed text-navy-600">{course.summary}</p>
              </section>
            )}

            {/* ─── Why it matches / how to unlock the score ──────── */}
            {match ? (
              <section className="mt-12">
                <h2 className="text-xl font-semibold text-navy-950">Why this matches you</h2>
                <div className="mt-5">
                  <MatchBreakdown match={match} />
                </div>
              </section>
            ) : (
              <section className="mt-12 rounded-2xl bg-primary-50 p-6">
                <h2 className="text-base font-semibold text-navy-950">Is this a good fit for you?</h2>
                <p className="mt-2 text-sm leading-relaxed text-navy-600">
                  {isAuthenticated
                    ? 'Complete your profile and this course will show a scored breakdown across all seven factors.'
                    : 'Build a free profile and Orbitwise scores this course against your marks, budget, English level and goals — and explains every factor.'}
                </p>
                <Button as={Link} to={isAuthenticated ? PATHS.onboarding : PATHS.register} className="mt-5" rightIcon={ArrowRight}>
                  {isAuthenticated ? 'Complete my profile' : 'Get my match score'}
                </Button>
              </section>
            )}

            {/* ─── Entry requirements ────────────────────────────── */}
            <section className="mt-12">
              <h2 className="text-xl font-semibold text-navy-950">Entry requirements</h2>
              <dl className="mt-5 divide-y divide-navy-100 overflow-hidden rounded-2xl bg-surface shadow-sm hairline">
                {[
                  ['Minimum education', req?.minEducationLevel ? degreeLabel(req.minEducationLevel) || req.minEducationLevel : 'Not stated'],
                  ['Class 12 marks', req?.minSecondaryPercentage != null ? `${req.minSecondaryPercentage}%` : '—'],
                  ['Degree marks', req?.minTertiaryPercentage != null ? `${req.minTertiaryPercentage}%` : '—'],
                  ['IELTS', req?.minIelts != null ? req.minIelts : '—'],
                  ['Backlogs allowed', req?.maxBacklogs != null ? req.maxBacklogs : '—'],
                  ['Work experience', req?.minWorkExperienceYears ? `${req.minWorkExperienceYears} year(s)` : 'Not required'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-4 px-5 py-3.5 text-sm">
                    <dt className="text-navy-500">{label}</dt>
                    <dd className="font-semibold text-navy-900">{value}</dd>
                  </div>
                ))}
              </dl>
              {req?.additional?.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm text-navy-600">
                  {req.additional.map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              )}
            </section>

            {course.careerOutcomes?.length > 0 && (
              <section className="mt-12">
                <h2 className="text-xl font-semibold text-navy-950">Career outcomes</h2>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {course.careerOutcomes.map((role) => (
                    <span key={role} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-navy-700 shadow-sm hairline">
                      {role}
                    </span>
                  ))}
                </div>
                {course.averageStartingSalaryInr && (
                  <p className="mt-4 text-sm text-navy-600">
                    Average starting salary around{' '}
                    <span className="font-semibold text-navy-900">{formatInr(course.averageStartingSalaryInr)}</span> a year.
                  </p>
                )}
              </section>
            )}
          </div>

          {/* ─── Sidebar ───────────────────────────────────────────── */}
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl bg-navy-950 p-6">
              <p className="text-2xs font-semibold tracking-wide text-navy-400 uppercase">Total programme cost</p>
              <p className="mt-2 font-display text-3xl font-semibold text-white">{formatInr(course.programmeCostInr)}</p>
              <p className="mt-1.5 text-sm text-navy-400">
                Tuition and living for {formatDuration(course.durationMonths)}
              </p>

              {country && (
                <dl className="mt-6 space-y-2.5 border-t border-white/10 pt-5 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-navy-400">Tuition / yr</dt>
                    <dd className="font-semibold text-white">{formatInr(course.tuitionPerYearInr)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-navy-400">Living / yr</dt>
                    <dd className="font-semibold text-white">{formatInr(country.livingCostPerYearInr)}</dd>
                  </div>
                </dl>
              )}

              <Button as={Link} to={isAuthenticated ? PATHS.studentCourses : PATHS.register} fullWidth className="mt-6">
                {isAuthenticated ? 'Shortlist in my portal' : 'Create profile to shortlist'}
              </Button>
              <Button
                as={Link}
                to={PATHS.contact}
                variant="outline"
                fullWidth
                className="mt-2.5 border-white/20 bg-white/5 text-white hover:border-white/30 hover:bg-white/10"
              >
                Talk to a counsellor
              </Button>
            </div>

            {university && (
              <div className="rounded-2xl bg-surface p-6 shadow-sm hairline">
                <h2 className="text-base font-semibold text-navy-950">{university.name}</h2>
                <dl className="mt-4 space-y-2.5 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="inline-flex items-center gap-1.5 text-navy-500">
                      <Award className="size-3.5" aria-hidden="true" />
                      Ranking
                    </dt>
                    <dd className="font-semibold text-navy-900">
                      {university.worldRanking ? `#${university.worldRanking}` : '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="inline-flex items-center gap-1.5 text-navy-500">
                      <GraduationCap className="size-3.5" aria-hidden="true" />
                      Acceptance
                    </dt>
                    <dd className="font-semibold text-navy-900">
                      {university.acceptanceRate != null ? `${university.acceptanceRate}%` : '—'}
                    </dd>
                  </div>
                </dl>
                {university.slug && (
                  <Button as={Link} to={PATHS.university(university.slug)} variant="outline" size="sm" fullWidth className="mt-5">
                    View university
                  </Button>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
