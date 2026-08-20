import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarClock, CalendarPlus, Check, CheckCheck, Video, X } from 'lucide-react';

import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import useQuery from '../../hooks/useQuery.js';
import { useAuth } from '../../hooks/useAuth.js';
import { appointmentService } from '../../services/counsellorService.js';
import { PATHS, ROLES } from '../../constants/routes.js';
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_TONES,
  appointmentTypeLabel,
} from '../../constants/domain.js';

const MODE_LABELS = { video: 'Video call', phone: 'Phone', in_person: 'In person' };

const formatWhen = (value) =>
  new Date(value).toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

/** Anything past these three is settled and takes no further action. */
const TERMINAL = new Set(['completed', 'cancelled', 'no_show']);

/**
 * Every session, for whichever role is signed in.
 *
 * One page rather than two: `GET /appointments` already scopes results to the
 * caller, so the only difference between the student and counsellor views is
 * which party is named and which buttons are legal. Duplicating the page to
 * express that would duplicate the date formatting and the empty states too.
 *
 * The action buttons mirror the server's rules exactly — confirming and
 * completing are the counsellor's calls, cancelling is open to both — so a
 * student is never shown a button that would come back 403.
 */
export default function Appointments() {
  const { user } = useAuth();
  const isCounsellor = user.role === ROLES.COUNSELLOR;

  const { data, isLoading, isError, error, refetch } = useQuery(
    (signal) => appointmentService.list({}, signal),
    []
  );
  const [busyId, setBusyId] = useState(null);

  const setStatus = async (appointment, status) => {
    if (status === 'cancelled' && !window.confirm('Cancel this session?')) return;

    setBusyId(appointment._id);
    try {
      await appointmentService.setStatus(appointment._id, { status });
      toast.success(`Marked ${APPOINTMENT_STATUS_LABELS[status].toLowerCase()}`);
      await refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-48" />
        <div className="mt-7 space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24" rounded="rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={refetch} title="Couldn’t load your sessions" />;

  const now = Date.now();
  const upcoming = data.filter((a) => !TERMINAL.has(a.status) && new Date(a.startsAt).getTime() >= now);
  const past = data.filter((a) => TERMINAL.has(a.status) || new Date(a.startsAt).getTime() < now);

  const renderCard = (appointment) => {
    const other = isCounsellor ? appointment.student : appointment.counsellor;
    const settled = TERMINAL.has(appointment.status);
    const busy = busyId === appointment._id;

    return (
      <li key={appointment._id} className="rounded-2xl bg-surface p-5 shadow-sm hairline">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <Avatar name={other?.name ?? 'Orbitwise'} src={other?.avatar} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy-950">{other?.name ?? 'Orbitwise counsellor'}</p>
              <p className="text-xs text-navy-500">{appointmentTypeLabel(appointment.type)}</p>
              <p className="mt-1 text-xs text-navy-600">
                {formatWhen(appointment.startsAt)} · {MODE_LABELS[appointment.mode] ?? appointment.mode}
              </p>
              {appointment.agenda && (
                <p className="mt-2 max-w-prose text-xs text-navy-500 italic">“{appointment.agenda}”</p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge tone={APPOINTMENT_STATUS_TONES[appointment.status] ?? 'neutral'}>
              {APPOINTMENT_STATUS_LABELS[appointment.status] ?? appointment.status}
            </Badge>
            {appointment.meetingLink && appointment.status === 'confirmed' && (
              <Button
                as="a"
                href={appointment.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                size="sm"
                leftIcon={Video}
              >
                Join
              </Button>
            )}
          </div>
        </div>

        {/* Cancellation reasons and outcomes are the record of what happened, so
            they stay visible after the session is settled. */}
        {appointment.cancelReason && (
          <p className="mt-3 border-t border-navy-100 pt-3 text-xs text-navy-500">
            Cancelled by the {appointment.cancelledBy}: {appointment.cancelReason}
          </p>
        )}
        {appointment.outcome && (
          <p className="mt-3 border-t border-navy-100 pt-3 text-xs text-navy-600">
            <span className="font-semibold text-navy-800">Outcome:</span> {appointment.outcome}
          </p>
        )}

        {!settled && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-navy-100 pt-4">
            {isCounsellor && appointment.status === 'requested' && (
              <Button size="sm" leftIcon={Check} isLoading={busy} onClick={() => setStatus(appointment, 'confirmed')}>
                Confirm
              </Button>
            )}
            {isCounsellor && appointment.status === 'confirmed' && (
              <>
                <Button
                  size="sm"
                  leftIcon={CheckCheck}
                  isLoading={busy}
                  onClick={() => setStatus(appointment, 'completed')}
                >
                  Mark completed
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={busy}
                  onClick={() => setStatus(appointment, 'no_show')}
                >
                  No show
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              leftIcon={X}
              isLoading={busy}
              onClick={() => setStatus(appointment, 'cancelled')}
            >
              Cancel
            </Button>
          </div>
        )}
      </li>
    );
  };

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy-950 md:text-3xl">
            {isCounsellor ? 'Appointments' : 'Your sessions'}
          </h1>
          <p className="mt-2 text-sm text-navy-500">
            {upcoming.length} upcoming · {past.length} past
          </p>
        </div>
        {!isCounsellor && (
          <Button as={Link} to={PATHS.studentBookSession} leftIcon={CalendarPlus}>
            Book a session
          </Button>
        )}
      </header>

      {data.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={CalendarClock}
          title={isCounsellor ? 'Nothing booked' : 'No sessions yet'}
          description={
            isCounsellor
              ? 'Students who book time with you will appear here.'
              : 'Talk to a counsellor about your shortlist, applications or visa.'
          }
          action={
            !isCounsellor && (
              <Button as={Link} to={PATHS.studentBookSession} leftIcon={CalendarPlus}>
                Book a session
              </Button>
            )
          }
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="mt-7">
              <h2 className="text-sm font-semibold tracking-wide text-navy-500 uppercase">Upcoming</h2>
              <ul className="mt-3 space-y-4">{upcoming.map(renderCard)}</ul>
            </section>
          )}

          {past.length > 0 && (
            <section className="mt-9">
              <h2 className="text-sm font-semibold tracking-wide text-navy-500 uppercase">Past</h2>
              <ul className="mt-3 space-y-4">{past.map(renderCard)}</ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
