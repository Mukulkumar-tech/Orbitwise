import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';

import { env } from '../../config/env.js';
import ApiError from '../../utils/ApiError.js';

/**
 * Local-disk storage.
 *
 * Files land in UPLOAD_DIR, which is outside any static route and gitignored.
 * There is deliberately no express.static for it: the only way to read a stored
 * file is through the authenticated, ownership-checked streaming endpoint.
 */

/**
 * Builds the stored filename.
 *
 * The user's own filename is **never** used to construct a path. A student can
 * upload `../../../server/.env` or `..\\..\\config\\db.js` as easily as
 * `passport.pdf`, and joining that onto a directory is a path-traversal write.
 * The key is random; the original name is kept in the database as metadata only.
 */
const buildKey = (folder, extension) => {
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, '');
  const random = crypto.randomBytes(16).toString('hex');
  const safeExtension = (extension ?? '').replace(/[^a-z0-9.]/gi, '').slice(0, 12);
  return path.posix.join(safeFolder, `${random}${safeExtension}`);
};

/** Resolves a key to an absolute path, refusing anything that escapes the root. */
const resolveKey = (key) => {
  const root = path.resolve(env.UPLOAD_DIR);
  const target = path.resolve(root, key);

  // Second line of defence. Keys are generated, not supplied, but a future
  // caller passing a key from a request must not be able to read /etc/passwd.
  if (target !== root && !target.startsWith(root + path.sep)) {
    throw ApiError.badRequest('Invalid file reference');
  }
  return target;
};

export const localProvider = {
  name: 'local',

  async put({ buffer, extension, folder = 'documents' }) {
    const key = buildKey(folder, extension);
    const target = resolveKey(key);

    try {
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, buffer);
    } catch (error) {
      /**
       * Serverless platforms mount a read-only filesystem outside /tmp, and /tmp
       * itself is per-invocation. Rather than reporting a bare EROFS, say what is
       * actually wrong and what to do about it.
       *
       * Deliberately not falling back to /tmp: a student would see "uploaded",
       * and their passport scan would be gone on the next request. Losing a file
       * silently is far worse than refusing to accept it.
       */
      if (error.code === 'EROFS' || error.code === 'EACCES') {
        throw ApiError.internal(
          'File storage is unavailable: this environment has a read-only filesystem. ' +
            'Document upload needs object storage (Cloudinary or GridFS) rather than local disk.'
        );
      }
      throw error;
    }

    return { key, size: buffer.length, provider: 'local' };
  },

  async getStream(key) {
    const target = resolveKey(key);
    try {
      await fs.access(target);
    } catch {
      throw ApiError.notFound('That file is no longer available');
    }
    return createReadStream(target);
  },

  async remove(key) {
    try {
      await fs.unlink(resolveKey(key));
      return true;
    } catch {
      // Already gone is the desired end state, so this is not an error.
      return false;
    }
  },

  async exists(key) {
    try {
      await fs.access(resolveKey(key));
      return true;
    } catch {
      return false;
    }
  },
};

export default localProvider;
