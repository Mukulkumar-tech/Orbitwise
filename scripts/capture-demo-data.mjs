// Captures real API responses as demo fixtures. Snapshotting live responses
// rather than hand-writing fixtures means the shapes cannot drift from the API.
import http from 'node:http';
import fs from 'node:fs';
import mongoose from 'mongoose';

const { default: app } = await import('./server/app.js');
const { env } = await import('./server/config/env.js');

await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
const server = http.createServer(app);
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}/api`;

const get = async (path) => {
  const r = await fetch(base + path);
  if (!r.ok) throw new Error(`${path} → ${r.status}`);
  return r.json();
};

const [home, countries, courses, scholarships, testimonials, universities] = await Promise.all([
  get('/public/home'),
  get('/countries'),
  get('/courses?limit=12'),
  get('/scholarships?limit=12'),
  get('/public/testimonials'),
  get('/universities?limit=12'),
]);

// Trim payloads: fixtures ship in the JS bundle, so only what the pages render.
const slimCourse = (c) => ({
  _id: c._id, slug: c.slug, title: c.title, universityName: c.universityName,
  countryCode: c.countryCode, city: c.city, degreeLevel: c.degreeLevel, field: c.field,
  durationMonths: c.durationMonths, tuitionPerYear: c.tuitionPerYear,
  tuitionPerYearInr: c.tuitionPerYearInr, intakes: c.intakes, requirements: c.requirements,
  scholarship: c.scholarship, careerOutcomes: c.careerOutcomes, highlights: c.highlights,
  summary: c.summary, programmeCostInr: c.programmeCostInr, match: null,
  university: c.university ? {
    _id: c.university._id, name: c.university.name, slug: c.university.slug,
    city: c.university.city, worldRanking: c.university.worldRanking,
    acceptanceRate: c.university.acceptanceRate, scholarshipAvailable: c.university.scholarshipAvailable,
  } : null,
  country: c.country ? {
    code: c.country.code, name: c.country.name, flag: c.country.flag, slug: c.country.slug,
    livingCostPerYearInr: c.country.livingCostPerYearInr,
  } : null,
});

const fixtures = {
  '/public/home': { data: home.data },
  '/countries': { data: countries.data },
  '/public/testimonials': { data: testimonials.data },
  '/courses': { data: courses.data.map(slimCourse), meta: { ...courses.meta, personalized: false } },
  '/scholarships': { data: scholarships.data, meta: { ...scholarships.meta, personalized: false } },
  '/universities': { data: universities.data, meta: universities.meta },
};

const banner = `/**
 * Demo fixtures.
 *
 * Captured from real API responses by scripts/capture-demo-data.mjs, not written
 * by hand, so the shapes cannot drift from what the endpoints actually return.
 *
 * Used only when the API is unreachable — see services/api.js. The UI always
 * says so; serving this silently while implying a live backend would be a lie to
 * whoever is looking at the page.
 *
 * Regenerate:  MONGODB_URI="..." node scripts/capture-demo-data.mjs
 */
`;

fs.mkdirSync('client/src/services/demo', { recursive: true });
fs.writeFileSync(
  'client/src/services/demo/fixtures.js',
  banner + 'export const FIXTURES = ' + JSON.stringify(fixtures, null, 2) + ';\n\nexport default FIXTURES;\n'
);

const kb = (fs.statSync('client/src/services/demo/fixtures.js').size / 1024).toFixed(1);
console.log(`  captured: home, ${countries.data.length} countries, ${courses.data.length} courses, ${scholarships.data.length} scholarships, ${testimonials.data.length} stories, ${universities.data.length} universities`);
console.log(`  fixtures.js = ${kb} KB`);

server.close(); await mongoose.disconnect(); process.exit(0);
