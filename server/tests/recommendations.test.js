import { describe, it, expect, beforeEach } from 'vitest';

import { agent, registerStudent } from './helpers.js';
import { seedCatalogue } from '../seed/seedCatalogue.js';
import Course from '../models/Course.js';

/**
 * Recommendations end to end, against the real seeded catalogue.
 *
 * The engine's own boundaries are unit-tested in match.test.js; what matters here
 * is that a saved profile actually changes what comes back — the whole product
 * claim — and that no endpoint ever offers a student a course they cannot enter.
 */

const authed = (request, token) => request.set('Authorization', `Bearer ${token}`);

const saveProfile = (token, patch) =>
  authed(agent().patch('/api/students/me/profile'), token).send(patch);

const CLASS_12 = {
  education: { level: 'class_12', secondaryMarks: { system: 'percentage', value: 82 }, backlogs: 0 },
  goal: {
    degreeLevel: 'Bachelors',
    fields: ['computer_science'],
    intake: { season: 'September', year: new Date().getFullYear() + 1 },
  },
  destinations: ['GB'],
  budget: { annualInr: 3_500_000, fundingSource: 'education_loan' },
  english: { test: 'ielts', overall: 6.5 },
};

describe('the seeded catalogue', () => {
  beforeEach(async () => {
    await seedCatalogue();
  });

  it('covers every degree level a student could be routed to', async () => {
    const levels = await Course.distinct('degreeLevel');

    // Without foundation courses, a student still in school sees an empty dashboard.
    expect(levels).toContain('Foundation');
    expect(levels).toContain('Diploma');
    expect(levels).toContain('Bachelors');
    expect(levels).toContain('Masters');
  });

  it('is idempotent — re-seeding updates rather than duplicates', async () => {
    const before = await Course.countDocuments();
    const second = await seedCatalogue();

    expect(await Course.countDocuments()).toBe(before);
    expect(second.created).toBe(0);
    expect(second.updated).toBeGreaterThan(0);
  });

  it('derives a slug for every course, so every detail page resolves', async () => {
    expect(await Course.countDocuments({ slug: { $in: [null, ''] } })).toBe(0);
  });

  it('converts tuition to rupees for every course', async () => {
    expect(await Course.countDocuments({ tuitionPerYearInr: { $lte: 0 } })).toBe(0);
  });

  it('publishes courses only in intake months their destination runs', async () => {
    const courses = await Course.find().populate('country', 'intakes name').lean();

    const mismatched = courses.filter((course) =>
      course.intakes.some((intake) => !course.country.intakes.includes(intake))
    );

    expect(mismatched.map((course) => `${course.title} (${course.intakes})`)).toEqual([]);
  });
});

