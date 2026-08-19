import { describe, it, expect, beforeEach } from 'vitest';

import { agent, registerStudent, createUserWithRole } from './helpers.js';
import { seedCatalogue } from '../seed/seedCatalogue.js';
import { ROLES } from '../constants/index.js';

/**
 * The student portal over real HTTP.
 *
 * Covers the two guarantees the wizard depends on — a patch never erases a section
 * it did not mention, and a saved education level immediately changes what the
 * catalogue will offer — plus the access rules around a profile, which contains
 * more personal detail than any other document in the platform.
 */

const CLASS_12_PROFILE = {
  education: {
    level: 'class_12',
    stream: 'science_pcm',
    boardOrInstitution: 'CBSE',
    secondaryMarks: { system: 'percentage', value: 82 },
    yearOfCompletion: 2026,
    backlogs: 0,
  },
  goal: {
    degreeLevel: 'Bachelors',
    fields: ['computer_science'],
    intake: { season: 'September', year: new Date().getFullYear() + 1 },
  },
  destinations: ['GB', 'CA'],
  budget: { annualInr: 3_000_000, fundingSource: 'education_loan', needsScholarship: true },
  english: { test: 'ielts', overall: 6.5 },
};

const authed = (request, token) => request.set('Authorization', `Bearer ${token}`);

describe('GET /api/students/me/profile', () => {
  it('creates an empty profile on first access rather than 404ing', async () => {
    const { accessToken } = await registerStudent();

    const response = await authed(agent().get('/api/students/me/profile'), accessToken);

    expect(response.status).toBe(200);
    expect(response.body.data.completion.percent).toBe(0);
    expect(response.body.data.guidance.known).toBe(false);
    expect(response.body.data.profile.onboardingCompletedAt).toBeNull();
  });

  it('rejects an unauthenticated request', async () => {
    expect((await agent().get('/api/students/me/profile')).status).toBe(401);
  });

  it('refuses a counsellor — the student portal is student-only', async () => {
    const { accessToken } = await createUserWithRole(ROLES.COUNSELLOR);

    const response = await authed(agent().get('/api/students/me/profile'), accessToken);

    expect(response.status).toBe(403);
  });
});

