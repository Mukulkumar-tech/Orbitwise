/**
 * The single response envelope for the whole API.
 *
 *   success → { success: true, data, meta? }
 *   failure → { success: false, message, errors? }   (see middleware/errorHandler.js)
 *
 * Every client-side data hook relies on this shape, so nothing should call
 * res.json() directly outside these helpers.
 */

export const ok = (res, data = null, meta = undefined) =>
  res.status(200).json({ success: true, data, ...(meta ? { meta } : {}) });

export const created = (res, data = null, meta = undefined) =>
  res.status(201).json({ success: true, data, ...(meta ? { meta } : {}) });

export const noContent = (res) => res.status(204).end();

/**
 * Paginated list response. `meta` is uniform across every list endpoint so the
 * client Pagination component never needs per-endpoint knowledge.
 *
 * Any extra keys passed alongside page/limit/total are merged into `meta` — for
 * per-endpoint truths a list has to admit to, such as the recommendation
 * engine's `capped` flag when its candidate ceiling trimmed the pool.
 */
export const paginated = (res, items, { page, limit, total, ...extra }) =>
  res.status(200).json({
    success: true,
    data: items,
    meta: {
      page,
      limit,
      total,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
      ...extra,
    },
  });
