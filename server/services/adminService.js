import User from '../models/User.js';
import StudentProfile from '../models/StudentProfile.js';
import Counsellor from '../models/Counsellor.js';
import Application from '../models/Application.js';
import Appointment from '../models/Appointment.js';
import Document from '../models/Document.js';
import Course from '../models/Course.js';
import University from '../models/University.js';
import Country from '../models/Country.js';
import Scholarship from '../models/Scholarship.js';
import Enquiry from '../models/Enquiry.js';
import ApiError from '../utils/ApiError.js';
import { completionOf } from './profileService.js';
import { ROLES, APPLICATION_STATUS_VALUES, DOCUMENT_STATUS } from '../constants/index.js';

/**
 * Admin analytics and operations.
 *
 * Every count here is an aggregation rather than a `find().length`. On a demo
 * database the difference is invisible; on a real one, pulling every application
 * into Node to count them by status is the query that takes the dashboard down.
 *
 * The overview and the charts are separate endpoints on purpose. The headline
 * numbers are what an admin opens the page for, and they should not wait on six
 * `$group` pipelines to render.
 */

/** `$group` by a field into a plain slug→count object. */
const countBy = async (Model, field, match = {}) => {
  const rows = await Model.aggregate([
    ...(Object.keys(match).length ? [{ $match: match }] : []),
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((r) => [r._id ?? 'unknown', r.count]));
};

/** Last `months` calendar months as `YYYY-MM` keys, oldest first. */
const monthKeys = (months) => {
  const keys = [];
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);
  cursor.setMonth(cursor.getMonth() - (months - 1));

  for (let i = 0; i < months; i++) {
    keys.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys;
};

/**
 * A monthly series with zero-filled gaps.
 *
 * Without the zero-fill a month in which nobody signed up simply vanishes, and
 * a line chart then draws a straight line across it — which reads as steady
 * activity rather than as none.
 */
const monthlySeries = async (Model, dateField, months, match = {}) => {
  const since = new Date();
  since.setDate(1);
  since.setHours(0, 0, 0, 0);
  since.setMonth(since.getMonth() - (months - 1));

  const rows = await Model.aggregate([
    { $match: { ...match, [dateField]: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: `$${dateField}` } },
        count: { $sum: 1 },
      },
    },
  ]);

  const byKey = new Map(rows.map((r) => [r._id, r.count]));
  return monthKeys(months).map((key) => ({ month: key, count: byKey.get(key) ?? 0 }));
};

