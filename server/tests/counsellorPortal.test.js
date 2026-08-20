import { beforeEach, describe, expect, it } from 'vitest';

import { agent, createUserWithRole, registerStudent } from './helpers.js';
import Counsellor from '../models/Counsellor.js';
import StudentProfile from '../models/StudentProfile.js';
import Document from '../models/Document.js';
import { ROLES } from '../constants/index.js';

let counsellor;
let token;

beforeEach(async () => {
  const created = await createUserWithRole(ROLES.COUNSELLOR);
  counsellor = created.user;
  token = created.accessToken;

  await Counsellor.create({
    user: counsellor._id,
    slotMinutes: 30,
    availability: [1, 2, 3, 4, 5].map((dayOfWeek) => ({ dayOfWeek, startMinute: 10 * 60, endMinute: 17 * 60 })),
  });
});

const get = (path) => agent().get(path).set('Authorization', `Bearer ${token}`);

/** Puts a student on the caseload the way a first booking does. */
const assign = async (studentId) => {
  await Counsellor.updateOne({ user: counsellor._id }, { $addToSet: { assignedStudents: studentId } });
};

/** A profile answering roughly half the completion checklist. */
const halfCompleteProfile = (userId) =>
  StudentProfile.create({
    user: userId,
    education: {
      level: 'class_12',
      stream: 'science_pcm',
      secondaryMarks: { system: 'percentage', value: 82 },
      yearOfCompletion: 2025,
    },
    goal: { degreeLevel: 'Bachelors', fields: ['computer_science'] },
  });

describe('GET /api/counsellors/me/students', () => {
  it('reports real profile completion rather than zero', async () => {
    // Regression: the caseload used to read `profile.completion.percent`, a field
    // the model does not have — so every student reported 0% and the worklist
    // sort that breaks ties on completion was a no-op. Completion is derived
    // state and has to be computed by profileService, the one definition of it.
    const student = await registerStudent();
    await assign(student.user._id ?? student.user.id);
    await halfCompleteProfile(student.user._id ?? student.user.id);

    const response = await get('/api/counsellors/me/students');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].completionPercent).toBeGreaterThan(0);
    expect(response.body.data[0].completionPercent).toBeLessThan(100);
    expect(response.body.data[0].educationLevel).toBe('class_12');
  });

  it('reports 0% for a student who never started onboarding, without throwing', async () => {
    const student = await registerStudent();
    await assign(student.user._id ?? student.user.id);

    const response = await get('/api/counsellors/me/students');

    expect(response.status).toBe(200);
    expect(response.body.data[0].completionPercent).toBe(0);
  });

  it('lists only assigned students', async () => {
    const mine = await registerStudent();
    await registerStudent(); // Somebody else's student.
    await assign(mine.user._id ?? mine.user.id);

    const response = await get('/api/counsellors/me/students');

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].email).toBe(mine.payload.email);
  });
});

describe('GET /api/counsellors/me/students/:studentId', () => {
  it('returns the full picture with completion computed', async () => {
    const student = await registerStudent();
    const id = student.user._id ?? student.user.id;
    await assign(id);
    await halfCompleteProfile(id);

    const response = await get(`/api/counsellors/me/students/${id}`);

    expect(response.status).toBe(200);
    expect(response.body.data.student.email).toBe(student.payload.email);
    expect(response.body.data.completion.percent).toBeGreaterThan(0);
    // The checklist travels with the number so the UI never has to re-derive it.
    expect(Array.isArray(response.body.data.completion.items)).toBe(true);
    expect(response.body.data.completion.missing.length).toBeGreaterThan(0);
  });

  it('refuses a student who is not on the caseload', async () => {
    const stranger = await registerStudent();
    const id = stranger.user._id ?? stranger.user.id;

    const response = await get(`/api/counsellors/me/students/${id}`);

    expect(response.status).toBe(403);
  });

  it('rejects a malformed id as a bad request rather than a 404', async () => {
    // A 404 here would be ambiguous with "assigned but deleted", which is a
    // different problem for a counsellor to act on.
    const response = await get('/api/counsellors/me/students/not-an-id');

    expect(response.status).toBe(400);
  });
});

describe('GET /api/counsellors/me/review-queue', () => {
  it('queues only documents belonging to assigned students, oldest first', async () => {
    const mine = await registerStudent();
    const other = await registerStudent();
    const mineId = mine.user._id ?? mine.user.id;
    await assign(mineId);

    await Document.create({
      student: mineId,
      type: 'passport',
      status: 'uploaded',
      storageKey: 'k1',
      originalName: 'passport.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
    });
    await Document.create({
      student: other.user._id ?? other.user.id,
      type: 'passport',
      status: 'uploaded',
      storageKey: 'k2',
      originalName: 'passport.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
    });

    const response = await get('/api/counsellors/me/review-queue');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].student.name).toBe(mine.payload.name);
    // storageKey is select:false and stripped in toJSON — a counsellor gets the
    // metadata and the streaming endpoint, never a path.
    expect(response.body.data[0].storageKey).toBeUndefined();
  });

  it('is empty, not an error, for a counsellor with no caseload', async () => {
    const response = await get('/api/counsellors/me/review-queue');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
  });
});

describe('counsellor portal authorization', () => {
  it('refuses a student outright', async () => {
    const { accessToken } = await registerStudent();

    const response = await agent()
      .get('/api/counsellors/me/students')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(403);
  });

  it('refuses an unauthenticated caller', async () => {
    const response = await agent().get('/api/counsellors/me/dashboard');

    expect(response.status).toBe(401);
  });
});
