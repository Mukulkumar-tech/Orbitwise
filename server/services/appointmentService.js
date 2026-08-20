import Appointment from '../models/Appointment.js';
import Counsellor from '../models/Counsellor.js';
import ApiError from '../utils/ApiError.js';
import { ROLES } from '../constants/index.js';

/**
 * Appointment booking.
 *
 * This file exists for one rule: a counsellor cannot be in two places at once.
 * Everything else — slot generation, cancellation, status changes — is
 * bookkeeping around that constraint.
 */

const MINUTE = 60_000;

/** Statuses that still occupy the calendar. A cancelled slot is free again. */
const BLOCKING = ['requested', 'confirmed'];

/** Minutes from midnight, in the server timezone. */
const minutesOf = (date) => date.getHours() * 60 + date.getMinutes();

/**
 * True when the interval sits inside a published working window.
 *
 * Checked separately from the conflict query, because "outside working hours" and
 * "already booked" are different problems and the student deserves to know which
 * one they hit.
 */
const withinAvailability = (counsellor, startsAt, endsAt) => {
  const windows = counsellor.availability.filter((w) => w.dayOfWeek === startsAt.getDay());
  if (!windows.length) return false;

  const start = minutesOf(startsAt);
  const end = minutesOf(endsAt);
  // A booking running past midnight is rejected rather than silently wrapping:
  // once end < start the interval arithmetic stops being meaningful.
  if (end <= start) return false;

  return windows.some((w) => start >= w.startMinute && end <= w.endMinute);
};

/**
 * Finds any live appointment overlapping the interval.
 *
 * Standard interval overlap — two intervals collide when each starts before the
 * other ends. Comparing only start times, the tempting shortcut, misses a long
 * appointment that swallows a shorter one entirely.
 */
