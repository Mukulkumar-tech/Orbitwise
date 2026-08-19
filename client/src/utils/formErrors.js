/**
 * Binds a server validation failure onto the form that caused it.
 *
 * The API returns `errors` as a field-keyed map (see middleware/errorHandler.js),
 * which lines up with React Hook Form's field names — so a rejected email lands
 * under the email input instead of in a generic banner at the top of the page.
 *
 * Returns true when at least one error was attached to a known field, letting
 * the caller decide whether a form-level message is still needed.
 */
export function applyServerErrors(error, setError, knownFields = []) {
  const fieldErrors = error?.errors;
  if (!fieldErrors || typeof fieldErrors !== 'object') return false;

  let attached = false;

  for (const [field, message] of Object.entries(fieldErrors)) {
    // Only bind fields the form actually renders; anything else would create an
    // error the user can neither see nor clear, blocking submission forever.
    if (knownFields.length && !knownFields.includes(field)) continue;
    setError(field, { type: 'server', message: String(message) });
    attached = true;
  }

  return attached;
}

export default applyServerErrors;
