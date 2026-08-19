import { beforeEach, describe, expect, it } from 'vitest';

import { agent, registerStudent } from './helpers.js';
import { seedCatalogue } from '../seed/seedCatalogue.js';
import Scholarship from '../models/Scholarship.js';
import StudentProfile from '../models/StudentProfile.js';
import Course from '../models/Course.js';

beforeEach(async () => {
  await seedCatalogue();
});

/** Writes a profile directly; the wizard's own validation is tested elsewhere. */
const giveProfile = async (userId, patch) =>
  StudentProfile.findOneAndUpdate({ user: userId }, patch, { upsert: true, new: true, setDefaultsOnInsert: true });

describe('GET /api/scholarships', () => {
  it('serves the public catalogue to anonymous visitors', async () => {
    const response = await agent().get('/api/scholarships?limit=48');

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(15);
    expect(response.body.meta.personalized).toBe(false);
    // Deadline info is computed in the service because .lean() drops virtuals.
    expect(response.body.data.some((award) => award.daysRemaining != null)).toBe(true);
  });

  it('orders dated awards before open-ended ones, soonest first', async () => {
    // MongoDB sorts null before real dates ascending, so a plain sort would put
    // every no-deadline award above the one closing in nine days.
    const response = await agent().get('/api/scholarships?limit=48');
    const days = response.body.data.map((award) => award.daysRemaining);

    const firstNullAt = days.indexOf(null);
    const dated = firstNullAt === -1 ? days : days.slice(0, firstNullAt);

    expect(dated[0]).not.toBeNull();
    // Ascending among the dated ones.
    expect(dated).toEqual([...dated].sort((a, b) => a - b));
    // And no dated award appears after an undated one.
    if (firstNullAt !== -1) expect(days.slice(firstNullAt).every((value) => value === null)).toBe(true);
  });

  it('filters by destination', async () => {
    const response = await agent().get('/api/scholarships?countryCode=DE&limit=48');
    expect(response.status).toBe(200);
    expect(response.body.data.every((award) => award.countryCode === 'DE')).toBe(true);
  });

  it('normalizes fixed award values to rupees at seed time', async () => {
    const award = await Scholarship.findOne({ 'award.type': 'fixed', 'award.currency': 'EUR' }).lean();
    expect(award.award.amountInr).toBeGreaterThan(award.award.amount);
  });
});

describe('scholarship matching', () => {
  it('never offers a master’s-only award to a Class 12 student', async () => {
    const { user, accessToken } = await registerStudent();
    await giveProfile(user._id ?? user.id, {
      education: { level: 'class_12', secondaryMarks: { system: 'percentage', value: 82 } },
      goal: { degreeLevel: 'Bachelors', fields: ['business'] },
      destinations: ['GB', 'AU'],
      english: { test: 'ielts', overall: 6.5 },
    });

    const response = await agent().get('/api/scholarships?limit=48').set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.meta.personalized).toBe(true);

    // The hard gate. A Class 12 student cannot reach Masters or PhD, so no award
    // restricted to those levels may appear at any score.
    for (const award of response.body.data) {
      const levels = award.eligibility?.degreeLevels ?? [];
      if (levels.length) {
        expect(levels.some((level) => ['Foundation', 'Certificate', 'Diploma', 'Bachelors'].includes(level))).toBe(true);
      }
    }
  });

  it('explains what it excluded rather than hiding it', async () => {
    const { user, accessToken } = await registerStudent();
    await giveProfile(user._id ?? user.id, {
      education: { level: 'class_12', secondaryMarks: { system: 'percentage', value: 82 } },
    });

    const response = await agent().get('/api/scholarships?limit=48').set('Authorization', `Bearer ${accessToken}`);

    expect(response.body.meta.ineligibleCount).toBeGreaterThan(0);
    expect(response.body.meta.ineligibleSample[0].reason).toBeTruthy();
  });

  it('scores marks against the level the award is for', async () => {
    const { user, accessToken } = await registerStudent();
    await giveProfile(user._id ?? user.id, {
      education: { level: 'class_12', secondaryMarks: { system: 'percentage', value: 95 } },
      goal: { degreeLevel: 'Bachelors', fields: ['business'] },
      destinations: ['GB'],
      english: { test: 'ielts', overall: 7.5 },
    });

    const response = await agent().get('/api/scholarships?limit=48').set('Authorization', `Bearer ${accessToken}`);
    const top = response.body.data[0];

    expect(top.match.score).toBeGreaterThan(60);
    expect(top.match.reasons.length).toBeGreaterThan(0);
    expect(top.match.reasons.join(' ')).toMatch(/95%|clears|IELTS/i);
  });

  it('flags a shortfall as a gap instead of excluding the award', async () => {
    // Marks below a threshold are actionable information, not grounds for
    // silence — unlike an unreachable degree level, which is a hard gate.
    const { user, accessToken } = await registerStudent();
    await giveProfile(user._id ?? user.id, {
      education: { level: 'class_12', secondaryMarks: { system: 'percentage', value: 61 } },
      goal: { degreeLevel: 'Bachelors' },
    });

    const response = await agent().get('/api/scholarships?limit=48').set('Authorization', `Bearer ${accessToken}`);
    const withGaps = response.body.data.filter((award) => award.match.gaps.length > 0);

    expect(withGaps.length).toBeGreaterThan(0);
    expect(withGaps.some((award) => award.match.gaps.join(' ').match(/Needs \d+%/))).toBe(true);
  });

  it('excludes awards whose deadline has passed', async () => {
    const { user, accessToken } = await registerStudent();
    await giveProfile(user._id ?? user.id, {
      education: { level: 'bachelors', tertiaryMarks: { system: 'percentage', value: 85 } },
    });

    await Scholarship.updateOne({ slug: /daad/ }, { deadline: new Date(Date.now() - 86_400_000) });

    const response = await agent().get('/api/scholarships?limit=48').set('Authorization', `Bearer ${accessToken}`);
    const slugs = response.body.data.map((award) => award.slug);

    expect(slugs.some((slug) => slug.includes('daad'))).toBe(false);
  });
});

