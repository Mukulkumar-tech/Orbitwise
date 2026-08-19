import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Award, CalendarDays, GraduationCap, MapPin, Users } from 'lucide-react';

import PageHero from '../../components/shared/PageHero.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import useQuery from '../../hooks/useQuery.js';
import publicService from '../../services/publicService.js';
import { PATHS } from '../../constants/routes.js';
import { degreeLabel, fieldLabel, formatDuration, formatInr } from '../../constants/domain.js';

export default function UniversityDetail() {
  const { slug } = useParams();
  const { data, isLoading, isError, error, refetch } = useQuery(() => publicService.university(slug), [slug]);

  if (isLoading) {
    return (
      <div className="container-page py-20">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="mt-6 h-48" rounded="rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container-page py-20">
        <ErrorState error={error} onRetry={refetch} title="Couldn’t load this university" />
        <div className="mt-6 flex justify-center">
          <Button as={Link} to={PATHS.universities} variant="outline">
            All universities
          </Button>
        </div>
      </div>
    );
  }

  const { university, country, courses, courseCount } = data;

  // Grouped by level so a Class 12 student can find the bachelor's programmes
  // without reading past a list of master's degrees.
  const byLevel = courses.reduce((acc, course) => {
    (acc[course.degreeLevel] ??= []).push(course);
    return acc;
  }, {});

  return (
    <>
      <PageHero
        eyebrow={country ? `${country.flag} ${country.name}` : 'University'}
        title={university.name}
        description={`${university.city}${university.establishedYear ? ` · established ${university.establishedYear}` : ''}`}
        breadcrumbs={[
          { label: 'Home', to: PATHS.home },
          { label: 'Universities', to: PATHS.universities },
          { label: university.name },
        ]}
      >
        <div className="flex flex-wrap gap-2.5">
          {university.scholarshipAvailable && <Badge tone="success">Scholarships available</Badge>}
          <Badge tone="primary">{courseCount} courses</Badge>
          {university.type && (
            <Badge tone="neutral" className="bg-white/10 text-navy-200 capitalize">
              {university.type}
            </Badge>
          )}
        </div>
      </PageHero>

      <div className="container-page py-14 md:py-20">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Award, label: 'World ranking', value: university.worldRanking ? `#${university.worldRanking}` : 'Not published' },
            { icon: Users, label: 'Acceptance rate', value: university.acceptanceRate != null ? `${university.acceptanceRate}%` : '—' },
            { icon: GraduationCap, label: 'International students', value: university.internationalStudentShare != null ? `${university.internationalStudentShare}%` : '—' },
            { icon: CalendarDays, label: 'Application fee', value: university.applicationFeeInr ? formatInr(university.applicationFeeInr) : 'None' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-surface p-5 shadow-sm hairline">
              <dt className="inline-flex items-center gap-2 text-2xs font-semibold tracking-wide text-navy-400 uppercase">
                <item.icon className="size-3.5" aria-hidden="true" />
                {item.label}
              </dt>
              <dd className="mt-2 text-lg font-semibold text-navy-950">{item.value}</dd>
            </div>
          ))}
        </dl>

        {country && (
          <p className="mt-6 inline-flex items-center gap-2 text-sm text-navy-500">
            <MapPin className="size-4" aria-hidden="true" />
            {university.city}, {country.name} · living costs around {formatInr(country.livingCostPerYearInr)} a year
            <Link to={PATHS.country(country.slug)} className="font-semibold text-primary-600 hover:text-primary-700">
              Destination guide
            </Link>
          </p>
        )}

        <section className="mt-14">
          <h2 className="text-xl font-semibold text-navy-950">Courses offered</h2>

          {courses.length === 0 ? (
            <EmptyState
              className="mt-6"
              icon={GraduationCap}
              title="No courses listed yet"
              description="This university is in the catalogue but its programmes have not been added."
              action={
                <Button as={Link} to={PATHS.courses} variant="outline">
                  Browse all courses
                </Button>
              }
            />
          ) : (
            Object.entries(byLevel).map(([level, group]) => (
              <div key={level} className="mt-8">
                <h3 className="text-sm font-semibold tracking-wide text-navy-500 uppercase">
                  {degreeLabel(level)} · {group.length}
                </h3>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {group.map((course) => (
                    <Link
                      key={course.slug}
                      to={PATHS.course(course.slug)}
                      className="group flex flex-col rounded-2xl bg-surface p-5 shadow-sm transition-all duration-200 hairline hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-base leading-snug font-semibold text-navy-950">{course.title}</h4>
                        {course.scholarship?.available && (
                          <Badge tone="success" size="sm">
                            {course.scholarship.maxPercentOfTuition}%
                          </Badge>
                        )}
                      </div>

                      <p className="mt-1.5 text-sm text-navy-500">{fieldLabel(course.field)}</p>

                      <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        <div>
                          <dt className="sr-only">Tuition per year</dt>
                          <dd className="font-semibold text-navy-900">{formatInr(course.tuitionPerYearInr)}/yr</dd>
                        </div>
                        <div>
                          <dt className="sr-only">Duration</dt>
                          <dd className="text-navy-600">{formatDuration(course.durationMonths)}</dd>
                        </div>
                        <div>
                          <dt className="sr-only">IELTS</dt>
                          <dd className="text-navy-600">IELTS {course.requirements?.minIelts ?? '—'}</dd>
                        </div>
                      </dl>

                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600">
                        View course
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      </div>
    </>
  );
}
