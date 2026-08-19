import path from 'node:path';

import Document from '../models/Document.js';
import Application from '../models/Application.js';
import Course from '../models/Course.js';
import ApiError from '../utils/ApiError.js';
import { getStorage } from './storage/index.js';
import { requirementBasis } from './academics.js';
import { DOCUMENT_STATUS, DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS, ROLES } from '../constants/index.js';

/**
 * `requirementBasis` assumes a known degree level; an application snapshot can
 * carry null if it predates the field. Defaulting to 'secondary' understates the
 * requirement rather than demanding degree transcripts from a school leaver.
 */
const basisOf = (degreeLevel) => (degreeLevel ? requirementBasis(degreeLevel) : 'secondary');

/**
 * Student documents: upload, replacement, review, and controlled reads.
 *
 * Two rules hold throughout:
 *   · a file is only ever readable by its owner or an authorized reviewer, checked
 *     in this layer rather than inferred from a route shape;
 *   · the storage key never leaves the server.
 */

/** Documents every student needs, regardless of where they apply. */
const UNIVERSAL = ['passport', 'mark_sheets', 'english_test'];

/** Additional documents implied by having started an application. */
const WHEN_APPLYING = ['sop', 'lor', 'financial'];

/** Documents a degree-level application adds on top. */
const FOR_POSTGRADUATE = ['degree_certificate', 'resume'];

