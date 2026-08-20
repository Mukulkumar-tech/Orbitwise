/**
 * Demo fallback.
 *
 * When the API is unreachable, read-only public pages fall back to captured
 * fixtures so the product is still explorable. This exists for a specific real
 * problem: free hosting tiers sleep, so the first visitor after a quiet period
 * can meet a 30-second cold start or a dead backend.
 *
 * Two rules make this honest rather than deceptive:
 *
 *   1. The UI always says it is showing demo data. Silently serving fixtures
 *      while implying a live backend would mislead whoever is looking at the page.
 *   2. Only GET requests fall back. A write that appears to succeed against
 *      fixtures would be a lie the user acts on — signing up, or believing an
 *      application was submitted.
 */

/** Fixtures are ~80KB, so they load only if something actually fails. */
let fixturesPromise = null;
const loadFixtures = () => (fixturesPromise ??= import('./fixtures.js').then((m) => m.FIXTURES));

let active = false;
const listeners = new Set();

export const isDemoActive = () => active;

/** Subscribe for useSyncExternalStore. */
export const subscribeDemo = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const activate = () => {
  if (active) return;
  active = true;
  listeners.forEach((listener) => listener());
};

/**
 * Only failures that mean "the backend is not answering" fall back.
 *
 * A 404 or a 400 is the API working correctly and saying no — masking those with
 * fixtures would hide real bugs behind plausible-looking data.
 */
const isBackendDown = (error) => error?.isNetworkError || error?.status === 0 || error?.status >= 500;

/** Strips the query string; a demo fixture ignores filters. */
const pathOf = (url = '') => url.split('?')[0].replace(/\/+$/, '') || '/';

/**
 * Returns a fixture for a failed request, or null if there is nothing to serve.
 * Null means the original error propagates and the page shows its error state.
 */
export async function resolveDemoFallback({ method = 'get', url = '' }, error) {
  if (method.toLowerCase() !== 'get') return null;
  if (!isBackendDown(error)) return null;

  const fixtures = await loadFixtures();
  const fixture = fixtures[pathOf(url)];
  if (!fixture) return null;

  activate();
  // Cloned so a component mutating what it receives cannot corrupt the fixture
  // for every later request.
  return structuredClone(fixture);
}

export default { isDemoActive, subscribeDemo, resolveDemoFallback };
