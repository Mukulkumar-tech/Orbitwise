import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowDown, ArrowUp, Download, Search, Users } from 'lucide-react';

import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ProgressRing from '../../components/ui/ProgressRing.jsx';
import useQuery from '../../hooks/useQuery.js';
import useDebounce from '../../hooks/useDebounce.js';
import adminService from '../../services/adminService.js';
import { educationLabel, degreeLabel, formatInr } from '../../constants/domain.js';
import cn from '../../utils/cn.js';

const LIMIT = 20;

const ASSIGNED_OPTIONS = [
  { value: '', label: 'Everyone' },
  { value: 'false', label: 'No counsellor' },
  { value: 'true', label: 'Has a counsellor' },
];

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—';

/** A sortable column header. Clicking the active column flips its direction. */
function SortHeader({ field, label, sort, onSort, className }) {
  const active = sort === field || sort === `-${field}`;
  const descending = sort === `-${field}`;
  const Icon = descending ? ArrowDown : ArrowUp;

  return (
    <th scope="col" className={cn('px-4 py-3 text-left', className)}>
      <button
        type="button"
        onClick={() => onSort(active && descending ? field : `-${field}`)}
        aria-sort={active ? (descending ? 'descending' : 'ascending') : 'none'}
        className="inline-flex items-center gap-1 rounded font-semibold text-navy-600 transition-colors hover:text-navy-900 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:outline-none"
      >
        {label}
        <Icon className={cn('size-3', active ? 'text-primary-700' : 'text-navy-300')} aria-hidden="true" />
      </button>
    </th>
  );
}

/**
 * The student table.
 *
 * Filter state lives in the URL rather than in component state, so a filtered
 * view is shareable, survives a refresh, and the back button behaves. It also
 * means the dashboard can link straight to "students with no counsellor" instead
 * of dropping the admin on an unfiltered list and asking them to re-narrow it.
 *
 * Every filter is applied server-side. Narrowing a single page in the browser
 * would make the total count — and therefore the CSV export — a lie.
 */
