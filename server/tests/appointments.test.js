import { beforeEach, describe, expect, it } from 'vitest';

import { agent, createUserWithRole, registerStudent } from './helpers.js';
import Counsellor from '../models/Counsellor.js';
import Appointment from '../models/Appointment.js';
import { ROLES } from '../constants/index.js';

let counsellor;
let counsellorToken;

/** Next occurrence of a weekday at a fixed hour, always in the future. */
const nextWeekdayAt = (hour) => {
  const d = new Date();
  d.setSeconds(0, 0);
  d.setDate(d.getDate() + 1);
  // Skip Sat/Sun: seeded availability is Mon–Fri, and a weekend slot would be
  // rejected for the right reason but make the test assert the wrong thing.
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  d.setHours(hour, 0, 0, 0);
  return d;
};

beforeEach(async () => {
  const created = await createUserWithRole(ROLES.COUNSELLOR);
  counsellor = created.user;
  counsellorToken = created.accessToken;

  await Counsellor.create({
    user: counsellor._id,
    slotMinutes: 30,
    availability: [1, 2, 3, 4, 5].map((dayOfWeek) => ({ dayOfWeek, startMinute: 10 * 60, endMinute: 17 * 60 })),
  });
});

const book = (token, startsAt, extra = {}) =>
  agent()
    .post('/api/appointments')
    .set('Authorization', `Bearer ${token}`)
    .send({ counsellorUserId: counsellor._id.toString(), type: 'counselling', startsAt: startsAt.toISOString(), ...extra });

describe('POST /api/appointments', () => {
  it('books a slot inside working hours', async () => {
    const { accessToken } = await registerStudent();
    const response = await book(accessToken, nextWeekdayAt(11));

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('requested');
    // The end time is stored, not derived on read, so overlap queries stay simple.
    expect(new Date(response.body.data.endsAt) - new Date(response.body.data.startsAt)).toBe(30 * 60_000);
  });

  it('assigns the student to the counsellor on first booking', async () => {
    const { user, accessToken } = await registerStudent();
    await book(accessToken, nextWeekdayAt(11)).expect?.(201);

    const profile = await Counsellor.findOne({ user: counsellor._id });
    expect(profile.assignedStudents.map(String)).toContain(String(user._id ?? user.id));
  });

  it('refuses a slot outside working hours', async () => {
    const { accessToken } = await registerStudent();
    const response = await book(accessToken, nextWeekdayAt(22));

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/working hours/i);
  });

  it('refuses a time in the past', async () => {
    const { accessToken } = await registerStudent();
    const response = await book(accessToken, new Date(Date.now() - 60_000));
    expect(response.status).toBe(400);
  });

  it('returns 409 when the counsellor is already booked', async () => {
    // 409 not 400: the request is well-formed and the student did nothing wrong,
    // the resource is simply taken.
    const first = await registerStudent();
    const second = await registerStudent();
    const slot = nextWeekdayAt(12);

    expect((await book(first.accessToken, slot)).status).toBe(201);

    const clash = await book(second.accessToken, slot);
    expect(clash.status).toBe(409);
    expect(clash.body.errors.startsAt).toBeTruthy();
  });

  it('detects an overlap that is not an exact start match', async () => {
    // The case a start-time-only comparison misses: 12:15 begins inside the
    // 12:00–12:30 booking without sharing its start.
    const first = await registerStudent();
    const second = await registerStudent();

    const noon = nextWeekdayAt(12);
    expect((await book(first.accessToken, noon)).status).toBe(201);

    const quarterPast = new Date(noon.getTime() + 15 * 60_000);
    expect((await book(second.accessToken, quarterPast)).status).toBe(409);
  });

  it('frees the slot again once cancelled', async () => {
    const first = await registerStudent();
    const second = await registerStudent();
    const slot = nextWeekdayAt(13);

    const booked = await book(first.accessToken, slot);
    await agent()
      .patch(`/api/appointments/${booked.body.data._id}/status`)
      .set('Authorization', `Bearer ${first.accessToken}`)
      .send({ status: 'cancelled', reason: 'Clashes with an exam' })
      .expect(200);

    // A cancelled appointment must not keep blocking the calendar.
    expect((await book(second.accessToken, slot)).status).toBe(201);
  });

  it('stops one student double-booking themselves', async () => {
    const student = await registerStudent();
    const other = await createUserWithRole(ROLES.COUNSELLOR);
    await Counsellor.create({
      user: other.user._id,
      slotMinutes: 30,
      availability: [1, 2, 3, 4, 5].map((dayOfWeek) => ({ dayOfWeek, startMinute: 10 * 60, endMinute: 17 * 60 })),
    });

    const slot = nextWeekdayAt(14);
    expect((await book(student.accessToken, slot)).status).toBe(201);

    const withOther = await agent()
      .post('/api/appointments')
      .set('Authorization', `Bearer ${student.accessToken}`)
      .send({ counsellorUserId: other.user._id.toString(), type: 'counselling', startsAt: slot.toISOString() });

    expect(withOther.status).toBe(409);
  });

  it('requires a student account', async () => {
    const response = await agent()
      .post('/api/appointments')
      .set('Authorization', `Bearer ${counsellorToken}`)
      .send({ counsellorUserId: counsellor._id.toString(), type: 'counselling', startsAt: nextWeekdayAt(11).toISOString() });

    expect(response.status).toBe(403);
  });
});

