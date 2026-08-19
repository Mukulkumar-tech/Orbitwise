import { describe, expect, it, beforeEach } from 'vitest';

import { agent, createUserWithRole, registerStudent } from './helpers.js';
import { seedCatalogue } from '../seed/seedCatalogue.js';
import Course from '../models/Course.js';
import Application from '../models/Application.js';
import { ROLES } from '../constants/index.js';

/** A real seeded course, so snapshots and requirements are realistic. */
let courseSlug;

beforeEach(async () => {
  await seedCatalogue();
  const course = await Course.findOne({ isActive: true }).sort({ tuitionPerYearInr: 1 }).lean();
  courseSlug = course.slug;
});

const startApplication = async (token, overrides = {}) =>
  agent()
    .post('/api/applications')
    .set('Authorization', `Bearer ${token}`)
    .send({ courseSlug, intake: { season: 'September', year: 2027 }, ...overrides });

describe('POST /api/applications', () => {
  it('opens an application in draft with a course snapshot', async () => {
    const { accessToken } = await registerStudent();
    const response = await startApplication(accessToken);

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('draft');
    // The snapshot is what makes the record historical rather than a live view.
    expect(response.body.data.snapshot.courseTitle).toBeTruthy();
    expect(response.body.data.snapshot.programmeCostInr).toBeGreaterThan(0);
    expect(response.body.data.timeline).toHaveLength(1);
  });

  it('refuses a duplicate application for the same course', async () => {
    const { accessToken } = await registerStudent();
    // startApplication is async, so it resolves to a response rather than a
    // chainable supertest Test — assert the status instead of .expect().
    const first = await startApplication(accessToken);
    expect(first.status).toBe(201);

    const duplicate = await startApplication(accessToken);
    expect(duplicate.status).toBe(409);
  });

  it('rejects an unknown course', async () => {
    const { accessToken } = await registerStudent();
    const response = await startApplication(accessToken, { courseSlug: 'no-such-course' });
    expect(response.status).toBe(404);
  });

  it('requires authentication', async () => {
    const response = await agent().post('/api/applications').send({ courseSlug });
    expect(response.status).toBe(401);
  });
});

describe('status machine', () => {
  it('walks the legal path from draft to submitted', async () => {
    const { accessToken } = await registerStudent();
    const { body } = await startApplication(accessToken);
    const id = body.data._id;

    for (const status of ['documents_pending', 'ready_to_apply', 'submitted']) {
      const response = await agent()
        .patch(`/api/applications/${id}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status });

      expect(response.status, `→ ${status}`).toBe(200);
      expect(response.body.data.status).toBe(status);
    }

    const final = await agent().get(`/api/applications/${id}`).set('Authorization', `Bearer ${accessToken}`);
    expect(final.body.data.submittedAt).toBeTruthy();
    // One entry for the opening draft plus one per transition.
    expect(final.body.data.timeline).toHaveLength(4);
  });

  it('rejects a skipped stage', async () => {
    // draft → submitted is not a legal edge: documents come first, and allowing
    // the jump would produce a timeline describing events that never happened.
    const { accessToken } = await registerStudent();
    const { body } = await startApplication(accessToken);

    const response = await agent()
      .patch(`/api/applications/${body.data._id}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'submitted' });

    expect(response.status).toBe(400);
    expect(response.body.errors.status).toBeTruthy();
  });

  it('stops a student recording a university-owned status', async () => {
    const { accessToken } = await registerStudent();
    const { body } = await startApplication(accessToken);
    const id = body.data._id;

    for (const status of ['documents_pending', 'ready_to_apply', 'submitted']) {
      await agent().patch(`/api/applications/${id}/status`).set('Authorization', `Bearer ${accessToken}`).send({ status });
    }

    // submitted → under_review is a *legal* edge, so this can only fail on the
    // role gate. That separation matters: 403 tells the student the move is real
    // but not theirs to make, where 400 would wrongly imply it never happens.
    const response = await agent()
      .patch(`/api/applications/${id}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'under_review' });

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/counsellor/i);
  });

  it('treats withdrawn as terminal', async () => {
    const { accessToken } = await registerStudent();
    const { body } = await startApplication(accessToken);
    const id = body.data._id;

    await agent()
      .patch(`/api/applications/${id}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'withdrawn' })
      .expect(200);

    const reopen = await agent()
      .patch(`/api/applications/${id}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'draft' });

    expect(reopen.status).toBe(400);
  });

  it('rejects a no-op transition', async () => {
    const { accessToken } = await registerStudent();
    const { body } = await startApplication(accessToken);

    const response = await agent()
      .patch(`/api/applications/${body.data._id}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'draft' });

    expect(response.status).toBe(400);
  });

  it('offers only transitions the caller may actually make', async () => {
    const { accessToken } = await registerStudent();
    const { body } = await startApplication(accessToken);

    const response = await agent().get(`/api/applications/${body.data._id}`).set('Authorization', `Bearer ${accessToken}`);
    const offered = response.body.data.availableTransitions.map((entry) => entry.status);

    expect(offered).toEqual(expect.arrayContaining(['documents_pending', 'ready_to_apply', 'withdrawn']));
    expect(offered).not.toContain('offer_received');
  });
});

