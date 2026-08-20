import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Info,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react';

import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import ProgressRing from '../../components/ui/ProgressRing.jsx';
import useQuery from '../../hooks/useQuery.js';
import documentService from '../../services/documentService.js';
import cn from '../../utils/cn.js';

const STATUS = {
  missing: { tone: 'neutral', label: 'Not uploaded', icon: Clock },
  uploaded: { tone: 'info', label: 'Uploaded', icon: FileText },
  under_review: { tone: 'info', label: 'Under review', icon: Clock },
  verified: { tone: 'success', label: 'Verified', icon: CheckCircle2 },
  rejected: { tone: 'danger', label: 'Rejected', icon: XCircle },
  expired: { tone: 'warning', label: 'Expired', icon: AlertTriangle },
};

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp';
const MAX_MB = 10;

const formatSize = (bytes) => (bytes > 1_048_576 ? `${(bytes / 1_048_576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`);

/**
 * Document checklist and upload.
 *
 * Files are previewed through the authenticated streaming endpoint, never a public
 * URL — the link opens `/api/documents/:id/file`, which checks ownership before
 * a single byte is sent.
 */
export default function Documents() {
  const { data, isLoading, isError, error, refetch } = useQuery((signal) => documentService.checklist(signal), []);
  const [busyType, setBusyType] = useState(null);
  const inputs = useRef({});

  const pick = (type) => inputs.current[type]?.click();

  const handleFile = async (type, file) => {
    if (!file) return;

    // Checked client-side too, so a 10 MB upload is not sent only to be rejected.
    if (file.size > MAX_MB * 1_048_576) {
      toast.error(`That file is larger than ${MAX_MB}MB`);
      return;
    }

    setBusyType(type);
    try {
      await documentService.upload({ type, file });
      toast.success('Uploaded');
      await refetch();
    } catch (uploadError) {
      toast.error(uploadError.errors?.file ?? uploadError.message);
    } finally {
      setBusyType(null);
      if (inputs.current[type]) inputs.current[type].value = '';
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(`Remove ${item.label}? You can upload a replacement afterwards.`);
    if (!confirmed) return;

    setBusyType(item.type);
    try {
      await documentService.remove(item.document._id);
      toast.success('Removed');
      await refetch();
    } catch (deleteError) {
      toast.error(deleteError.message);
    } finally {
      setBusyType(null);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-6 h-96" rounded="rounded-2xl" />
      </div>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={refetch} title="Couldn’t load your documents" />;

  const required = data.items.filter((item) => item.required);
  const optional = data.items.filter((item) => !item.required);

  const renderRow = (item) => {
    const status = STATUS[item.status] ?? STATUS.missing;
    const Icon = status.icon;
    const busy = busyType === item.type;

    return (
      <li key={item.type} className="flex flex-wrap items-center gap-4 px-5 py-4">
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl',
            item.status === 'verified' ? 'bg-success-50 text-success-700' : 'bg-navy-100 text-navy-500'
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-navy-950">
            {item.label}
            {item.required && (
              <span className="text-2xs font-semibold tracking-wide text-danger-700 uppercase">Required</span>
            )}
          </p>
          {item.document ? (
            <p className="mt-0.5 truncate text-xs text-navy-500">
              {item.document.originalName} · {formatSize(item.document.sizeBytes)}
              {item.document.version > 1 ? ` · v${item.document.version}` : ''}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-navy-400">PDF, JPG, PNG or WebP · up to {MAX_MB}MB</p>
          )}
          {item.document?.reviewNote && (
            <p className="mt-1 text-xs leading-relaxed text-danger-700">{item.document.reviewNote}</p>
          )}
        </div>

        <Badge tone={status.tone} size="sm">
          {status.label}
        </Badge>

        <div className="flex items-center gap-2">
          <input
            ref={(node) => {
              inputs.current[item.type] = node;
            }}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            aria-label={`Upload ${item.label}`}
            onChange={(event) => handleFile(item.type, event.target.files?.[0])}
          />

          {item.document && (
            <Button
              as="a"
              href={documentService.fileUrl(item.document._id)}
              target="_blank"
              rel="noopener noreferrer"
              variant="ghost"
              size="sm"
            >
              View
            </Button>
          )}

          <Button variant="outline" size="sm" leftIcon={Upload} isLoading={busy} onClick={() => pick(item.type)}>
            {item.document ? 'Replace' : 'Upload'}
          </Button>

          {item.document && item.status !== 'verified' && (
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Remove ${item.label}`}
              onClick={() => handleDelete(item)}
              className="text-danger-700 hover:bg-danger-50"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </li>
    );
  };

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy-950 md:text-3xl">
            Documents
          </h1>
          <p className="mt-2 max-w-xl text-sm text-navy-500">
            Universities ask for the same core documents. Upload them once here and they attach to every application.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <ProgressRing value={data.completionPercent} size="lg" />
          <div>
            <p className="text-sm font-semibold text-navy-950">
              {data.verifiedCount} of {data.requiredCount} verified
            </p>
            <p className="text-xs text-navy-500">{data.completionPercent}% submitted</p>
          </div>
        </div>
      </header>

      {data.outstanding.length > 0 && (
        <Alert tone="warning" className="mt-7" title={`${data.outstanding.length} document${data.outstanding.length === 1 ? '' : 's'} still needed`}>
          {data.outstanding.map((item) => item.label).join(' · ')}
        </Alert>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold tracking-wide text-navy-500 uppercase">Required</h2>
        <ul className="mt-3 divide-y divide-navy-100 overflow-hidden rounded-2xl bg-surface shadow-sm hairline">
          {required.map(renderRow)}
        </ul>
      </section>

      {optional.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold tracking-wide text-navy-500 uppercase">Also useful</h2>
          <p className="mt-1 text-xs text-navy-500">
            Not needed yet — these become required once you start applying, or for postgraduate courses.
          </p>
          <ul className="mt-3 divide-y divide-navy-100 overflow-hidden rounded-2xl bg-surface shadow-sm hairline">
            {optional.map(renderRow)}
          </ul>
        </section>
      )}

      <p className="mt-8 flex items-start gap-2 text-xs leading-relaxed text-navy-500">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        Your documents are private. They are never served from a public URL — each view is authenticated and checked
        against your account, and only a counsellor assigned to you can open them.
      </p>
    </div>
  );
}