describe('PATCH /api/students/me/profile', () => {
  it('saves a full profile and returns the derived state with it', async () => {
    const { accessToken } = await registerStudent();

    const response = await authed(agent().patch('/api/students/me/profile'), accessToken).send(CLASS_12_PROFILE);

    expect(response.status).toBe(200);
    expect(response.body.data.completion.percent).toBe(100);
    expect(response.body.data.guidance.eligibleDegreeLevels).toContain('Bachelors');
    expect(response.body.data.eligibleDegreeLevels).not.toContain('Masters');
    expect(response.body.data.profile.onboardingCompletedAt).not.toBeNull();
    expect(response.body.data.journeyStage).toBe('course_discovery');
  });

  it('merges one section without erasing the others', async () => {
    // The failure this guards against: editing a budget from the profile screen
    // silently wiping the English score entered during onboarding.
    const { accessToken } = await registerStudent();
    await authed(agent().patch('/api/students/me/profile'), accessToken).send(CLASS_12_PROFILE);

    const response = await authed(agent().patch('/api/students/me/profile'), accessToken).send({
      budget: { annualInr: 4_000_000 },
    });

    expect(response.status).toBe(200);
    expect(response.body.data.profile.budget.annualInr).toBe(4_000_000);
    expect(response.body.data.profile.budget.fundingSource).toBe('education_loan');
    expect(response.body.data.profile.english.overall).toBe(6.5);
    expect(response.body.data.profile.education.secondaryMarks.value).toBe(82);
    expect(response.body.data.completion.percent).toBe(100);
  });

  it('converts a CGPA to a percentage for scoring', async () => {
    const { accessToken } = await registerStudent();

    const response = await authed(agent().patch('/api/students/me/profile'), accessToken).send({
      education: { level: 'class_12', secondaryMarks: { system: 'cgpa_10', value: 8.4 } },
    });

    expect(response.body.data.profile.secondaryPercentage).toBe(79.8);
  });

  it('rejects marks that are impossible in the chosen grading system', async () => {
    const { accessToken } = await registerStudent();

    const response = await authed(agent().patch('/api/students/me/profile'), accessToken).send({
      education: { secondaryMarks: { system: 'cgpa_10', value: 88 } },
    });

    expect(response.status).toBe(400);
    expect(response.body.errors['education.secondaryMarks.value']).toMatch(/Maximum for this grading system is 10/);
  });

  it('rejects a test score outside that test’s own scale', async () => {
    const { accessToken } = await registerStudent();

    const response = await authed(agent().patch('/api/students/me/profile'), accessToken).send({
      english: { test: 'ielts', overall: 65 }, // a PTE score entered against IELTS
    });

    expect(response.status).toBe(400);
    expect(response.body.errors['english.overall']).toMatch(/IELTS scores run from 0 to 9/);
  });

  it('rejects a score with no test selected instead of storing an orphan number', async () => {
    const { accessToken } = await registerStudent();

    const response = await authed(agent().patch('/api/students/me/profile'), accessToken).send({
      english: { test: 'planned', overall: 7 },
    });

    expect(response.status).toBe(400);
    expect(response.body.errors['english.overall']).toMatch(/Choose which test/);
  });

  it('rejects an empty body rather than reporting a successful no-op', async () => {
    const { accessToken } = await registerStudent();

    expect((await authed(agent().patch('/api/students/me/profile'), accessToken).send({})).status).toBe(400);
  });

  it('strips fields a client is not allowed to set', async () => {
    const { accessToken } = await registerStudent();

    const response = await authed(agent().patch('/api/students/me/profile'), accessToken).send({
      education: { level: 'class_12' },
      goal: { degreeLevel: 'Bachelors' },
      // Neither of these is in the schema, so Zod drops them before any service runs.
      onboardingCompletedAt: '2020-01-01T00:00:00.000Z',
      shortlist: ['65f0000000000000000000aa'],
    });

    expect(response.status).toBe(200);
    expect(response.body.data.profile.shortlist).toEqual([]);
    expect(new Date(response.body.data.profile.onboardingCompletedAt).getFullYear()).toBeGreaterThan(2020);
  });

  it('caps subject areas at three', async () => {
    const { accessToken } = await registerStudent();

    const response = await authed(agent().patch('/api/students/me/profile'), accessToken).send({
      goal: { fields: ['computer_science', 'business', 'design', 'law'] },
    });

    expect(response.status).toBe(400);
    expect(response.body.errors['goal.fields']).toMatch(/up to three/i);
  });
});

describe('shortlist', () => {
  let accessToken;
  let courseId;

  beforeEach(async () => {
    await seedCatalogue();
    ({ accessToken } = await registerStudent());
    await authed(agent().patch('/api/students/me/profile'), accessToken).send(CLASS_12_PROFILE);

    const courses = await authed(agent().get('/api/students/me/recommendations?limit=1'), accessToken);
    courseId = courses.body.data[0]._id;
  });

  it('adds, lists and removes a course', async () => {
    const added = await authed(agent().post(`/api/students/me/shortlist/${courseId}`), accessToken);
    expect(added.status).toBe(200);
    expect(added.body.data.count).toBe(1);

    const listed = await authed(agent().get('/api/students/me/shortlist'), accessToken);
    expect(listed.body.data).toHaveLength(1);
    // Shortlisted courses are re-scored on read, so the profile stays authoritative.
    expect(listed.body.data[0].match.score).toBeGreaterThan(0);

    const removed = await authed(agent().delete(`/api/students/me/shortlist/${courseId}`), accessToken);
    expect(removed.body.data.count).toBe(0);
  });

  it('refuses the same course twice', async () => {
    await authed(agent().post(`/api/students/me/shortlist/${courseId}`), accessToken);
    const again = await authed(agent().post(`/api/students/me/shortlist/${courseId}`), accessToken);

    expect(again.status).toBe(409);
  });

  it('rejects a malformed course id before it reaches a query', async () => {
    const response = await authed(agent().post('/api/students/me/shortlist/not-an-id'), accessToken);
    expect(response.status).toBe(400);
  });

  it('moves the student to the shortlist stage of the journey', async () => {
    await authed(agent().post(`/api/students/me/shortlist/${courseId}`), accessToken);
    const dashboard = await authed(agent().get('/api/students/me/dashboard'), accessToken);

    expect(dashboard.body.data.journeyStage).toBe('university_shortlist');
  });
});
