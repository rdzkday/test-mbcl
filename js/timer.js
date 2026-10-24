import { $, now, C, fmtTime } from './util.js';
import { S, ui, task, presets, rollover, save } from './state.js';
import { render } from './views.js';
import { alarm } from './audio.js';

/* ---------- wake lock ---------- */
let lock = null;
export function syncWake() {
  var run = S.timer && S.timer.status === 'running';
  if (run && !lock && navigator.wakeLock && document.visibilityState === 'visible') {
    navigator.wakeLock.request('screen').then(function (l) {
      lock = l; l.addEventListener('release', function () { lock = null; });
    }).catch(function () {});
  } else if (!run && lock) { try { lock.release(); } catch (e) {} lock = null; }
}

/* ---------- timer ---------- */
export function remMs(t) { return t.status === 'running' ? Math.max(0, t.endAt - now()) : t.remaining * 1000; }
export function mk(kind, total, status, brkMin) {
  var t = { kind: kind, total: total, status: status, remaining: total, brkMin: brkMin };
  if (status === 'running') { t.endAt = now() + total * 1000; t.segStart = now(); }
  return t;
}
export function run(t) {
  t.status = 'running'; t.endAt = now() + t.remaining * 1000; t.segStart = now();
}
/* catat lama fokus ke tugas sesi yang belum selesai */
export function credit() {
  var t = S.timer;
  if (!t || t.kind !== 'focus' || t.status !== 'running' || !t.segStart) return;
  var end = Math.min(now(), t.endAt), el = Math.max(0, (end - t.segStart) / 1000);
  S.session.forEach(function (id) {
    var k = task(id);
    if (k && !k.done) k.spent = (k.spent || 0) + el;
  });
  t.segStart = end;
}
export function digits(ms) {
  var s = Math.ceil(ms / 1000), m = Math.floor(s / 60), r = s % 60;
  var str = String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
  return str.split('').map(function (ch) {
    return ch === ':' ? '<span class="c">:</span>' : '<span class="d">' + ch + '</span>';
  }).join('');
}
export function paint(t, ms) {
  var h = digits(ms);
  var ti = $('#time');
  if (ti && h !== ui.lastDigits) { ti.innerHTML = h; ui.lastDigits = h; }
  var frac = Math.max(0, Math.min(1, ms / (t.total * 1000)));
  var r = $('#ring'); if (r) r.style.strokeDashoffset = C * (1 - frac);
  var b = $('#bar'); if (b) b.style.width = ((1 - frac) * 100) + '%';
  var e = $('#endt');
  if (e) {
    var lead = t.kind === 'break' ? 'Istirahat selesai pukul ' : 'Selesai pukul ';
    var txt;
    if (t.status === 'running') txt = lead + fmtTime(t.endAt);
    else if (t.status === 'ready') txt = 'Jika mulai sekarang, ' + lead.toLowerCase() + fmtTime(now() + t.remaining * 1000);
    else txt = 'Dijeda. Jam selesai dihitung ulang saat lanjut.';
    if (e.textContent !== txt) e.textContent = txt;
  }
  if (t.status === 'running') {
    var s = Math.ceil(ms / 1000), name = { plan: 'Menyusun', focus: 'Fokus', 'break': 'Istirahat' }[t.kind];
    document.title = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0') + ' ' + name;
  } else { document.title = 'Pomodoro Fokus'; }
}
export function tick() {
  if (rollover()) { render(); return; }
  var t = S.timer; if (!t) return;
  if (t.status === 'running') {
    var ms = remMs(t); paint(t, ms);
    if (ms <= 0) complete(false);
  } else if (t.status === 'ready') {
    paint(t, remMs(t));
  }
}

export function goSelect(fromBreak, keepSel) {
  S.phase = 'select'; S.timer = null; S.fromBreak = fromBreak;
  S.sel = keepSel ? S.session.filter(function (id) { var t = task(id); return t && !t.done; }) : [];
  ui.confirmStop = false;
}
export function doneFocus(t) {
  S.session.forEach(function (id) { var k = task(id); if (k) k.pomos = (k.pomos || 0) + 1; });
  S.log.push({ t: now(), ids: S.session.slice(), min: Math.round(t.total / 60) });
  S.last = S.session.slice();
}
export function complete(silent) {
  var t = S.timer; if (!t) return;
  if (!silent) S.tab = 'fokus';
  if (t.kind === 'plan') {
    goSelect(false);
    if (!silent) alarm('Waktu menyusun habis', 'Saatnya memilih tugas untuk sesi ini.');
  } else if (t.kind === 'focus') {
    credit();
    doneFocus(t);
    if (silent) { goSelect(true); }
    else {
      var bm = t.brkMin || 5;
      S.phase = 'break'; S.timer = mk('break', bm * 60, 'running');
      alarm('Waktu fokus selesai', 'Istirahat ' + bm + ' menit dimulai.');
    }
  } else {
    goSelect(true);
    if (!silent) alarm('Istirahat selesai', 'Pilih tugas untuk sesi berikutnya.');
  }
  save(); render(); syncWake();
}
export function applyPre(i) {
  var p = presets()[i];
  S.pre = i;
  if (S.timer && S.timer.status === 'ready') {
    S.timer.total = p.f * 60; S.timer.remaining = p.f * 60; S.timer.brkMin = p.b;
  }
}
export function applyOrder(ids) {
  ids = ids.filter(function (id) { return task(id); });
  var ords = ids.map(function (id) { return task(id).ord; }).sort(function (a, b) { return a - b; });
  ids.forEach(function (id, i) { task(id).ord = ords[i]; });
}
