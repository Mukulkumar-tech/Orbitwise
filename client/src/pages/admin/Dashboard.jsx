import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CalendarClock,
  FileClock,
  GraduationCap,
  Globe2,
  Library,
  Mail,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react';

import Button from '../../components/ui/Button.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Alert from '../../components/ui/Alert.jsx';
import StatTile from '../../components/cards/StatTile.jsx';
import ChartCard from '../../components/cards/ChartCard.jsx';
import useQuery from '../../hooks/useQuery.js';
import adminService from '../../services/adminService.js';
import { PATHS } from '../../constants/routes.js';
import { AXIS, SERIES_COLORS, tooltipStyle } from '../../constants/charts.js';
import {
  APPLICATION_STATUS_LABELS,
  appointmentTypeLabel,
  degreeLabel,
} from '../../constants/domain.js';

/** `2026-08` → `Aug`. Charted labels want to be short, not unambiguous. */
const monthLabel = (key) => {
  const [year, month] = key.split('-');
  return new Date(Number(year), Number(month) - 1, 1).toLocaleString('en-IN', { month: 'short' });
};


/**
 * Admin home.
 *
 * The headline counts and the six charts are two separate requests. The numbers
 * are what an admin opens this page for, and making them wait on six `$group`
 * pipelines would be a slower page for no benefit — so the tiles render as soon
 * as the overview lands and the charts fill in underneath.
 */
