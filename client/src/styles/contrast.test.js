import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * WCAG contrast guarantees for the design tokens.
 *
 * An axe-core sweep across all 33 routes found 290 failing nodes, traced back to
 * four tokens used as text: navy-400 (2.81:1), navy-500 (4.30:1) and the
 * success/warning/danger -600 ramp (3.40, 2.88, 4.24). This test exists so that
 * lightening one of them back — which is a one-character edit and looks
 * harmless in isolation — fails here rather than in an audit six months later.
 *
 * Parsed out of the stylesheet rather than duplicated, so the assertion is
 * against what actually ships.
 */

// import.meta.dirname rather than a file URL: under Vitest, import.meta.url is
// not necessarily file-scheme.
const css = readFileSync(path.resolve(import.meta.dirname, 'theme.css'), 'utf8');

/** Reads a `--color-*` custom property out of the `@theme` block. */
const token = (name) => {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
  if (!match) throw new Error(`token --color-${name} not found in theme.css`);
  return match[1].toLowerCase();
};

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** WCAG 2.1 relative luminance. */
const luminance = (hex) => {
  const [r, g, b] = channels(hex).map((value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a, b) => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Every light surface a muted token actually sits on. The binding constraint is
 * the *darkest* of these, not white — dark text on a tinted panel has less
 * contrast than the same text on white.
 */
const LIGHT_SURFACES = {
  surface: '#ffffff',
  slate50: '#f8fafc',
  canvas: token('canvas'),
  navy50: token('navy-50'),
};

const AA_TEXT = 4.5;

/** Worst ratio across every light surface the token appears on. */
const worstOnLight = (hex) => Math.min(...Object.values(LIGHT_SURFACES).map((bg) => contrast(hex, bg)));

describe('token contrast on light surfaces', () => {
  // navy-300 is excluded on purpose: it is a border and dark-surface text colour,
  // never body text on a light background.
  it.each([['navy-400'], ['navy-500'], ['navy-600'], ['navy-700'], ['navy-800'], ['navy-900'], ['navy-950']])(
    '%s meets AA for body text',
    (name) => {
      expect(worstOnLight(token(name))).toBeGreaterThanOrEqual(AA_TEXT);
    }
  );

  it.each([['success-700'], ['warning-700'], ['danger-700'], ['info-600'], ['info-700']])(
    '%s meets AA for body text',
    (name) => {
      expect(worstOnLight(token(name))).toBeGreaterThanOrEqual(AA_TEXT);
    }
  );

  it('keeps the navy ramp monotonically darker', () => {
    // A ramp that crosses over makes "one step lighter" unpredictable, and the
    // contrast fix above chose values on the assumption that it holds.
    const ramp = ['navy-400', 'navy-500', 'navy-600', 'navy-700', 'navy-800', 'navy-900', 'navy-950'];
    const ratios = ramp.map((name) => worstOnLight(token(name)));

    for (let i = 1; i < ratios.length; i++) {
      expect(ratios[i], `${ramp[i]} should be darker than ${ramp[i - 1]}`).toBeGreaterThan(ratios[i - 1]);
    }
  });
});

describe('token contrast on the dark surfaces', () => {
  // The footer, the auth aside and the cost-calculator summary panel are all
  // navy-950. Muted text there has to get *lighter*, not darker — the opposite
  // direction from everything above, which is exactly why it was missed.
  it('navy-300 meets AA on navy-950', () => {
    expect(contrast(token('navy-300'), token('navy-950'))).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('navy-400 does NOT meet AA on navy-950, so it must not be used there', () => {
    // Documents the trap rather than asserting a wish: if this ever starts
    // passing, navy-400 became dark enough to be wrong on light surfaces too.
    expect(contrast(token('navy-400'), token('navy-950'))).toBeLessThan(AA_TEXT);
  });
});

describe('the brand primary stays usable', () => {
  it('primary-700 meets AA as a text colour', () => {
    expect(worstOnLight(token('primary-700'))).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('navy-950 on primary-500 meets AA, which is why buttons use a navy label', () => {
    // White on the brand orange measures ~2.8:1. This is the reason Button's
    // primary variant is dark-on-orange rather than the conventional inverse.
    expect(contrast(token('navy-950'), token('primary-500'))).toBeGreaterThanOrEqual(AA_TEXT);
    expect(contrast('#ffffff', token('primary-500'))).toBeLessThan(AA_TEXT);
  });
});
