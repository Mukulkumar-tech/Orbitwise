import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Starts one MongoDB for the entire test run.
 *
 * Previously each test file spun up its own `mongod` from setupFiles, which on
 * Windows costs several seconds apiece — a per-file tax that grows with every
 * phase. Files still run sequentially and truncate collections between tests, so
 * a single shared instance is safe.
 */
export default async function setup({ provide }) {
  const mongo = await MongoMemoryServer.create({ instance: { dbName: 'orbitwise-test' } });
  provide('mongoUri', mongo.getUri());

  return async () => {
    await mongo.stop();
  };
}
