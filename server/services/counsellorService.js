import Counsellor from '../models/Counsellor.js';
import StudentProfile from '../models/StudentProfile.js';
import Application from '../models/Application.js';
import Document from '../models/Document.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { DOCUMENT_STATUS } from '../constants/index.js';
import { completionOf } from './profileService.js';

/**
 * The counsellor's own caseload.
 *
 * Every read here is scoped to `assignedStudents`. There is no route that takes
 * an arbitrary student id, so a counsellor cannot reach a student who is not
 * theirs by editing a URL — the boundary is the data, not a check someone might
 * forget to write.
 */

/** The counsellor profile for a signed-in counsellor, created on first access. */
export async function getOrCreateProfile(userId) {
  const existing = await Counsellor.findOne({ user: userId });
  if (existing) return existing;

  // Sensible defaults rather than an empty profile: a counsellor with no
  // availability cannot be booked, which would look like a broken feature.
  return Counsellor.create({
    user: userId,
    availability: [1, 2, 3, 4, 5].map((dayOfWeek) => ({ dayOfWeek, startMinute: 10 * 60, endMinute: 18 * 60 })),
  });
}

const assignedIds = async (userId) => {
  const profile = await getOrCreateProfile(userId);
  return { profile, ids: profile.assignedStudents };
};

export const counsellorService = {
  getOrCreateProfile,

  /**
   * The dashboard: what needs attention, not just what exists.
   *
   * Counts are computed in Mongo rather than by loading documents and filtering
   * in Node, because a caseload of two hundred students should not mean two
   * hundred documents crossing the wire to produce five numbers.
   */
  async dashboard(userId) {
    const { profile, ids } = await assignedIds(userId);

    const [studentCount, docsPending, appsByStatus, upcoming] = await Promise.all([
      ids.length,
      Document.countDocuments({
        student: { $in: ids },
        status: { $in: [DOCUMENT_STATUS.UPLOADED, DOCUMENT_STATUS.UNDER_REVIEW] },
      }),
      Application.aggregate([
        { $match: { student: { $in: ids } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Appointment.find({ counsellor: userId, startsAt: { $gte: new Date() }, status: { $in: ['requested', 'confirmed'] } })
        .sort({ startsAt: 1 })
        .limit(5)
        .populate('student', 'name avatar')
        .lean(),
    ]);

    const byStatus = Object.fromEntries(appsByStatus.map(({ _id, count }) => [_id, count]));

    return {
      profile: {
        title: profile.title,
        experienceYears: profile.experienceYears,
        countries: profile.countries,
        isAcceptingStudents: profile.isAcceptingStudents,
        slotMinutes: profile.slotMinutes,
        availability: profile.availability,
      },
      stats: {
        students: studentCount,
        documentsAwaitingReview: docsPending,
        applications: Object.values(byStatus).reduce((a, b) => a + b, 0),
        offers: byStatus.offer_received ?? 0,
        inReview: (byStatus.submitted ?? 0) + (byStatus.under_review ?? 0),
        pendingRequests: upcoming.filter((a) => a.status === 'requested').length,
      },
      upcomingAppointments: upcoming,
    };
  },

  /** Assigned students with the few figures a counsellor triages on. */
  async students(userId) {
    const { ids } = await assignedIds(userId);
    if (!ids.length) return [];

    const [users, profiles, apps, docs] = await Promise.all([
      User.find({ _id: { $in: ids } }).select('name email avatar createdAt lastLogin').lean(),
      StudentProfile.find({ user: { $in: ids } }).lean(),
      Application.aggregate([
        { $match: { student: { $in: ids } } },
        { $group: { _id: '$student', total: { $sum: 1 } } },
      ]),
      Document.aggregate([
        { $match: { student: { $in: ids }, status: { $in: [DOCUMENT_STATUS.UPLOADED, DOCUMENT_STATUS.UNDER_REVIEW] } } },
        { $group: { _id: '$student', pending: { $sum: 1 } } },
      ]),
    ]);

    const profileBy = new Map(profiles.map((p) => [p.user.toString(), p]));
    const appsBy = new Map(apps.map((a) => [a._id.toString(), a.total]));
    const docsBy = new Map(docs.map((d) => [d._id.toString(), d.pending]));

    return users
      .map((user) => {
        const id = user._id.toString();
        const profile = profileBy.get(id);
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          joinedAt: user.createdAt,
          lastLogin: user.lastLogin,
          educationLevel: profile?.education?.level ?? null,
          // Computed, not stored: `completion` is derived state and the model has
          // no such field, so reading one would silently report every student as
          // 0% and make the worklist sort below a no-op.
          completionPercent: profile ? completionOf(profile).percent : 0,
          destinations: profile?.destinations ?? [],
          applications: appsBy.get(id) ?? 0,
          documentsAwaitingReview: docsBy.get(id) ?? 0,
        };
      })
      // Students needing something come first — the list is a worklist, not a
      // directory, so ordering it by name would bury the ones who are blocked.
      .sort((a, b) => b.documentsAwaitingReview - a.documentsAwaitingReview || a.completionPercent - b.completionPercent);
  },

  /**
   * One student's full picture.
   *
   * Refuses outright unless the student is on this counsellor's caseload, so the
   * id in the URL grants nothing on its own.
   */
  async student(userId, studentId) {
    const { ids } = await assignedIds(userId);
    if (!ids.some((id) => id.toString() === studentId.toString())) {
      throw ApiError.forbidden('That student is not assigned to you');
    }

    const [user, profile, applications, documents, appointments] = await Promise.all([
      User.findById(studentId).select('name email phone avatar createdAt lastLogin').lean(),
      StudentProfile.findOne({ user: studentId }).lean(),
      Application.find({ student: studentId }).sort({ updatedAt: -1 }).lean(),
      Document.find({ student: studentId }).sort({ type: 1 }).lean(),
      Appointment.find({ student: studentId, counsellor: userId }).sort({ startsAt: -1 }).limit(20).lean(),
    ]);

    if (!user) throw ApiError.notFound('Student not found');

    return {
      student: user,
      profile,
      completion: profile ? completionOf(profile) : { percent: 0, items: [], missing: [] },
      applications,
      documents,
      appointments,
    };
  },

  /** Documents across the caseload that need a decision. */
  async reviewQueue(userId) {
    const { ids } = await assignedIds(userId);
    if (!ids.length) return [];

    const docs = await Document.find({
      student: { $in: ids },
      status: { $in: [DOCUMENT_STATUS.UPLOADED, DOCUMENT_STATUS.UNDER_REVIEW] },
    })
      .sort({ updatedAt: 1 })
      .populate('student', 'name avatar')
      .lean();

    return docs;
  },

  /** Working hours and whether new students are being taken on. */
  async updateProfile(userId, patch) {
    const profile = await getOrCreateProfile(userId);

    for (const key of ['title', 'bio', 'experienceYears', 'countries', 'fields', 'languages', 'slotMinutes', 'isAcceptingStudents', 'availability']) {
      if (patch[key] !== undefined) profile[key] = patch[key];
    }

    await profile.save();
    return profile.toJSON();
  },
};

export default counsellorService;
