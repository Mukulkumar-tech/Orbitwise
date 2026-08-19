import fs from 'node:fs/promises';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

import { agent, createUserWithRole, registerStudent } from './helpers.js';
import Document from '../models/Document.js';
import Application from '../models/Application.js';
import { env } from '../config/env.js';
import { ROLES } from '../constants/index.js';

/** A minimal but structurally valid PDF, so uploads exercise a real file. */
const PDF = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n');
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
  'base64'
);

const upload = (token, { type = 'passport', buffer = PDF, filename = 'passport.pdf', mime = 'application/pdf' } = {}) =>
  agent()
    .post('/api/documents')
    .set('Authorization', `Bearer ${token}`)
    .field('type', type)
    .attach('file', buffer, { filename, contentType: mime });

afterAll(async () => {
  // Uploads write to a real directory; leaving them behind would grow forever.
  await fs.rm(path.resolve(env.UPLOAD_DIR, 'documents'), { recursive: true, force: true }).catch(() => {});
});

describe('POST /api/documents', () => {
  it('stores a PDF and returns the record', async () => {
    const { accessToken } = await registerStudent();
    const response = await upload(accessToken);

    expect(response.status).toBe(201);
    expect(response.body.data.type).toBe('passport');
    expect(response.body.data.originalName).toBe('passport.pdf');
    expect(response.body.data.status).toBe('uploaded');
  });

  it('never returns the storage key', async () => {
    const { accessToken } = await registerStudent();
    const response = await upload(accessToken);

    // A leaked key is a leaked passport scan. It must be absent from the body
    // even though the service holds it internally.
    expect(response.body.data.storageKey).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain('storageKey');
  });

  it('accepts a PNG', async () => {
    const { accessToken } = await registerStudent();
    const response = await upload(accessToken, {
      type: 'mark_sheets',
      buffer: PNG,
      filename: 'marks.png',
      mime: 'image/png',
    });
    expect(response.status).toBe(201);
  });

  it('rejects a disallowed extension', async () => {
    const { accessToken } = await registerStudent();
    const response = await upload(accessToken, {
      buffer: Buffer.from('#!/bin/sh\nrm -rf /\n'),
      filename: 'payload.sh',
      mime: 'application/x-sh',
    });

    expect(response.status).toBe(400);
    expect(response.body.errors.file).toBeTruthy();
  });

  it('rejects a mime type that disagrees with the extension', async () => {
    // A script renamed .pdf passes an extension-only check; a forged header passes
    // a mime-only check. Both must agree.
    const { accessToken } = await registerStudent();
    const response = await upload(accessToken, {
      buffer: Buffer.from('not really a pdf'),
      filename: 'sneaky.pdf',
      mime: 'application/x-msdownload',
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/claims to be|Unsupported/i);
  });

  it('rejects an unknown document type', async () => {
    const { accessToken } = await registerStudent();
    const response = await upload(accessToken, { type: 'blackmail_letter' });
    expect(response.status).toBe(400);
  });

  it('requires a file', async () => {
    const { accessToken } = await registerStudent();
    const response = await agent()
      .post('/api/documents')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('type', 'passport');

    expect(response.status).toBe(400);
    expect(response.body.errors.file).toBeTruthy();
  });

  it('does not use the uploaded filename to build a path', async () => {
    // A traversal filename must be stored as metadata only. If it reached the
    // filesystem join, this would write outside the upload directory.
    const { accessToken } = await registerStudent();
    const response = await upload(accessToken, { filename: '../../../etc/passwd.pdf' });

    expect(response.status).toBe(201);
    const stored = await Document.findById(response.body.data._id).select('+storageKey');
    expect(stored.storageKey).not.toContain('..');
    expect(stored.storageKey).toMatch(/^documents\/[0-9a-f]{32}\.pdf$/);
  });

  it('replaces rather than duplicates, and resets review state', async () => {
    const { accessToken } = await registerStudent();
    const first = await upload(accessToken);

    // Pretend a counsellor verified it, then the student uploads a new file.
    await Document.findByIdAndUpdate(first.body.data._id, { status: 'verified' });

    const second = await upload(accessToken, { filename: 'passport-v2.pdf' });

    expect(second.status).toBe(201);
    expect(second.body.data._id).toBe(first.body.data._id);
    expect(second.body.data.version).toBe(2);
    // Carrying "verified" onto a different file would be a hole in the process.
    expect(second.body.data.status).toBe('uploaded');
    expect(await Document.countDocuments({ type: 'passport' })).toBe(1);
  });
});

describe('GET /api/documents/:id/file', () => {
  it('streams the owner’s own file', async () => {
    const { accessToken } = await registerStudent();
    const { body } = await upload(accessToken);

    const response = await agent()
      .get(`/api/documents/${body.data._id}/file`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/pdf');
    expect(response.headers['cache-control']).toContain('no-store');
  });

  it('refuses an unauthenticated request', async () => {
    const { accessToken } = await registerStudent();
    const { body } = await upload(accessToken);

    const response = await agent().get(`/api/documents/${body.data._id}/file`);
    expect(response.status).toBe(401);
  });

  it('hides another student’s file behind a 404, not a 403', async () => {
    // A 403 would confirm the id is real, turning id enumeration into a way to
    // discover that a document exists.
    const owner = await registerStudent();
    const intruder = await registerStudent();
    const { body } = await upload(owner.accessToken);

    const response = await agent()
      .get(`/api/documents/${body.data._id}/file`)
      .set('Authorization', `Bearer ${intruder.accessToken}`);

    expect(response.status).toBe(404);
  });

  it('refuses an unassigned counsellor', async () => {
    const owner = await registerStudent();
    const counsellor = await createUserWithRole(ROLES.COUNSELLOR);
    const { body } = await upload(owner.accessToken);

    const response = await agent()
      .get(`/api/documents/${body.data._id}/file`)
      .set('Authorization', `Bearer ${counsellor.accessToken}`);

    expect(response.status).toBe(403);
  });

  it('allows an assigned counsellor', async () => {
    const owner = await registerStudent();
    const counsellor = await createUserWithRole(ROLES.COUNSELLOR);
    const { body } = await upload(owner.accessToken);

    // Assignment is expressed through an application; Phase 12 adds the UI.
    await Application.create({
      student: owner.user._id ?? owner.user.id,
      course: body.data._id, // any ObjectId; only the assignment link matters here
      counsellor: counsellor.user._id,
      snapshot: {
        courseTitle: 'x',
        universityName: 'y',
        countryCode: 'GB',
        degreeLevel: 'Masters',
      },
    });

    const response = await agent()
      .get(`/api/documents/${body.data._id}/file`)
      .set('Authorization', `Bearer ${counsellor.accessToken}`);

    expect(response.status).toBe(200);
  });
});

describe('GET /api/documents/checklist', () => {
  it('asks only for universal documents before any application exists', async () => {
    const { accessToken } = await registerStudent();
    const response = await agent().get('/api/documents/checklist').set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    const required = response.body.data.items.filter((item) => item.required).map((item) => item.type);

    expect(required).toEqual(expect.arrayContaining(['passport', 'mark_sheets', 'english_test']));
    // Demanding three reference letters from someone who has not applied anywhere
    // is noise, not guidance.
    expect(required).not.toContain('lor');
  });

  it('tracks progress across required documents only', async () => {
    const { accessToken } = await registerStudent();
    expect((await agent().get('/api/documents/checklist').set('Authorization', `Bearer ${accessToken}`)).body.data.completionPercent).toBe(0);

    await upload(accessToken);
    const after = await agent().get('/api/documents/checklist').set('Authorization', `Bearer ${accessToken}`);

    expect(after.body.data.completionPercent).toBeGreaterThan(0);
    expect(after.body.data.outstanding.map((item) => item.type)).not.toContain('passport');
  });
});

describe('PATCH /api/documents/:id/review', () => {
  it('lets an admin verify a document', async () => {
    const owner = await registerStudent();
    const admin = await createUserWithRole(ROLES.ADMIN);
    const { body } = await upload(owner.accessToken);

    const response = await agent()
      .patch(`/api/documents/${body.data._id}/review`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'verified', note: 'Matches the application name.' });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('verified');
    expect(response.body.data.reviewedAt).toBeTruthy();
  });

  it('stops a student verifying their own document', async () => {
    const { accessToken } = await registerStudent();
    const { body } = await upload(accessToken);

    const response = await agent()
      .patch(`/api/documents/${body.data._id}/review`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'verified' });

    expect(response.status).toBe(403);
  });

  it('rejects a status that is not a review outcome', async () => {
    const owner = await registerStudent();
    const admin = await createUserWithRole(ROLES.ADMIN);
    const { body } = await upload(owner.accessToken);

    const response = await agent()
      .patch(`/api/documents/${body.data._id}/review`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ status: 'missing' });

    expect(response.status).toBe(400);
  });
});

