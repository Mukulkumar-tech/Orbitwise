import { describe, it, expect } from 'vitest';

import { matchBand } from '../constants/index.js';
import {
  admissionRoute,
  degreeLevelsByRoute,
  eligibleDegreeLevels,
  expandFields,
  monthsToNearestIntake,
  toIeltsEquivalent,
  toPercentage,
} from '../services/academics.js';
import { rankCourses, resolveRoute, scoreCourse, WEIGHTS, TOTAL_WEIGHT } from '../services/matchService.js';
import { completionOf, guidanceFor } from '../services/profileService.js';

/**
 * OrbitMatch unit tests.
 *
 * Every case here is a decision a student would act on, so they are written
 * against the boundary rather than the middle: 59 versus 60 on a band edge, marks
 * exactly on a cut-off, a backlog one over the limit, a qualification that is in
 * progress versus one that was never started.
 */

/* ─── Fixtures ─────────────────────────────────────────────────────────────── */

const GB = { code: 'GB', name: 'United Kingdom', livingCostPerYearInr: 950_000 };

const university = (overrides = {}) => ({ name: 'Test University', acceptanceRate: 65, ...overrides });

const course = (overrides = {}) => ({
  title: 'BSc Computer Science',
  degreeLevel: 'Bachelors',
  field: 'computer_science',
  durationMonths: 36,
  countryCode: 'GB',
  tuitionPerYearInr: 2_000_000,
  intakes: ['September'],
  university: university(),
  scholarship: { available: false, maxPercentOfTuition: 0 },
  ...overrides,
  requirements: {
    minEducationLevel: 'class_12',
    minSecondaryPercentage: 70,
    minTertiaryPercentage: null,
    minIelts: 6.5,
    maxBacklogs: 2,
    minWorkExperienceYears: 0,
    ...overrides.requirements,
  },
});

const profile = (overrides = {}) => ({
  education: {
    level: 'class_12',
    secondaryMarks: { system: 'percentage', value: 88 },
    tertiaryMarks: { system: 'percentage', value: null },
    backlogs: 0,
  },
  goal: { degreeLevel: 'Bachelors', fields: ['computer_science'], intake: { season: 'September', year: 2027 } },
  destinations: ['GB'],
  budget: { annualInr: 3_500_000, fundingSource: 'education_loan', needsScholarship: false },
  english: { test: 'ielts', overall: 7.5 },
  shortlist: [],
  ...overrides,
});

const score = (p, c = course()) => scoreCourse(p, c, { country: GB, university: c.university });

/* ─── Marks ────────────────────────────────────────────────────────────────── */

describe('marks normalization', () => {
  it('converts a CBSE CGPA with the ×9.5 rule, not a linear stretch', () => {
    // The naive version would report 83%, clearing a 78% cut-off it does not clear.
    expect(toPercentage({ system: 'cgpa_10', value: 8.3 })).toBe(78.9);
  });

  it('converts a 4.0 GPA proportionally', () => {
    expect(toPercentage({ system: 'gpa_4', value: 3.2 })).toBe(80);
  });

  it('passes a percentage through and caps at 100', () => {
    expect(toPercentage({ system: 'percentage', value: 78.5 })).toBe(78.5);
    expect(toPercentage({ system: 'percentage', value: 120 })).toBe(100);
  });

  it('returns null for absent marks rather than zero', () => {
    // Zero would read as "failed everything" to every scorer downstream.
    expect(toPercentage({ system: 'percentage', value: null })).toBeNull();
    expect(toPercentage(undefined)).toBeNull();
  });
});

/* ─── English tests ────────────────────────────────────────────────────────── */

describe('English test equivalence', () => {
  it('maps each test onto the same IELTS 6.5 band', () => {
    expect(toIeltsEquivalent({ test: 'ielts', overall: 6.5 })).toBe(6.5);
    expect(toIeltsEquivalent({ test: 'pte', overall: 58 })).toBe(6.5);
    expect(toIeltsEquivalent({ test: 'toefl', overall: 79 })).toBe(6.5);
    expect(toIeltsEquivalent({ test: 'duolingo', overall: 105 })).toBe(6.5);
  });

  it('maps the 7.0 band across tests too', () => {
    expect(toIeltsEquivalent({ test: 'pte', overall: 65 })).toBe(7);
    expect(toIeltsEquivalent({ test: 'toefl', overall: 94 })).toBe(7);
    expect(toIeltsEquivalent({ test: 'duolingo', overall: 120 })).toBe(7);
  });

  it('treats an intention as no score', () => {
    expect(toIeltsEquivalent({ test: 'planned', overall: null })).toBeNull();
    expect(toIeltsEquivalent({ test: 'none' })).toBeNull();
  });
});

