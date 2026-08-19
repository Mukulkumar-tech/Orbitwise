import User from '../models/User.js';
import { ROLES } from '../constants/index.js';

/**
 * Local-development password for all three demo accounts.
 *
 * Deliberately a single shared constant rather than three: it exists so the
 * README can document one credential set, and it is only ever applied by the
 * seeder, which refuses to run against a production database.
 */
export const DEMO_PASSWORD = 'orbitwise2027';

export const DEMO_USERS = [
  {
    name: 'Aarav Sharma',
    email: 'student@orbitwise.dev',
    role: ROLES.STUDENT,
    phone: '+91 98765 43210',
  },
  {
    name: 'Rahul Menon',
    email: 'counsellor@orbitwise.dev',
    role: ROLES.COUNSELLOR,
    phone: '+91 98765 11223',
  },
  {
    name: 'Priya Nair',
    email: 'admin@orbitwise.dev',
    role: ROLES.ADMIN,
    phone: '+91 98765 44556',
  },
];

/**
 * Creates the three demo accounts, one per role.
 *
 * Idempotent: an account that already exists is left alone unless `force` is
 * set, so re-running against a persistent database never clobbers local changes.
 *
 * Uses `User.create()` rather than `insertMany`/`updateOne` on purpose. Password
 * hashing lives in a `pre('save')` hook, which the query-level write methods
 * bypass entirely — seeding through them would store the password in plaintext
 * and every demo login would fail against a bcrypt comparison.
 *
 * Accounts are created pre-verified: an email-verification step the seeder
 * cannot complete would make the demo credentials unusable.
 */
export async function seedUsers({ force = false } = {}) {
  const results = [];

  for (const spec of DEMO_USERS) {
    const existing = await User.findOne({ email: spec.email });

    if (existing && !force) {
      results.push({ ...spec, status: 'kept' });
      continue;
    }

    if (existing) await existing.deleteOne();

    await User.create({ ...spec, password: DEMO_PASSWORD, isVerified: true });
    results.push({ ...spec, status: existing ? 'replaced' : 'created' });
  }

  return results;
}

export default seedUsers;