describe('GET /api/appointments/availability/:id', () => {
  it('lists slots and omits ones already taken', async () => {
    const { accessToken } = await registerStudent();
    const slot = nextWeekdayAt(11);
    const date = slot.toISOString().slice(0, 10);

    const before = await agent()
      .get(`/api/appointments/availability/${counsellor._id}?date=${date}`)
      .set('Authorization', `Bearer ${accessToken}`);
    const countBefore = before.body.data.slots.length;
    expect(countBefore).toBeGreaterThan(0);

    await book(accessToken, slot);

    const after = await agent()
      .get(`/api/appointments/availability/${counsellor._id}?date=${date}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(after.body.data.slots.length).toBe(countBefore - 1);
    expect(after.body.data.slots.some((s) => s.startsAt === slot.toISOString())).toBe(false);
  });

  it('returns no slots for a day with no availability', async () => {
    const { accessToken } = await registerStudent();
    // Find the next Sunday — seeded availability is Mon–Fri.
    const d = new Date();
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));

    const response = await agent()
      .get(`/api/appointments/availability/${counsellor._id}?date=${d.toISOString().slice(0, 10)}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.body.data.slots).toHaveLength(0);
  });

  it('rejects a malformed date', async () => {
    const { accessToken } = await registerStudent();
    const response = await agent()
      .get(`/api/appointments/availability/${counsellor._id}?date=tomorrow`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(response.status).toBe(400);
  });
});

describe('appointment status', () => {
  it('lets the counsellor confirm, but not the student', async () => {
    const { accessToken } = await registerStudent();
    const { body } = await book(accessToken, nextWeekdayAt(11));

    const byStudent = await agent()
      .patch(`/api/appointments/${body.data._id}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'confirmed' });
    expect(byStudent.status).toBe(403);

    const byCounsellor = await agent()
      .patch(`/api/appointments/${body.data._id}/status`)
      .set('Authorization', `Bearer ${counsellorToken}`)
      .send({ status: 'confirmed' });
    expect(byCounsellor.status).toBe(200);
  });

  it('stops a student marking their own session completed', async () => {
    // That would be recording something which may not have happened.
    const { accessToken } = await registerStudent();
    const { body } = await book(accessToken, nextWeekdayAt(11));

    const response = await agent()
      .patch(`/api/appointments/${body.data._id}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'completed' });

    expect(response.status).toBe(403);
  });

  it('refuses to change an already-terminal appointment', async () => {
    const { accessToken } = await registerStudent();
    const { body } = await book(accessToken, nextWeekdayAt(11));

    await agent()
      .patch(`/api/appointments/${body.data._id}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'cancelled' })
      .expect(200);

    const again = await agent()
      .patch(`/api/appointments/${body.data._id}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'confirmed' });

    expect(again.status).toBe(400);
  });

  it('hides an appointment from an unrelated student', async () => {
    const owner = await registerStudent();
    const stranger = await registerStudent();
    const { body } = await book(owner.accessToken, nextWeekdayAt(11));

    const response = await agent()
      .patch(`/api/appointments/${body.data._id}/status`)
      .set('Authorization', `Bearer ${stranger.accessToken}`)
      .send({ status: 'cancelled' });

    expect(response.status).toBe(403);
  });
});