/* ─── Bands ────────────────────────────────────────────────────────────────── */

describe('match bands', () => {
  it('places every boundary on the higher band', () => {
    expect(matchBand(90).key).toBe('excellent');
    expect(matchBand(89).key).toBe('strong');
    expect(matchBand(75).key).toBe('strong');
    expect(matchBand(74).key).toBe('possible');
    expect(matchBand(60).key).toBe('possible');
    expect(matchBand(59).key).toBe('ambitious');
    expect(matchBand(0).key).toBe('ambitious');
  });
});

/* ─── Eligibility ──────────────────────────────────────────────────────────── */

describe('eligibility by education level', () => {
  it('opens bachelor’s degrees directly to a Class 12 leaver', () => {
    expect(admissionRoute('class_12', 'Bachelors')).toBe('direct');
  });

  it('offers a conditional bachelor’s place to a student sitting Class 12', () => {
    expect(admissionRoute('class_12_pursuing', 'Bachelors')).toBe('conditional');
  });

  it('shows a Class 11 student what Class 12 will unlock, marked as future', () => {
    expect(admissionRoute('class_11', 'Bachelors')).toBe('future');
    expect(degreeLevelsByRoute('class_11', 'future')).toContain('Bachelors');
  });

  it('never offers a master’s to a school leaver', () => {
    expect(admissionRoute('class_12', 'Masters')).toBeNull();
    expect(eligibleDegreeLevels('class_12')).not.toContain('Masters');
  });

  it('opens master’s degrees to graduates, conditionally in the final year', () => {
    expect(admissionRoute('bachelors', 'Masters')).toBe('direct');
    expect(admissionRoute('bachelors_pursuing', 'Masters')).toBe('conditional');
  });

  it('lists eligible levels in academic order', () => {
    expect(eligibleDegreeLevels('class_12')).toEqual(['Foundation', 'Certificate', 'Diploma', 'Bachelors']);
  });
});

describe('resolveRoute — the second gate, on the course’s own minimum', () => {
  it('refuses a postgraduate certificate to a Class 12 leaver', () => {
    // The level is on their trajectory, but the course wants a degree they neither
    // hold nor are studying for — so there is no conditional offer to make.
    const pgCertificate = course({
      degreeLevel: 'Certificate',
      requirements: { minEducationLevel: 'bachelors', minTertiaryPercentage: 60, minSecondaryPercentage: null },
    });
    expect(resolveRoute(profile(), pgCertificate)).toBeNull();
    expect(score(profile(), pgCertificate)).toBeNull();
  });

  it('admits a Class 12 leaver to an undergraduate certificate', () => {
    const ugCertificate = course({ degreeLevel: 'Certificate', requirements: { minEducationLevel: 'class_12' } });
    expect(resolveRoute(profile(), ugCertificate).route).toBe('direct');
  });

  it('makes a conditional offer against the result a student is waiting for', () => {
    const applicant = profile({ education: { ...profile().education, level: 'class_12_pursuing' } });
    const resolved = resolveRoute(applicant, course());

    expect(resolved.route).toBe('conditional');
    expect(resolved.conditional).toBe(true);
    expect(resolved.note).toMatch(/predicted grades/i);
  });

  it('marks a bachelor’s degree as future for a Class 10 student', () => {
    const schoolStudent = profile({ education: { ...profile().education, level: 'class_10' } });
    expect(resolveRoute(schoolStudent, course()).route).toBe('future');
  });

  it('admits a Class 10 student directly to a foundation year that accepts them', () => {
    const schoolStudent = profile({ education: { ...profile().education, level: 'class_10' } });
    const foundation = course({ degreeLevel: 'Foundation', requirements: { minEducationLevel: 'class_10' } });

    expect(resolveRoute(schoolStudent, foundation).route).toBe('direct');
  });
});

/* ─── Scoring ──────────────────────────────────────────────────────────────── */

