import { $, now, uid, LIM } from './util.js';
import { S, D, ui, task, nextOrd, fokusPending, save, applyTheme } from './state.js';
import { credit, mk, run, goSelect, applyPre, syncWake } from './timer.js';
import { render, toast } from './views.js';
import { unlockAudio, startSound, stopSound, clearAudio, idbDel, onSong } from './audio.js';

/* ---------- actions ---------- */
export function act(a, d) {
  var id = d.id;
  switch (a) {
    case 'tab': S.tab = d.v; D.open = false; break;
    case 'startPlan':
      unlockAudio(); S.phase = 'plan'; D.open = false;
      S.timer = mk('plan', S.settings.plan * 60, 'running'); break;
    case 'cancelPlan': S.phase = 'idle'; S.timer = null; break;
    case 'finishPlan': goSelect(false); break;
    case 'toSelect': goSelect(false); break;
    case 'closeSession': S.phase = 'idle'; S.timer = null; S.sel = []; D.open = false; break;
    case 'pri': D.pri = d.v; break;
    case 'toggleForm': D.open = !D.open; break;
    case 'pick':
      var i = S.sel.indexOf(id);
      if (i > -1) S.sel.splice(i, 1); else S.sel.push(id);
      break;
    case 'selAll': S.sel = fokusPending().map(function (t) { return t.id; }); break;
    case 'selNone': S.sel = []; break;
    case 'selLast': S.sel = S.last.map(task).filter(function (t) { return t && !t.done; }).map(function (t) { return t.id; }); break;
    case 'ready':
      if (!S.sel.length) return;
      unlockAudio(); S.session = S.sel.slice(); S.phase = 'focus'; D.open = false;
      S.timer = mk('focus', 25 * 60, 'ready', 5);
      applyPre(0); break;
    case 'pickPre': applyPre(Number(d.i)); break;
    case 'backSelect': goSelect(false, true); break;
    case 'startTimer': unlockAudio(); run(S.timer); break;
    case 'pause':
      credit();
      S.timer.remaining = Math.max(0, (S.timer.endAt - now()) / 1000);
      S.timer.status = 'paused'; delete S.timer.endAt; delete S.timer.segStart; break;
    case 'resume': unlockAudio(); run(S.timer); break;
    case 'stop':
      if (ui.confirmStop) { credit(); ui.confirmStop = false; S.last = S.session.slice(); goSelect(false, true); }
      else {
        ui.confirmStop = true; clearTimeout(ui.csT);
        ui.csT = setTimeout(function () { ui.confirmStop = false; render(); }, 4000);
      }
      break;
    case 'skipBreak': goSelect(true); break;
    case 'toggleDone':
      var t = task(id);
      if (t) {
        if (!t.done) { credit(); t.done = true; t.doneAt = now(); S.sel = S.sel.filter(function (x) { return x !== id; }); }
        else { t.done = false; t.doneAt = null; }
      }
      break;
    case 'bring':
      var bt = task(id);
      if (bt) { bt.bring = now(); bt.ord = nextOrd(); toast('Ditambahkan ke halaman Fokus hari ini.'); }
      break;
    case 'del':
      if (ui.delId === id) {
        S.tasks = S.tasks.filter(function (x) { return x.id !== id; });
        ['sel', 'session', 'last'].forEach(function (k) { S[k] = S[k].filter(function (x) { return x !== id; }); });
        ui.delId = null;
      } else {
        ui.delId = id; clearTimeout(ui.delT);
        ui.delT = setTimeout(function () { ui.delId = null; render(); }, 3000);
      }
      break;
    case 'filter': ui.filter = d.v; break;
    case 'sample':
      [['Susun kerangka laporan', 'Outline dan poin utama', 'high'], ['Balas email yang tertunda', '', 'med'], ['Rapikan folder unduhan', '', 'low']].forEach(function (x) {
        S.tasks.push({ id: uid(), title: x[0], desc: x[1], pri: x[2], at: now(), ord: nextOrd(), done: false, pomos: 0, spent: 0 });
      });
      break;
    case 'step':
      var k = d.k, nv = S.settings[k] + Number(d.d);
      S.settings[k] = Math.max(LIM[k][0], Math.min(LIM[k][1], nv));
      if (S.pre === 2) applyPre(2);
      break;
    case 'theme': S.theme = d.v === 'dark' ? 'dark' : 'light'; applyTheme(); break;
    case 'pickSong': $('#songfile').click(); return;
    case 'defaultSong':
      stopSound(true); ui.previewing = false; clearAudio(); ui.songMeta = null; idbDel(); toast('Memakai nada bawaan.'); break;
    case 'preview':
      unlockAudio();
      if (ui.previewing) { stopSound(); return; }
      ui.previewing = true; startSound(); break;
    case 'stopAlarm': stopSound(); return;
    default: return;
  }
  save(); render(); syncWake();
}

const app = $('#app');
app.addEventListener('click', function (e) {
  var b = e.target.closest('[data-act]');
  if (b && app.contains(b)) act(b.dataset.act, b.dataset);
});
app.addEventListener('input', function (e) {
  var k = e.target.dataset && e.target.dataset.draft;
  if (k) D[k] = e.target.value;
});
app.addEventListener('submit', function (e) {
  e.preventDefault();
  var f = e.target, title = $('#f-title', f).value.trim(), desc = $('#f-desc', f).value.trim();
  if (!title) { toast('Isi nama tugas dulu.'); $('#f-title', f).focus(); return; }
  var t = { id: uid(), title: title, desc: desc, pri: D.pri, at: now(), ord: nextOrd(), done: false, pomos: 0, spent: 0 };
  S.tasks.push(t);
  if (S.phase === 'select' && S.tab === 'fokus') S.sel.push(t.id);
  D.title = ''; D.desc = '';
  save(); render();
  var ft = $('#f-title'); if (ft) ft.focus();
});
$('#songfile').addEventListener('change', function (e) {
  var f = e.target.files && e.target.files[0];
  e.target.value = '';
  onSong(f);
});
