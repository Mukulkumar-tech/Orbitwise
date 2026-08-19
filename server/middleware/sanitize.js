const MAX_DEPTH = 12;

/**
 * Recursively strips keys that MongoDB would interpret as operators (`$gt`,
 * `$where`) or as dotted paths (`user.role`), mutating in place.
 */
function scrub(value, depth = 0) {
  if (depth > MAX_DEPTH || value === null || typeof value !== 'object') return;

  if (Array.isArray(value)) {
    for (const entry of value) scrub(entry, depth + 1);
    return;
  }

  for (const key of Object.keys(value)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete value[key];
      continue;
    }
    scrub(value[key], depth + 1);
  }
}

/**
 * Defence-in-depth against NoSQL operator injection.
 *
 * The primary defence is Zod: every mutating route validates its input with a
 * schema that strips unknown keys, so an injected `$ne` never reaches a query.
 * This runs first anyway, for the same reason seatbelts and airbags coexist.
 *
 * `req.query` is deliberately untouched. Express 5's default "simple" query
 * parser cannot build nested objects — `?role[$ne]=admin` arrives as the flat
 * string key `"role[$ne]"` — so there is no operator object to strip, and the
 * getter returns a fresh object on each access, making mutation pointless.
 */
export function sanitize(req, _res, next) {
  scrub(req.body);
  scrub(req.params);
  next();
}

export default sanitize;
