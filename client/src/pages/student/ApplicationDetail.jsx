import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, MessageSquarePlus, Send } from 'lucide-react';

import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Alert from '../../components/ui/Alert.jsx';
import ApplicationTimeline from '../../components/cards/ApplicationTimeline.jsx';
import useQuery from '../../hooks/useQuery.js';
import useMutation from '../../hooks/useMutation.js';
import applicationService from '../../services/applicationService.js';
import { PATHS } from '../../constants/routes.js';
import { degreeLabel, fieldLabel, formatDuration, formatInr } from '../../constants/domain.js';

const TONE = {
  draft: 'neutral',
  documents_pending: 'warning',
  ready_to_apply: 'primary',
  submitted: 'info',
  under_review: 'info',
  offer_received: 'success',
  rejected: 'danger',
  withdrawn: 'neutral',
};

const STATUS_LABELS = {
  draft: 'Draft',
  documents_pending: 'Documents Pending',
  ready_to_apply: 'Ready to Apply',
  submitted: 'Submitted',
  under_review: 'Under Review',
  offer_received: 'Offer Received',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

/** Withdrawing is terminal, so it asks first. */
const DESTRUCTIVE = new Set(['withdrawn']);

export default function ApplicationDetail() {
  const { id } = useParams();
  const [note, setNote] = useState('');

  const { data: application, isLoading, isError, error, refetch, setData } = useQuery(
    (signal) => applicationService.get(id, signal),
    [id]
  );

  const transition = useMutation((payload) => applicationService.transition(id, payload), {
    onSuccess: (updated) => {
      setData(updated);
      toast.success(`Moved to ${updated.statusLabel}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const addNote = useMutation((payload) => applicationService.addNote(id, payload), {
    onSuccess: (updated) => {
      setData(updated);
      setNote('');
      toast.success('Note added');
    },
    onError: (err) => toast.error(err.message),
  });

  const handleTransition = (status) => {
    if (DESTRUCTIVE.has(status)) {
      const confirmed = window.confirm(
        'Withdraw this application? This cannot be undone — you would need to start a new application for this course.'
      );
      if (!confirmed) return;
    }
    transition.mutate({ status }).catch(() => {});
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-6 h-64" rounded="rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <ErrorState error={error} onRetry={refetch} title="Couldn’t load this application" />
        <Button as={Link} to={PATHS.studentApplications} variant="outline" leftIcon={ArrowLeft} className="mt-6">
          All applications
        </Button>
      </div>
    );
  }

  const snap = application.snapshot;

  return (
    <div>
      <Link
        to={PATHS.studentApplications}
        className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-navy-500 transition-colors hover:text-navy-900"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All applications
      </Link>

      <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy-950 md:text-3xl">
            {snap.courseTitle}
          </h1>
          <p className="mt-2 text-sm text-navy-500">
            {snap.universityName} · {snap.city}
            {snap.countryName ? `, ${snap.countryName}` : ''}
          </p>
        </div>
        <Badge tone={TONE[application.status] ?? 'neutral'} size="md">
          {application.statusLabel}
        </Badge>
      </header>

      {application.decision?.outcome === 'offer' && (
        <Alert tone="success" className="mt-6" title="Offer received">
          {application.decision.note || 'The university has made you an offer. Your counsellor will guide the next steps.'}
        </Alert>
      )}
      {application.decision?.outcome === 'rejection' && (
        <Alert tone="danger" className="mt-6" title="Not successful this time">
          {application.decision.note ||
            'This application was unsuccessful. Your shortlist has other options — talk to your counsellor about the strongest next move.'}
        </Alert>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <section className="rounded-2xl bg-surface p-6 shadow-sm hairline">
            <h2 className="text-base font-semibold text-navy-950">Progress</h2>
            <div className="mt-6">
              <ApplicationTimeline
                stages={application.stages}
                history={application.timeline}
                statusLabels={STATUS_LABELS}
              />
            </div>
          </section>

          {/* ─── Next actions ─────────────────────────────────────────
              Rendered from the server's availableTransitions, so the buttons on
              screen are exactly the moves the API will accept. */}
          {application.availableTransitions?.length > 0 && (
            <section className="mt-6 rounded-2xl bg-surface p-6 shadow-sm hairline">
              <h2 className="text-base font-semibold text-navy-950">Move this forward</h2>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {application.availableTransitions.map((option) => (
                  <Button
                    key={option.status}
                    variant={DESTRUCTIVE.has(option.status) ? 'outline' : 'primary'}
                    size="sm"
                    isLoading={transition.isLoading}
                    onClick={() => handleTransition(option.status)}
                    className={DESTRUCTIVE.has(option.status) ? 'text-danger-700' : undefined}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </section>
          )}

          {/* ─── Notes ────────────────────────────────────────────── */}
          <section className="mt-6 rounded-2xl bg-surface p-6 shadow-sm hairline">
            <h2 className="text-base font-semibold text-navy-950">Notes</h2>

            {application.notes?.length > 0 ? (
              <ul className="mt-4 space-y-4">
                {application.notes.map((entry) => (
                  <li key={entry._id} className="rounded-xl bg-navy-50 p-4">
                    <p className="text-sm leading-relaxed text-navy-700">{entry.body}</p>
                    <p className="mt-2 text-xs text-navy-400">
                      {entry.authorName || 'You'} ·{' '}
                      {new Date(entry.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-navy-500">
                No notes yet. Use this to record questions for your counsellor.
              </p>
            )}

            <form
              className="mt-5"
              onSubmit={(event) => {
                event.preventDefault();
                if (note.trim().length === 0) return;
                addNote.mutate({ body: note.trim() }).catch(() => {});
              }}
            >
              <label htmlFor="note" className="mb-1.5 block text-sm font-medium text-navy-800">
                Add a note
              </label>
              <textarea
                id="note"
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Anything you want on record for this application."
                className="w-full rounded-xl border border-navy-200 bg-white px-3.5 py-3 text-sm text-navy-900 transition-[border-color,box-shadow] duration-150 placeholder:text-navy-400 hover:border-navy-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none"
              />
              <Button
                type="submit"
                size="sm"
                className="mt-3"
                leftIcon={note.trim() ? Send : MessageSquarePlus}
                disabled={note.trim().length === 0}
                isLoading={addNote.isLoading}
              >
                Add note
              </Button>
            </form>
          </section>
        </div>

        {/* ─── Snapshot sidebar ──────────────────────────────────────
            Explicitly labelled as recorded-at-apply-time, because these figures
            deliberately do not track later changes to the course. */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl bg-navy-950 p-6">
            <p className="text-2xs font-semibold tracking-wide text-navy-400 uppercase">Recorded when you applied</p>
            <p className="mt-2 font-display text-2xl font-semibold text-white">
              {snap.programmeCostInr ? formatInr(snap.programmeCostInr) : '—'}
            </p>
            <p className="mt-1 text-sm text-navy-400">Total programme cost</p>

            <dl className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm">
              {[
                ['Level', degreeLabel(snap.degreeLevel)],
                ['Subject', snap.field ? fieldLabel(snap.field) : '—'],
                ['Duration', snap.durationMonths ? formatDuration(snap.durationMonths) : '—'],
                ['Tuition / yr', snap.tuitionPerYearInr ? formatInr(snap.tuitionPerYearInr) : '—'],
                ['IELTS needed', snap.minIelts ?? '—'],
                [
                  'Intake',
                  application.intake?.season ? `${application.intake.season} ${application.intake.year ?? ''}`.trim() : '—',
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="text-navy-400">{label}</dt>
                  <dd className="text-right font-medium text-white">{value}</dd>
                </div>
              ))}
            </dl>

            {snap.courseSlug && (
              <Button
                as={Link}
                to={PATHS.course(snap.courseSlug)}
                variant="outline"
                fullWidth
                size="sm"
                className="mt-6 border-white/20 bg-white/5 text-white hover:border-white/30 hover:bg-white/10"
              >
                View current course details
              </Button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
