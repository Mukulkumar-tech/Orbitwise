import api from './api.js';

/**
 * Admin portal.
 *
 * Filters are passed straight through as query params rather than being applied
 * client-side, so the table, the pagination count and the CSV export all read
 * from the same server-side query. Filtering a page of results in the browser
 * would make "3 of 412" mean nothing.
 */
export const adminService = {
  overview: (signal) => api.get('/admin/stats/overview', { signal }).then((r) => r.data),

  charts: (params = {}, signal) => api.get('/admin/stats/charts', { params, signal }).then((r) => r.data),

  /** Returns the envelope, not just the rows — the caller needs `meta` to paginate. */
  students: (params = {}, signal) => api.get('/admin/students', { params, signal }).then((r) => r),

  counsellors: (signal) => api.get('/admin/counsellors', { signal }).then((r) => r.data),

  /** Creates the login and the counsellor profile in one call. */
  createCounsellor: (payload) => api.post('/admin/counsellors', payload).then((r) => r.data),

  enquiries: (params = {}, signal) => api.get('/admin/enquiries', { params, signal }).then((r) => r),

  assignCounsellor: (studentId, counsellorUserId) =>
    api.patch(`/admin/students/${studentId}/counsellor`, { counsellorUserId }).then((r) => r.data),

  setActive: (studentId, isActive) =>
    api.patch(`/admin/students/${studentId}/active`, { isActive }).then((r) => r.data),

  /**
   * Downloads the current filter set as CSV.
   *
   * Fetched through the API client and saved from a Blob, rather than pointed at
   * by a plain `<a href>`. The access token lives in memory and travels as an
   * `Authorization` header the interceptor adds — a link navigation carries no
   * such header, so the browser would download a 401 body as a .csv file.
   *
   * The filename comes from Content-Disposition when present so the server stays
   * the one deciding it, with a local fallback if the header is stripped by a
   * proxy.
   */
  async downloadStudentsCsv(params = {}) {
    const response = await api.get('/admin/students/export.csv', {
      params,
      responseType: 'blob',
      // The envelope interceptor unwraps `data`; a Blob has no envelope to unwrap.
      transformResponse: (value) => value,
    });

    // The envelope interceptor returns { data, meta, raw }, so the real axios
    // response — and therefore the headers — hangs off `raw`.
    const disposition = response.raw?.headers?.['content-disposition'] ?? '';
    const match = /filename="?([^";]+)"?/i.exec(disposition);
    const filename = match?.[1] ?? `orbitwise-students-${new Date().toISOString().slice(0, 10)}.csv`;

    const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    // Revoked immediately: the click has already handed the blob to the download
    // manager, and holding the URL leaks the whole export until reload.
    URL.revokeObjectURL(url);

    return filename;
  },
};

export default adminService;
