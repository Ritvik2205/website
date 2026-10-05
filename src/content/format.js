const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `2026-05` → `May 2026`; `present` stays `Present`. */
export function formatMonth(ym) {
  if (!ym || ym === 'present') return 'Present';
  const [y, m] = ym.split('-');
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

export const formatRange = (entry) => `${formatMonth(entry.start)} – ${formatMonth(entry.end)}`;
