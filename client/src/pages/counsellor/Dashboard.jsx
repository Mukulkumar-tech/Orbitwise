import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarClock, CheckCircle2, FileClock, GraduationCap, Inbox, Users } from 'lucide-react';

import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import StatTile from '../../components/cards/StatTile.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import useQuery from '../../hooks/useQuery.js';
import counsellorService, { appointmentService } from '../../services/counsellorService.js';
import { PATHS } from '../../constants/routes.js';
import { APPOINTMENT_TYPE_LABELS } from '../../constants/domain.js';

const formatWhen = (value) =>
  new Date(value).toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

/**
 * Counsellor home.
 *
 * Ordered by what needs a decision rather than by what exists: pending requests
 * and documents awaiting review come before headline counts, because a caseload
 * summary that buries three unanswered booking requests is decoration.
 */
export default function CounsellorDashboard() {
  const { data, isLoading, isError, error, refetch } = useQuery((signal) => counsellorService.dashboard(signal), []);

  const confirm = async (id) => {
    try {
      await appointmentService.setStatus(id, { status: 'confirmed' });
      toast.success('Appointment confirmed');
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-72" />
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24" rounded="rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mt-8 h-64" rounded="rounded-2xl" />
      </div>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={refetch} title="Couldn’t load your dashboard" />;

  const { stats, upcomingAppointments, profile } = data;

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy-950 md:text-3xl">
            Your caseload
          </h1>
          <p className="mt-2 text-sm text-navy-500">
            {profile.title}
            {profile.experienceYears ? ` · ${profile.experienceYears} years' experience` : ''}
          </p>
        </div>
        <Badge tone={profile.isAcceptingStudents ? 'success' : 'neutral'}>
          {profile.isAcceptingStudents ? 'Accepting students' : 'Not accepting students'}
        </Badge>
      </header>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Users} label="Students" value={stats.students} />
        <StatTile
          icon={FileClock}
          label="Docs to review"
          value={stats.documentsAwaitingReview}
          tone={stats.documentsAwaitingReview > 0 ? 'warning' : 'neutral'}
        />
        <StatTile
          icon={CalendarClock}
          label="Booking requests"
          value={stats.pendingRequests}
          tone={stats.pendingRequests > 0 ? 'warning' : 'neutral'}
        />
        <StatTile icon={GraduationCap} label="Offers won" value={stats.offers} tone="success" />
      </div>

      {/* ─── Needs a decision ──────────────────────────────────────────── */}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-surface p-6 shadow-sm hairline">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-navy-950">Next appointments</h2>
            <Button as={Link} to={PATHS.counsellorAppointments} variant="ghost" size="sm">
              All
            </Button>
          </div>

          {upcomingAppointments.length === 0 ? (
            <EmptyState
              className="mt-5"
              size="sm"
              icon={CalendarClock}
              title="Nothing booked"
              description="Students who book a session will appear here."
            />
          ) : (
            <ul className="mt-5 space-y-3">
              {upcomingAppointments.map((appointment) => (
                <li key={appointment._id} className="flex flex-wrap items-center gap-3 rounded-xl bg-navy-50 p-3.5">
                  <Avatar name={appointment.student?.name ?? 'Student'} src={appointment.student?.avatar} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy-950">
                      {appointment.student?.name ?? 'Student'}
                    </p>
                    <p className="text-xs text-navy-500">
                      {APPOINTMENT_TYPE_LABELS[appointment.type] ?? appointment.type} · {formatWhen(appointment.startsAt)}
                    </p>
                  </div>
                  {appointment.status === 'requested' ? (
                    <Button size="sm" leftIcon={CheckCircle2} onClick={() => confirm(appointment._id)}>
                      Confirm
                    </Button>
                  ) : (
                    <Badge tone="success" size="sm">
                      Confirmed
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-surface p-6 shadow-sm hairline">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-navy-950">Applications in flight</h2>
            <Button as={Link} to={PATHS.counsellorStudents} variant="ghost" size="sm">
              Students
            </Button>
          </div>

          <dl className="mt-5 space-y-3">
            {[
              ['With the university', stats.inReview],
              ['Offers received', stats.offers],
              ['Total applications', stats.applications],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-3 border-b border-navy-100 pb-3 last:border-0">
                <dt className="text-sm text-navy-500">{label}</dt>
                <dd className="text-lg font-semibold text-navy-950">{value}</dd>
              </div>
            ))}
          </dl>

          {stats.documentsAwaitingReview > 0 && (
            <Button as={Link} to={PATHS.counsellorReview} className="mt-5" fullWidth leftIcon={Inbox}>
              Review {stats.documentsAwaitingReview} document{stats.documentsAwaitingReview === 1 ? '' : 's'}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
