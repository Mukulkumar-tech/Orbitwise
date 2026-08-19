import { describe, expect, it } from 'vitest';

import { INITIAL_VALUES, STEPS, patchForStep, validateStep, valuesFromProfile } from './wizardSteps.js';
import { formatInr, marksBasisFor } from '../../constants/domain.js';

/**
 * Wizard rules, tested without rendering.
 *
 * These are the two places the form can silently corrupt a profile: validating the
 * wrong bound for the grading system or test the student chose, and writing marks
 * into the wrong field so a master's entry requirement reads a Class 12 percentage.
 * Both are invisible in the UI and obvious here.
 */

const STEP = Object.fromEntries(STEPS.map((step, index) => [step.id, index]));

const withValues = (overrides) => ({ ...INITIAL_VALUES, ...overrides });

describe('education step', () => {
  it('requires a level and marks before continuing', () => {
    const { ok, errors } = validateStep(STEP.education, INITIAL_VALUES);

    expect(ok).toBe(false);
    expect(errors.educationLevel).toBeTruthy();
    expect(errors.marksValue).toBeTruthy();
  });

  it('bounds marks by the grading system the student chose', () => {
    const asCgpa = withValues({ educationLevel: 'class_12', marksSystem: 'cgpa_10', marksValue: '88' });
    expect(validateStep(STEP.education, asCgpa).errors.marksValue).toMatch(/cannot exceed 10/);

    const asPercentage = withValues({ educationLevel: 'class_12', marksSystem: 'percentage', marksValue: '88' });
    expect(validateStep(STEP.education, asPercentage).ok).toBe(true);
  });

  it('rejects zero and non-numeric marks rather than storing them', () => {
    expect(validateStep(STEP.education, withValues({ educationLevel: 'class_12', marksValue: '0' })).ok).toBe(false);
    expect(validateStep(STEP.education, withValues({ educationLevel: 'class_12', marksValue: 'abc' })).ok).toBe(false);
  });

  it('writes school marks to secondaryMarks and degree marks to tertiaryMarks', () => {
    const schoolLeaver = withValues({ educationLevel: 'class_12', marksValue: '82' });
    const graduate = withValues({ educationLevel: 'bachelors', marksValue: '72' });

    expect(patchForStep(STEP.education, schoolLeaver).education).toMatchObject({
      secondaryMarks: { system: 'percentage', value: 82 },
    });
    expect(patchForStep(STEP.education, schoolLeaver).education.tertiaryMarks).toBeUndefined();

    expect(patchForStep(STEP.education, graduate).education).toMatchObject({
      tertiaryMarks: { system: 'percentage', value: 72 },
    });
  });

  it('agrees with the domain helper about which marksheet each level uses', () => {
    expect(marksBasisFor('class_12_pursuing')).toBe('secondary');
    expect(marksBasisFor('bachelors_pursuing')).toBe('tertiary');
  });

  it('sends an unanswered optional field as null, not as an empty string', () => {
    const values = withValues({ educationLevel: 'class_12', marksValue: '82' });
    const { education } = patchForStep(STEP.education, values);

    expect(education.yearOfCompletion).toBeNull();
    expect(education.stream).toBeNull();
    expect(education.backlogs).toBe(0);
  });
});

describe('goal step', () => {
  const valid = { degreeLevel: 'Bachelors', fields: ['computer_science'], intakeSeason: 'September', intakeYear: '2027' };

  it('requires a qualification, a subject and an intake', () => {
    const { errors } = validateStep(STEP.goal, INITIAL_VALUES);

    expect(errors.degreeLevel).toBeTruthy();
    expect(errors.fields).toBeTruthy();
    expect(errors.intakeSeason).toBeTruthy();
  });

  it('accepts up to three subjects and refuses a fourth', () => {
    expect(validateStep(STEP.goal, withValues({ ...valid, fields: ['computer_science', 'business', 'design'] })).ok).toBe(
      true
    );
    expect(
      validateStep(STEP.goal, withValues({ ...valid, fields: ['computer_science', 'business', 'design', 'law'] })).errors
        .fields
    ).toMatch(/up to three/i);
  });

  it('nests the intake the way the profile stores it', () => {
    expect(patchForStep(STEP.goal, withValues(valid)).goal).toEqual({
      degreeLevel: 'Bachelors',
      fields: ['computer_science'],
      intake: { season: 'September', year: 2027 },
    });
  });
});

describe('destination step', () => {
  it('requires at least one and allows at most five', () => {
    expect(validateStep(STEP.destinations, INITIAL_VALUES).ok).toBe(false);
    expect(validateStep(STEP.destinations, withValues({ destinations: ['GB'] })).ok).toBe(true);
    expect(
      validateStep(STEP.destinations, withValues({ destinations: ['GB', 'CA', 'AU', 'DE', 'IE', 'NZ'] })).errors
        .destinations
    ).toMatch(/up to five/i);
  });

  it('preserves selection order, which is the preference ranking', () => {
    const values = withValues({ destinations: ['CA', 'GB', 'AU'] });
    expect(patchForStep(STEP.destinations, values).destinations).toEqual(['CA', 'GB', 'AU']);
  });
});

