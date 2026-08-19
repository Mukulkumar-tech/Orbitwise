import { env } from '../../config/env.js';
import logger from '../../config/logger.js';
import localProvider from './localProvider.js';

/**
 * Storage adapter.
 *
 * One interface — put / getStream / remove / exists — so document handling never
 * knows where a file physically lives. `local` is the default and works offline;
 * a Cloudinary provider drops in behind the same four methods by setting
 * STORAGE_PROVIDER, with no change to documentService.
 *
 * Cloudinary is not implemented yet. Selecting it fails loudly at boot rather
 * than silently writing to disk while the operator believes files are in the
 * cloud — a wrong-but-working path is worse than a refusal here, because it is
 * discovered only when someone needs the files back.
 */
const providers = { local: localProvider };

let active = null;

export function getStorage() {
  if (active) return active;

  const requested = env.STORAGE_PROVIDER;
  const provider = providers[requested];

  if (!provider) {
    const known = Object.keys(providers).join(', ');
    throw new Error(`STORAGE_PROVIDER="${requested}" is not implemented. Available: ${known}.`);
  }

  if (requested !== 'local') logger.info(`Storage provider: ${requested}`);
  active = provider;
  return active;
}

export default getStorage;
