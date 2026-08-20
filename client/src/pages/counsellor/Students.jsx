import { Link } from 'react-router-dom';
import { ArrowRight, FileClock, Users } from 'lucide-react';

import Badge from '../../components/ui/Badge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ProgressRing from '../../components/ui/ProgressRing.jsx';
import useQuery from '../../hooks/useQuery.js';
import counsellorService from '../../services/counsellorService.js';
import { PATHS } from '../../constants/routes.js';
import { educationLabel } from '../../constants/domain.js';

/**
 * The caseload, ordered as a worklist.
 *
 * The API sorts students who are blocked to the top rather than alphabetically —
 * a directory tells you who exists, a worklist tells you who is waiting.
 */
export default function CounsellorStudents() {
  const { data, isLoading, isError, error, refetch } = useQuery((signal) => counsellorService.students(signal), []);

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-56" />
        <div className="mt-7 space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20" rounded="rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={refetch} title="Couldn’t load your students" />;

  return (
    <div>
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy-950 md:text-3xl">
          My students
        </h1>
        <p className="mt-2 text-sm text-navy-500">
          {data.length} assigned. Students with documents waiting appear first.
        </p>
      </header>

      {data.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Users}
          title="No students yet"
          description="A student becomes yours when they book their first session with you."
        />
      ) : (
        <ul className="mt-7 space-y-3">
          {data.map((student) => (
            <li key={student._id}>
              <Link
                to={PATHS.counsellorStudent(student._id)}
                className="group flex flex-wrap items-center gap-4 rounded-2xl bg-surface p-4 shadow-sm transition-all duration-200 hairline hover:-translate-y-0.5 hover:shadow-lg md:p-5"
              >
                <Avatar name={student.name} src={student.avatar} size="md" />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-navy-950">{student.name}</p>
                  <p className="truncate text-xs text-navy-500">{student.email}</p>
                  <p className="mt-1 text-xs text-navy-600">
                    {student.educationLevel ? educationLabel(student.educationLevel) : 'Profile incomplete'}
                    {student.destinations.length ? ` · ${student.destinations.join(', ')}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {student.documentsAwaitingReview > 0 && (
                    <Badge tone="warning" icon={FileClock}>
                      {student.documentsAwaitingReview} to review
                    </Badge>
                  )}
                  {student.applications > 0 && (
                    <Badge tone="info">
                      {student.applications} application{student.applications === 1 ? '' : 's'}
                    </Badge>
                  )}
                  <div className="hidden sm:block">
                    <ProgressRing value={student.completionPercent} size="sm" />
                  </div>
                  <ArrowRight
                    className="size-4 text-primary-700 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
