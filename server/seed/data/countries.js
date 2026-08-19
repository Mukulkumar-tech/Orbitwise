/**
 * Study destinations.
 *
 * Rupee figures are seed data, not live rates — see FX_TO_INR in
 * ../seedCatalogue.js for the snapshot they were converted at, and why a
 * recommendation stores the converted number rather than recomputing it.
 *
 * Living costs are a single-student annual figure covering accommodation, food,
 * transport and phone, at the level a visa application has to evidence. They are
 * deliberately not the cheapest possible: a plan built on the cheapest possible
 * number is a plan that fails in the second term.
 */

export const COUNTRIES = [
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    livingCostPerYearInr: 1_050_000,
    tuitionRangeInr: { min: 1_800_000, max: 4_800_000 },
    visaSuccessRate: 78,
    visaFeeInr: 45_000,
    workRights: { hoursPerWeekDuringStudy: 20, postStudyWorkYears: 3 },
    prPathway: false,
    intakes: ['January', 'May', 'September'],
    popularCities: ['New York', 'Boston', 'Chicago', 'Phoenix'],
    typicalIelts: 6.5,
    summary:
      'The largest choice of universities anywhere, strong research funding, and up to three years of post-study work for STEM graduates on OPT.',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP',
    livingCostPerYearInr: 950_000,
    tuitionRangeInr: { min: 1_600_000, max: 3_600_000 },
    visaSuccessRate: 96,
    visaFeeInr: 52_000,
    workRights: { hoursPerWeekDuringStudy: 20, postStudyWorkYears: 2 },
    prPathway: true,
    // September dominates; January is well established, and a few teaching-focused
    // universities add a May intake, which is why it is listed here.
    intakes: ['January', 'May', 'September'],
    popularCities: ['London', 'Manchester', 'Birmingham', 'Coventry'],
    typicalIelts: 6.5,
    summary:
      'One-year master’s degrees, a two-year Graduate Route work visa, and the highest study-visa approval rate of any major destination.',
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    currency: 'CAD',
    livingCostPerYearInr: 800_000,
    tuitionRangeInr: { min: 1_200_000, max: 2_800_000 },
    visaSuccessRate: 62,
    visaFeeInr: 15_000,
    workRights: { hoursPerWeekDuringStudy: 24, postStudyWorkYears: 3 },
    prPathway: true,
    intakes: ['January', 'May', 'September'],
    popularCities: ['Toronto', 'Vancouver', 'Kitchener', 'Windsor'],
    typicalIelts: 6.5,
    summary:
      'The clearest study-to-permanent-residence route of any destination, with a three-year post-graduation work permit — but the toughest visa approval odds, so course choice matters.',
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD',
    livingCostPerYearInr: 880_000,
    tuitionRangeInr: { min: 1_400_000, max: 3_000_000 },
    visaSuccessRate: 85,
    visaFeeInr: 100_000,
    workRights: { hoursPerWeekDuringStudy: 24, postStudyWorkYears: 3 },
    prPathway: true,
    intakes: ['February', 'July'],
    popularCities: ['Melbourne', 'Sydney', 'Brisbane', 'Geelong'],
    typicalIelts: 6.5,
    summary:
      'Strong graduate work rights, a points-based PR system that rewards regional study, and February/July intakes that suit an Indian academic year.',
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    currency: 'EUR',
    livingCostPerYearInr: 780_000,
    tuitionRangeInr: { min: 0, max: 1_800_000 },
    visaSuccessRate: 90,
    visaFeeInr: 7_500,
    workRights: { hoursPerWeekDuringStudy: 20, postStudyWorkYears: 2 },
    prPathway: true,
    intakes: ['April', 'October'],
    popularCities: ['Munich', 'Berlin', 'Aachen', 'Frankfurt'],
    typicalIelts: 6.5,
    summary:
      'Public universities charge no tuition, only a semester fee — so the real cost is living, not fees. Indian Class 12 students usually enter through a one-year Studienkolleg foundation.',
  },
  {
    code: 'IE',
    name: 'Ireland',
    flag: '🇮🇪',
    currency: 'EUR',
    livingCostPerYearInr: 900_000,
    tuitionRangeInr: { min: 1_200_000, max: 2_600_000 },
    visaSuccessRate: 90,
    visaFeeInr: 5_500,
    workRights: { hoursPerWeekDuringStudy: 20, postStudyWorkYears: 2 },
    prPathway: true,
    intakes: ['January', 'September'],
    popularCities: ['Dublin', 'Cork', 'Galway', 'Limerick'],
    typicalIelts: 6.5,
    summary:
      'English-speaking, inside the EU, and the European base for most large technology and pharmaceutical employers — with a two-year graduate stay-back.',
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    flag: '🇳🇿',
    currency: 'NZD',
    livingCostPerYearInr: 780_000,
    tuitionRangeInr: { min: 1_200_000, max: 2_400_000 },
    visaSuccessRate: 82,
    visaFeeInr: 24_000,
    workRights: { hoursPerWeekDuringStudy: 20, postStudyWorkYears: 3 },
    prPathway: true,
    intakes: ['February', 'July'],
    popularCities: ['Auckland', 'Wellington', 'Christchurch'],
    typicalIelts: 6.0,
    summary:
      'Smaller class sizes, lower living costs than Australia, and a three-year open work visa after a bachelor’s degree.',
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    currency: 'AED',
    livingCostPerYearInr: 700_000,
    tuitionRangeInr: { min: 800_000, max: 2_200_000 },
    visaSuccessRate: 95,
    visaFeeInr: 18_000,
    workRights: { hoursPerWeekDuringStudy: 15, postStudyWorkYears: 2 },
    prPathway: false,
    intakes: ['January', 'September'],
    popularCities: ['Dubai', 'Abu Dhabi', 'Sharjah'],
    typicalIelts: 6.0,
    summary:
      'UK and Australian university campuses at roughly half the fees, a three-hour flight from home, and a two-year post-study work visa in Dubai.',
  },
];

export default COUNTRIES;
