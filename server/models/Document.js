import mongoose from 'mongoose';
import { DOCUMENT_STATUS, DOCUMENT_STATUS_VALUES, DOCUMENT_TYPES } from '../constants/index.js';

/**
 * An uploaded student document.
 *
 * `storageKey` is the single most sensitive field here: it is the location of a
 * passport scan. It is `select: false` and stripped in `toJSON`, so it cannot
 * reach a client even if a query explicitly asks for it. Files are readable only
 * through the authenticated, ownership-checked streaming endpoint.
 */
const documentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: DOCUMENT_TYPES, required: true },

    status: {
      type: String,
      enum: DOCUMENT_STATUS_VALUES,
      default: DOCUMENT_STATUS.UPLOADED,
      index: true,
    },

    /** Where the file lives. Never serialized — see toJSON below. */
    storageKey: { type: String, required: true, select: false },
    storageProvider: { type: String, default: 'local', select: false },

    /**
     * The name the student's own file had.
     *
     * Kept purely so the UI can show "passport-final.pdf" rather than a random
     * hex key. It is never used to build a filesystem path — doing so would make
     * a filename like `../../.env` a path-traversal write.
     */
    originalName: { type: String, required: true, maxlength: 255 },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true, min: 0 },

    /** Replacing a document bumps this rather than creating a second record. */
    version: { type: Number, default: 1 },

    /** For passports and test scores, which genuinely expire. */
    expiresAt: { type: Date, default: null },

    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, default: '', maxlength: 500 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        // Belt to the select:false braces. A leaked storage key is a leaked
        // passport scan, so this must fail closed at every layer.
        delete ret.storageKey;
        delete ret.storageProvider;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/** One current document per type per student; replacements bump `version`. */
documentSchema.index({ student: 1, type: 1 }, { unique: true });
documentSchema.index({ student: 1, status: 1 });

documentSchema.virtual('isExpired').get(function () {
  return Boolean(this.expiresAt && this.expiresAt.getTime() < Date.now());
});

export default mongoose.model('Document', documentSchema);