describe('scoreCourse', () => {
  it('weights sum to 100, so a score is a percentage', () => {
    expect(TOTAL_WEIGHT).toBe(100);
    expect(Object.keys(WEIGHTS)).toHaveLength(7);
  });

  it('scores an all-round fit as an excellent match', () => {
    const match = score(profile());

    expect(match.score).toBeGreaterThanOrEqual(90);
    expect(match.band).toBe('excellent');
    expect(match.route).toBe('direct');
    expect(match.watchouts).toHaveLength(0);
    expect(match.breakdown).toHaveLength(7);
  });

  it('explains itself — every scorer returns a reason', () => {
    const match = score(profile());
    expect(match.breakdown.every((item) => item.reason.length > 0)).toBe(true);
    expect(match.strengths.length).toBeGreaterThan(0);
  });

  it('adds tuition and living costs together, because a family funds both', () => {
    const match = score(profile());
    expect(match.costs).toMatchObject({ tuition: 2_000_000, living: 950_000, total: 2_950_000 });
  });

  it('flags a course over budget without hiding it', () => {
    const match = score(profile({ budget: { annualInr: 1_500_000 } }));
    const budget = match.breakdown.find((item) => item.key === 'budget');

    expect(budget.verdict).toBe('weak');
    expect(budget.score).toBeLessThan(WEIGHTS.budget * 0.2);
    expect(match.watchouts.some((text) => /budget/i.test(text))).toBe(true);
    // The shortfall is stated in rupees, not implied by a low score.
    expect(match.costs.gap).toBe(1_450_000);
  });

  it('credits a scholarship that would close a budget gap, and says it is a condition', () => {
    const funded = course({ scholarship: { available: true, maxPercentOfTuition: 50 } });
    const match = score(profile({ budget: { annualInr: 2_100_000 } }), funded);
    const budget = match.breakdown.find((item) => item.key === 'budget');

    expect(budget.reason).toMatch(/scholarship would bring it within reach/i);
    expect(budget.watchout).toBe(true);
  });

  it('caps academic fit when backlogs exceed the course limit', () => {
    const match = score(profile({ education: { ...profile().education, backlogs: 3 } }));
    const academic = match.breakdown.find((item) => item.key === 'academic');

    expect(academic.verdict).toBe('weak');
    expect(academic.reason).toMatch(/3 backlogs against a limit of 2/);
  });

  it('rates marks just under the cut-off as worth a try, not hopeless', () => {
    const nearMiss = profile({
      education: { ...profile().education, secondaryMarks: { system: 'percentage', value: 67 } },
    });
    const academic = score(nearMiss).breakdown.find((item) => item.key === 'academic');

    expect(academic.verdict).toBe('fair');
    expect(academic.reason).toMatch(/foundation year/i);
  });

  it('treats half a band short of the English requirement as fixable', () => {
    const match = score(profile({ english: { test: 'ielts', overall: 6 } }));
    const english = match.breakdown.find((item) => item.key === 'english');

    expect(english.verdict).toBe('fair');
    expect(english.reason).toMatch(/pre-sessional|retake/i);
  });

  it('ranks a destination by the student’s own preference order', () => {
    const first = score(profile({ destinations: ['GB', 'CA'] })).breakdown.find((i) => i.key === 'destination');
    const second = score(profile({ destinations: ['CA', 'GB'] })).breakdown.find((i) => i.key === 'destination');
    const absent = score(profile({ destinations: ['CA', 'AU'] })).breakdown.find((i) => i.key === 'destination');

    expect(first.score).toBeGreaterThan(second.score);
    expect(second.score).toBeGreaterThan(absent.score);
    expect(absent.score).toBe(0);
  });

  it('gives partial credit — never zero — for what the student has not entered', () => {
    // A profile with only an education level must not rank every course as hopeless;
    // it must rank them provisionally and name what is missing.
    const bare = { education: { level: 'class_12' }, goal: {}, destinations: [], budget: {}, english: { test: 'none' } };
    const match = score(bare);

    expect(match.score).toBeGreaterThan(40);
    expect(match.score).toBeLessThan(70);
    expect(match.unknowns).toContain('Budget fit');
    expect(match.unknowns).toContain('Destination');
  });
});

