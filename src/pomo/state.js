import { now, KEY, RESET_HOUR } from './util.js';

export function def() {
  return { tasks: [], settings: { plan: 5, cf: 15, cb: 3 }, theme: 'light', pre: 0, phase: 'idle', timer: null,
    sel: [], session: [], last: [], log: [], fromBreak: false, tab: 'fokus', dayStart: 0 };
}
export function load() {
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) {
      var o = JSON.parse(raw), d = def(), ds = d.settings;
      var s = Object.assign(d, o);
      s.settings = Object.assign(ds, o.settings || {});
      s.tasks = Array.isArray(s.tasks) ? s.tasks : [];
      s.tasks.forEach(function (t, i) {
        if (t.ord == null) t.ord = t.at || i;
        if (t.spent == null) t.spent = 0;
      });
      if (typeof s.pre !== 'number') s.pre = 0;
      s.theme = s.theme === 'dark' ? 'dark' : 'light';
      return s;
    }
  } catch (e) {}
  return def();
}
export const S = load();
export function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
export function applyTheme() { document.documentElement.setAttribute('data-app-theme', S.theme === 'dark' ? 'dark' : 'light'); }
applyTheme();

export const D = { title: '', desc: '', pri: 'med', open: false };
/* state tampilan yang dipakai lintas modul */
export const ui = {
  filter: 'all', delId: null, delT: null, confirmStop: false, csT: null,
  songMeta: null, hasSong: false, previewing: false, lastDigits: '', drag: null
};

export const task = function (id) { return S.tasks.filter(function (t) { return t.id === id; })[0]; };
export function nextOrd() {
  var m = now();
  S.tasks.forEach(function (t) { if (t.ord >= m) m = t.ord + 1; });
  return m;
}

/* ---------- hari Fokus (reset 05.00) ---------- */
export function dayStartOf(ts) {
  var d = new Date(ts);
  d.setHours(RESET_HOUR, 0, 0, 0);
  if (d.getTime() > ts) d.setDate(d.getDate() - 1);
  return d.getTime();
}
export function visible(t) { return Math.max(t.at || 0, t.bring || 0) >= S.dayStart; }
export function fokusPending() {
  return S.tasks.filter(function (t) { return !t.done && visible(t); })
    .sort(function (a, b) { return a.ord - b.ord; });
}
export function hiddenCount() { return S.tasks.filter(function (t) { return !t.done && !visible(t); }).length; }
export function rollover() {
  var ds = dayStartOf(now());
  if (S.dayStart === ds) return false;
  if (S.phase === 'idle' || S.phase === 'select') {
    S.dayStart = ds; S.phase = 'idle'; S.timer = null;
    S.sel = []; S.session = []; S.last = []; D.open = false; ui.confirmStop = false;
    save();
    return true;
  }
  return false;
}

export function presets() {
  return [
    { f: 25, b: 5, l: '25 / 5' },
    { f: 50, b: 10, l: '50 / 10' },
    { f: S.settings.cf, b: S.settings.cb, l: S.settings.cf + ' / ' + S.settings.cb + ' kustom' }
  ];
}
