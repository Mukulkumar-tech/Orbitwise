import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, inject } from 'vitest';

/**
 * Per-file database lifecycle.
 *
 * The `mongod` process itself is started once for the whole run by
 * globalSetup.js; this connects to it and keeps each test isolated by
 * truncating collections in between. Tests import `app` directly rather than
 * booting server.js, so nothing else opens a connection.
 */
beforeAll(async () => {
  await mongoose.connect(inject('mongoUri'));
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
});
