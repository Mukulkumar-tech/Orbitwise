import { ZodError } from 'zod';
import ApiError from '../utils/ApiError.js';
import { env } from '../config/env.js';
import logger from '../config/logger.js';

export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Translates every error shape the stack can produce into the one failure
 * envelope: { success: false, message, errors? }.
 *
 * `errors` is a field-keyed map so React Hook Form can bind server-side
 * validation failures straight onto the offending inputs.
 */
export function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let errors = err.errors || null;

  // Zod — request body/query/params failed validation
  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.fromEntries(err.issues.map((issue) => [issue.path.join('.') || '_', issue.message]));
  }

  // Mongoose — schema validation
  else if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.fromEntries(Object.entries(err.errors).map(([field, detail]) => [field, detail.message]));
  }

  // Mongoose — malformed ObjectId or other cast failure
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for "${err.path}"`;
  }

  // MongoDB — unique index violation
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with that ${field} already exists`;
    errors = { [field]: 'Already in use' };
  }

  // JWT
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired, please sign in again';
  }

  // Multer — upload rejected
  else if (err.name === 'MulterError') {
    statusCode = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `File is too large (max ${env.MAX_UPLOAD_MB}MB)`
        : `Upload failed: ${err.message}`;
  }

  // Unexpected — a real bug. Log the stack, tell the client nothing internal.
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} →`, err.stack || err.message);
    if (env.isProd) message = 'Something went wrong';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
    ...(env.isProd ? {} : { stack: err.stack }),
  });
}

export default errorHandler;
