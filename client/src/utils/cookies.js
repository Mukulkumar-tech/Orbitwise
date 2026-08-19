/** Name kept in sync with server/utils/tokens.js → SESSION_HINT_COOKIE. */
export const SESSION_HINT_COOKIE = 'orbitwise_session';

/**
 * True when a session might be restorable.
 *
 * The refresh token itself is httpOnly and unreadable here by design; this flag
 * is a data-free companion set and cleared alongside it. Checking it lets an
 * anonymous visitor skip the bootstrap refresh entirely — no wasted round-trip
 * on every public page load, and no 401 in their console.
 *
 * A false negative only costs a re-login, so treating a missing flag as
 * "no session" is safe.
 */
export const hasSessionHint = () =>
  document.cookie.split('; ').some((entry) => entry.startsWith(`${SESSION_HINT_COOKIE}=`));