describe('GET /api/scholarships/deadlines', () => {
  it('returns only awards the student is eligible for', async () => {
    const { user, accessToken } = await registerStudent();
    await giveProfile(user._id ?? user.id, {
      education: { level: 'class_12', secondaryMarks: { system: 'percentage', value: 80 } },
    });

    const response = await agent().get('/api/scholarships/deadlines').set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.every((entry) => entry.daysRemaining >= 0)).toBe(true);
  });

  it('does not treat "deadlines" as a scholarship slug', async () => {
    // Route-ordering guard: registered after '/:slug' this would be a 404 lookup.
    const response = await agent().get('/api/scholarships/deadlines');
    expect(response.status).toBe(401); // auth required, not "not found"
  });
});

describe('POST /api/tools/cost-calculator', () => {
  it('computes a full estimate with a scholarship applied to tuition only', async () => {
    const response = await agent()
      .post('/api/tools/cost-calculator')
      .send({
        costs: { tuition: 2_000_000, accommodation: 600_000, food: 200_000, visa: 30_000 },
        durationMonths: 24,
        scholarship: { type: 'percentage', percentOfTuition: 50 },
        annualBudgetInr: 2_000_000,
      });

    expect(response.status).toBe(200);
    const data = response.body.data;

    expect(data.years).toBe(2);
    expect(data.scholarship.total).toBe(2_000_000);
    expect(data.netTotal).toBe(data.grossTotal - 2_000_000);
    expect(data.budget.known).toBe(true);
    expect(data.budget.usedPercent).toBeGreaterThan(0);
  });

  it('uses the stored award rather than a client-supplied value', async () => {
    // A client must not be able to inflate an award by asserting its size.
    const award = await Scholarship.findOne({ 'award.type': 'percentage' }).lean();

    const response = await agent()
      .post('/api/tools/cost-calculator')
      .send({
        costs: { tuition: 1_000_000 },
        durationMonths: 12,
        scholarshipSlug: award.slug,
        scholarship: { type: 'full' },
      });

    expect(response.status).toBe(200);
    expect(response.body.data.appliedScholarship.slug).toBe(award.slug);
    // 'full' would have zeroed tuition; the stored percentage did not.
    expect(response.body.data.scholarship.total).toBeLessThan(1_000_000);
  });

  it('rejects a negative cost', async () => {
    const response = await agent()
      .post('/api/tools/cost-calculator')
      .send({ costs: { tuition: -5000 }, durationMonths: 12 });

    expect(response.status).toBe(400);
  });

  it('404s on an unknown scholarship slug', async () => {
    const response = await agent()
      .post('/api/tools/cost-calculator')
      .send({ costs: { tuition: 100 }, durationMonths: 12, scholarshipSlug: 'no-such-award' });

    expect(response.status).toBe(404);
  });
});

describe('GET /api/tools/cost-calculator/prefill', () => {
  it('prefills from a real course', async () => {
    const course = await Course.findOne({ isActive: true }).lean();
    const response = await agent().get(`/api/tools/cost-calculator/prefill?courseSlug=${course.slug}`);

    expect(response.status).toBe(200);
    expect(response.body.data.costs.tuition).toBe(course.tuitionPerYearInr);
    expect(response.body.data.durationMonths).toBe(course.durationMonths);
    // Living costs are split into editable lines rather than one opaque total.
    expect(response.body.data.costs.accommodation).toBeGreaterThan(0);
    expect(response.body.data.costs.food).toBeGreaterThan(0);
  });

  it('returns an empty starting point with no course', async () => {
    const response = await agent().get('/api/tools/cost-calculator/prefill');
    expect(response.status).toBe(200);
    expect(response.body.data.course).toBeNull();
    expect(response.body.data.fields.annual).toContain('tuition');
  });
});
