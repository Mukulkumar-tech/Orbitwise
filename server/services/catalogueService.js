/**
 * Reads over the catalogue — countries, universities, courses — and the
 * recommendation queries built on top of them.
 *
 * The split of work is deliberate: MongoDB narrows the candidate set with indexed
 * equality filters (active, eligible degree levels, chosen destinations), and
 * OrbitMatch ranks the survivors in memory. Scoring is seven weighted comparisons
 * against a student's whole profile, including derived values like IELTS
 * equivalence — expressible as an aggregation pipeline only by rewriting the
 * engine in a second language, where it could no longer be unit-tested.
 */

import Country from '../models/Country.js';
import University from '../models/University.js';
import Course from '../models/Course.js';
import ApiError from '../utils/ApiError.js';
import {
  ACADEMIC_STREAMS,
  DEGREE_LEVELS,
  EDUCATION_LEVEL_VALUES,
  ENGLISH_TESTS,
  FUNDING_SOURCES,
  GRADING_SYSTEMS,
  INTAKE_SEASONS,
  STUDY_FIELDS,
} from '../constants/index.js';
import { eligibleDegreeLevels, expandFields } from './academics.js';
import { rankCourses, scoreCourse } from './matchService.js';

/**
 * Ceiling on courses pulled into memory for one ranking pass.
 *
 * The catalogue is in the low thousands, and a student's eligible + preferred
 * subset is a few hundred at most, so this is a safety rail rather than a
 * throttle — but it is an explicit one: an unbounded find() that works today
 * becomes a memory incident the week the catalogue is imported in bulk. When it
 * bites, the response says so (`capped`) instead of quietly returning less.
 */
const CANDIDATE_CAP = 500;

/** Fields a card needs from a university — never the whole document. */
const UNIVERSITY_CARD_FIELDS =
  'name slug city countryCode worldRanking acceptanceRate type establishedYear internationalStudentShare applicationFeeInr scholarshipAvailable';

/** Countries indexed by code — eight documents shared by every candidate. */
async function loadCountries() {
  const countries = await Country.find({ isActive: true }).lean();
  return new Map(countries.map((country) => [country.code, country]));
}

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Builds the candidate filter from a student's profile and any explicit overrides.
 *
 * Profile values are defaults, not constraints: the dashboard uses them so the
 * first thing a student sees is relevant, and the explore page overrides them so
 * "what if I looked at Germany instead?" is one click rather than a profile edit.
 */
function buildFilter(profile, query = {}) {
  const filter = { isActive: true };

  const level = profile?.education?.level;
  const eligible = level ? eligibleDegreeLevels(level) : DEGREE_LEVELS;

  if (query.degreeLevel) {
    // An explicitly requested level the student cannot be admitted to yields an
    // empty list rather than a silent substitution — a filter that quietly
    // ignores its input is worse than one that returns nothing. `$in: []` matches
    // nothing by definition, which is exactly the intent.
    filter.degreeLevel = eligible.includes(query.degreeLevel) ? query.degreeLevel : { $in: [] };
  } else {
    filter.degreeLevel = { $in: eligible };
  }

  const destinations = query.countryCode ? [query.countryCode] : (profile?.destinations ?? []);
  if (destinations.length) filter.countryCode = { $in: destinations };

  if (query.field) {
    filter.field = query.field;
  } else if (!query.allFields && profile?.goal?.fields?.length) {
    filter.field = { $in: expandFields(profile.goal.fields) };
  }

  if (query.maxTuitionInr) filter.tuitionPerYearInr = { $lte: query.maxTuitionInr };

  if (query.q) {
    const pattern = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ title: pattern }, { universityName: pattern }, { city: pattern }];
  }

  return filter;
}

const paginate = (items, page, limit) => items.slice((page - 1) * limit, page * limit);

/** Whole-programme cost, which is what a family actually has to fund. */
const programmeCost = (course, country) =>
  Math.round(((course.tuitionPerYearInr ?? 0) + (country?.livingCostPerYearInr ?? 0)) * (course.durationMonths / 12));

/** Shapes one course for a card: catalogue data, its country, its match. */
const decorate = (course, country, match) => ({
  ...course,
  country: country ?? null,
  programmeCostInr: programmeCost(course, country),
  match,
});