export default function AdminStudents() {
  const [params, setParams] = useSearchParams();

  const search = params.get('search') ?? '';
  const assigned = params.get('assigned') ?? '';
  const sort = params.get('sort') ?? '-createdAt';
  const page = Number(params.get('page') ?? 1);

  // Local, so typing stays responsive; the URL and the request follow behind it.
  const [searchDraft, setSearchDraft] = useState(search);
  const debouncedSearch = useDebounce(searchDraft, 350);
  const [exporting, setExporting] = useState(false);

  /** Writes a patch into the query string, resetting to page 1 unless paging. */
  const update = (patch) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          if (value === '' || value == null) next.delete(key);
          else next.set(key, String(value));
        }
        if (!('page' in patch)) next.delete('page');
        return next;
      },
      { replace: true }
    );
  };

  // The debounced value drives the URL; the URL drives the query. One direction,
  // so a back-button navigation cannot fight the input.
  useEffect(() => {
    if (debouncedSearch !== search) update({ search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const query = useMemo(
    () => ({ search: search || undefined, assigned: assigned || undefined, sort, page, limit: LIMIT }),
    [search, assigned, sort, page]
  );

  const { data, isLoading, isError, error, refetch } = useQuery(
    (signal) => adminService.students(query, signal).then(({ data: items, meta: pageMeta }) => ({ items, pageMeta })),
    [query]
  );

  const counsellors = useQuery((signal) => adminService.counsellors(signal), []);

  const assign = async (studentId, counsellorUserId) => {
    try {
      await adminService.assignCounsellor(studentId, counsellorUserId || null);
      toast.success(counsellorUserId ? 'Counsellor assigned' : 'Counsellor removed');
      await Promise.all([refetch(), counsellors.refetch()]);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const filename = await adminService.downloadStudentsCsv({
        search: search || undefined,
        assigned: assigned || undefined,
        sort,
      });
      toast.success(`Downloaded ${filename}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  const counsellorOptions = [
    { value: '', label: 'Unassigned' },
    ...(counsellors.data ?? []).map((c) => ({
      value: c.userId,
      label: `${c.name} (${c.caseload})`,
    })),
  ];

  const items = data?.items ?? [];
  const pageMeta = data?.pageMeta ?? null;

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy-950 md:text-3xl">
            Students
          </h1>
          <p className="mt-2 text-sm text-navy-500">
            {pageMeta ? `${pageMeta.total} matching` : 'Loading'}
            {search || assigned ? ' this filter' : ' in total'}.
          </p>
        </div>

        {/* Exports the filtered set, not the whole table — same query as above. */}
        <Button variant="outline" leftIcon={Download} isLoading={exporting} onClick={exportCsv}>
          Export CSV
        </Button>
      </header>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <Input
          containerClassName="min-w-64 flex-1"
          label="Search"
          leftIcon={Search}
          placeholder="Name, email or phone"
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
        />
        <Select
          containerClassName="w-52"
          label="Counsellor"
          options={ASSIGNED_OPTIONS}
          value={assigned}
          onChange={(event) => update({ assigned: event.target.value })}
        />
      </div>

      {isLoading ? (
        <div className="mt-7 space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-16" rounded="rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState className="mt-8" error={error} onRetry={refetch} title="Couldn’t load students" />
      ) : items.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Users}
          title="No students match"
          description={
            search || assigned
              ? 'Try a broader search, or clear the counsellor filter.'
              : 'Nobody has registered yet.'
          }
          action={
            (search || assigned) && (
              <Button variant="outline" onClick={() => update({ search: '', assigned: '' })}>
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="mt-7 overflow-x-auto rounded-2xl bg-surface shadow-sm hairline">
            <table className="w-full min-w-[56rem] text-sm">
              <thead className="border-b border-navy-100 text-xs">
                <tr>
                  <SortHeader field="name" label="Student" sort={sort} onSort={(v) => update({ sort: v })} />
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-navy-600">
                    Profile
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-navy-600">
                    Goal
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-navy-600">
                    Counsellor
                  </th>
                  <SortHeader
                    field="createdAt"
                    label="Joined"
                    sort={sort}
                    onSort={(v) => update({ sort: v })}
                    className="font-semibold text-navy-600"
                  />
                  <SortHeader field="lastLogin" label="Last seen" sort={sort} onSort={(v) => update({ sort: v })} />
                </tr>
              </thead>

              <tbody>
                {items.map((student) => (
                  <tr key={student._id} className="border-b border-navy-50 last:border-0 hover:bg-navy-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={student.name} src={student.avatar} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-navy-950">{student.name}</p>
                          <p className="truncate text-xs text-navy-500">{student.email}</p>
                        </div>
                        {!student.isVerified && (
                          <Badge tone="warning" size="sm">
                            Unverified
                          </Badge>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <ProgressRing value={student.completionPercent} size="sm" />
                        <span className="text-xs text-navy-600">
                          {student.educationLevel ? educationLabel(student.educationLevel) : 'Not started'}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-navy-800">
                        {student.degreeGoal ? degreeLabel(student.degreeGoal) : '—'}
                      </p>
                      <p className="text-xs text-navy-500">
                        {student.destinations.length ? student.destinations.join(', ') : 'Anywhere'}
                        {student.budgetInr ? ` · ${formatInr(student.budgetInr)}` : ''}
                      </p>
                      {student.applications > 0 && (
                        <Badge tone="info" size="sm" className="mt-1">
                          {student.applications} application{student.applications === 1 ? '' : 's'}
                        </Badge>
                      )}
                    </td>

                    {/* Assignment happens inline. Opening a drawer to change one
                        dropdown is the slower path for the only bulk-ish job on
                        this screen. */}
                    <td className="px-4 py-3">
                      <Select
                        containerClassName="w-44"
                        aria-label={`Counsellor for ${student.name}`}
                        options={counsellorOptions}
                        value={student.counsellor?._id ?? ''}
                        disabled={counsellors.isLoading}
                        onChange={(event) => assign(student._id, event.target.value)}
                      />
                    </td>

                    <td className="px-4 py-3 text-xs whitespace-nowrap text-navy-600">
                      {formatDate(student.joinedAt)}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-navy-600">
                      {formatDate(student.lastLogin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pageMeta && pageMeta.totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm"
            >
              <p className="text-navy-500">
                Page {pageMeta.page} of {pageMeta.totalPages} · {pageMeta.total} students
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pageMeta.hasPrevPage}
                  onClick={() => update({ page: pageMeta.page - 1 })}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pageMeta.hasNextPage}
                  onClick={() => update({ page: pageMeta.page + 1 })}
                >
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
