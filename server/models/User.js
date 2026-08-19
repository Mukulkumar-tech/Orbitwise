import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLE_VALUES, ROLES } from '../constants/index.js';
import { env } from '../config/env.js';

const MAX_SESSIONS = 5;

/**
 * A single refresh-token session (one per signed-in device).
 *
 * Only the SHA-256 hash is stored, so a database leak cannot be replayed into
 * live sessions. Keeping a list rather than one hash means signing in on a
 * phone does not silently sign the user out on their laptop.
 */
const sessionSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true },
    userAgent: { type: String, default: '' },
    expiresAt: { type: Date, required: true },
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    phone: { type: String, trim: true, default: '' },
    role: { type: String, enum: ROLE_VALUES, default: ROLES.STUDENT, index: true },
    avatar: { type: String, default: '' },

    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },

    // ─── Sensitive: never leaves the server ──────────────────────────────
    sessions: { type: [sessionSchema], default: [], select: false },
    verifyTokenHash: { type: String, default: null, select: false },
    verifyTokenExpires: { type: Date, default: null, select: false },
    resetTokenHash: { type: String, default: null, select: false },
    resetTokenExpires: { type: Date, default: null, select: false },

    /**
     * Generation counter for access tokens, embedded in every JWT as `tv`.
     *
     * Access tokens are stateless and live 15 minutes, so a password change
     * cannot revoke them on its own. Incrementing this counter invalidates every
     * token minted before it, instantly and exactly.
     *
     * A timestamp cannot do this job reliably: the JWT `iat` claim has only
     * second precision, so comparing against a "password changed at" time either
     * rejects the fresh token issued by the change itself, or leaves a
     * sub-second window in which a pre-change token still works. An integer
     * compare has no such ambiguity.
     *
     * Not a secret — just a counter — so it is selected by default. That removes
     * a whole class of bug where a query forgets `+tokenVersion` and every token
     * it issues is born invalid. It is stripped in `toJSON` regardless.
     */
    tokenVersion: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        // Belt to the `select: false` braces — if a query ever explicitly
        // selects a secret, it still cannot leak through a response body.
        delete ret.password;
        delete ret.sessions;
        delete ret.verifyTokenHash;
        delete ret.verifyTokenExpires;
        delete ret.resetTokenHash;
        delete ret.resetTokenExpires;
        delete ret.tokenVersion;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.virtual('firstName').get(function () {
  return this.name?.split(' ')[0] ?? '';
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, env.BCRYPT_ROUNDS);

  // Any password change invalidates outstanding access tokens. Living in the
  // hook rather than in each service means a future admin-initiated reset gets
  // this for free instead of having to remember it.
  if (!this.isNew) this.tokenVersion += 1;

  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

/** True when the access token predates the current token generation. */
userSchema.methods.isTokenStale = function isTokenStale(tokenVersion) {
  return tokenVersion !== this.tokenVersion;
};

/** Adds a session, pruning expired entries and capping concurrent devices. */
userSchema.methods.addSession = function addSession({ tokenHash, userAgent, expiresAt }) {
  const now = Date.now();
  const live = this.sessions.filter((session) => session.expiresAt.getTime() > now);
  live.push({ tokenHash, userAgent: userAgent?.slice(0, 200) ?? '', expiresAt });
  this.sessions = live.slice(-MAX_SESSIONS);
};

export default mongoose.model('User', userSchema);
