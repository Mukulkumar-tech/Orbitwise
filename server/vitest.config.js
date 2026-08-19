import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    // One mongod for the whole run; per-file connection handled in setup.js.
    globalSetup: ['./tests/globalSetup.js'],
    setupFiles: ['./tests/setup.js'],
    // Every suite shares that database and truncates collections between tests,
    // so files must not run concurrently against it.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 180_000, // first run may download the mongod binary
    env: { NODE_ENV: 'test' },
  },
});