export const adminService = {
  /** Headline counts, one round trip. */
  async overview() {
    const [
      students,
      counsellors,
      admins,
      applications,
      appointments,
      documents,
      pendingDocuments,
      courses,
      universities,
      countries,
      scholarships,
      enquiries,
      unassigned,
      offers,
    ] = await Promise.all([
      User.countDocuments({ role: ROLES.STUDENT }),
      User.countDocuments({ role: ROLES.COUNSELLOR }),
      User.countDocuments({ role: ROLES.ADMIN }),
      Application.countDocuments(),
      Appointment.countDocuments(),
      Document.countDocuments(),
      Document.countDocuments({ status: { $in: [DOCUMENT_STATUS.UPLOADED, DOCUMENT_STATUS.UNDER_REVIEW] } }),
      Course.countDocuments({ isActive: true }),
      University.countDocuments(),
      Country.countDocuments(),
      Scholarship.countDocuments({ isActive: true }),
      Enquiry.countDocuments(),
      // Students on nobody's caseload. This is the number that turns the
      // dashboard into a worklist rather than a scoreboard.
      (async () => {
        const assigned = await Counsellor.distinct('assignedStudents');
        return User.countDocuments({ role: ROLES.STUDENT, _id: { $nin: assigned } });
      })(),
      Application.countDocuments({ status: 'offer_received' }),
    ]);

    return {
      students,
      counsellors,
      admins,
      applications,
      appointments,
      documents,
      pendingDocuments,
      courses,
      universities,
      countries,
      scholarships,
      enquiries,
      unassignedStudents: unassigned,
      offers,
      // Reported as a ratio, not a percentage string: formatting is the client's
      // job and a number survives being charted.
      offerRate: applications > 0 ? offers / applications : 0,
    };
  },

  /** The six visuals on the admin home. */
  async charts({ months = 6 } = {}) {
    const [signups, applicationsOverTime, applicationsByStatus, studentsByDestination, coursesByDegree, appointmentsByType] =
      await Promise.all([
        monthlySeries(User, 'createdAt', months, { role: ROLES.STUDENT }),
        monthlySeries(Application, 'createdAt', months),
        countBy(Application, 'status'),
        (async () => {
          // Destinations is an array, so it needs unwinding before grouping —
          // grouping on the array itself would key on the whole list.
          const rows = await StudentProfile.aggregate([
            { $unwind: '$destinations' },
            { $group: { _id: '$destinations', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 8 },
          ]);
          return rows.map((r) => ({ code: r._id, count: r.count }));
        })(),
        countBy(Course, 'degreeLevel', { isActive: true }),
        countBy(Appointment, 'type'),
      ]);

    return {
      signups,
      applicationsOverTime,
      // Zero-filled across the full enum so the chart's categories are stable
      // between renders rather than appearing as data arrives.
      applicationsByStatus: APPLICATION_STATUS_VALUES.map((status) => ({
        status,
        count: applicationsByStatus[status] ?? 0,
      })),
      studentsByDestination,
      coursesByDegree: Object.entries(coursesByDegree).map(([degreeLevel, count]) => ({ degreeLevel, count })),
      appointmentsByType: Object.entries(appointmentsByType).map(([type, count]) => ({ type, count })),
    };
  },

  /**
   * The student table: search, filter, sort, paginate.
   *
   * Filtering happens in Mongo, not in Node. The CSV export below reuses this
   * exact method precisely so that "export" always means "export what I am
   * looking at" — a second query would drift from the table it claims to mirror.
   */
  async students({ search, assigned, counsellorId, sort = '-createdAt', page = 1, limit = 20 } = {}) {
    const filter = { role: ROLES.STUDENT };

    if (search) {
      // Escaped: an unescaped search box is a regex injection, and a stray '('
      // from a student typing a phone number would throw rather than find.
      const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(safe, 'i');
      filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
    }

    // Caseload membership lives on Counsellor, so it has to be resolved to ids
    // before it can filter Users.
    if (assigned === true || assigned === false || counsellorId) {
      const ids = counsellorId
        ? ((await Counsellor.findOne({ user: counsellorId }).select('assignedStudents').lean())?.assignedStudents ?? [])
        : await Counsellor.distinct('assignedStudents');

      if (counsellorId) filter._id = { $in: ids };
      else filter._id = assigned ? { $in: ids } : { $nin: ids };
    }

    const allowedSorts = new Set(['createdAt', '-createdAt', 'name', '-name', 'lastLogin', '-lastLogin']);
    const sortSpec = allowedSorts.has(sort) ? sort : '-createdAt';

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name email phone avatar isVerified isActive createdAt lastLogin')
        .sort(sortSpec)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const ids = users.map((u) => u._id);
    const [profiles, apps, counsellorRows] = await Promise.all([
      StudentProfile.find({ user: { $in: ids } }).lean(),
      Application.aggregate([{ $match: { student: { $in: ids } } }, { $group: { _id: '$student', total: { $sum: 1 } } }]),
      Counsellor.find({ assignedStudents: { $in: ids } })
        .select('user assignedStudents')
        .populate('user', 'name')
        .lean(),
    ]);

    const profileBy = new Map(profiles.map((p) => [p.user.toString(), p]));
    const appsBy = new Map(apps.map((a) => [a._id.toString(), a.total]));

    const counsellorBy = new Map();
    for (const row of counsellorRows) {
      for (const studentId of row.assignedStudents) {
        counsellorBy.set(studentId.toString(), { _id: row.user?._id, name: row.user?.name ?? 'Counsellor' });
      }
    }

    const items = users.map((user) => {
      const id = user._id.toString();
      const profile = profileBy.get(id);
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? '',
        avatar: user.avatar,
        isVerified: user.isVerified,
        isActive: user.isActive,
        joinedAt: user.createdAt,
        lastLogin: user.lastLogin ?? null,
        educationLevel: profile?.education?.level ?? null,
        degreeGoal: profile?.goal?.degreeLevel ?? null,
        destinations: profile?.destinations ?? [],
        budgetInr: profile?.budget?.annualInr ?? null,
        completionPercent: profile ? completionOf(profile).percent : 0,
        applications: appsBy.get(id) ?? 0,
        counsellor: counsellorBy.get(id) ?? null,
      };
    });

    return { items, total, page, limit };
  },

  /**
   * The same rows the table is showing, as CSV.
   *
   * `limit` is raised rather than removed: an unbounded export is a way to run
   * the server out of memory from a query string.
   */
  async studentsCsv(query = {}) {
    const { items } = await this.students({ ...query, page: 1, limit: 5000 });

    const columns = [
      ['Name', (s) => s.name],
      ['Email', (s) => s.email],
      ['Phone', (s) => s.phone],
      ['Verified', (s) => (s.isVerified ? 'yes' : 'no')],
      ['Joined', (s) => new Date(s.joinedAt).toISOString().slice(0, 10)],
      ['Last login', (s) => (s.lastLogin ? new Date(s.lastLogin).toISOString().slice(0, 10) : '')],
      ['Education', (s) => s.educationLevel ?? ''],
      ['Goal', (s) => s.degreeGoal ?? ''],
      ['Destinations', (s) => s.destinations.join(' ')],
      ['Budget INR', (s) => (s.budgetInr == null ? '' : String(s.budgetInr))],
      ['Profile %', (s) => String(s.completionPercent)],
      ['Applications', (s) => String(s.applications)],
      ['Counsellor', (s) => s.counsellor?.name ?? ''],
    ];

    /**
     * Quotes every field unconditionally and prefixes anything a spreadsheet
     * would evaluate.
     *
     * A student named `=cmd|...` is a CSV injection: Excel treats a leading
     * `=`, `+`, `-` or `@` as a formula. Prefixing a single quote makes it text
     * without changing what a human reads.
     */
    const cell = (value) => {
      const text = String(value ?? '');
      const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
      return `"${guarded.replace(/"/g, '""')}"`;
    };

    const lines = [columns.map(([header]) => cell(header)).join(',')];
    for (const student of items) lines.push(columns.map(([, read]) => cell(read(student))).join(','));

    // CRLF and a BOM: Excel on Windows misreads UTF-8 without one, which turns
    // every non-ASCII name in the export into mojibake.
    return '﻿' + lines.join('\r\n') + '\r\n';
  },

  /**
   * Creates a counsellor login and its profile together.
   *
   * `User.create()` rather than a query-level write, because password hashing
   * lives in a pre-save hook that insertMany/updateOne bypass entirely — seeding
   * a counsellor through those would store the password in plaintext and every
   * login would then fail against a bcrypt comparison.
   *
   * Created pre-verified: the verification email goes to an address the admin
   * just typed, and a counsellor who cannot log in until they click a link the
   * admin never sees is a support ticket, not a security control.
   *
   * The profile is created in the same call. A counsellor with no availability
   * cannot be booked, so defaults matter — an empty profile would look like a
   * broken feature rather than an unconfigured one.
   */
  async createCounsellor({ name, email, password, phone, ...profile }) {
    const existing = await User.findOne({ email });
    if (existing) {
      throw ApiError.conflict('An account with that email already exists', {
        errors: { email: 'Already in use' },
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: phone ?? '',
      role: ROLES.COUNSELLOR,
      isVerified: true,
    });

    let counsellor;
    try {
      counsellor = await Counsellor.create({
        user: user._id,
        title: profile.title || 'Education Counsellor',
        bio: profile.bio ?? '',
        experienceYears: profile.experienceYears ?? 0,
        countries: profile.countries ?? [],
        fields: profile.fields ?? [],
        languages: profile.languages?.length ? profile.languages : ['English'],
        slotMinutes: profile.slotMinutes ?? 30,
        isAcceptingStudents: profile.isAcceptingStudents ?? true,
        // Mon–Fri 10:00–17:00 unless told otherwise, so the account is bookable
        // the moment it exists.
        availability:
          profile.availability?.length
            ? profile.availability
            : [1, 2, 3, 4, 5].map((dayOfWeek) => ({ dayOfWeek, startMinute: 10 * 60, endMinute: 17 * 60 })),
      });
    } catch (error) {
      // Without this the login exists with no profile: it would authenticate,
      // then 500 or silently self-create a default profile on first access.
      await user.deleteOne();
      throw error;
    }

    return {
      _id: counsellor._id,
      userId: user._id,
      name: user.name,
      email: user.email,
      title: counsellor.title,
      experienceYears: counsellor.experienceYears,
      countries: counsellor.countries,
      fields: counsellor.fields,
      caseload: 0,
      isAcceptingStudents: counsellor.isAcceptingStudents,
      isActive: counsellor.isActive,
    };
  },

  /** Counsellors, with live caseload sizes. */
  async counsellors() {
    const rows = await Counsellor.find().populate('user', 'name email avatar isActive').lean();

    return rows
      .filter((row) => row.user)
      .map((row) => ({
        _id: row._id,
        userId: row.user._id,
        name: row.user.name,
        email: row.user.email,
        avatar: row.user.avatar,
        title: row.title,
        experienceYears: row.experienceYears,
        countries: row.countries,
        fields: row.fields,
        caseload: row.assignedStudents?.length ?? 0,
        isAcceptingStudents: row.isAcceptingStudents,
        isActive: row.isActive,
      }))
      .sort((a, b) => b.caseload - a.caseload);
  },

  /**
   * Moves a student onto a counsellor's caseload, or off every caseload.
   *
   * Written as a pull-from-all followed by one add, so a student can never end
   * up on two caseloads. "Who is my counsellor" has to have exactly one answer.
   */
  async assignCounsellor(studentId, counsellorUserId) {
    const student = await User.findOne({ _id: studentId, role: ROLES.STUDENT });
    if (!student) throw ApiError.notFound('Student not found');

    await Counsellor.updateMany({ assignedStudents: studentId }, { $pull: { assignedStudents: studentId } });

    if (!counsellorUserId) return { studentId, counsellor: null };

    const counsellor = await Counsellor.findOne({ user: counsellorUserId });
    if (!counsellor) throw ApiError.notFound('Counsellor not found');

    counsellor.assignedStudents.push(student._id);
    await counsellor.save();

    return { studentId, counsellor: { _id: counsellorUserId, caseload: counsellor.assignedStudents.length } };
  },

  /** Deactivates or restores a login without deleting the history behind it. */
  async setStudentActive(studentId, isActive) {
    const student = await User.findOneAndUpdate(
      { _id: studentId, role: ROLES.STUDENT },
      { isActive },
      { new: true }
    ).select('name email isActive');

    if (!student) throw ApiError.notFound('Student not found');
    return student.toJSON();
  },

  /** Contact-form submissions, newest first. */
  async enquiries({ page = 1, limit = 20 } = {}) {
    const [items, total] = await Promise.all([
      Enquiry.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Enquiry.countDocuments(),
    ]);
    return { items, total, page, limit };
  },
};

export default adminService;
