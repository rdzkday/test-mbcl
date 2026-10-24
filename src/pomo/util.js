
export const $ = function (s, r) { return (r || document).querySelector(s); };
export const esc = function (s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
};
export const now = function () { return Date.now(); };
export const KEY = 'pomo.v1';
export const LIM = { plan: [1, 15], cf: [1, 120], cb: [1, 60] };
export const PRI = { high: 'Tinggi', med: 'Sedang', low: 'Rendah' };
export const C = 2 * Math.PI * 118;
export const RESET_HOUR = 5;

export function svg(inner, w) {
  return '<svg viewBox="0 0 24 24" width="' + (w || 22) + '" height="' + (w || 22) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
}
export const ICON = {
  timer: svg('<circle cx="12" cy="14" r="7.5"/><path d="M12 14V10M9.5 2.5h5M12 6.5V4.5"/>'),
  list: svg('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r=".8"/><circle cx="4.5" cy="12" r=".8"/><circle cx="4.5" cy="18" r=".8"/>'),
  set: svg('<path d="M4 7h9M19 7h1M4 17h1M11 17h9"/><circle cx="16" cy="7" r="2.2"/><circle cx="8" cy="17" r="2.2"/>'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 14),
  x: svg('<path d="M6 6l12 12M18 6L6 18"/>', 18),
  plus: svg('<path d="M12 5v14M5 12h14"/>', 20),
  play: svg('<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>', 20),
  pause: svg('<path d="M8 5v14M16 5v14"/>', 20),
  note: svg('<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>', 20),
  grip: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="18" r="1.7"/><circle cx="15" cy="18" r="1.7"/></svg>'
};
export const uid = function () { return Math.random().toString(36).slice(2, 9) + now().toString(36); };

export function fmtDate(ts) { return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }); }
export function fmtTime(ts) { return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }); }
export function fmtDT(ts) { return fmtDate(ts) + ', ' + fmtTime(ts); }
export function dur(sec) {
  if (sec < 60) return '<1 mnt';
  var m = Math.round(sec / 60);
  if (m < 60) return m + ' mnt';
  var h = Math.floor(m / 60), r = m % 60;
  return h + ' j' + (r ? ' ' + r + ' mnt' : '');
}