describe('rankCourses', () => {
  it('sorts by score, then by cost so the cheaper equal match wins', () => {
    const cheap = course({ title: 'Cheaper', tuitionPerYearInr: 1_500_000 });
    const dear = course({ title: 'Dearer', tuitionPerYearInr: 2_000_000 });

    const ranked = rankCourses(profile(), [dear, cheap], { countriesByCode: new Map([['GB', GB]]) });

    expect(ranked[0].course.title).toBe('Cheaper');
    expect(ranked[0].match.score).toBeGreaterThanOrEqual(ranked[1].match.score);
  });

  it('drops courses the student cannot be admitted to', () => {
    const masters = course({
      degreeLevel: 'Masters',
      requirements: { minEducationLevel: 'bachelors', minTertiaryPercentage: 60 },
    });

    const ranked = rankCourses(profile(), [course(), masters], { countriesByCode: new Map([['GB', GB]]) });

    expect(ranked).toHaveLength(1);
    expect(ranked[0].course.degreeLevel).toBe('Bachelors');
  });

  it('honours the limit', () => {
    const many = Array.from({ length: 10 }, (_, index) => course({ title: `Course ${index}` }));
    expect(rankCourses(profile(), many, { countriesByCode: new Map([['GB', GB]]), limit: 3 })).toHaveLength(3);
  });
});

/* ─── Intakes ──────────────────────────────────────────────────────────────── */

describe('intake distance', () => {
  it('measures on a 12-month circle', () => {
    // January to October is three months, not nine.
    expect(monthsToNearestIntake({ season: 'January' }, ['October'])).toBe(3);
    expect(monthsToNearestIntake({ season: 'September' }, ['September'])).toBe(0);
    expect(monthsToNearestIntake({ season: 'February' }, ['July', 'January'])).toBe(1);
  });
});

/* ─── Fields ───────────────────────────────────────────────────────────────── */

describe('field expansion', () => {
  it('includes neighbours so related courses are discoverable', () => {
    const expanded = expandFields(['computer_science']);
    expect(expanded).toContain('computer_science');
    expect(expanded).toContain('data_analytics');
  });

  it('deduplicates overlapping neighbours', () => {
    const expanded = expandFields(['computer_science', 'data_analytics']);
    expect(new Set(expanded).size).toBe(expanded.length);
  });
});

/* ─── Profile completion and guidance ──────────────────────────────────────── */

describe('profile completion', () => {
  it('is zero for an untouched profile and 100 for a filled one', () => {
    const empty = { education: {}, goal: {}, destinations: [], budget: {}, english: { test: 'none' } };
    expect(completionOf(empty).percent).toBe(0);

    const full = {
      ...profile(),
      education: { ...profile().education, stream: 'science_pcm', boardOrInstitution: 'CBSE' },
    };
    expect(completionOf(full).percent).toBe(100);
    expect(completionOf(full).missing).toHaveLength(0);
  });

  it('points each gap at the wizard step that fills it', () => {
    const partial = { education: { level: 'class_12' }, goal: {}, destinations: [], budget: {}, english: {} };
    const missing = completionOf(partial).missing;

    expect(missing.every((item) => Number.isInteger(item.step))).toBe(true);
    expect(missing.find((item) => item.key === 'budget').step).toBe(4);
  });

  it('reads degree marks for a master’s applicant, not Class 12 marks', () => {
    const graduate = {
      education: { level: 'bachelors', secondaryMarks: { system: 'percentage', value: 90 }, tertiaryMarks: {} },
      goal: { degreeLevel: 'Masters' },
      destinations: [],
      budget: {},
      english: {},
    };

    expect(completionOf(graduate).items.find((item) => item.key === 'marks').done).toBe(false);
  });
});

describe('guidance', () => {
  it('names the outstanding milestone for a student still in school', () => {
    const guidance = guidanceFor(profile({ education: { level: 'class_12_pursuing' } }));

    expect(guidance.preClass12).toBe(true);
    expect(guidance.milestone).toBe('Class 12');
    expect(guidance.conditionalDegreeLevels).toContain('Bachelors');
    expect(guidance.actions[0].label).toMatch(/Complete your Class 12/);
  });

  it('has no outstanding milestone once Class 12 is complete', () => {
    const guidance = guidanceFor(profile());

    expect(guidance.milestone).toBeNull();
    expect(guidance.eligibleDegreeLevels).toContain('Bachelors');
    expect(guidance.preClass12).toBe(false);
  });

  it('asks for an education level before anything else', () => {
    const guidance = guidanceFor({ education: {}, goal: {}, destinations: [], budget: {}, english: {} });

    expect(guidance.known).toBe(false);
    expect(guidance.actions[0].step).toBe(1);
  });
});