describe('budget step', () => {
  it('rejects a figure too small to fund anything', () => {
    const values = withValues({ budgetAnnualInr: '50000', fundingSource: 'self' });
    expect(validateStep(STEP.budget, values).errors.budgetAnnualInr).toMatch(/at least/i);
  });

  it('requires a funding source', () => {
    const values = withValues({ budgetAnnualInr: '2500000' });
    expect(validateStep(STEP.budget, values).errors.fundingSource).toBeTruthy();
  });

  it('accepts a realistic budget', () => {
    const values = withValues({ budgetAnnualInr: '2500000', fundingSource: 'education_loan' });
    expect(validateStep(STEP.budget, values).ok).toBe(true);
    expect(patchForStep(STEP.budget, values).budget.annualInr).toBe(2_500_000);
  });
});

describe('english step', () => {
  it('requires a score for a test that has one', () => {
    expect(validateStep(STEP.english, withValues({ englishTest: 'ielts' })).errors.englishOverall).toBeTruthy();
  });

  it('bounds the score by that test’s own scale', () => {
    // 65 is a PTE score; against IELTS it is nonsense, and catching it here saves a
    // round trip that would come back as a dotted server path.
    expect(
      validateStep(STEP.english, withValues({ englishTest: 'ielts', englishOverall: '65' })).errors.englishOverall
    ).toMatch(/0 to 9/);
    expect(validateStep(STEP.english, withValues({ englishTest: 'pte', englishOverall: '65' })).ok).toBe(true);
  });

  it('treats “not taken yet” as a complete answer', () => {
    expect(validateStep(STEP.english, withValues({ englishTest: 'planned' })).ok).toBe(true);
    expect(validateStep(STEP.english, withValues({ englishTest: 'none' })).ok).toBe(true);
  });

  it('clears a stale score when the answer becomes “not taken”', () => {
    // The server rejects a score with no test, so carrying the old number forward
    // would turn a valid edit into a 400.
    const values = withValues({ englishTest: 'none', englishOverall: '7' });
    expect(patchForStep(STEP.english, values).english).toEqual({ test: 'none', overall: null });
  });
});

describe('valuesFromProfile', () => {
  const profile = {
    education: {
      level: 'bachelors',
      stream: 'science_pcm',
      boardOrInstitution: 'Delhi University',
      secondaryMarks: { system: 'percentage', value: 88 },
      tertiaryMarks: { system: 'cgpa_10', value: 7.8 },
      yearOfCompletion: 2025,
      backlogs: 1,
    },
    goal: { degreeLevel: 'Masters', fields: ['data_analytics'], intake: { season: 'September', year: 2027 } },
    destinations: ['IE', 'GB'],
    budget: { annualInr: 3_000_000, fundingSource: 'education_loan', needsScholarship: true },
    english: { test: 'pte', overall: 62 },
  };

  it('loads the marksheet that matches the education level', () => {
    const values = valuesFromProfile(profile);

    // A graduate edits their degree marks, not the Class 12 marks still on file.
    expect(values.marksSystem).toBe('cgpa_10');
    expect(values.marksValue).toBe('7.8');
  });

  it('renders every number as a string, so inputs stay clearable', () => {
    const values = valuesFromProfile(profile);

    expect(values.budgetAnnualInr).toBe('3000000');
    expect(values.intakeYear).toBe('2027');
    expect(values.englishOverall).toBe('62');
    expect(values.backlogs).toBe('1');
  });

  it('round-trips through a patch without changing anything', () => {
    const values = valuesFromProfile(profile);

    expect(patchForStep(STEP.english, values).english).toEqual({ test: 'pte', overall: 62 });
    expect(patchForStep(STEP.destinations, values).destinations).toEqual(['IE', 'GB']);
    expect(patchForStep(STEP.education, values).education.tertiaryMarks).toEqual({ system: 'cgpa_10', value: 7.8 });
  });

  it('falls back to blank values for a profile that does not exist yet', () => {
    expect(valuesFromProfile(null)).toEqual(INITIAL_VALUES);
    expect(valuesFromProfile({}).marksValue).toBe('');
  });
});

describe('formatInr', () => {
  it('reads money in the units Indian families plan in', () => {
    expect(formatInr(2_950_000)).toBe('₹29.5L');
    expect(formatInr(3_000_000)).toBe('₹30L');
    expect(formatInr(12_500_000)).toBe('₹1.25Cr');
    expect(formatInr(45_000)).toBe('₹45,000');
  });

  it('shows an em dash rather than ₹0 for an unknown amount', () => {
    expect(formatInr(null)).toBe('—');
    expect(formatInr(undefined)).toBe('—');
    expect(formatInr(0)).toBe('₹0');
  });
});
