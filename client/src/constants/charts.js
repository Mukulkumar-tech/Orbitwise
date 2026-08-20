/**
 * Shared chart tokens.
 *
 * Separate from ChartCard because a module that exports both a component and
 * constants breaks Fast Refresh — editing a colour would remount every chart
 * rather than restyle it.
 */

/** Brand-consistent tooltip, so six charts don't each style their own. */
export const tooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: '1px solid rgb(226 232 240)',
    boxShadow: '0 8px 24px -8px rgb(10 37 64 / 0.18)',
    fontSize: 12,
  },
  labelStyle: { color: 'rgb(10 37 64)', fontWeight: 600 },
};

/**
 * Categorical palette.
 *
 * Brand orange first, then hues that stay distinguishable in the common forms of
 * colour blindness — a status breakdown where "rejected" and "offer received"
 * look alike is worse than no chart.
 */
export const SERIES_COLORS = [
  '#f97316',
  '#0a2540',
  '#0891b2',
  '#7c3aed',
  '#059669',
  '#d97706',
  '#be123c',
  '#64748b',
];

/** Axis styling shared by every cartesian chart. */
export const AXIS = { stroke: 'rgb(100 116 139)', fontSize: 11, tickLine: false };
