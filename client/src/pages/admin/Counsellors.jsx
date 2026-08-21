import { useState } from 'react';
import { Globe2, UserCog, UserPlus, Users } from 'lucide-react';

import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Button from '../../components/ui/Button.jsx';
import useQuery from '../../hooks/useQuery.js';
import NewCounsellorForm from './NewCounsellorForm.jsx';
import adminService from '../../services/adminService.js';
import { fieldLabel } from '../../constants/domain.js';

/**
 * Counsellors and how loaded they are.
 *
 * Sorted busiest-first by the API. The question this page answers is "who can
 * take another student", so the caseload column is the point of it — an
 * alphabetical directory would make an admin count by hand before assigning.
 */
export default function AdminCounsellors() {
  const { data, isLoading, isError, error, refetch } = useQuery((signal) => adminService.counsellors(signal), []);
  const [creating, setCreating] = useState(false);

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-52" />
        <div className="mt-7 space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24" rounded="rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={refetch} title="Couldn’t load counsellors" />;

  const totalCaseload = data.reduce((sum, c) => sum + c.caseload, 0);

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy-950 md:text-3xl">
            Counsellors
          </h1>
          <p className="mt-2 text-sm text-navy-500">
            {data.length} counsellor{data.length === 1 ? '' : 's'} carrying {totalCaseload} student
            {totalCaseload === 1 ? '' : 's'}. Busiest first.
          </p>
        </div>
        {!creating && (
          <Button leftIcon={UserPlus} onClick={() => setCreating(true)}>
            New counsellor
          </Button>
        )}
      </header>

      {creating && (
        <NewCounsellorForm
          onCancel={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            // Refetch rather than splicing the new row in: the list is sorted by
            // caseload server-side, so appending locally would put a new
            // counsellor in the wrong place until the next load.
            refetch();
          }}
        />
      )}

      {data.length === 0 ? (
        !creating && (
          <EmptyState
            className="mt-8"
            icon={UserCog}
            title="No counsellors yet"
            description="Add one to start assigning students and taking bookings."
            action={
              <Button leftIcon={UserPlus} onClick={() => setCreating(true)}>
                New counsellor
              </Button>
            }
          />
        )
      ) : (
        <ul className="mt-7 space-y-3">
          {data.map((counsellor) => (
            <li
              key={counsellor._id}
              className="flex flex-wrap items-center gap-4 rounded-2xl bg-surface p-5 shadow-sm hairline"
            >
              <Avatar name={counsellor.name} src={counsellor.avatar} size="md" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy-950">{counsellor.name}</p>
                <p className="truncate text-xs text-navy-500">
                  {counsellor.title}
                  {counsellor.experienceYears ? ` · ${counsellor.experienceYears} yrs` : ''}
                </p>
                <p className="truncate text-xs text-navy-400">{counsellor.email}</p>

                {(counsellor.countries?.length > 0 || counsellor.fields?.length > 0) && (
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    {counsellor.countries?.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-2xs text-navy-500">
                        <Globe2 className="size-3" aria-hidden="true" />
                        {counsellor.countries.join(' · ')}
                      </span>
                    )}
                    {counsellor.fields?.slice(0, 3).map((field) => (
                      <Badge key={field} tone="primary" size="sm">
                        {fieldLabel(field)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {!counsellor.isAcceptingStudents && <Badge tone="neutral">Closed to new students</Badge>}
                {!counsellor.isActive && <Badge tone="danger">Inactive</Badge>}
                <Badge tone={counsellor.caseload > 0 ? 'info' : 'neutral'} icon={Users}>
                  {counsellor.caseload} student{counsellor.caseload === 1 ? '' : 's'}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
