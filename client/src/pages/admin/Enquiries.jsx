import { useState } from 'react';
import { Mail, Phone } from 'lucide-react';

import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import useQuery from '../../hooks/useQuery.js';
import adminService from '../../services/adminService.js';
import { educationLabel } from '../../constants/domain.js';

const STATUS_TONES = { new: 'warning', contacted: 'info', converted: 'success', closed: 'neutral' };

const formatWhen = (value) =>
  new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

/**
 * Contact-form submissions.
 *
 * Read-only, and deliberately so: this phase built the queue, not the CRM around
 * it. Every enquiry carries a working mailto and tel link, so the action an admin
 * actually takes — replying — is one click, rather than a status dropdown that
 * changes a field nobody downstream reads yet.
 */
export default function AdminEnquiries() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useQuery(
    (signal) => adminService.enquiries({ page, limit: 20 }, signal).then(({ data: items, meta }) => ({ items, meta })),
    [page]
  );

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-48" />
        <div className="mt-7 space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28" rounded="rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={refetch} title="Couldn’t load enquiries" />;

  const { items, meta } = data;

  return (
    <div>
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy-950 md:text-3xl">
          Enquiries
        </h1>
        <p className="mt-2 text-sm text-navy-500">
          {meta.total} submission{meta.total === 1 ? '' : 's'} from the contact form, newest first.
        </p>
      </header>

      {items.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Mail}
          title="No enquiries yet"
          description="Messages sent through the contact form will land here."
        />
      ) : (
        <>
          <ul className="mt-7 space-y-4">
            {items.map((enquiry) => (
              <li key={enquiry._id} className="rounded-2xl bg-surface p-5 shadow-sm hairline">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy-950">{enquiry.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-navy-500">
                      <a
                        href={`mailto:${enquiry.email}`}
                        className="inline-flex items-center gap-1.5 hover:text-primary-700"
                      >
                        <Mail className="size-3.5" aria-hidden="true" />
                        {enquiry.email}
                      </a>
                      {enquiry.phone && (
                        <a
                          href={`tel:${enquiry.phone.replace(/\s/g, '')}`}
                          className="inline-flex items-center gap-1.5 hover:text-primary-700"
                        >
                          <Phone className="size-3.5" aria-hidden="true" />
                          {enquiry.phone}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge tone={STATUS_TONES[enquiry.status] ?? 'neutral'}>{enquiry.status}</Badge>
                    <span className="text-xs whitespace-nowrap text-navy-400">{formatWhen(enquiry.createdAt)}</span>
                  </div>
                </div>

                <p className="mt-3 border-t border-navy-100 pt-3 text-sm leading-relaxed text-navy-700">
                  {enquiry.message}
                </p>

                {(enquiry.educationLevel || enquiry.interestedCountries?.length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {enquiry.educationLevel && (
                      <Badge tone="primary" size="sm">
                        {educationLabel(enquiry.educationLevel)}
                      </Badge>
                    )}
                    {enquiry.interestedCountries?.map((code) => (
                      <Badge key={code} tone="neutral" size="sm">
                        {code}
                      </Badge>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>

          {meta.totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-5 flex items-center justify-between gap-3 text-sm">
              <p className="text-navy-500">
                Page {meta.page} of {meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!meta.hasPrevPage} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={!meta.hasNextPage} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
