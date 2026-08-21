import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Bookmark, CalendarClock, Check, FilePlus2, FileText, GraduationCap, Mail, Phone } from 'lucide-react';

import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ProgressRing from '../../components/ui/ProgressRing.jsx';
import useQuery from '../../hooks/useQuery.js';
import counsellorService from '../../services/counsellorService.js';
import applicationService from '../../services/applicationService.js';
import { PATHS } from '../../constants/routes.js';
import {
  APPLICATION_STATUS_TONES,
  APPOINTMENT_STATUS_TONES,
  DOCUMENT_STATUS_TONES,
  appointmentTypeLabel,
  applicationStatusLabel,
  degreeLabel,
  documentTypeLabel,
  educationLabel,
  fieldLabel,
  formatInr,
  fundingLabel,
  nextIntake,
  streamLabel,
  testLabel,
} from '../../constants/domain.js';

/** Marks carry their own notation, so 8.3 CGPA never renders as 8.3%. */
const formatMarks = (marks) =>
  marks?.value == null ? null : marks.system === 'percentage' ? `${marks.value}%` : `${marks.value} ${marks.system.toUpperCase()}`;

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const formatWhen = (value) =>
  new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

/** A labelled row, used for the profile facts where a table would be overkill. */
function Fact({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-navy-100 py-2.5 last:border-0">
      <dt className="text-xs text-navy-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-navy-900">{children ?? '—'}</dd>
    </div>
  );
}

/**
 * One student's full picture, for the counsellor who owns the caseload.
 *
 * The server refuses this route outright unless the student is assigned to the
 * caller, so a 403 here is a real answer rather than an error to paper over —
 * `ErrorState` shows the API's own message.
 *
 * Everything on this page is read-only apart from the links out to the review
 * queue: acting on a document belongs where all the other documents are, not
 * duplicated per student.
 */