describe('DELETE /api/documents/:id', () => {
  it('deletes the record and the stored file', async () => {
    const { accessToken } = await registerStudent();
    const { body } = await upload(accessToken);

    const stored = await Document.findById(body.data._id).select('+storageKey');
    const absolute = path.resolve(env.UPLOAD_DIR, stored.storageKey);
    await expect(fs.access(absolute)).resolves.toBeUndefined();

    await agent().delete(`/api/documents/${body.data._id}`).set('Authorization', `Bearer ${accessToken}`).expect(200);

    expect(await Document.findById(body.data._id)).toBeNull();
    // Orphaned files are a slow privacy leak, so removal must be real.
    await expect(fs.access(absolute)).rejects.toThrow();
  });

  it('refuses to delete a verified document', async () => {
    const { accessToken } = await registerStudent();
    const { body } = await upload(accessToken);
    await Document.findByIdAndUpdate(body.data._id, { status: 'verified' });

    const response = await agent()
      .delete(`/api/documents/${body.data._id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/replacement/i);
  });

  it('stops one student deleting another’s document', async () => {
    const owner = await registerStudent();
    const intruder = await registerStudent();
    const { body } = await upload(owner.accessToken);

    const response = await agent()
      .delete(`/api/documents/${body.data._id}`)
      .set('Authorization', `Bearer ${intruder.accessToken}`);

    expect(response.status).toBe(404);
    expect(await Document.findById(body.data._id)).not.toBeNull();
  });
});