describe('ownership', () => {
  it('stops one student reading another student’s application', async () => {
    const owner = await registerStudent();
    const intruder = await registerStudent();
    const { body } = await startApplication(owner.accessToken);

    const response = await agent()
      .get(`/api/applications/${body.data._id}`)
      .set('Authorization', `Bearer ${intruder.accessToken}`);

    expect(response.status).toBe(403);
  });

  it('stops one student transitioning another’s application', async () => {
    const owner = await registerStudent();
    const intruder = await registerStudent();
    const { body } = await startApplication(owner.accessToken);

    const response = await agent()
      .patch(`/api/applications/${body.data._id}/status`)
      .set('Authorization', `Bearer ${intruder.accessToken}`)
      .send({ status: 'withdrawn' });

    expect(response.status).toBe(403);
  });

  it('stops an unassigned counsellor reading an application', async () => {
    const owner = await registerStudent();
    const counsellor = await createUserWithRole(ROLES.COUNSELLOR);
    const { body } = await startApplication(owner.accessToken);

    const response = await agent()
      .get(`/api/applications/${body.data._id}`)
      .set('Authorization', `Bearer ${counsellor.accessToken}`);

    expect(response.status).toBe(403);
  });
});

describe('notes', () => {
  it('never returns a counsellor’s private note to the student', async () => {
    const owner = await registerStudent();
    const counsellor = await createUserWithRole(ROLES.COUNSELLOR);
    const { body } = await startApplication(owner.accessToken);
    const id = body.data._id;

    // Assign the counsellor directly; assignment flows arrive with Phase 12.
    await Application.findByIdAndUpdate(id, { counsellor: counsellor.user._id });

    await agent()
      .post(`/api/applications/${id}/notes`)
      .set('Authorization', `Bearer ${counsellor.accessToken}`)
      .send({ body: 'Marks are borderline for this university.', isPrivate: true })
      .expect(200);

    const asCounsellor = await agent().get(`/api/applications/${id}`).set('Authorization', `Bearer ${counsellor.accessToken}`);
    expect(asCounsellor.body.data.notes).toHaveLength(1);

    // Filtered server-side. A flag the browser is trusted to honour is not a
    // privacy control.
    const asStudent = await agent().get(`/api/applications/${id}`).set('Authorization', `Bearer ${owner.accessToken}`);
    expect(asStudent.body.data.notes).toHaveLength(0);
    expect(JSON.stringify(asStudent.body)).not.toContain('borderline');
  });

  it('cannot be marked private by a student', async () => {
    const { accessToken } = await registerStudent();
    const { body } = await startApplication(accessToken);

    const response = await agent()
      .post(`/api/applications/${body.data._id}/notes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ body: 'Trying to hide this from my counsellor', isPrivate: true });

    expect(response.status).toBe(200);
    expect(response.body.data.notes[0].isPrivate).toBe(false);
  });
});

describe('GET /api/applications', () => {
  it('lists only the caller’s own applications', async () => {
    const owner = await registerStudent();
    const other = await registerStudent();
    await startApplication(owner.accessToken);
    await startApplication(other.accessToken);

    const response = await agent().get('/api/applications').set('Authorization', `Bearer ${owner.accessToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  it('reports counts by status', async () => {
    const { accessToken } = await registerStudent();
    await startApplication(accessToken);

    const response = await agent().get('/api/applications/stats').set('Authorization', `Bearer ${accessToken}`);
    expect(response.body.data.total).toBe(1);
    expect(response.body.data.active).toBe(1);
    expect(response.body.data.offers).toBe(0);
  });
});

describe('GET /api/courses/compare', () => {
  it('compares courses and names per-dimension winners', async () => {
    const courses = await Course.find({ isActive: true }).limit(3).lean();
    const slugs = courses.map((course) => course.slug).join(',');

    const response = await agent().get(`/api/courses/compare?slugs=${slugs}`);

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(3);
    expect(response.body.data.bestBy.totalCost).toBeTruthy();
    expect(response.body.data.recommended.slug).toBeTruthy();
    // Anonymous callers get a cost-based recommendation, honestly labelled.
    expect(response.body.data.personalized).toBe(false);
  });

  it('requires at least two courses', async () => {
    const course = await Course.findOne({ isActive: true }).lean();
    const response = await agent().get(`/api/courses/compare?slugs=${course.slug}`);
    expect(response.status).toBe(400);
  });

  it('refuses more than four', async () => {
    const courses = await Course.find({ isActive: true }).limit(5).lean();
    const response = await agent().get(`/api/courses/compare?slugs=${courses.map((c) => c.slug).join(',')}`);
    expect(response.status).toBe(400);
  });

  it('does not treat "compare" as a course slug', async () => {
    // Route-ordering regression guard. One slug fails the compare validator with
    // 400; if '/compare' were registered after '/:slug' it would instead be
    // looked up as a course and 404. The two codes distinguish the two routes.
    const response = await agent().get('/api/courses/compare?slugs=only-one');

    expect(response.status).toBe(400);
    expect(response.body.errors?.slugs ?? response.body.message).toBeTruthy();
  });
});
