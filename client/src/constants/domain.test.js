import { describe, expect, it } from 'vitest';

import {
  DEGREE_LEVELS,
  FIELDS,
  EDUCATION_LEVEL_ORDER,
  degreeLabel,
  educationLabel,
  fieldLabel,
  nextIntake,
} from './domain.js';

/**
 * Guards the label accessors.
 *
 * FIELDS maps slug→string while DEGREE_LEVELS maps slug→{label,hint}. A filter
 * dropdown that reached into the shape directly with `entry.label` produced
 * `undefined` for every FIELDS option — the <option> elements rendered, blank,
 * with no error anywhere. Going through these accessors is what prevents that,
 * so they need to be provably total over their own key sets.
 */
describe('label accessors are total over their key sets', () => {
  it('every FIELDS slug resolves to a non-empty label', () => {
    const slugs = Object.keys(FIELDS);
    expect(slugs.length).toBeGreaterThan(0);

    for (const slug of slugs) {
      const label = fieldLabel(slug);
      expect(typeof label, slug).toBe('string');
      expect(label.trim(), slug).not.toBe('');
      // The bug produced literally "undefined" in some renderings.
      expect(label, slug).not.toMatch(/undefined/i);
    }
  });

  it('every DEGREE_LEVELS slug resolves to a non-empty label', () => {
    for (const slug of Object.keys(DEGREE_LEVELS)) {
      const label = degreeLabel(slug);
      expect(typeof label, slug).toBe('string');
      expect(label.trim(), slug).not.toBe('');
      expect(label, slug).not.toMatch(/undefined/i);
    }
  });

  it('every education level resolves to a non-empty label', () => {
    for (const slug of EDUCATION_LEVEL_ORDER) {
      expect(educationLabel(slug).trim(), slug).not.toBe('');
    }
  });
});

describe('unknown slugs degrade readably', () => {
  it('falls back to a humanized slug rather than undefined', () => {
    // A slug added server-side before the client knows about it must still render
    // something a person can read, not a blank option.
    for (const label of [fieldLabel('quantum_basket_weaving'), degreeLabel('Postdoc')]) {
      expect(typeof label).toBe('string');
      expect(label.trim()).not.toBe('');
      expect(label).not.toMatch(/undefined/i);
    }
  });

  it('returns an empty string for null or undefined instead of throwing', () => {
    // Several fields reaching these accessors are nullable — an application
    // snapshot degreeLevel, an unset goal — so a throw here takes down a page.
    for (const value of [null, undefined, '']) {
      expect(fieldLabel(value)).toBe('');
      expect(degreeLabel(value)).toBe('');
    }
  });
});

/**
 * Course.intakes stores season names with no year, so the year has to be
 * derived. Getting this wrong means offering a student an intake that has
 * already passed, which is worse than offering none at all.
 *
 * `from` is injectable precisely so these cases can be asserted without
 * freezing the clock.
 */
describe('nextIntake', () => {
  const june2026 = new Date(2026, 5, 15);

  it('picks the soonest season still ahead this year', () => {
    expect(nextIntake(['September', 'January'], june2026)).toEqual({ season: 'September', year: 2026 });
  });

  it('rolls a season that has already passed into next year', () => {
    expect(nextIntake(['January'], june2026)).toEqual({ season: 'January', year: 2027 });
  });

  it('treats the current month as still open', () => {
    // A July intake is usually still processing applications during July.
    expect(nextIntake(['July'], new Date(2026, 6, 20))).toEqual({ season: 'July', year: 2026 });
  });

  it('prefers a later season this year over an earlier one next year', () => {
    expect(nextIntake(['February', 'October'], june2026)).toEqual({ season: 'October', year: 2026 });
  });

  it('returns null rather than a bogus intake when there is nothing to pick', () => {
    expect(nextIntake([], june2026)).toBeNull();
    expect(nextIntake(undefined, june2026)).toBeNull();
  });

  it('ignores a season it does not recognise', () => {
    // Guards against the catalogue growing a season name before this map does.
    expect(nextIntake(['Monsoon'], june2026)).toBeNull();
    expect(nextIntake(['Monsoon', 'September'], june2026)).toEqual({ season: 'September', year: 2026 });
  });

  it('rolls every season forward in December', () => {
    expect(nextIntake(['January', 'September'], new Date(2026, 11, 10))).toEqual({ season: 'January', year: 2027 });
  });
});