export const catalogueService = {
  /** Everything the onboarding wizard needs to render its choices. */
  async options() {
    const countries = await Country.find({ isActive: true })
      .select(
        'code name slug flag currency livingCostPerYearInr tuitionRangeInr typicalIelts prPathway workRights intakes popularCities summary visaSuccessRate'
      )
      .sort({ name: 1 })
      .lean();

    return {
      countries,
      degreeLevels: DEGREE_LEVELS,
      educationLevels: EDUCATION_LEVEL_VALUES,
      fields: STUDY_FIELDS,
      streams: ACADEMIC_STREAMS,
      gradingSystems: GRADING_SYSTEMS,
      englishTests: ENGLISH_TESTS,
      fundingSources: FUNDING_SOURCES,
      intakeSeasons: INTAKE_SEASONS,
    };
  },

  async listCountries() {
    return Country.find({ isActive: true }).sort({ name: 1 }).lean();
  },

  async listUniversities({ countryCode, page = 1, limit = 12 } = {}) {
    const filter = { isActive: true, ...(countryCode ? { countryCode } : {}) };

    const [items, total] = await Promise.all([
      University.find(filter).sort({ worldRanking: 1, name: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      University.countDocuments(filter),
    ]);

    return { items, total };
  },

  /**
   * Scored, ranked recommendations for one student.
   *
   * The match travels as its own `match` key rather than being merged into the
   * course, so a client can never mistake a derived score for catalogue data.
   */
  async recommendations(profile, query = {}) {
    const { page = 1, limit = 12 } = query;

    const [countriesByCode, candidates] = await Promise.all([
      loadCountries(),
      Course.find(buildFilter(profile, query)).populate('university', UNIVERSITY_CARD_FIELDS).limit(CANDIDATE_CAP).lean(),
    ]);

    const ranked = rankCourses(profile, candidates, { countriesByCode });

    return {
      items: paginate(ranked, page, limit).map(({ course, match }) =>
        decorate(course, countriesByCode.get(course.countryCode), match)
      ),
      total: ranked.length,
      /** True when the candidate cap trimmed the pool — surfaced, never silent. */
      capped: candidates.length === CANDIDATE_CAP,
    };
  },

  /**
   * Unscored catalogue browse, for visitors with no profile to score against.
   *
   * Paginated in MongoDB rather than in memory: without a profile there is nothing
   * to rank by, so there is no reason to pull a page's worth of documents through
   * the application to throw most of them away.
   */
  async listCourses(query = {}) {
    const { page = 1, limit = 12 } = query;
    const filter = buildFilter(null, query);

    const [courses, total, countriesByCode] = await Promise.all([
      Course.find(filter)
        .sort({ isPopular: -1, tuitionPerYearInr: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('university', UNIVERSITY_CARD_FIELDS)
        .lean(),
      Course.countDocuments(filter),
      loadCountries(),
    ]);

    return {
      items: courses.map((course) => decorate(course, countriesByCode.get(course.countryCode), null)),
      total,
    };
  },

  /**
   * One course, with a match score when a signed-in student asks for it.
   *
   * `profile` is optional so the same endpoint serves the public catalogue and the
   * student portal — an anonymous visitor gets the course, a student gets the
   * course plus why it fits them.
   */
  async courseBySlug(slug, profile = null) {
    const course = await Course.findOne({ slug, isActive: true }).populate('university').lean();
    if (!course) throw ApiError.notFound('That course could not be found');

    const country = await Country.findOne({ code: course.countryCode }).lean();
    const match = profile?.education?.level
      ? scoreCourse(profile, course, { country, university: course.university })
      : null;

    return decorate(course, country, match);
  },

  /**
   * One destination, with the institutions and programme levels available there.
   *
   * The level breakdown is what makes the page answer the question a school
   * student actually arrives with — "can I go here after 12th?" — rather than
   * listing tuition at a country they are not yet eligible for.
   */
  async countryBySlug(slug) {
    const country = await Country.findOne({ slug, isActive: true }).lean();
    if (!country) throw ApiError.notFound('That destination could not be found');

    const [universities, levelCounts, fieldCounts, courseCount] = await Promise.all([
      University.find({ countryCode: country.code, isActive: true })
        .select(UNIVERSITY_CARD_FIELDS)
        .sort({ worldRanking: 1, name: 1 })
        .limit(12)
        .lean(),
      Course.aggregate([
        { $match: { countryCode: country.code, isActive: true } },
        { $group: { _id: '$degreeLevel', count: { $sum: 1 }, fromInr: { $min: '$tuitionPerYearInr' } } },
        { $sort: { count: -1 } },
      ]),
      Course.aggregate([
        { $match: { countryCode: country.code, isActive: true } },
        { $group: { _id: '$field', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
      Course.countDocuments({ countryCode: country.code, isActive: true }),
    ]);

    return {
      country,
      universities,
      courseCount,
      byDegreeLevel: levelCounts.map(({ _id, count, fromInr }) => ({ degreeLevel: _id, count, fromInr })),
      popularFields: fieldCounts.map(({ _id, count }) => ({ field: _id, count })),
    };
  },

  /** One institution, with its programmes and the destination it sits in. */
  async universityBySlug(slug) {
    const university = await University.findOne({ slug, isActive: true }).lean();
    if (!university) throw ApiError.notFound('That university could not be found');

    const [country, courses] = await Promise.all([
      Country.findOne({ code: university.countryCode }).lean(),
      Course.find({ university: university._id, isActive: true })
        .sort({ degreeLevel: 1, tuitionPerYearInr: 1 })
        .lean(),
    ]);

    return {
      university,
      country: country ?? null,
      courses: courses.map((course) => ({ ...course, programmeCostInr: programmeCost(course, country) })),
      courseCount: courses.length,
    };
  },

  /** Shortlisted courses, re-scored on read so the profile stays authoritative. */
  async shortlistFor(profile) {
    if (!profile.shortlist?.length) return [];

    const [countriesByCode, courses] = await Promise.all([
      loadCountries(),
      Course.find({ _id: { $in: profile.shortlist } }).populate('university', UNIVERSITY_CARD_FIELDS).lean(),
    ]);

    // Scored, but deliberately not re-sorted: this is the student's own list, and
    // reordering it under them because a score moved would lose the order they
    // built. The client renders it in shortlist order.
    return courses.map((course) => {
      const country = countriesByCode.get(course.countryCode);
      return decorate(course, country, scoreCourse(profile, course, { country, university: course.university }));
    });
  },

  /** Catalogue-wide counts for the dashboard's "what's open to you" tiles. */
  async reachStats(profile) {
    const level = profile?.education?.level;
    const courseFilter = {
      isActive: true,
      ...(level ? { degreeLevel: { $in: eligibleDegreeLevels(level) } } : {}),
    };

    const [eligibleCourses, universities, countries] = await Promise.all([
      Course.countDocuments(courseFilter),
      University.countDocuments({ isActive: true }),
      Country.countDocuments({ isActive: true }),
    ]);

    return { eligibleCourses, universities, countries };
  },
};

export default catalogueService;
