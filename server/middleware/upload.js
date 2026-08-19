import path from 'node:path';
import multer from 'multer';

import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';

/**
 * Document upload handling.
 *
 * Memory storage, not disk: multer's disk storage writes the file before any
 * application code runs, so a rejected upload would still have hit the filesystem.
 * Buffering lets the storage adapter decide the filename and location after
 * validation passes. Files are capped well below any memory concern.
 */

/** Extension → accepted mime types. Both must agree for an upload to proceed. */
const ALLOWED = {
  '.pdf': ['application/pdf'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.webp': ['image/webp'],
};

export const ALLOWED_EXTENSIONS = Object.keys(ALLOWED);

const fileFilter = (_req, file, callback) => {
  const extension = path.extname(file.originalname ?? '').toLowerCase();
  const permitted = ALLOWED[extension];

  if (!permitted) {
    return callback(
      ApiError.badRequest(`Unsupported file type. Accepted: ${ALLOWED_EXTENSIONS.join(', ')}`, {
        errors: { file: 'Unsupported file type' },
      })
    );
  }

  /**
   * Extension *and* mime type must match.
   *
   * Checking only the extension lets a script be renamed `.pdf`; checking only
   * the reported mime type trusts a header the client controls. Requiring both to
   * agree raises the bar for a mismatch to be accidental.
   */
  if (!permitted.includes(file.mimetype)) {
    return callback(
      ApiError.badRequest(`That file claims to be ${file.mimetype} but has a ${extension} extension`, {
        errors: { file: 'File type does not match its extension' },
      })
    );
  }

  return callback(null, true);
};

export const uploadDocument = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_MB * 1024 * 1024,
    files: 1,
    // A multipart body with thousands of fields is a cheap denial-of-service.
    fields: 10,
  },
  fileFilter,
}).single('file');

/**
 * Wraps multer so its errors become ApiErrors.
 *
 * Multer calls back with its own MulterError shape; without this the central
 * handler sees an unrecognised error and reports a 500 for what is really a
 * user-correctable 400.
 */
export const handleUpload = (req, res, next) =>
  uploadDocument(req, res, (error) => {
    if (!error) {
      if (!req.file) {
        return next(ApiError.badRequest('Choose a file to upload', { errors: { file: 'No file received' } }));
      }
      return next();
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(
        ApiError.badRequest(`That file is larger than ${env.MAX_UPLOAD_MB}MB`, {
          errors: { file: `Maximum size is ${env.MAX_UPLOAD_MB}MB` },
        })
      );
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return next(ApiError.badRequest('Upload one file at a time'));
    }
    return next(error.statusCode ? error : ApiError.badRequest(`Upload failed: ${error.message}`));
  });

export default handleUpload;