describe('rescheduling', () => {
  it('moves an appointment and re-checks conflicts', async () => {
    const { accessToken } = await registerStudent();
    const { body } = await book(accessToken, nextWeekdayAt(11));
    const target = nextWeekdayAt(15);

    const moved = await agent()
      .patch(`/api/appointments/${body.data._id}/reschedule`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ startsAt: target.toISOString() });

    expect(moved.status).toBe(200);
    expect(new Date(moved.body.data.startsAt).getHours()).toBe(15);
  });

  it('allows a small nudge without colliding with itself', async () => {
    // The self-exclusion case: without it an appointment could never be moved by
    // less than its own duration, because it would find its own booking.
    const { accessToken } = await registerStudent();
    const start = nextWeekdayAt(11);
    const { body } = await book(accessToken, start);

    const response = await agent()
      .patch(`/api/appointments/${body.data._id}/reschedule`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ startsAt: new Date(start.getTime() + 30 * 60_000).toISOString() });

    expect(response.status).toBe(200);
  });
});

describe('counsellor caseload', () => {
  it('shows only assigned students', async () => {
    const mine = await registerStudent();
    await registerStudent(); // unrelated
    await book(mine.accessToken, nextWeekdayAt(11));

    const response = await agent().get('/api/counsellors/me/students').set('Authorization', `Bearer ${counsellorToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].email).toBe(mine.payload.email);
  });

  it('refuses a student who is not on the caseload', async () => {
    const stranger = await registerStudent();

    const response = await agent()
      .get(`/api/counsellors/me/students/${stranger.user._id ?? stranger.user.id}`)
      .set('Authorization', `Bearer ${counsellorToken}`);

    expect(response.status).toBe(403);
  });

  it('reports a dashboard scoped to the caseload', async () => {
    const mine = await registerStudent();
    await book(mine.accessToken, nextWeekdayAt(11));

    const response = await agent().get('/api/counsellors/me/dashboard').set('Authorization', `Bearer ${counsellorToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.stats.students).toBe(1);
    expect(response.body.data.upcomingAppointments).toHaveLength(1);
    expect(response.body.data.stats.pendingRequests).toBe(1);
  });

  it('is closed to students', async () => {
    const { accessToken } = await registerStudent();
    const response = await agent().get('/api/counsellors/me/dashboard').set('Authorization', `Bearer ${accessToken}`);
    expect(response.status).toBe(403);
  });

  it('rejects an availability window that ends before it starts', async () => {
    const response = await agent()
      .patch('/api/counsellors/me/profile')
      .set('Authorization', `Bearer ${counsellorToken}`)
      .send({ availability: [{ dayOfWeek: 1, startMinute: 600, endMinute: 300 }] });

    expect(response.status).toBe(400);
  });

  it('saves working hours', async () => {
    const response = await agent()
      .patch('/api/counsellors/me/profile')
      .set('Authorization', `Bearer ${counsellorToken}`)
      .send({ slotMinutes: 60, isAcceptingStudents: false, title: 'Senior Counsellor' });

    expect(response.status).toBe(200);
    expect(response.body.data.slotMinutes).toBe(60);

    // No longer accepting bookings, so a new request must be refused.
    const student = await registerStudent();
    expect((await book(student.accessToken, nextWeekdayAt(11))).status).toBe(400);
    expect(await Appointment.countDocuments()).toBe(0);
  });
});