describe('GET /api/students/me/recommendations', () => {
  let accessToken;

  beforeEach(async () => {
    await seedCatalogue();
    ({ accessToken } = await registerStudent());
  });

  it('scores provisionally before an education level is known', async () => {
    const response = await authed(agent().get('/api/students/me/recommendations'), accessToken);
    const [top] = response.body.data;

    // Nothing is filtered out yet, and every scorer runs on partial credit — which
    // the payload admits to, so the client can prompt instead of implying certainty.
    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(top.match.unknowns.length).toBeGreaterThan(0);
  });

  it('scores and explains every recommendation once a profile exists', async () => {
    await saveProfile(accessToken, CLASS_12);

    const response = await authed(agent().get('/api/students/me/recommendations'), accessToken);
    const [top] = response.body.data;

    expect(response.status).toBe(200);
    expect(top.match.score).toBeGreaterThan(0);
    expect(top.match.breakdown).toHaveLength(7);
    expect(top.match.bandLabel).toBeTruthy();
    expect(top.country.name).toBeTruthy();
    expect(top.programmeCostInr).toBeGreaterThan(top.tuitionPerYearInr);
  });

  it('sorts by match score, highest first', async () => {
    await saveProfile(accessToken, CLASS_12);

    const { body } = await authed(agent().get('/api/students/me/recommendations?limit=20'), accessToken);
    const scores = body.data.map((course) => course.match.score);

    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('never recommends a master’s degree to a Class 12 leaver', async () => {
    await saveProfile(accessToken, CLASS_12);

    const { body } = await authed(agent().get('/api/students/me/recommendations?limit=48&allFields=true'), accessToken);

    expect(body.data.some((course) => course.degreeLevel === 'Masters')).toBe(false);
    expect(body.meta.total).toBeGreaterThan(0);
  });

  it('offers a graduate master’s degrees and nothing below their level', async () => {
    await saveProfile(accessToken, {
      education: { level: 'bachelors', tertiaryMarks: { system: 'percentage', value: 72 } },
      goal: { degreeLevel: 'Masters', fields: ['data_analytics'] },
      destinations: ['IE'],
      english: { test: 'ielts', overall: 7 },
      budget: { annualInr: 3_500_000 },
    });

    const { body } = await authed(agent().get('/api/students/me/recommendations?limit=48'), accessToken);

    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((course) => ['Masters', 'Certificate', 'Diploma'].includes(course.degreeLevel))).toBe(true);
    expect(body.data.every((course) => course.countryCode === 'IE')).toBe(true);
  });

  it('shows a Class 11 student what Class 12 will unlock, labelled as such', async () => {
    await saveProfile(accessToken, {
      education: { level: 'class_11', secondaryMarks: { system: 'percentage', value: 75 } },
      goal: { degreeLevel: 'Bachelors', fields: ['business'] },
      destinations: ['AU', 'GB'],
      budget: { annualInr: 2_500_000 },
    });

    const { body } = await authed(agent().get('/api/students/me/recommendations?limit=48'), accessToken);
    const bachelors = body.data.filter((course) => course.degreeLevel === 'Bachelors');

    expect(bachelors.length).toBeGreaterThan(0);
    expect(bachelors.every((course) => course.match.route === 'future')).toBe(true);
    expect(bachelors[0].match.conditionalNote).toMatch(/Class 12/);

    // And a pathway they can start from where they are now: Deakin College admits
    // on Class 11 marks, so it is a direct offer rather than a future one.
    const foundation = body.data.filter((course) => course.degreeLevel === 'Foundation');
    expect(foundation.some((course) => course.match.route === 'direct')).toBe(true);
  });

  it('marks a Class 12 candidate’s offers as conditional while results are pending', async () => {
    await saveProfile(accessToken, {
      ...CLASS_12,
      education: { ...CLASS_12.education, level: 'class_12_pursuing' },
    });

    const { body } = await authed(agent().get('/api/students/me/recommendations?limit=10'), accessToken);
    const bachelors = body.data.filter((course) => course.degreeLevel === 'Bachelors');

    expect(bachelors.length).toBeGreaterThan(0);
    expect(bachelors.every((course) => course.match.route === 'conditional')).toBe(true);
  });

  it('respects the student’s destination preference, and lets a filter override it', async () => {
    await saveProfile(accessToken, CLASS_12);

    const preferred = await authed(agent().get('/api/students/me/recommendations?limit=48'), accessToken);
    expect(preferred.body.data.every((course) => course.countryCode === 'GB')).toBe(true);

    const override = await authed(agent().get('/api/students/me/recommendations?countryCode=AE'), accessToken);
    expect(override.body.data.every((course) => course.countryCode === 'AE')).toBe(true);
  });

  it('widens beyond the chosen subjects only when asked', async () => {
    await saveProfile(accessToken, CLASS_12);

    const narrow = await authed(agent().get('/api/students/me/recommendations?limit=48'), accessToken);
    const wide = await authed(agent().get('/api/students/me/recommendations?limit=48&allFields=true'), accessToken);

    expect(wide.body.meta.total).toBeGreaterThan(narrow.body.meta.total);
    // "false" must not coerce to true — the classic query-string boolean bug.
    const explicitlyOff = await authed(agent().get('/api/students/me/recommendations?limit=48&allFields=false'), accessToken);
    expect(explicitlyOff.body.meta.total).toBe(narrow.body.meta.total);
  });

  it('returns an empty list for a degree level the student cannot enter', async () => {
    await saveProfile(accessToken, CLASS_12);

    const { body } = await authed(agent().get('/api/students/me/recommendations?degreeLevel=Masters'), accessToken);

    expect(body.data).toEqual([]);
    expect(body.meta.total).toBe(0);
  });

  it('rejects a query it cannot parse instead of guessing', async () => {
    await saveProfile(accessToken, CLASS_12);

    expect((await authed(agent().get('/api/students/me/recommendations?limit=999'), accessToken)).status).toBe(400);
    expect((await authed(agent().get('/api/students/me/recommendations?field=astrology'), accessToken)).status).toBe(400);
  });
});

describe('GET /api/students/me/dashboard', () => {
  let accessToken;

  beforeEach(async () => {
    await seedCatalogue();
    ({ accessToken } = await registerStudent());
  });

  it('asks for an education level before showing matches', async () => {
    const { body } = await authed(agent().get('/api/students/me/dashboard'), accessToken);

    expect(body.data.matches).toEqual([]);
    expect(body.data.completion.percent).toBe(0);
    expect(body.data.guidance.known).toBe(false);
    // Catalogue counts still come back — a reason to finish, not an empty screen.
    expect(body.data.stats.universities).toBeGreaterThan(0);
  });

  it('assembles matches, stats, guidance and insights in one response', async () => {
    await saveProfile(accessToken, CLASS_12);

    const { body } = await authed(agent().get('/api/students/me/dashboard'), accessToken);
    const { matches, stats, guidance, insights, completion } = body.data;

    expect(matches.length).toBeGreaterThan(0);
    expect(matches.length).toBeLessThanOrEqual(6);
    expect(stats.matchingCourses).toBeGreaterThanOrEqual(matches.length);
    expect(guidance.eligibleDegreeLevels).toContain('Bachelors');
    expect(insights.bestScore).toBe(matches[0].match.score);
    expect(insights.typicalAnnualCostInr).toBeGreaterThan(0);
    expect(completion.percent).toBeGreaterThan(50);
  });

  it('names what is still unknown so the student can improve the score', async () => {
    await saveProfile(accessToken, { education: { level: 'class_12' }, goal: { degreeLevel: 'Bachelors' } });

    const { body } = await authed(agent().get('/api/students/me/dashboard'), accessToken);

    expect(body.data.insights.unknowns).toContain('Budget fit');
    expect(body.data.completion.missing.some((item) => item.key === 'budget')).toBe(true);
  });
});

describe('public catalogue', () => {
  beforeEach(async () => {
    await seedCatalogue();
  });

  it('serves courses to an anonymous visitor without match scores', async () => {
    const { body, status } = await agent().get('/api/courses?limit=5');

    expect(status).toBe(200);
    expect(body.data).toHaveLength(5);
    expect(body.data[0].match).toBeNull();
    expect(body.meta.personalized).toBe(false);
  });

  it('personalizes the same endpoint for a signed-in student', async () => {
    const { accessToken } = await registerStudent();
    await saveProfile(accessToken, CLASS_12);

    const { body } = await authed(agent().get('/api/courses?limit=5'), accessToken);

    expect(body.meta.personalized).toBe(true);
    expect(body.data[0].match.score).toBeGreaterThan(0);
  });

  it('treats a bad token on a public route as anonymous, not as an error', async () => {
    const response = await agent().get('/api/courses?limit=1').set('Authorization', 'Bearer not.a.token');

    expect(response.status).toBe(200);
    expect(response.body.meta.personalized).toBe(false);
  });

  it('returns a course detail page by slug, with the full requirement set', async () => {
    const list = await agent().get('/api/courses?limit=1');
    const { slug } = list.body.data[0];

    const { body, status } = await agent().get(`/api/courses/${slug}`);

    expect(status).toBe(200);
    expect(body.data.requirements.minEducationLevel).toBeTruthy();
    expect(body.data.university.name).toBeTruthy();
    expect(body.data.country.livingCostPerYearInr).toBeGreaterThan(0);
  });

  it('404s an unknown slug and 400s a malformed one', async () => {
    expect((await agent().get('/api/courses/no-such-course-here')).status).toBe(404);
    expect((await agent().get('/api/courses/Not%20A%20Slug')).status).toBe(400);
  });

  it('serves the wizard’s option sets in one request', async () => {
    const { body } = await agent().get('/api/options');

    expect(body.data.countries.length).toBeGreaterThan(0);
    expect(body.data.educationLevels).toContain('class_12');
    expect(body.data.degreeLevels).toContain('Foundation');
    expect(body.data.fields).toContain('computer_science');
  });

  it('lists universities, ranked, and filters by destination', async () => {
    const { body } = await agent().get('/api/universities?countryCode=GB&limit=10');

    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.every((university) => university.countryCode === 'GB')).toBe(true);
    expect(body.meta.total).toBe(body.data.length);
  });
});
