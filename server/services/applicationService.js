import Application from '../models/Application.js';
import Course from '../models/Course.js';
import Country from '../models/Country.js';
import Counsellor from '../models/Counsellor.js';
import ApiError from '../utils/ApiError.js';
import {
  APPLICATION_STATUS,
  APPLICATION_STATUS_LABELS,
  APPLICATION_TRANSITIONS,
  APPLICATION_STAGES,
  ROLES,
  canTransition,
  STUDENT_SETTABLE_STATUSES,
} from '../constants/index.js';

/**
 * Applications: creation, the status machine, and the timeline.
 *
 * The status machine lives here rather than in the model so that "who is allowed
 * to make this transition" sits next to "is this transition legal at all" — both
 * are business rules, and splitting them across layers is how one gets enforced
 * and the other quietly does not.
 */

/** Whole-programme cost, matching catalogueService so the two never disagree. */
const programmeCost = (course, country) =>
  Math.round(((course.tuitionPerYearInr ?? 0) + (country?.livingCostPerYearInr ?? 0)) * (course.durationMonths / 12));

/**
 * Strips counsellor-private notes for student-facing reads.
 *
 * Applied server-side on every read path. A student must never receive a private
 * note in a payload, regardless of what the client would have done with it.
 */
const forAudience = (application, role) => {
  const plain = application.toJSON ? application.toJSON() : application;
  if (role === ROLES.STUDENT) {
    return { ...plain, notes: (plain.notes ?? []).filter((note) => !note.isPrivate) };
  }
  return plain;
};

/** Maps status history onto the fixed stage list the UI renders. */
const buildStages = (application) => {
  const reached = new Set(application.timeline.map((entry) => entry.status));
  const status = application.status;

  const stageState = {
    created: 'complete',
    documents: reached.has(APPLICATION_STATUS.READY_TO_APPLY) || reached.has(APPLICATION_STATUS.SUBMITTED)
      ? 'complete'
      : status === APPLICATION_STATUS.DOCUMENTS_PENDING
        ? 'current'
        : 'pending',
    submitted: reached.has(APPLICATION_STATUS.SUBMITTED) ? 'complete' : status === APPLICATION_STATUS.READY_TO_APPLY ? 'current' : 'pending',
    review: reached.has(APPLICATION_STATUS.OFFER_RECEIVED) || reached.has(APPLICATION_STATUS.REJECTED)
      ? 'complete'
      : status === APPLICATION_STATUS.UNDER_REVIEW
        ? 'current'
        : 'pending',
    decision:
      status === APPLICATION_STATUS.OFFER_RECEIVED
        ? 'complete'
        : status === APPLICATION_STATUS.REJECTED
          ? 'rejected'
          : 'pending',
  };

  return APPLICATION_STAGES.map((stage) => ({ ...stage, state: stageState[stage.key] ?? 'pending' }));
};

/**
 * Refuses unless the caller is entitled to this application.
 *
 * - student: must own it
 * - counsellor: the student must be on their caseload *now*, not when the
 *   application was created
 * - admin: always
 *
 * Shared by the read and both write paths deliberately. The two writes
 * previously checked only students, which let any counsellor transition any
 * application in the system.
 */
async function assertCanAccess(application, { userId, role }) {
  if (role === ROLES.ADMIN) return;

  if (role === ROLES.STUDENT) {
    if (application.student.toString() !== userId.toString()) {
      throw ApiError.forbidden('That application is not yours');
    }
    return;
  }

  if (role === ROLES.COUNSELLOR) {
    // Imported lazily: counsellorService imports profileService, which keeps the
    // module graph acyclic at load time.
    const { counsellorService } = await import('./counsellorService.js');
    await counsellorService.assertOnCaseload(userId, application.student.toString());
    return;
  }

  throw ApiError.forbidden('That application is not yours');
}

