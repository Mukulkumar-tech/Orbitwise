import Country from '../models/Country.js';
import University from '../models/University.js';
import Course from '../models/Course.js';
import Testimonial from '../models/Testimonial.js';
import COUNTRIES from './data/countries.js';
import UNIVERSITIES from './data/universities.js';
import COURSES from './data/courses.js';
import TESTIMONIALS from './data/testimonials.js';

/**
 * Seeds the catalogue: destinations, institutions, courses.
 *
 * Idempotent by natural key — country code, university name, course title within a
 * university — so re-running updates in place rather than duplicating. Documents
 * are saved individually rather than through insertMany because slug derivation
 * lives in a `pre('validate')` hook that the query-level write methods bypass
 * entirely; seeding through them would produce courses with no slug, and therefore
 * no detail page and a duplicate-key error on the second one.
 */

/**
 * Exchange rates used to convert published tuition into rupees.
 *
 * A snapshot, taken deliberately rather than fetched: a recommendation has to be
 * reproducible. If a student is told a course costs ₹29L and the same query
 * returns ₹31L next week because a rate moved, the number stops being usable for
 * planning and every screenshot they sent their parents becomes wrong. Refresh
 * this map and re-seed when the drift matters — as an explicit act.
 */
export const FX_TO_INR = {
  USD: 88,
  GBP: 112,
  EUR: 96,
  CAD: 64,
  AUD: 58,
  NZD: 53,
  AED: 24,
};

/** Requirement defaults, applied where a course does not state its own. */
const REQUIREMENT_DEFAULTS = {
  minIelts: 6.5,
  maxBacklogs: 5,
  minWorkExperienceYears: 0,
  additional: [],
};

function expandCourse(spec, university, country) {
  const [amount, currency] = spec.tuition;
  const rate = FX_TO_INR[currency];
  if (!rate) throw new Error(`No exchange rate for ${currency} (course: ${spec.title})`);

  return {
    title: spec.title,
    university: university._id,
    universityName: university.name,
    country: country._id,
    countryCode: country.code,
    city: university.city,
    degreeLevel: spec.degreeLevel,
    field: spec.field,
    durationMonths: spec.durationMonths,
    tuitionPerYear: { amount, currency },
    tuitionPerYearInr: Math.round(amount * rate),
    intakes: spec.intakes,
    requirements: { ...REQUIREMENT_DEFAULTS, ...spec.requirements },
    scholarship: spec.scholarship
      ? { available: true, maxPercentOfTuition: spec.scholarship[0], note: spec.scholarship[1] }
      : { available: false, maxPercentOfTuition: 0, note: '' },
    careerOutcomes: spec.careerOutcomes ?? [],
    averageStartingSalaryInr: spec.averageStartingSalaryInr ?? null,
    highlights: spec.highlights ?? [],
    summary: spec.summary ?? '',
    isActive: true,
    isPopular: Boolean(spec.isPopular),
  };
}

/** Creates or updates one document, keeping model hooks in play. */
async function upsert(Model, query, data) {
  const existing = await Model.findOne(query);
  if (!existing) return { doc: await Model.create(data), created: true };

  existing.set(data);
  await existing.save();
  return { doc: existing, created: false };
}

export async function seedCatalogue({ force = false } = {}) {
  if (force) {
    // Order matters: courses reference universities, which reference countries.
    await Course.deleteMany({});
    await University.deleteMany({});
    await Country.deleteMany({});
    await Testimonial.deleteMany({});
  }

  const counts = { countries: 0, universities: 0, courses: 0, testimonials: 0, created: 0, updated: 0 };

  const countriesByCode = new Map();
  for (const spec of COUNTRIES) {
    const { doc, created } = await upsert(Country, { code: spec.code }, spec);
    countriesByCode.set(doc.code, doc);
    counts.countries += 1;
    counts[created ? 'created' : 'updated'] += 1;
  }

  const universitiesByName = new Map();
  for (const spec of UNIVERSITIES) {
    const country = countriesByCode.get(spec.countryCode);
    if (!country) throw new Error(`Unknown country ${spec.countryCode} for ${spec.name}`);

    const { doc, created } = await upsert(University, { name: spec.name }, { ...spec, country: country._id });
    universitiesByName.set(doc.name, doc);
    counts.universities += 1;
    counts[created ? 'created' : 'updated'] += 1;
  }

  for (const spec of COURSES) {
    const university = universitiesByName.get(spec.university);
    if (!university) throw new Error(`Unknown university "${spec.university}" for course "${spec.title}"`);

    const country = countriesByCode.get(university.countryCode);
    const { created } = await upsert(
      Course,
      { title: spec.title, universityName: university.name },
      expandCourse(spec, university, country)
    );
    counts.courses += 1;
    counts[created ? 'created' : 'updated'] += 1;
  }

  // Testimonials deliberately hold no reference to a Course or University: they
  // are historical statements, and a tuition edit must not be able to rewrite
  // someone's quoted story. Keyed by name + intake year for idempotency.
  for (const spec of TESTIMONIALS) {
    const { created } = await upsert(
      Testimonial,
      { studentName: spec.studentName, intakeYear: spec.intakeYear },
      spec
    );
    counts.testimonials += 1;
    counts[created ? 'created' : 'updated'] += 1;
  }

  return counts;
}

export default seedCatalogue;
