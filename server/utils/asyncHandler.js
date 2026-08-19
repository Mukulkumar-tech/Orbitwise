/**
 * Wraps an async route handler so rejections reach the central error handler.
 *
 * Express 5 forwards rejected promises on its own, but wrapping keeps the intent
 * explicit at every call site and keeps handlers correct if the app is ever run
 * on Express 4 middleware that does not.
 */
export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export default asyncHandler;
