import { afterEach, describe, expect, it, vi } from 'vitest';

import { isDemoActive, resolveDemoFallback } from './index.js';

/** A rejection shaped like ApiClientError, which is what the interceptor passes. */
const err = (over = {}) => ({ status: 500, isNetworkError: false, ...over });

afterEach(() => vi.restoreAllMocks());

describe('resolveDemoFallback', () => {
  it('serves a fixture when the backend is unreachable', async () => {
    const result = await resolveDemoFallback({ method: 'get', url: '/countries' }, err({ isNetworkError: true, status: 0 }));

    expect(result).toBeTruthy();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
  });

  it('serves a fixture on a 5xx, which is what a sleeping server returns', async () => {
    const result = await resolveDemoFallback({ method: 'get', url: '/public/home' }, err({ status: 503 }));
    expect(result.data.stats.courses).toBeGreaterThan(0);
  });

  it('ignores the query string so filters still resolve to a fixture', async () => {
    const result = await resolveDemoFallback({ method: 'get', url: '/courses?limit=12&countryCode=DE' }, err());
    expect(result.data.length).toBeGreaterThan(0);
  });

  it('refuses to fall back on a 404', async () => {
    // A 404 is the API working and saying no. Masking it with fixtures would hide
    // a real routing bug behind plausible-looking data.
    expect(await resolveDemoFallback({ method: 'get', url: '/countries' }, err({ status: 404 }))).toBeNull();
  });

  it('refuses to fall back on a 400', async () => {
    expect(await resolveDemoFallback({ method: 'get', url: '/courses' }, err({ status: 400 }))).toBeNull();
  });

  it('never falls back for a write', async () => {
    // A POST that appears to succeed against fixtures is a lie the user acts on —
    // believing they registered, or that an application was submitted.
    for (const method of ['post', 'patch', 'put', 'delete']) {
      expect(await resolveDemoFallback({ method, url: '/courses' }, err({ status: 503 }))).toBeNull();
    }
  });

  it('returns null for a path with no fixture', async () => {
    expect(await resolveDemoFallback({ method: 'get', url: '/students/me/dashboard' }, err())).toBeNull();
  });

  it('hands back a clone, so a consumer cannot corrupt the fixture', async () => {
    const first = await resolveDemoFallback({ method: 'get', url: '/countries' }, err());
    first.data.length = 0;

    const second = await resolveDemoFallback({ method: 'get', url: '/countries' }, err());
    expect(second.data.length).toBeGreaterThan(0);
  });

  it('marks demo mode active once a fixture has been served', async () => {
    await resolveDemoFallback({ method: 'get', url: '/countries' }, err());
    expect(isDemoActive()).toBe(true);
  });
});