export const documentService = {
  /**
   * Stores an uploaded file.
   *
   * Replacing an existing document of the same type updates the record and bumps
   * `version` rather than creating a second one, then deletes the superseded file.
   * Two "current" passports would leave a reviewer guessing which is authoritative.
   */
  async upload({ studentId, type, file, expiresAt }) {
    const storage = getStorage();
    const extension = path.extname(file.originalname ?? '').toLowerCase();

    const stored = await storage.put({
      buffer: file.buffer,
      extension,
      folder: 'documents',
    });

    const existing = await Document.findOne({ student: studentId, type }).select('+storageKey');

    if (existing) {
      const supersededKey = existing.storageKey;

      existing.set({
        storageKey: stored.key,
        storageProvider: stored.provider,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: stored.size,
        version: existing.version + 1,
        // A replacement is a fresh submission, so review state resets. Carrying a
        // "verified" status onto a different file would be a hole in the process.
        status: DOCUMENT_STATUS.UPLOADED,
        reviewedBy: null,
        reviewedAt: null,
        reviewNote: '',
        expiresAt: expiresAt ?? null,
      });
      await existing.save();

      // After the record points at the new file, so a failure here orphans a file
      // rather than leaving a record pointing at nothing.
      if (supersededKey) await storage.remove(supersededKey).catch(() => {});

      return existing.toJSON();
    }

    const created = await Document.create({
      student: studentId,
      type,
      storageKey: stored.key,
      storageProvider: stored.provider,
      originalName: file.originalname,
      mimeType: file.mimetype,
      sizeBytes: stored.size,
      expiresAt: expiresAt ?? null,
    });

    return created.toJSON();
  },

  /**
   * The student's document checklist: what they have, and what they still need.
   *
   * Requirements are derived from the applications they have actually started
   * rather than listed generically, so a student who has not applied anywhere is
   * not confronted with a demand for three reference letters.
   */
  async checklistFor(studentId) {
    const [documents, applications] = await Promise.all([
      Document.find({ student: studentId }).lean(),
      Application.find({ student: studentId }).select('snapshot.degreeLevel status').lean(),
    ]);

    const required = new Set(UNIVERSAL);

    if (applications.length) {
      WHEN_APPLYING.forEach((type) => required.add(type));

      const needsDegreeDocs = applications.some(
        (application) => basisOf(application.snapshot?.degreeLevel) === 'tertiary'
      );
      if (needsDegreeDocs) FOR_POSTGRADUATE.forEach((type) => required.add(type));
    }

    const byType = new Map(documents.map((document) => [document.type, document]));

    const items = DOCUMENT_TYPES.map((type) => {
      const document = byType.get(type);
      const isRequired = required.has(type);
      const expired = Boolean(document?.expiresAt && new Date(document.expiresAt).getTime() < Date.now());

      return {
        type,
        label: DOCUMENT_TYPE_LABELS[type],
        required: isRequired,
        status: expired ? DOCUMENT_STATUS.EXPIRED : (document?.status ?? DOCUMENT_STATUS.MISSING),
        document: document
          ? {
              _id: document._id,
              originalName: document.originalName,
              mimeType: document.mimeType,
              sizeBytes: document.sizeBytes,
              version: document.version,
              uploadedAt: document.updatedAt,
              expiresAt: document.expiresAt,
              reviewNote: document.reviewNote,
            }
          : null,
      };
    });

    const outstanding = items.filter(
      (item) =>
        item.required &&
        [DOCUMENT_STATUS.MISSING, DOCUMENT_STATUS.REJECTED, DOCUMENT_STATUS.EXPIRED].includes(item.status)
    );

    return {
      items,
      requiredCount: required.size,
      verifiedCount: items.filter((item) => item.status === DOCUMENT_STATUS.VERIFIED).length,
      outstanding: outstanding.map((item) => ({ type: item.type, label: item.label, status: item.status })),
      /** Progress across required documents only — optional extras do not dilute it. */
      completionPercent:
        required.size === 0
          ? 100
          : Math.round(
              (items.filter(
                (item) =>
                  item.required &&
                  [DOCUMENT_STATUS.UPLOADED, DOCUMENT_STATUS.UNDER_REVIEW, DOCUMENT_STATUS.VERIFIED].includes(
                    item.status
                  )
              ).length /
                required.size) *
                100
            ),
    };
  },

  /**
   * Loads a document and authorizes the caller.
   *
   * Returns the hydrated record *with* the storage key, so it is the only path
   * that can reach a file — and it always runs the ownership check first.
   */
  async authorize(documentId, { userId, role }) {
    const document = await Document.findById(documentId).select('+storageKey +storageProvider');
    if (!document) throw ApiError.notFound('Document not found');

    const isOwner = document.student.toString() === userId.toString();

    if (role === ROLES.STUDENT && !isOwner) {
      // 404 rather than 403: confirming a document exists but belongs to someone
      // else tells an attacker their guessed id was valid.
      throw ApiError.notFound('Document not found');
    }

    if (role === ROLES.COUNSELLOR) {
      const assigned = await Application.exists({ student: document.student, counsellor: userId });
      if (!assigned) throw ApiError.forbidden('You are not assigned to this student');
    }

    return document;
  },

  /** Opens a read stream for a document the caller has already been authorized for. */
  async streamFor(document) {
    const storage = getStorage();
    return storage.getStream(document.storageKey);
  },

  /** Reviewer decision. Students cannot verify their own documents. */
  async review(documentId, { status, note }, { userId, role }) {
    if (role === ROLES.STUDENT) {
      throw ApiError.forbidden('Only a counsellor or administrator can review documents');
    }

    const document = await this.authorize(documentId, { userId, role });

    document.status = status;
    document.reviewNote = note ?? '';
    document.reviewedBy = userId;
    document.reviewedAt = new Date();
    await document.save();

    return document.toJSON();
  },

  async remove(documentId, { userId, role }) {
    const document = await this.authorize(documentId, { userId, role });

    if (document.status === DOCUMENT_STATUS.VERIFIED && role === ROLES.STUDENT) {
      throw ApiError.badRequest(
        'This document has been verified and cannot be deleted. Upload a replacement instead.'
      );
    }

    const { storageKey } = document;
    await document.deleteOne();
    await getStorage().remove(storageKey).catch(() => {});

    return { deleted: true };
  },

  /** Counsellor/admin view of one student's documents. */
  async listForStudent(studentId) {
    return Document.find({ student: studentId }).sort({ type: 1 }).lean();
  },
};

/** Course-level check used by the checklist; kept here to avoid a circular import. */
export const documentsRequiredForCourse = async (courseSlug) => {
  const course = await Course.findOne({ slug: courseSlug }).select('requirements degreeLevel').lean();
  if (!course) return [];
  return basisOf(course.degreeLevel) === 'tertiary'
    ? [...UNIVERSAL, ...WHEN_APPLYING, ...FOR_POSTGRADUATE]
    : [...UNIVERSAL, ...WHEN_APPLYING];
};

export default documentService;
