import { describe, expect, it } from 'vitest';

import { budgetVerdict, calculateCost, scholarshipValue } from '../services/costService.js';

/** A two-year master's with round numbers, so arithmetic errors are obvious. */
const COSTS = {
  tuition: 2_000_000,
  accommodation: 600_000,
  food: 200_000,
  transport: 100_000,
  insurance: 60_000,
  flights: 80_000,
  other: 40_000,
  visa: 30_000,
  setup: 50_000,
};

describe('calculateCost', () => {
  it('separates recurring costs from one-time costs', () => {
    const result = calculateCost({ costs: COSTS, durationMonths: 24 });

    expect(result.annualTotal).toBe(3_080_000);
    expect(result.oneTimeTotal).toBe(80_000);
    expect(result.firstYear).toBe(3_160_000);
    expect(result.laterYear).toBe(3_080_000);
  });

  it('does not multiply one-time costs by the number of years', () => {
    // The whole point of the two groups. A visa fee charged three times over a
    // three-year degree overstates the total by twice the fee.
    const oneYear = calculateCost({ costs: COSTS, durationMonths: 12 });
    const threeYear = calculateCost({ costs: COSTS, durationMonths: 36 });

    expect(threeYear.grossTotal - oneYear.grossTotal).toBe(3_080_000 * 2);
    expect(threeYear.oneTimeTotal).toBe(oneYear.oneTimeTotal);
  });

  it('totals annual costs across the programme plus one-time once', () => {
    const result = calculateCost({ costs: COSTS, durationMonths: 24 });
    expect(result.grossTotal).toBe(3_080_000 * 2 + 80_000);
  });

  it('reports monthly living cost excluding tuition', () => {
    // This is the number a visa office asks about, so tuition must not be in it.
    const result = calculateCost({ costs: COSTS, durationMonths: 24 });
    expect(result.monthlyLiving).toBe(Math.round(1_080_000 / 12));
  });

  it('rounds a part-year programme up to a full year', () => {
    const result = calculateCost({ costs: COSTS, durationMonths: 6 });
    expect(result.years).toBe(1);
    expect(result.grossTotal).toBe(3_080_000 + 80_000);
  });

  it('treats missing and negative line items as zero', () => {
    const result = calculateCost({ costs: { tuition: 1_000_000, food: -5000 }, durationMonths: 12 });
    expect(result.annualTotal).toBe(1_000_000);
    expect(result.breakdown.annual.food).toBe(0);
  });

  it('handles an empty input without dividing by zero', () => {
    const result = calculateCost({});
    expect(result.grossTotal).toBe(0);
    expect(result.savedPercent).toBe(0);
    expect(Number.isFinite(result.monthlyLiving)).toBe(true);
  });
});

describe('scholarship application', () => {
  it('reduces tuition only, never total cost', () => {
    // The most damaging error this engine could make. A 50% award on ₹20L tuition
    // with ₹10.8L living costs saves ₹10L a year, not half of ₹30.8L.
    const result = calculateCost({
      costs: COSTS,
      durationMonths: 24,
      scholarship: { type: 'percentage', percentOfTuition: 50 },
    });

    expect(result.scholarship.perYear).toBe(1_000_000);
    expect(result.scholarship.total).toBe(2_000_000);
    expect(result.netTotal).toBe(result.grossTotal - 2_000_000);
    // Half of tuition is well under half of the total.
    expect(result.savedPercent).toBeLessThan(50);
  });

  it('treats a full award as full tuition, not a free degree', () => {
    const result = calculateCost({ costs: COSTS, durationMonths: 24, scholarship: { type: 'full' } });

    expect(result.scholarship.total).toBe(4_000_000);
    // Living costs, visa and setup all still have to be funded.
    expect(result.netTotal).toBeGreaterThan(0);
    expect(result.netTotal).toBe(result.grossTotal - 4_000_000);
  });

  it('spreads a one-time cash award across the programme', () => {
    const perYear = calculateCost({
      costs: COSTS,
      durationMonths: 24,
      scholarship: { type: 'fixed', amountInr: 500_000, recurrence: 'per_year' },
    });
    const oneTime = calculateCost({
      costs: COSTS,
      durationMonths: 24,
      scholarship: { type: 'fixed', amountInr: 500_000, recurrence: 'one_time' },
    });

    // A per-year award is worth twice a one-time award of the same face value
    // over two years. Conflating them overstates affordability.
    expect(perYear.scholarship.total).toBe(1_000_000);
    expect(oneTime.scholarship.total).toBe(500_000);
  });

  it('never awards more than the tuition actually charged', () => {
    const result = calculateCost({
      costs: { tuition: 300_000 },
      durationMonths: 12,
      scholarship: { type: 'fixed', amountInr: 900_000, recurrence: 'per_year' },
    });

    expect(result.scholarship.total).toBe(300_000);
    expect(result.netTotal).toBe(0);
  });

  it('never produces a negative net total', () => {
    const result = calculateCost({
      costs: { tuition: 100_000 },
      durationMonths: 12,
      scholarship: { type: 'fixed', amountInr: 10_000_000, recurrence: 'per_year' },
    });
    expect(result.netTotal).toBeGreaterThanOrEqual(0);
  });

  it('reports no award when there is no scholarship', () => {
    const result = calculateCost({ costs: COSTS, durationMonths: 24 });
    expect(result.scholarship.applies).toBe(false);
    expect(result.netTotal).toBe(result.grossTotal);
  });
});

describe('scholarshipValue', () => {
  it('caps a percentage award at 100%', () => {
    const award = scholarshipValue({
      scholarship: { type: 'percentage', percentOfTuition: 150 },
      annualTuition: 1_000_000,
      years: 1,
    });
    expect(award.perYear).toBe(1_000_000);
  });
});

describe('budgetVerdict', () => {
  it('reports a shortfall per year rather than a bare verdict', () => {
    const verdict = budgetVerdict({ netTotal: 6_000_000, years: 2, annualBudgetInr: 2_500_000 });

    expect(verdict.withinBudget).toBe(false);
    expect(verdict.budgetTotal).toBe(5_000_000);
    expect(verdict.gap).toBe(1_000_000);
    // Actionable: the student can look for a bigger award or a cheaper city.
    expect(verdict.gapPerYear).toBe(500_000);
    expect(verdict.usedPercent).toBe(120);
  });

  it('confirms an affordable plan', () => {
    const verdict = budgetVerdict({ netTotal: 4_000_000, years: 2, annualBudgetInr: 2_500_000 });
    expect(verdict.withinBudget).toBe(true);
    expect(verdict.gap).toBeLessThan(0);
  });

  it('says nothing when no budget is known', () => {
    expect(budgetVerdict({ netTotal: 1_000_000, years: 1, annualBudgetInr: 0 }).known).toBe(false);
  });
});
