import { connectDB, disconnectDB, isEphemeral } from '../config/db.js';
import { env } from '../config/env.js';
import logger from '../config/logger.js';
import { seedUsers, DEMO_PASSWORD } from './seedUsers.js';
import { seedCatalogue } from './seedCatalogue.js';
import { seedCaseload } from './seedCaseload.js';

/**
 * Seed runner — `npm run seed`.
 *
 * Seeds the demo accounts, which make role-based routing usable, and the
 * catalogue, without which the student dashboard has nothing to recommend.
 *
 * Note the ephemeral-database caveat below: this CLI is for *persistent*
 * databases. When no MONGODB_URI is set, each process gets its own private
 * in-memory MongoDB, so seeding from a separate process could never be visible
 * to a running server. That case is handled by auto-seeding at boot instead
 * (see server.js).
 */
async function run() {
  const force = process.argv.includes('--force');

  // Demo accounts have published credentials. Creating them against a production
  // database would hand anyone who read the README an admin login.
  if (env.isProd) {
    throw new Error('Refusing to seed demo accounts with NODE_ENV=production.');
  }

  await connectDB();

  if (isEphemeral()) {
    logger.warn(
      'This process started its own in-memory database, so seeding it here has no effect on a running server. ' +
        'Set MONGODB_URI to seed a persistent database, or just start the server — it auto-seeds when ephemeral.'
    );
  }

  const users = await seedUsers({ force });
  const kept = users.filter((user) => user.status === 'kept').length;
  const catalogue = await seedCatalogue({ force });
  const caseload = await seedCaseload({ force });

  logger.banner('Seed complete', [
    ...users.map((user) => `${user.status.padEnd(9)} ${user.role.padEnd(11)} ${user.email}`),
    '',
    `Password: ${DEMO_PASSWORD}`,
    ...(kept ? [`${kept} existing account(s) kept — use --force to recreate.`] : []),
    '',
    `Catalogue: ${catalogue.countries} countries · ${catalogue.universities} universities · ${catalogue.courses} courses`,
    `           ${catalogue.scholarships} scholarships · ${catalogue.testimonials} success stories`,
    `           ${catalogue.created} created, ${catalogue.updated} updated in place`,
    '',
    caseload.skipped
      ? `Caseload:  skipped (${caseload.skipped})`
      : `Caseload:  ${caseload.students} students · ${caseload.appointments} appointments · ${caseload.documents} documents to review`,
  ]);

  await disconnectDB();
}

run().catch(async (error) => {
  logger.error('Seed failed:', error.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
