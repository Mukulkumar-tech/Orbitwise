import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CalendarX, Check, Globe2, Languages, UserRound } from 'lucide-react';

import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import useQuery from '../../hooks/useQuery.js';
import { appointmentService } from '../../services/counsellorService.js';
import { PATHS } from '../../constants/routes.js';
import { APPOINTMENT_TYPE_LABELS, fieldLabel } from '../../constants/domain.js';
import cn from '../../utils/cn.js';

const TYPE_OPTIONS = Object.entries(APPOINTMENT_TYPE_LABELS).map(([value, label]) => ({ value, label }));

const MODE_OPTIONS = [
  { value: 'video', label: 'Video call' },
  { value: 'phone', label: 'Phone' },
  { value: 'in_person', label: 'In person' },
];

/** `YYYY-MM-DD` in the browser's own timezone — `toISOString` would shift the date. */
const toDateInput = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

/**
 * Book time with a counsellor.
 *
 * Slots come from the server, which generates them from published availability
 * and then removes the ones already taken — so the list only ever offers times
 * the booking call will accept. The client does not compute availability; it
 * would have to duplicate the conflict rules and would still race against
 * another student booking the same slot a second earlier. A 409 is still handled,
 * because that race is real however narrow.
 */
export default function BookSession() {
  const navigate = useNavigate();

  const {
    data: counsellors,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery((signal) => appointmentService.listCounsellors(signal), []);

  const [counsellorUserId, setCounsellorUserId] = useState('');
  const [date, setDate] = useState(() => toDateInput(new Date()));
  const [slots, setSlots] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [startsAt, setStartsAt] = useState('');
  const [type, setType] = useState(TYPE_OPTIONS[0].value);
  const [mode, setMode] = useState('video');
  const [agenda, setAgenda] = useState('');
  const [booking, setBooking] = useState(false);

  const selected = useMemo(
    () => counsellors?.find((c) => c.userId === counsellorUserId) ?? null,
    [counsellors, counsellorUserId]
  );

  // Reload slots whenever the counsellor or the day changes, and drop any slot
  // already chosen — keeping it would let a student submit a time that belongs
  // to a different counsellor's calendar.
  useEffect(() => {
    if (!counsellorUserId || !date) {
      setSlots(null);
      return undefined;
    }

    let active = true;
    setLoadingSlots(true);
    setStartsAt('');

    appointmentService
      .availability(counsellorUserId, date)
      .then((result) => {
        if (active) setSlots(result);
      })
      .catch((err) => {
        if (active) {
          setSlots({ slots: [] });
          toast.error(err.message);
        }
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });

    return () => {
      active = false;
    };
  }, [counsellorUserId, date]);

  const submit = async (event) => {
    event.preventDefault();
    if (!startsAt) {
      toast.error('Pick a time slot');
      return;
    }

    setBooking(true);
    try {
      await appointmentService.book({ counsellorUserId, type, startsAt, mode, agenda: agenda.trim() || undefined });
      toast.success('Requested — your counsellor will confirm shortly');
      navigate(PATHS.studentAppointments);
    } catch (err) {
      toast.error(err.message);
      // A 409 means someone took the slot while this form was open. Refetching
      // is the only honest response: the list on screen is now wrong.
      if (/booked/i.test(err.message)) {
        setStartsAt('');
        const fresh = await appointmentService.availability(counsellorUserId, date).catch(() => null);
        if (fresh) setSlots(fresh);
      }
    } finally {
      setBooking(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-56" />
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32" rounded="rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={refetch} title="Couldn’t load counsellors" />;

  return (
    <div>
      <Button as={Link} to={PATHS.studentAppointments} variant="ghost" size="sm" leftIcon={ArrowLeft}>
        Your sessions
      </Button>

      <header className="mt-4">
        <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy-950 md:text-3xl">
          Book a session
        </h1>
        <p className="mt-2 text-sm text-navy-500">
          Pick a counsellor, then a time they are actually free. Sessions are free for Orbitwise students.
        </p>
      </header>

      {counsellors.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={UserRound}
          title="No counsellors available"
          description="Every counsellor is at capacity right now. Please check back shortly."
        />
      ) : (
        <form onSubmit={submit} className="mt-7">
          {/* ─── 1 · Who ──────────────────────────────────────────────────── */}
          <fieldset>
            <legend className="text-sm font-semibold text-navy-900">1 · Choose a counsellor</legend>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {counsellors.map((counsellor) => {
                const isSelected = counsellor.userId === counsellorUserId;
                return (
                  <label
                    key={counsellor.userId}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-2xl bg-surface p-4 shadow-sm transition-all duration-200 hairline',
                      // The radio itself is sr-only, so the ring has to come from the label.
                      'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2',
                      isSelected ? 'ring-2 ring-primary-500' : 'hover:-translate-y-0.5 hover:shadow-lg'
                    )}
                  >
                    <input
                      type="radio"
                      name="counsellor"
                      value={counsellor.userId}
                      checked={isSelected}
                      onChange={() => setCounsellorUserId(counsellor.userId)}
                      className="sr-only"
                    />
                    <Avatar name={counsellor.name} src={counsellor.avatar} size="md" />

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-navy-950">{counsellor.name}</span>
                        {isSelected && <Check className="size-4 shrink-0 text-primary-700" aria-hidden="true" />}
                      </span>
                      <span className="block truncate text-xs text-navy-500">{counsellor.title}</span>

                      {counsellor.bio && (
                        <span className="mt-1.5 block line-clamp-2 text-xs text-navy-600">{counsellor.bio}</span>
                      )}

                      <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-navy-500">
                        {counsellor.experienceYears > 0 && (
                          <span>
                            {counsellor.experienceYears} yr{counsellor.experienceYears === 1 ? '' : 's'}
                          </span>
                        )}
                        {counsellor.countries?.length > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Globe2 className="size-3" aria-hidden="true" />
                            {counsellor.countries.join(' · ')}
                          </span>
                        )}
                        {counsellor.languages?.length > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Languages className="size-3" aria-hidden="true" />
                            {counsellor.languages.join(', ')}
                          </span>
                        )}
                      </span>

                      {counsellor.fields?.length > 0 && (
                        <span className="mt-2 flex flex-wrap gap-1.5">
                          {counsellor.fields.slice(0, 3).map((field) => (
                            <Badge key={field} tone="primary" size="sm">
                              {fieldLabel(field)}
                            </Badge>
                          ))}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* ─── 2 · When ─────────────────────────────────────────────────── */}
          <fieldset className="mt-8" disabled={!counsellorUserId}>
            <legend className="text-sm font-semibold text-navy-900">2 · Pick a time</legend>

            {!counsellorUserId ? (
              <p className="mt-3 text-sm text-navy-500">Choose a counsellor first.</p>
            ) : (
              <div className="mt-3 rounded-2xl bg-surface p-5 shadow-sm hairline">
                <Input
                  type="date"
                  label="Date"
                  containerClassName="max-w-56"
                  value={date}
                  min={toDateInput(new Date())}
                  onChange={(event) => setDate(event.target.value)}
                  hint={selected ? `${selected.slotMinutes}-minute sessions` : undefined}
                />

                <div className="mt-5">
                  {loadingSlots ? (
                    <div className="flex items-center gap-2 text-sm text-navy-500">
                      <Spinner size="sm" />
                      Checking availability…
                    </div>
                  ) : slots?.slots?.length ? (
                    <ul className="flex flex-wrap gap-2">
                      {slots.slots.map((slot) => (
                        <li key={slot.startsAt}>
                          <button
                            type="button"
                            onClick={() => setStartsAt(slot.startsAt)}
                            aria-pressed={startsAt === slot.startsAt}
                            className={cn(
                              'rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors duration-150',
                              'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:outline-none',
                              startsAt === slot.startsAt
                                ? 'bg-primary-500 text-navy-950'
                                : 'bg-navy-50 text-navy-700 hover:bg-navy-100'
                            )}
                          >
                            {formatTime(slot.startsAt)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState
                      size="sm"
                      icon={CalendarX}
                      title="Nothing free that day"
                      description="Weekends and fully-booked days show up empty. Try another date."
                    />
                  )}
                </div>
              </div>
            )}
          </fieldset>

          {/* ─── 3 · What ─────────────────────────────────────────────────── */}
          <fieldset className="mt-8" disabled={!startsAt}>
            <legend className="text-sm font-semibold text-navy-900">3 · What it’s about</legend>

            <div className="mt-3 rounded-2xl bg-surface p-5 shadow-sm hairline">
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="Session type"
                  options={TYPE_OPTIONS}
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                />
                <Select
                  label="How you'd like to meet"
                  options={MODE_OPTIONS}
                  value={mode}
                  onChange={(event) => setMode(event.target.value)}
                />
              </div>

              <Input
                containerClassName="mt-4"
                label="Anything specific you want to cover?"
                optionalLabel
                placeholder="e.g. whether my 7.0 IELTS is enough for the UK courses I shortlisted"
                maxLength={500}
                value={agenda}
                onChange={(event) => setAgenda(event.target.value)}
                hint="Your counsellor reads this before the call, so the time goes further."
              />
            </div>
          </fieldset>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Button type="submit" size="lg" isLoading={booking} disabled={!startsAt}>
              Request this session
            </Button>
            {startsAt && (
              <p className="text-sm text-navy-500">
                {selected?.name} ·{' '}
                {new Date(startsAt).toLocaleString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
