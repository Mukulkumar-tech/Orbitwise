import { useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, ExternalLink, Inbox, XCircle } from 'lucide-react';

import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Input from '../../components/ui/Input.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import useQuery from '../../hooks/useQuery.js';
import counsellorService, { reviewService } from '../../services/counsellorService.js';
import { DOCUMENT_TYPE_LABELS } from '../../constants/domain.js';

const formatSize = (bytes) =>
  bytes > 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

/**
 * Documents across the caseload awaiting a decision.
 *
 * Rejection requires a note. A student told only "rejected" has to guess what to
 * fix, which turns one round trip into three.
 */
export default function ReviewQueue() {
  const { data, isLoading, isError, error, refetch } = useQuery((signal) => counsellorService.reviewQueue(signal), []);
  const [busyId, setBusyId] = useState(null);
  const [notes, setNotes] = useState({});

  const decide = async (doc, status) => {
    const note = (notes[doc._id] ?? '').trim();

    if (status === 'rejected' && !note) {
      toast.error('Add a note explaining what needs fixing');
      return;
    }

    setBusyId(doc._id);
    try {
      await reviewService.review(doc._id, { status, note });
      toast.success(status === 'verified' ? 'Verified' : 'Sent back to the student');
      setNotes((prev) => ({ ...prev, [doc._id]: '' }));
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
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-7 h-72" rounded="rounded-2xl" />
      </div>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={refetch} title="Couldn’t load the review queue" />;

  return (
    <div>
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy-950 md:text-3xl">
          Document review
        </h1>
        <p className="mt-2 text-sm text-navy-500">
          {data.length} document{data.length === 1 ? '' : 's'} waiting, oldest first.
        </p>
      </header>

      {data.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Inbox}
          title="Nothing to review"
          description="Documents your students upload will queue up here."
        />
      ) : (
        <ul className="mt-7 space-y-4">
          {data.map((doc) => (
            <li key={doc._id} className="rounded-2xl bg-surface p-5 shadow-sm hairline">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <Avatar name={doc.student?.name ?? 'Student'} src={doc.student?.avatar} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy-950">
                      {DOCUMENT_TYPE_LABELS[doc.type] ?? doc.type}
                    </p>
                    <p className="text-xs text-navy-500">{doc.student?.name ?? 'Student'}</p>
                    <p className="mt-1 truncate text-xs text-navy-400">
                      {doc.originalName} · {formatSize(doc.sizeBytes)}
                      {doc.version > 1 ? ` · v${doc.version}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge tone="info" size="sm">
                    {doc.status.replace('_', ' ')}
                  </Badge>
                  {/* Streams through the authenticated endpoint, which checks that
                      this counsellor is assigned to the student before sending. */}
                  <Button
                    as="a"
                    href={reviewService.fileUrl(doc._id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outline"
                    size="sm"
                    rightIcon={ExternalLink}
                  >
                    Open
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-navy-100 pt-4">
                <Input
                  containerClassName="flex-1 min-w-56"
                  label="Note to the student"
                  placeholder="Required when sending back — say what to fix"
                  value={notes[doc._id] ?? ''}
                  onChange={(event) => setNotes((prev) => ({ ...prev, [doc._id]: event.target.value }))}
                />
                <Button
                  size="sm"
                  leftIcon={CheckCircle2}
                  isLoading={busyId === doc._id}
                  onClick={() => decide(doc, 'verified')}
                >
                  Verify
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={XCircle}
                  className="text-danger-700"
                  isLoading={busyId === doc._id}
                  onClick={() => decide(doc, 'rejected')}
                >
                  Send back
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
