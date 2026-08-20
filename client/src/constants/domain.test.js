import { describe, expect, it } from 'vitest';

import {
  DEGREE_LEVELS,
  FIELDS,
  EDUCATION_LEVEL_ORDER,
  degreeLabel,
  educationLabel,
  fieldLabel,
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
