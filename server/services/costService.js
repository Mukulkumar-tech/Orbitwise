/**
 * Study-abroad cost arithmetic.
 *
 * Pure and total: no database, no clock, no request. Every figure a family plans
 * around comes out of here, so it needs to be verifiable at its boundaries rather
 * than only observable through an endpoint.
 *
 * Two modelling decisions carry the whole thing:
 *
 * 1. One-time costs are not multiplied by years. A visa fee is paid once; adding
 *    it to every year of a three-year degree overstates the total by twice the
 *    fee. Separating the two groups is the difference between a planning number
 *    and a scary number.
 *
 * 2. A scholarship reduces *tuition*, not total cost. A "50% scholarship" on a
 *    course with ₹20L tuition and ₹10L living costs saves ₹10L, not ₹15L. Getting
 *    this wrong would tell a student they can afford something they cannot, which
 *    is the most damaging error this file could make.
 */

/** Recurring annual costs. Every one of these is paid again each year of study. */
const ANNUAL_KEYS = ['tuition', 'accommodation', 'food', 'transport', 'insurance', 'flights', 'other'];

/** Paid once for the whole journey, regardless of duration. */
const ONE_TIME_KEYS = ['visa', 'setup'];

export const COST_FIELDS = { annual: ANNUAL_KEYS, oneTime: ONE_TIME_KEYS };

const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const sum = (source, keys) => keys.reduce((total, key) => total + num(source[key]), 0);

const round = (value) => Math.round(value);

/**
 * Value of a scholarship against a given annual tuition, in rupees.
 *
 * `per_year` awards are worth their value once per year of study; `one_time`
 * awards once in total. Treating a one-time award as recurring is the other
 * common way to overstate affordability.
 */
export function scholarshipValue({ scholarship, annualTuition, years }) {
  if (!scholarship) return { perYear: 0, total: 0, describes: 'none' };

  const { type, percentOfTuition = 0, amountInr = 0, recurrence = 'per_year' } = scholarship;

  if (type === 'full') {
    return { perYear: annualTuition, total: annualTuition * years, describes: 'full tuition' };
  }

  if (type === 'percentage') {
    const perYear = (annualTuition * Math.min(percentOfTuition, 100)) / 100;
    return { perYear, total: perYear * years, describes: `${percentOfTuition}% of tuition` };
  }

  // Fixed cash award.
  const cash = num(amountInr);
  if (recurrence === 'one_time') {
    // Spread across the programme for the per-year view, but never exceed tuition.
    const total = Math.min(cash, annualTuition * years);
    return { perYear: total / years, total, describes: 'fixed one-time award' };
  }

  const perYear = Math.min(cash, annualTuition);
  return { perYear, total: perYear * years, describes: 'fixed award each year' };
}

/**
 * Builds a full cost estimate.
 *
 * @param input.costs        annual + one-time line items, in rupees
 * @param input.durationMonths programme length
 * @param input.scholarship  optional award shape (see scholarshipValue)
 */
export function calculateCost({ costs = {}, durationMonths = 12, scholarship = null } = {}) {
  // At least one year: a 6-month programme still incurs a full year of most
  // line items, and dividing by a fraction would understate everything.
  const years = Math.max(1, Math.round((Number(durationMonths) || 12) / 12));

  const annualTotal = sum(costs, ANNUAL_KEYS);
  const oneTimeTotal = sum(costs, ONE_TIME_KEYS);
  const annualTuition = num(costs.tuition);

  const award = scholarshipValue({ scholarship, annualTuition, years });

  const firstYear = annualTotal + oneTimeTotal;
  const laterYear = annualTotal;
  const grossTotal = annualTotal * years + oneTimeTotal;
  const netTotal = Math.max(0, grossTotal - award.total);

  return {
    years,
    /** Per-line breakdown, so the UI never re-derives a number shown elsewhere. */
    breakdown: {
      annual: Object.fromEntries(ANNUAL_KEYS.map((key) => [key, round(num(costs[key]))])),
      oneTime: Object.fromEntries(ONE_TIME_KEYS.map((key) => [key, round(num(costs[key]))])),
    },
    annualTotal: round(annualTotal),
    oneTimeTotal: round(oneTimeTotal),
    firstYear: round(firstYear),
    laterYear: round(laterYear),
    /** Living costs only — the figure a visa office asks about. */
    monthlyLiving: round((annualTotal - annualTuition) / 12),
    grossTotal: round(grossTotal),
    scholarship: {
      applies: award.total > 0,
      describes: award.describes,
      perYear: round(award.perYear),
      total: round(award.total),
    },
    netTotal: round(netTotal),
    /** What the scholarship actually saves, as a share of the gross total. */
    savedPercent: grossTotal > 0 ? Math.round((award.total / grossTotal) * 1000) / 10 : 0,
  };
}

/**
 * Compares an estimate against a stated budget.
 *
 * Returns the shortfall rather than a boolean: "₹4.2L short per year" is
 * actionable — a student can look for a larger scholarship or a cheaper city —
 * where "unaffordable" is only discouraging.
 */
export function budgetVerdict({ netTotal, years, annualBudgetInr }) {
  const budget = num(annualBudgetInr);
  if (!budget) return { known: false };

  const budgetTotal = budget * years;
  const gap = netTotal - budgetTotal;

  return {
    known: true,
    budgetTotal: round(budgetTotal),
    gap: round(gap),
    withinBudget: gap <= 0,
    gapPerYear: round(gap / years),
    /** Share of budget consumed; over 100 means a shortfall. */
    usedPercent: Math.round((netTotal / budgetTotal) * 100),
  };
}

export default { calculateCost, scholarshipValue, budgetVerdict, COST_FIELDS };