const findConflict = (counsellorId, startsAt, endsAt, excludeId = null) =>
  Appointment.findOne({
    counsellor: counsellorId,
    status: { $in: BLOCKING },
    startsAt: { $lt: endsAt },
    endsAt: { $gt: startsAt },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).lean();

export const appointmentService = {
  /** Counsellors a student can book, with enough detail to choose between them. */
  async listCounsellors() {
    const counsellors = await Counsellor.find({ isActive: true, isAcceptingStudents: true })
      .populate('user', 'name avatar')
      .select('-assignedStudents')
      .lean();

    return counsellors.map((c) => ({
      _id: c._id,
      userId: c.user?._id,
      name: c.user?.name ?? 'Counsellor',
      avatar: c.user?.avatar ?? '',
      title: c.title,
      bio: c.bio,
      experienceYears: c.experienceYears,
      countries: c.countries,
      fields: c.fields,
      languages: c.languages,
      slotMinutes: c.slotMinutes,
    }));
  },

  /**
   * Bookable slots for one counsellor on one day.
   *
   * Generated from published availability then filtered against existing
   * bookings, so the client never offers a slot the booking call would reject.
   */
  async availableSlots(counsellorUserId, dateString) {
    const counsellor = await Counsellor.findOne({ user: counsellorUserId, isActive: true }).lean();
    if (!counsellor) throw ApiError.notFound('Counsellor not found');

    const day = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(day.getTime())) throw ApiError.badRequest('Invalid date');

    const windows = counsellor.availability.filter((w) => w.dayOfWeek === day.getDay());
    if (!windows.length) return { date: dateString, slotMinutes: counsellor.slotMinutes, slots: [] };

    const dayStart = new Date(day);
    const dayEnd = new Date(day.getTime() + 24 * 60 * MINUTE);

    const booked = await Appointment.find({
      counsellor: counsellorUserId,
      status: { $in: BLOCKING },
      startsAt: { $gte: dayStart, $lt: dayEnd },
    })
      .select('startsAt endsAt')
      .lean();

    const slots = [];
    const now = Date.now();

    for (const window of windows) {
      for (let m = window.startMinute; m + counsellor.slotMinutes <= window.endMinute; m += counsellor.slotMinutes) {
        const startsAt = new Date(day.getTime() + m * MINUTE);
        const endsAt = new Date(startsAt.getTime() + counsellor.slotMinutes * MINUTE);

        // A past slot is not bookable, so offering it would only produce an error
        // the student cannot act on.
        if (startsAt.getTime() <= now) continue;

        const taken = booked.some((b) => startsAt < b.endsAt && endsAt > b.startsAt);
        if (!taken) slots.push({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() });
      }
    }

    return { date: dateString, slotMinutes: counsellor.slotMinutes, slots };
  },

  /**
   * Books a slot.
   *
   * A clash returns 409, not 400: the request was well-formed and the student did
   * nothing wrong — the resource is simply taken, which is what Conflict means.
   */
  async book({ studentId, counsellorUserId, type, startsAt, mode, agenda }) {
    const counsellor = await Counsellor.findOne({ user: counsellorUserId, isActive: true });
    if (!counsellor) throw ApiError.notFound('Counsellor not found');
    if (!counsellor.isAcceptingStudents) {
      throw ApiError.badRequest('This counsellor is not accepting new bookings');
    }

    const start = new Date(startsAt);
    if (Number.isNaN(start.getTime())) throw ApiError.badRequest('Invalid start time');
    if (start.getTime() <= Date.now()) throw ApiError.badRequest('Choose a time in the future');

    const end = new Date(start.getTime() + counsellor.slotMinutes * MINUTE);

    if (!withinAvailability(counsellor, start, end)) {
      throw ApiError.badRequest('That time is outside this counsellor’s working hours');
    }

    const clash = await findConflict(counsellorUserId, start, end);
    if (clash) {
      throw ApiError.conflict('That slot has just been taken. Pick another time.', {
        errors: { startsAt: 'Already booked' },
      });
    }

    // A student holding two overlapping sessions is a mistake, not a feature.
    const ownClash = await Appointment.findOne({
      student: studentId,
      status: { $in: BLOCKING },
      startsAt: { $lt: end },
      endsAt: { $gt: start },
    }).lean();
    if (ownClash) throw ApiError.conflict('You already have an appointment at that time');

    const appointment = await Appointment.create({
      student: studentId,
      counsellor: counsellorUserId,
      type,
      startsAt: start,
      endsAt: end,
      mode: mode ?? 'video',
      agenda: agenda ?? '',
      status: 'requested',
    });

    // Booking is also how a student acquires a counsellor: the first session
    // creates the relationship the rest of the portal depends on.
    if (!counsellor.assignedStudents.some((id) => id.toString() === studentId.toString())) {
      counsellor.assignedStudents.push(studentId);
      await counsellor.save();
    }

    return appointment.toJSON();
  },

  async listFor({ userId, role }, { upcoming } = {}) {
    const filter = role === ROLES.STUDENT ? { student: userId } : { counsellor: userId };
    if (upcoming) {
      filter.startsAt = { $gte: new Date() };
      filter.status = { $in: BLOCKING };
    }

    return Appointment.find(filter)
      .sort({ startsAt: upcoming ? 1 : -1 })
      .populate('student', 'name email avatar')
      .populate('counsellor', 'name avatar')
      .limit(100)
      .lean();
  },

  /** Loads an appointment the caller is a party to. */
  async authorize(id, { userId, role }) {
    const appointment = await Appointment.findById(id);
    if (!appointment) throw ApiError.notFound('Appointment not found');

    const isParty =
      appointment.student.toString() === userId.toString() ||
      appointment.counsellor.toString() === userId.toString();

    if (!isParty && role !== ROLES.ADMIN) throw ApiError.forbidden('That appointment is not yours');
    return appointment;
  },

  /**
   * Status changes, split by who is asking.
   *
   * Confirming and completing are the counsellor's calls — a student marking
   * their own session completed would be recording something that may not have
   * happened. Cancelling is open to both, since either party can withdraw.
   */
  async setStatus(id, { status, reason, outcome }, actor) {
    const appointment = await this.authorize(id, actor);

    // Terminal state is checked before the role rule. A cancelled appointment
    // cannot be changed by anyone, so answering "only a counsellor can do that"
    // would name a restriction that is not the real obstacle.
    if (['completed', 'cancelled', 'no_show'].includes(appointment.status)) {
      throw ApiError.badRequest(`This appointment is already ${appointment.status}`);
    }

    if (['completed', 'no_show', 'confirmed'].includes(status) && actor.role === ROLES.STUDENT) {
      throw ApiError.forbidden(`Only a counsellor can mark an appointment ${status.replace('_', ' ')}`);
    }

    if (status === 'cancelled') {
      appointment.cancelledBy = actor.role;
      appointment.cancelReason = reason ?? '';
    }
    if (status === 'completed' && outcome) appointment.outcome = outcome;

    appointment.status = status;
    await appointment.save();
    return appointment.toJSON();
  },

  /** Reschedules, re-running the same rules as a fresh booking. */
  async reschedule(id, { startsAt }, actor) {
    const appointment = await this.authorize(id, actor);
    if (!BLOCKING.includes(appointment.status)) {
      throw ApiError.badRequest('Only an upcoming appointment can be moved');
    }

    const counsellor = await Counsellor.findOne({ user: appointment.counsellor });
    const start = new Date(startsAt);
    if (Number.isNaN(start.getTime()) || start.getTime() <= Date.now()) {
      throw ApiError.badRequest('Choose a time in the future');
    }
    const end = new Date(start.getTime() + (counsellor?.slotMinutes ?? 30) * MINUTE);

    if (counsellor && !withinAvailability(counsellor, start, end)) {
      throw ApiError.badRequest('That time is outside this counsellor’s working hours');
    }

    // Excludes itself, or an appointment could never be nudged by ten minutes.
    const clash = await findConflict(appointment.counsellor, start, end, appointment._id);
    if (clash) throw ApiError.conflict('That slot is already booked');

    appointment.startsAt = start;
    appointment.endsAt = end;
    appointment.status = 'requested';
    await appointment.save();
    return appointment.toJSON();
  },
};

export { findConflict, withinAvailability };
export default appointmentService;
