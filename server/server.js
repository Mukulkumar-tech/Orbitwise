import app from './app.js';
import { env, assertProductionEnv } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import logger from './config/logger.js';

let server;

/**
 * Seeds demo accounts and the catalogue when the database is ephemeral.
 *
 * An in-memory MongoDB is private to this process, so `npm run seed` from a
 * separate terminal would populate a different database and exit — the running
 * server would never see it. Seeding at boot is the only thing that can work,
 * and it means the credentials in the README are always valid in dev and the
 * student dashboard always has courses to recommend.
 *
 * Unreachable in production: assertProductionEnv() requires MONGODB_URI, so
 * `ephemeral` is never true there.
 */
async function seedEphemeralDatabase() {
  const { seedUsers, DEMO_PASSWORD } = await import('./seed/seedUsers.js');
  const { seedCatalogue } = await import('./seed/seedCatalogue.js');
  const { seedCaseload, seedApplications } = await import('./seed/seedCaseload.js');

  const users = await seedUsers();
  const catalogue = await seedCatalogue();
  // Gives the counsellor portal a caseload; without it every screen there is
  // an empty state, which demonstrates none of what the portal is for.
  const caseload = await seedCaseload();
  const applications = await seedApplications();

  logger.banner('Demo data ready (in-memory database)', [
    ...users.map((user) => `${user.role.padEnd(11)} ${user.email}`),
    '',
    `Password for all three: ${DEMO_PASSWORD}`,
    '',
    `Catalogue    ${catalogue.countries} countries · ${catalogue.universities} universities · ${catalogue.courses} courses`,
    `             ${catalogue.scholarships} scholarships · ${catalogue.testimonials} success stories`,
    caseload.skipped
      ? `Caseload     skipped (${caseload.skipped})`
      : `Caseload     ${caseload.students} students · ${caseload.appointments} appointments · ${caseload.documents} docs to review`,
    applications.skipped
      ? `Apps         skipped (${applications.skipped})`
      : `Apps         ${applications.applications} applications across the pipeline`,
  ]);
}

async function start() {
  assertProductionEnv();
  const { ephemeral } = await connectDB();

  if (ephemeral) {
    // A seeding failure must not stop the API from serving.
    await seedEphemeralDatabase().catch((error) =>
      logger.error('Could not seed demo accounts:', error.message)
    );
  }

  server = app.listen(env.PORT, () => {
    logger.banner('Orbitwise API', [
      `Environment  ${env.NODE_ENV}`,
      `API          http://localhost:${env.PORT}/api`,
      `Health       http://localhost:${env.PORT}/api/health`,
      `Client       ${env.CLIENT_URL}`,
    ]);
  });
}

async function shutdown(signal, exitCode = 0) {
  logger.warn(`${signal} received — shutting down gracefully`);
  const timer = setTimeout(() => {
    logger.error('Forced exit: shutdown took longer than 10s');
    process.exit(1);
  }, 10_000).unref();

  try {
    await new Promise((resolve) => (server ? server.close(resolve) : resolve()));
    await disconnectDB();
    clearTimeout(timer);
    logger.success('Shutdown complete');
    process.exit(exitCode);
  } catch (error) {
    logger.error('Error during shutdown:', error.message);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection:', reason instanceof Error ? reason.stack : reason);
  shutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error.stack || error.message);
  shutdown('uncaughtException', 1);
});

start().catch((error) => {
  logger.error('Failed to start server:', error.message);
  process.exit(1);
});
