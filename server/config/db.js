import mongoose from 'mongoose';
import { env } from './env.js';
import logger from './logger.js';

let memoryServer = null;

/** Strips credentials before a URI ever reaches a log line. */
const redact = (uri) => uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');

/**
 * Connects to MongoDB.
 *
 * Uses MONGODB_URI when present (Atlas, Docker, or a local mongod). When it is
 * absent — the case on a machine with no MongoDB installed — an ephemeral
 * in-memory server is started instead so the platform is runnable with nothing
 * but `npm run dev`. `assertProductionEnv()` blocks this path in production.
 */
export async function connectDB() {
  mongoose.set('strictQuery', true);

  let uri = env.MONGODB_URI;
  const ephemeral = !uri;

  if (ephemeral) {
    // Specifier built at runtime so bundlers and dependency tracers do not try
    // to pull this dev-only package into a production build. Vercel installs
    // with NODE_ENV=production, so the package is absent there — a statically
    // analysable import would fail the build for code that never runs in prod.
    const devOnly = ['mongodb', 'memory', 'server'].join('-');
    const { MongoMemoryServer } = await import(/* @vite-ignore */ devOnly);
    memoryServer = await MongoMemoryServer.create({ instance: { dbName: 'orbitwise' } });
    uri = memoryServer.getUri();
  }

  mongoose.connection.on('error', (error) => logger.error('MongoDB connection error:', error.message));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
    autoIndex: !env.isProd,
  });

  if (ephemeral) {
    logger.banner('In-memory MongoDB started', [
      'No MONGODB_URI was set, so an ephemeral database is running.',
      'All data resets on restart. Demo accounts are reseeded automatically.',
      'Set MONGODB_URI to persist data between runs.',
    ]);
  } else {
    logger.success(`MongoDB connected → ${redact(uri)}`);
  }

  return { uri, ephemeral };
}

export async function disconnectDB() {
  await mongoose.connection.close();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

export const isEphemeral = () => Boolean(memoryServer);

export default connectDB;