export const applicationService = {
  /**
   * Starts an application for a course.
   *
   * Opens in `draft` rather than `submitted`: applying is a process with
   * documents attached to it, and a one-click "submitted" would be a lie the
   * student discovers only when a university never replies.
   */
  async create({ studentId, courseSlug, intake, matchScore, actor }) {
    const course = await Course.findOne({ slug: courseSlug, isActive: true }).populate('university', 'name').lean();
    if (!course) throw ApiError.notFound('That course could not be found');

    const existing = await Application.findOne({ student: studentId, course: course._id });
    if (existing) {
      throw ApiError.conflict('There is already an application for this course', {
        errors: { course: 'Application already exists' },
      });
    }

    const country = await Country.findOne({ code: course.countryCode }).lean();
    const startedBy = actor?.role === ROLES.COUNSELLOR ? ROLES.COUNSELLOR : ROLES.STUDENT;

    // Denormalised for the counsellor's own queries and for documentService's
    // "is this counsellor involved" check. Authorization does NOT read this
    // field — assertCanAccess uses the live caseload — so a stale stamp after a
    // reassignment is a cosmetic inaccuracy rather than an access bug.
    const owningCounsellor = await Counsellor.findOne({ assignedStudents: studentId }).select('user').lean();

    const application = await Application.create({
      student: studentId,
      counsellor: owningCounsellor?.user ?? null,
      course: course._id,
      university: course.university?._id ?? null,
      snapshot: {
        courseTitle: course.title,
        universityName: course.universityName,
        countryCode: course.countryCode,
        countryName: country?.name ?? '',
        city: course.city,
        degreeLevel: course.degreeLevel,
        field: course.field,
        durationMonths: course.durationMonths,
        tuitionPerYearInr: course.tuitionPerYearInr,
        programmeCostInr: programmeCost(course, country),
        minIelts: course.requirements?.minIelts ?? null,
        courseSlug: course.slug,
        matchScoreAtApply: matchScore ?? null,
      },
      intake: { season: intake?.season ?? '', year: intake?.year ?? null },
      status: APPLICATION_STATUS.DRAFT,
      timeline: [
        {
          status: APPLICATION_STATUS.DRAFT,
          note: startedBy === ROLES.COUNSELLOR ? 'Application started by your counsellor' : 'Application started',
          actor: startedBy,
          actorId: actor?.userId ?? studentId,
        },
      ],
    });

    // Audience follows the caller, not the owner: a counsellor gets their own
    // view of the record they just created, private notes included.
    return forAudience(application, startedBy);
  },

  async listForStudent(studentId, { status } = {}) {
    const applications = await Application.find({
      student: studentId,
      ...(status ? { status } : {}),
    })
      .sort({ updatedAt: -1 })
      .lean();

    return applications.map((application) => ({
      ...forAudience(application, ROLES.STUDENT),
      statusLabel: APPLICATION_STATUS_LABELS[application.status],
    }));
  },

  /**
   * One application, with its rendered timeline and the transitions the caller
   * is actually allowed to make next.
   *
   * Returning `availableTransitions` means the client renders exactly the buttons
   * the server will honour, instead of guessing the rules a second time and
   * drifting out of sync with them.
   */
  async getById(id, { userId, role }) {
    const application = await Application.findById(id);
    if (!application) throw ApiError.notFound('Application not found');

    await assertCanAccess(application, { userId, role });

    const allowed = APPLICATION_TRANSITIONS[application.status] ?? [];
    const availableTransitions = (role === ROLES.STUDENT
      ? allowed.filter((next) => STUDENT_SETTABLE_STATUSES.includes(next))
      : allowed
    ).map((next) => ({ status: next, label: APPLICATION_STATUS_LABELS[next] }));

    return {
      ...forAudience(application, role),
      statusLabel: APPLICATION_STATUS_LABELS[application.status],
      stages: buildStages(application),
      availableTransitions,
    };
  },

  /**
   * Moves an application to a new status.
   *
   * Two separate checks, because they fail for different reasons and deserve
   * different messages: is the transition legal at all, and is this role allowed
   * to make it. A student cannot mark their own application `offer_received` —
   * that is a university outcome, not a self-assessment.
   */
  async transition(id, { status, note }, { userId, role }) {
    const application = await Application.findById(id);
    if (!application) throw ApiError.notFound('Application not found');

    await assertCanAccess(application, { userId, role });

    if (application.status === status) {
      throw ApiError.badRequest(`This application is already ${APPLICATION_STATUS_LABELS[status]}`);
    }

    if (!canTransition(application.status, status)) {
      throw ApiError.badRequest(
        `Cannot move from ${APPLICATION_STATUS_LABELS[application.status]} to ${APPLICATION_STATUS_LABELS[status]}`,
        { errors: { status: 'Illegal status transition' } }
      );
    }

    if (role === ROLES.STUDENT && !STUDENT_SETTABLE_STATUSES.includes(status)) {
      throw ApiError.forbidden(`Only a counsellor can record "${APPLICATION_STATUS_LABELS[status]}"`);
    }

    application.status = status;
    application.timeline.push({ status, note: note ?? '', actor: role, actorId: userId });

    if (status === APPLICATION_STATUS.SUBMITTED && !application.submittedAt) {
      application.submittedAt = new Date();
    }
    if (status === APPLICATION_STATUS.OFFER_RECEIVED) {
      application.decision = { outcome: 'offer', at: new Date(), note: note ?? '' };
    }
    if (status === APPLICATION_STATUS.REJECTED) {
      application.decision = { outcome: 'rejection', at: new Date(), note: note ?? '' };
    }

    await application.save();
    return this.getById(id, { userId, role });
  },

  async addNote(id, { body, isPrivate }, { userId, role, name }) {
    const application = await Application.findById(id);
    if (!application) throw ApiError.notFound('Application not found');

    await assertCanAccess(application, { userId, role });

    application.notes.push({
      body,
      author: userId,
      authorName: name ?? '',
      // Only staff can write a private note; a student flagging their own note
      // private would hide it from the counsellor who needs to read it.
      isPrivate: role === ROLES.STUDENT ? false : Boolean(isPrivate),
    });

    await application.save();
    return this.getById(id, { userId, role });
  },

  /** Counts by status, for the dashboard and the portal badges. */
  async statsForStudent(studentId) {
    const rows = await Application.aggregate([
      { $match: { student: studentId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const byStatus = Object.fromEntries(rows.map(({ _id, count }) => [_id, count]));
    return {
      total: rows.reduce((sum, row) => sum + row.count, 0),
      byStatus,
      active: (byStatus.draft ?? 0) + (byStatus.documents_pending ?? 0) + (byStatus.ready_to_apply ?? 0),
      inProgress: (byStatus.submitted ?? 0) + (byStatus.under_review ?? 0),
      offers: byStatus.offer_received ?? 0,
    };
  },
};

export default applicationService;
