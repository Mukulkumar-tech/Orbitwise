import Course from '../models/Course.js';
import Country from '../models/Country.js';
import Scholarship from '../models/Scholarship.js';
import profileService from '../services/profileService.js';
import { budgetVerdict, calculateCost, COST_FIELDS } from '../services/costService.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { ok } from '../utils/apiResponse.js';
import { ROLES } from '../constants/index.js';

/**
 * Splits a country's published annual living cost into the lines the calculator
 * shows.
 *
 * A single "living costs" figure is accurate but useless for planning — a student
 * cannot tell whether it assumes a shared flat or a studio. These proportions are
 * indicative and clearly labelled as such in the UI; the point is to give the
 * student editable starting numbers rather than one opaque total.
 */
const splitLiving = (annualLiving) => ({
  accommodation: Math.round(annualLiving * 0.55),
  food: Math.round(annualLiving * 0.25),
  transport: Math.round(annualLiving * 0.1),
  other: Math.round(annualLiving * 0.1),
});

/**
 * Sensible starting values for the calculator.
 *
 * Prefilled from a real course when one is named, so a student lands on their own
 * numbers instead of an empty nine-field form they have to research first.
 */
export const getCostPrefill = asyncHandler(async (req, res) => {
  const { courseSlug } = req.query;

  const profile = req.user?.role === ROLES.STUDENT ? await profileService.getOrCreate(req.user._id) : null;
  const base = {
    fields: COST_FIELDS,
    annualBudgetInr: profile?.budget?.annualInr ?? null,
  };

  if (!courseSlug) {
    return ok(res, { ...base, course: null, costs: null, durationMonths: 12 });
  }

  const course = await Course.findOne({ slug: courseSlug, isActive: true }).lean();
  if (!course) throw ApiError.notFound('That course could not be found');

  const country = await Country.findOne({ code: course.countryCode }).lean();
  const living = country?.livingCostPerYearInr ?? 0;

  return ok(res, {
    ...base,
    course: {
      slug: course.slug,
      title: course.title,
      universityName: course.universityName,
      countryName: country?.name ?? '',
      durationMonths: course.durationMonths,
    },
    durationMonths: course.durationMonths,
    costs: {
      tuition: course.tuitionPerYearInr ?? 0,
      ...splitLiving(living),
      insurance: 60_000,
      flights: 70_000,
      visa: country?.visaFeeInr ?? 0,
      setup: 50_000,
    },
  });
});

/**
 * Runs the cost engine.
 *
 * A POST because the payload is a nine-field cost model, not an identifier — and
 * because putting a family's budget in a URL puts it in browser history and every
 * proxy log in between.
 */
export const calculate = asyncHandler(async (req, res) => {
  const { costs, durationMonths, annualBudgetInr, scholarshipSlug, scholarship } = req.body;

  // A named award wins over an inline one: the stored record is authoritative,
  // and a client should not be able to inflate an award's value by asserting it.
  let award = scholarship ?? null;
  let awardMeta = null;

  if (scholarshipSlug) {
    const found = await Scholarship.findOne({ slug: scholarshipSlug, isActive: true }).lean();
    if (!found) throw ApiError.notFound('That scholarship could not be found');
    award = found.award;
    awardMeta = { slug: found.slug, name: found.name, provider: found.provider };
  }

  const estimate = calculateCost({ costs, durationMonths, scholarship: award });

  // Fall back to the profile's budget so a signed-in student gets the verdict
  // without re-entering a number they already gave us.
  let budget = annualBudgetInr;
  if (budget == null && req.user?.role === ROLES.STUDENT) {
    const profile = await profileService.getOrCreate(req.user._id);
    budget = profile?.budget?.annualInr ?? null;
  }

  return ok(res, {
    ...estimate,
    appliedScholarship: awardMeta,
    budget: budgetVerdict({ netTotal: estimate.netTotal, years: estimate.years, annualBudgetInr: budget }),
  });
});