export default function AdminDashboard() {
  const overview = useQuery((signal) => adminService.overview(signal), []);
  const charts = useQuery((signal) => adminService.charts({ months: 6 }, signal), []);

  if (overview.isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-64" />
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-24" rounded="rounded-2xl" />
          ))}
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-72" rounded="rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (overview.isError) {
    return <ErrorState error={overview.error} onRetry={overview.refetch} title="Couldn’t load the dashboard" />;
  }

  const s = overview.data;
  const c = charts.data;

  return (
    <div>
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-navy-950 md:text-3xl">
          Platform overview
        </h1>
        <p className="mt-2 text-sm text-navy-500">
          {s.students} students · {s.counsellors} counsellors · {s.applications} applications ·{' '}
          {(s.offerRate * 100).toFixed(0)}% offer rate
        </p>
      </header>

      {/* ─── What needs attention, before what merely exists ──────────────── */}
      {(s.unassignedStudents > 0 || s.pendingDocuments > 0) && (
        <Alert tone="warning" className="mt-6" title="Needs attention">
          <ul className="space-y-1">
            {s.unassignedStudents > 0 && (
              <li>
                {s.unassignedStudents} student{s.unassignedStudents === 1 ? '' : 's'} on nobody’s caseload.{' '}
                <Link
                  to={`${PATHS.adminStudents}?assigned=false`}
                  className="font-semibold text-primary-700 underline underline-offset-2"
                >
                  Assign a counsellor
                </Link>
              </li>
            )}
            {s.pendingDocuments > 0 && (
              <li>
                {s.pendingDocuments} document{s.pendingDocuments === 1 ? '' : 's'} waiting on a counsellor’s review.
              </li>
            )}
          </ul>
        </Alert>
      )}

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Users} label="Students" value={s.students} />
        <StatTile
          icon={UserPlus}
          label="Unassigned"
          value={s.unassignedStudents}
          tone={s.unassignedStudents > 0 ? 'warning' : 'neutral'}
        />
        <StatTile icon={UserCog} label="Counsellors" value={s.counsellors} />
        <StatTile icon={GraduationCap} label="Applications" value={s.applications} />
        <StatTile
          icon={FileClock}
          label="Docs pending"
          value={s.pendingDocuments}
          tone={s.pendingDocuments > 0 ? 'warning' : 'neutral'}
        />
        <StatTile icon={CalendarClock} label="Appointments" value={s.appointments} />
        <StatTile icon={Library} label="Courses" value={s.courses} />
        <StatTile icon={Globe2} label="Countries" value={s.countries} />
      </div>

      {/* ─── Charts ──────────────────────────────────────────────────────── */}
      {charts.isLoading ? (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-72" rounded="rounded-2xl" />
          ))}
        </div>
      ) : charts.isError ? (
        <ErrorState
          className="mt-8"
          error={charts.error}
          onRetry={charts.refetch}
          title="Couldn’t load the charts"
        />
      ) : (
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <ChartCard
            title="Student signups"
            subtitle="Last six months"
            isEmpty={c.signups.every((point) => point.count === 0)}
          >
            <AreaChart data={c.signups} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES_COLORS[0]} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={SERIES_COLORS[0]} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(226 232 240)" vertical={false} />
              <XAxis dataKey="month" tickFormatter={monthLabel} {...AXIS} />
              <YAxis allowDecimals={false} {...AXIS} />
              <Tooltip {...tooltipStyle} labelFormatter={monthLabel} formatter={(v) => [v, 'Signups']} />
              <Area
                type="monotone"
                dataKey="count"
                stroke={SERIES_COLORS[0]}
                strokeWidth={2}
                fill="url(#signupFill)"
              />
            </AreaChart>
          </ChartCard>

          <ChartCard
            title="Applications started"
            subtitle="Last six months"
            isEmpty={c.applicationsOverTime.every((point) => point.count === 0)}
          >
            <LineChart data={c.applicationsOverTime} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(226 232 240)" vertical={false} />
              <XAxis dataKey="month" tickFormatter={monthLabel} {...AXIS} />
              <YAxis allowDecimals={false} {...AXIS} />
              <Tooltip {...tooltipStyle} labelFormatter={monthLabel} formatter={(v) => [v, 'Applications']} />
              <Line
                type="monotone"
                dataKey="count"
                stroke={SERIES_COLORS[1]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ChartCard>

          <ChartCard
            title="Applications by stage"
            subtitle="Where the pipeline is sitting"
            isEmpty={c.applicationsByStatus.every((row) => row.count === 0)}
          >
            <BarChart
              data={c.applicationsByStatus}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 42, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(226 232 240)" horizontal={false} />
              <XAxis type="number" allowDecimals={false} {...AXIS} />
              <YAxis
                type="category"
                dataKey="status"
                width={112}
                tickFormatter={(status) => APPLICATION_STATUS_LABELS[status] ?? status}
                {...AXIS}
              />
              <Tooltip
                {...tooltipStyle}
                labelFormatter={(status) => APPLICATION_STATUS_LABELS[status] ?? status}
                formatter={(v) => [v, 'Applications']}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {c.applicationsByStatus.map((row, i) => (
                  <Cell key={row.status} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartCard>

          <ChartCard
            title="Where students want to go"
            subtitle="Top destinations across all profiles"
            isEmpty={c.studentsByDestination.length === 0}
          >
            <BarChart data={c.studentsByDestination} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(226 232 240)" vertical={false} />
              <XAxis dataKey="code" {...AXIS} />
              <YAxis allowDecimals={false} {...AXIS} />
              <Tooltip {...tooltipStyle} formatter={(v) => [v, 'Students']} />
              <Bar dataKey="count" fill={SERIES_COLORS[2]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartCard>

          <ChartCard
            title="Catalogue by degree level"
            subtitle={`${s.courses} active courses`}
            isEmpty={c.coursesByDegree.length === 0}
          >
            <PieChart>
              <Pie
                data={c.coursesByDegree}
                dataKey="count"
                nameKey="degreeLevel"
                innerRadius={52}
                outerRadius={86}
                paddingAngle={2}
              >
                {c.coursesByDegree.map((row, i) => (
                  <Cell key={row.degreeLevel} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} formatter={(v, name) => [v, degreeLabel(name)]} />
              <Legend
                formatter={(name) => degreeLabel(name)}
                iconType="circle"
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              />
            </PieChart>
          </ChartCard>

          <ChartCard
            title="Sessions by type"
            subtitle="What students actually book"
            isEmpty={c.appointmentsByType.length === 0}
          >
            <BarChart data={c.appointmentsByType} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(226 232 240)" vertical={false} />
              <XAxis
                dataKey="type"
                tickFormatter={(type) => appointmentTypeLabel(type).split(' ')[0]}
                {...AXIS}
              />
              <YAxis allowDecimals={false} {...AXIS} />
              <Tooltip
                {...tooltipStyle}
                labelFormatter={(type) => appointmentTypeLabel(type)}
                formatter={(v) => [v, 'Sessions']}
              />
              <Bar dataKey="count" fill={SERIES_COLORS[3]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartCard>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button as={Link} to={PATHS.adminStudents} leftIcon={Users}>
          Manage students
        </Button>
        <Button as={Link} to={PATHS.adminCounsellors} variant="outline" leftIcon={UserCog}>
          Counsellors
        </Button>
        <Button as={Link} to={PATHS.adminEnquiries} variant="outline" leftIcon={Mail}>
          Enquiries ({s.enquiries})
        </Button>
      </div>
    </div>
  );
}
