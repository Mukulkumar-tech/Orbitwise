import api from './api.js';

export const documentService = {
  checklist: (signal) => api.get('/documents/checklist', { signal }).then((r) => r.data),

  /**
   * Uploads one file.
   *
   * The Content-Type header is deleted rather than set: the browser must generate
   * the multipart boundary itself, and an explicit `multipart/form-data` without a
   * boundary makes the body unparseable server-side.
   */
  upload: ({ type, file, expiresAt }) => {
    const form = new FormData();
    form.append('type', type);
    form.append('file', file);
    if (expiresAt) form.append('expiresAt', expiresAt);

    return api
      .post('/documents', form, { headers: { 'Content-Type': undefined }, timeout: 60_000 })
      .then((r) => r.data);
  },

  remove: (id) => api.delete(`/documents/${id}`).then((r) => r.data),

  /** Path to the authenticated stream. Never a public URL. */
  fileUrl: (id) => `/api/documents/${id}/file`,
};

export default documentService;