export default function CounsellorStudentDetail() {
  const { id } = useParams();
  const [startingSlug, setStartingSlug] = useState(null);
  const { data, isLoading, isError, error, refetch } = useQuery(
    (signal) => counsellorService.student(id, signal),
    [id]
  );

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-6 h-28" rounded="rounded-2xl" />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-72" rounded="rounded-2xl" />
          <Skeleton className="h-72 lg:col-span-2" rounded="rounded-2xl" />
        </div>
      </div>
    );
  }

  /**
   * Opens an application on the student's behalf.
   *
   * The server records the counsellor as the actor, so the student's timeline
   * says who started it rather than implying they did it themselves.
   */
  const startApplication = async (course) => {
    setStartingSlug(course.slug);
    try {
      await applicationService.create({
        studentId: id,
        courseSlug: course.slug,
        intake: nextIntake(course.intakes) ?? undefined,
      });
      toast.success(`Application started for ${course.title}`);
      await refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStartingSlug(null);
    }
  };

  if (isError) return <ErrorState error={error} onRetry={refetch} title="Couldn’t load this student" />;

  const { student, profile, completion, applications, documents, appointments } = data;
  const pendingDocs = documents.filter((doc) => ['uploaded', 'under_review'].includes(doc.status)).length;
  // Populated by the API; inactive courses are dropped because applying to one
  // would fail server-side with "course could not be found".
  const shortlist = (profile?.shortlist ?? []).filter((course) => course?.isActive !== false);
  const appliedSlugs = new Set(applications.map((application) => application.snapshot?.courseSlug).filter(Boolean));

  return (
    <div>
      <Button as={Link} to={PATHS.counsellorStudents} variant="ghost" size="sm" leftIcon={ArrowLeft}>
        My students
      </Button>

      {/* ─── Identity ────────────────────────────────────────────────────── */}
      <header className="mt-4 flex flex-wrap items-center gap-5 rounded-2xl bg-surface p-6 shadow-sm hairline">
        <Avatar name={student.name} src={student.avatar} size="lg" />

        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy-950">{student.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-navy-500">
            <a href={`mailto:${student.email}`} className="inline-flex items-center gap-1.5 hover:text-primary-700">
              <Mail className="size-3.5" aria-hidden="true" />
              {student.email}
            </a>
            {student.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="size-3.5" aria-hidden="true" />
                {student.phone}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-navy-400">
            Joined {formatDate(student.createdAt)} · Last seen {formatDate(student.lastLogin)}
          </p>
        </div>

        <div className="flex items-center gap-5">
          {pendingDocs > 0 && (
            <Button as={Link} to={PATHS.counsellorReview} size="sm" leftIcon={FileText}>
              {pendingDocs} to review
            </Button>
          )}
          <div className="text-center">
            <ProgressRing value={completion.percent} />
            <p className="mt-1 text-xs text-navy-500">Profile</p>
          </div>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ─── Profile facts ─────────────────────────────────────────────── */}
        <section className="rounded-2xl bg-surface p-6 shadow-sm hairline">
          <h2 className="text-base font-semibold text-navy-950">Profile</h2>

          {profile ? (
            <dl className="mt-4">
              <Fact label="Education">
                {profile.education?.level ? educationLabel(profile.education.level) : null}
              </Fact>
              <Fact label="Stream">
                {profile.education?.stream ? streamLabel(profile.education.stream) : null}
              </Fact>
              <Fact label="Institution">{profile.education?.boardOrInstitution || null}</Fact>
              {/* Both marksheets, because which one a course scores against depends
                  on the degree level the student is aiming at. */}
              <Fact label="Class 10/12">{formatMarks(profile.education?.secondaryMarks)}</Fact>
              <Fact label="Degree">{formatMarks(profile.education?.tertiaryMarks)}</Fact>
              <Fact label="Backlogs">{profile.education?.backlogs ?? 0}</Fact>
              <Fact label="Target">
                {profile.goal?.degreeLevel ? degreeLabel(profile.goal.degreeLevel) : null}
              </Fact>
              <Fact label="Fields">
                {profile.goal?.fields?.length ? profile.goal.fields.map(fieldLabel).join(', ') : null}
              </Fact>
              <Fact label="Intake">
                {profile.goal?.intake?.season
                  ? `${profile.goal.intake.season} ${profile.goal.intake.year ?? ''}`.trim()
                  : null}
              </Fact>
              <Fact label="Destinations">
                {profile.destinations?.length ? profile.destinations.join(', ') : 'Open to anywhere'}
              </Fact>
              <Fact label="Budget / year">
                {profile.budget?.annualInr ? formatInr(profile.budget.annualInr) : null}
              </Fact>
              <Fact label="Funding">
                {profile.budget?.fundingSource ? fundingLabel(profile.budget.fundingSource) : null}
              </Fact>
              <Fact label="English">
                {profile.english?.test && profile.english.test !== 'none'
                  ? `${testLabel(profile.english.test)}${profile.english.overall ? ` · ${profile.english.overall}` : ''}`
                  : 'Not taken'}
              </Fact>
              <Fact label="Work experience">
                {profile.work?.years ? `${profile.work.years} year${profile.work.years === 1 ? '' : 's'}` : 'None'}
              </Fact>
            </dl>
          ) : (
            <EmptyState
              className="mt-4"
              size="sm"
              icon={GraduationCap}
              title="Profile not started"
              description="They haven’t completed onboarding yet, so matching can’t run."
            />
          )}
        </section>

        {/* ─── Applications, documents, sessions ─────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl bg-surface p-6 shadow-sm hairline">
            <h2 className="text-base font-semibold text-navy-950">
              Applications <span className="text-navy-400">({applications.length})</span>
            </h2>

            {applications.length === 0 ? (
              <EmptyState
                className="mt-4"
                size="sm"
                icon={GraduationCap}
                title="No applications"
                description="Nothing started yet."
              />
            ) : (
              <ul className="mt-4 space-y-3">
                {applications.map((application) => (
                  <li
                    key={application._id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-navy-50 p-3.5"
                  >
                    {/* Read off the snapshot, not a populated Course: an application is
                        a historical record and must render the terms it was made under. */}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-navy-950">
                        {application.snapshot?.courseTitle}
                      </p>
                      <p className="truncate text-xs text-navy-500">
                        {application.snapshot?.universityName} ·{' '}
                        {degreeLabel(application.snapshot?.degreeLevel)}
                        {application.intake?.season ? ` · ${application.intake.season} ${application.intake.year}` : ''}
                      </p>
                    </div>
                    <Badge tone={APPLICATION_STATUS_TONES[application.status] ?? 'neutral'} size="sm">
                      {applicationStatusLabel(application.status)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ─── Their shortlist, as a place to act from ────────────────── */}
          <section className="rounded-2xl bg-surface p-6 shadow-sm hairline">
            <h2 className="text-base font-semibold text-navy-950">
              Their shortlist <span className="text-navy-400">({shortlist.length})</span>
            </h2>
            <p className="mt-1 text-xs text-navy-500">
              Start an application for them. They will see it as a draft, marked as started by you.
            </p>

            {shortlist.length === 0 ? (
              <EmptyState
                className="mt-4"
                size="sm"
                icon={Bookmark}
                title="Nothing shortlisted"
                description="Once they save courses, you can open applications from here."
              />
            ) : (
              <ul className="mt-4 space-y-3">
                {shortlist.map((course) => {
                  const already = appliedSlugs.has(course.slug);
                  return (
                    <li
                      key={course._id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-navy-50 p-3.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-navy-950">{course.title}</p>
                        <p className="truncate text-xs text-navy-500">
                          {course.universityName} · {degreeLabel(course.degreeLevel)}
                          {course.tuitionPerYearInr ? ` · ${formatInr(course.tuitionPerYearInr)}/yr` : ''}
                        </p>
                      </div>

                      {already ? (
                        <Badge tone="success" size="sm" icon={Check}>
                          Applied
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          leftIcon={FilePlus2}
                          isLoading={startingSlug === course.slug}
                          onClick={() => startApplication(course)}
                        >
                          Start application
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-2xl bg-surface p-6 shadow-sm hairline">
            <h2 className="text-base font-semibold text-navy-950">
              Documents <span className="text-navy-400">({documents.length})</span>
            </h2>

            {documents.length === 0 ? (
              <EmptyState
                className="mt-4"
                size="sm"
                icon={FileText}
                title="Nothing uploaded"
                description="Their document checklist is still empty."
              />
            ) : (
              <ul className="mt-4 flex flex-wrap gap-2">
                {documents.map((doc) => (
                  <li key={doc._id}>
                    <Badge tone={DOCUMENT_STATUS_TONES[doc.status] ?? 'neutral'}>
                      {documentTypeLabel(doc.type)} · {doc.status.replace('_', ' ')}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl bg-surface p-6 shadow-sm hairline">
            <h2 className="text-base font-semibold text-navy-950">Sessions with you</h2>

            {appointments.length === 0 ? (
              <EmptyState
                className="mt-4"
                size="sm"
                icon={CalendarClock}
                title="No sessions yet"
                description="Nothing booked between you and this student."
              />
            ) : (
              <ul className="mt-4 space-y-2.5">
                {appointments.map((appointment) => (
                  <li
                    key={appointment._id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-100 pb-2.5 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-navy-900">
                        {appointmentTypeLabel(appointment.type)}
                      </p>
                      <p className="text-xs text-navy-500">{formatWhen(appointment.startsAt)}</p>
                    </div>
                    <Badge tone={APPOINTMENT_STATUS_TONES[appointment.status] ?? 'neutral'} size="sm">
                      {appointment.status.replace('_', ' ')}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
