/**
 * Zod validation middleware.
 *
 * Validated output replaces the raw input, so downstream services receive
 * parsed, coerced, unknown-key-stripped data — which is also the platform's
 * primary defence against NoSQL operator injection.
 *
 * `req.query` is assigned onto a plain own property because Express 5 exposes
 * `query` as a prototype getter; defining an own value shadows it cleanly.
 *
 * Usage:  router.post('/', validate({ body: registerSchema }), controller)
 */
export const validate = (schemas) => (req, _res, next) => {
  try {
    if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
    if (schemas.params) req.params = schemas.params.parse(req.params ?? {});
    if (schemas.query) {
      Object.defineProperty(req, 'query', {
        value: schemas.query.parse(req.query ?? {}),
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }
    next();
  } catch (error) {
    next(error); // ZodError → 400 with a field-keyed `errors` map
  }
};

export default validate;
