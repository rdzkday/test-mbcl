import { $, esc, C, PRI, LIM, ICON, fmtDT, fmtTime, dur } from './util.js';
import { S, D, ui, task, visible, fokusPending, hiddenCount, presets } from './state.js';
import { remMs, digits, paint } from './timer.js';

let lastKey = '';

/* ---------- views ---------- */
export function hdr(eyebrow, title) { return '<div><p class="eyebrow">' + esc(eyebrow) + '</p><h1>' + esc(title) + '</h1></div>'; }

export function priChips() {
  return '<div class="pri" role="group" aria-label="Prioritas">' + ['high', 'med', 'low'].map(function (k) {
    return '<button type="button" class="pchip pri-' + k + '" data-act="pri" data-v="' + k + '" aria-pressed="' + (D.pri === k) + '">' + PRI[k] + '</button>';
  }).join('') + '</div>';
}
export function formHTML() {
  return '<form class="card form" data-form="add" autocomplete="off">' +
    '<input id="f-title" class="field" placeholder="Nama tugas" maxlength="80" value="' + esc(D.title) + '" data-draft="title" aria-label="Nama tugas">' +
    '<input id="f-desc" class="field" placeholder="Deskripsi singkat (opsional)" maxlength="140" value="' + esc(D.desc) + '" data-draft="desc" aria-label="Deskripsi singkat">' +
    priChips() +
    '<button class="btn primary" type="submit">' + ICON.plus + 'Tambah tugas</button></form>';
}
export function meta(t) {
  var h = '<span class="meta"><span class="m"><i class="pd"></i>' + PRI[t.pri] + '</span>' +
    '<span class="m">Dibuat ' + fmtDT(t.at) + '</span>';
  if (t.pomos) h += '<span class="m">' + t.pomos + ' pomodoro</span>';
  if (t.done && t.doneAt) h += '<span class="m">Selesai ' + fmtDT(t.doneAt) + (t.spent > 0 ? ' · fokus ' + dur(t.spent) : '') + '</span>';
  else if (t.spent > 0) h += '<span class="m">Fokus ' + dur(t.spent) + '</span>';
  return h + '</span>';
}
export function body(t, bring) {
  var b = (bring && !t.done && !visible(t))
    ? '<button type="button" class="linkbtn" data-act="bring" data-id="' + t.id + '">Kerjakan hari ini</button>' : '';
  return '<span class="body"><span class="name">' + esc(t.title) + '</span>' +
    (t.desc ? '<span class="desc">' + esc(t.desc) + '</span>' : '') + meta(t) + b + '</span>';
}
export function gripBtn(t) {
  return '<button type="button" class="grip" data-id="' + t.id + '" aria-label="Geser urutan: ' + esc(t.title) + '. Gunakan panah atas atau bawah.">' + ICON.grip + '</button>';
}
export function pickRow(t) {
  var on = S.sel.indexOf(t.id) > -1;
  return '<div class="task pick pri-' + t.pri + (on ? ' is-checked' : '') + '" data-id="' + t.id + '">' + gripBtn(t) +
    '<button type="button" class="pickbtn" data-act="pick" data-id="' + t.id + '" aria-pressed="' + on + '">' +
    '<span class="dot">' + ICON.check + '</span>' + body(t) + '</button></div>';
}
export function row(t, withDel, withGrip, bring) {
  var x = '';
  if (withDel) {
    var c = ui.delId === t.id;
    x = '<button type="button" class="x' + (c ? ' confirm' : '') + '" data-act="del" data-id="' + t.id + '" aria-label="Hapus ' + esc(t.title) + '">' + (c ? 'Hapus?' : ICON.x) + '</button>';
  }
  return '<div class="task pri-' + t.pri + (t.done ? ' done is-checked' : '') + '" data-id="' + t.id + '">' + (withGrip ? gripBtn(t) : '') +
    '<button type="button" class="chk" data-act="toggleDone" data-id="' + t.id + '" aria-pressed="' + !!t.done + '" aria-label="Tandai selesai: ' + esc(t.title) + '"><span class="dot">' + ICON.check + '</span></button>' +
    body(t, bring) + x + '</div>';
}
export function crow(t) {
  var sub = t.done && t.doneAt
    ? '<span class="meta"><span class="m">Selesai ' + fmtTime(t.doneAt) + (t.spent > 0 ? ' · ' + dur(t.spent) : '') + '</span></span>' : '';
  return '<div class="task crow pri-' + t.pri + (t.done ? ' done is-checked' : '') + '">' +
    '<button type="button" class="chk" data-act="toggleDone" data-id="' + t.id + '" aria-pressed="' + !!t.done + '" aria-label="Tandai selesai: ' + esc(t.title) + '"><span class="dot">' + ICON.check + '</span></button>' +
    '<span class="body"><span class="name">' + esc(t.title) + '</span>' + sub + '</span></div>';
}
export function ringHTML(t, cls, label) {
  var ms = remMs(t), frac = Math.max(0, Math.min(1, ms / (t.total * 1000)));
  ui.lastDigits = '';
  return '<div class="ringwrap ' + cls + '"><svg viewBox="0 0 260 260" aria-hidden="true">' +
    '<circle class="inner" cx="130" cy="130" r="104"/><circle class="trk" cx="130" cy="130" r="118"/>' +
    '<circle id="ring" class="prg" cx="130" cy="130" r="118" style="stroke-dasharray:' + C + ';stroke-dashoffset:' + (C * (1 - frac)) + '"/></svg>' +
    '<div class="ringtime"><div id="time" class="big" role="timer">' + digits(ms) + '</div><div class="cap">' + esc(label) + '</div></div></div>';
}
export function oldNote() {
  var n = hiddenCount();
  return n ? '<p class="sub" style="margin:0">' + n + ' to-do lama tidak ditampilkan di sini. Lihat di tab To-do, lalu pilih "Kerjakan hari ini".</p>' : '';
}
export function dragHint(n) {
  return n > 1 ? '<p class="sub" style="margin:0">Tahan ikon titik di kiri, lalu geser untuk mengubah urutan.</p>' : '';
}

export function vIdle() {
  var today = S.log.filter(function (l) { return l.t >= S.dayStart; });
  var mins = today.reduce(function (a, l) { return a + l.min; }, 0);
  var act = fokusPending().length;
  var dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
  return {
    body: hdr(dateStr, 'Fokus') +
      '<div class="tiles"><div class="tile"><b>' + today.length + '</b><span>Pomodoro hari ini</span></div>' +
      '<div class="tile"><b>' + mins + '</b><span>Menit fokus</span></div>' +
      '<div class="tile"><b>' + act + '</b><span>To-do hari ini</span></div></div>' +
      '<div class="card"><h2>Alur satu sesi</h2><ol class="flow">' +
      '<li><b>Susun to-do</b><span>' + S.settings.plan + ' menit</span></li>' +
      '<li><b>Pilih tugas</b><span>untuk satu sesi</span></li>' +
      '<li><b>Fokus</b><span>25 menit, bisa diganti</span></li>' +
      '<li><b>Istirahat</b><span>5 menit, lalu pilih lagi</span></li></ol></div>' +
      '<p class="sub" style="margin:0">Halaman ini mulai kosong lagi setiap pukul 05.00.</p>' + oldNote(),
    dock: '<button class="btn primary" data-act="startPlan">Mulai sesi baru</button>' +
      (act ? '<button class="btn" data-act="toSelect">Lewati, pilih tugas</button>' : '')
  };
}
export function vPlan() {
  var t = S.timer, ms = remMs(t), p = fokusPending();
  return {
    body: hdr('Menyusun to-do', 'Apa yang mau dikerjakan?') +
      '<div class="card"><div class="row"><span class="sub">Sisa waktu menyusun</span><span id="time" class="mini" role="timer">' + digits(ms) + '</span></div>' +
      '<div class="bar"><i id="bar" style="width:' + ((1 - ms / (t.total * 1000)) * 100) + '%"></i></div></div>' +
      formHTML() +
      '<h2>To-do hari ini (' + p.length + ')</h2>' + dragHint(p.length) +
      (p.length ? '<div class="list" data-sort>' + p.map(function (x) { return row(x, true, true); }).join('') + '</div>'
        : '<div class="card sub">Belum ada tugas. Tulis satu di atas, lalu tekan Tambah.</div>'),
    dock: '<button class="btn" data-act="cancelPlan">Batal</button><button class="btn primary" data-act="finishPlan">Selesai, pilih tugas</button>'
  };
}
export function vSelect() {
  var p = fokusPending();
  var lp = S.last.map(task).filter(function (t) { return t && !t.done; });
  var chips = '';
  if (lp.length) chips += '<button class="chip" data-act="selLast">Lanjut sesi sebelumnya (' + lp.length + ')</button>';
  if (p.length) chips += '<button class="chip" data-act="selAll">Pilih semua</button><button class="chip" data-act="selNone">Kosongkan</button>';
  var showForm = D.open || !p.length;
  return {
    body: hdr(S.fromBreak ? 'Istirahat selesai' : 'Langkah berikutnya', 'Pilih tugas sesi ini') +
      (chips ? '<div class="chips">' + chips + '</div>' : '') + dragHint(p.length) +
      (p.length ? '<div class="list" data-sort>' + p.map(pickRow).join('') + '</div>'
        : '<div class="card sub">Tidak ada to-do aktif hari ini. Tambahkan tugas baru di bawah.</div>') +
      (showForm ? formHTML() : '<button class="btn" data-act="toggleForm">' + ICON.plus + 'Tambah tugas baru</button>') + oldNote(),
    dock: '<button class="btn" data-act="closeSession">Tutup sesi</button>' +
      '<button class="btn primary" data-act="ready"' + (S.sel.length ? '' : ' disabled') + '>Siapkan Pomodoro' + (S.sel.length ? ' (' + S.sel.length + ')' : '') + '</button>'
  };
}
export function vFocus() {
  var t = S.timer;
  var rows = S.session.map(task).filter(Boolean).map(crow).join('');
  var cap = t.status === 'ready' ? 'Siap' : t.status === 'paused' ? 'Dijeda' : 'Fokus';
  var dock, pre = '';
  if (t.status === 'ready') {
    pre = '<div class="chips center" role="group" aria-label="Durasi pomodoro">' + presets().map(function (p, i) {
      return '<button type="button" class="chip' + (S.pre === i ? ' on' : '') + '" data-act="pickPre" data-i="' + i + '" aria-pressed="' + (S.pre === i) + '">' + p.l + '</button>';
    }).join('') + '</div><p class="sub" style="margin:0;text-align:center">Menit fokus / istirahat. Bawaan 25 / 5.</p>';
    dock = '<button class="btn" data-act="backSelect">Ubah tugas</button><button class="btn primary" data-act="startTimer">' + ICON.play + 'Mulai fokus</button>';
  } else {
    dock = '<button class="btn' + (ui.confirmStop ? ' danger' : '') + '" data-act="stop">' + (ui.confirmStop ? 'Yakin? Ketuk lagi' : 'Stop') + '</button>' +
      (t.status === 'running'
        ? '<button class="btn primary" data-act="pause">' + ICON.pause + 'Jeda</button>'
        : '<button class="btn primary" data-act="resume">' + ICON.play + 'Lanjut</button>');
  }
  return {
    body: '<div><h2 style="margin-bottom:8px">Tugas sesi ini</h2><div class="list">' + (rows || '<span class="sub">Tidak ada tugas.</span>') + '</div></div>' +
      '<div class="stage">' + ringHTML(t, '', cap) + '<p id="endt" class="endline"></p>' + pre + '</div>',
    dock: dock
  };
}
export function vBreak() {
  var t = S.timer;
  return {
    body: hdr('Istirahat', 'Lepas dulu layarnya') +
      '<div class="stage">' + ringHTML(t, 'brk', t.status === 'paused' ? 'Dijeda' : 'Istirahat') + '<p id="endt" class="endline"></p>' +
      '<p class="sub" style="margin:0;text-align:center">Berdiri, minum air, regangkan badan.<br>Setelah ini kamu memilih tugas lagi.</p></div>',
    dock: '<button class="btn" data-act="skipBreak">Lewati istirahat</button>' +
      (t.status === 'running'
        ? '<button class="btn primary" data-act="pause">' + ICON.pause + 'Jeda</button>'
        : '<button class="btn primary" data-act="resume">' + ICON.play + 'Lanjut</button>')
  };
}
export function viewFokus() {
  if (S.phase === 'plan' && S.timer) return vPlan();
  if (S.phase === 'select') return vSelect();
  if (S.phase === 'focus' && S.timer) return vFocus();
  if (S.phase === 'break' && S.timer) return vBreak();
  return vIdle();
}
export function viewTodo() {
  var all = S.tasks.slice().sort(function (a, b) { return b.at - a.at; });
  var act = all.filter(function (t) { return !t.done; }), dn = all.filter(function (t) { return t.done; });
  var shown = ui.filter === 'active' ? act : ui.filter === 'done' ? dn : all;
  var seg = [['all', 'Semua'], ['active', 'Aktif'], ['done', 'Selesai']].map(function (f) {
    return '<button data-act="filter" data-v="' + f[0] + '" aria-pressed="' + (ui.filter === f[0]) + '">' + f[1] + '</button>';
  }).join('');
  var list;
  if (!all.length) {
    list = '<div class="empty"><span>Belum ada to-do. Tambahkan sendiri, atau isi contoh dulu untuk mencoba alurnya.</span><button class="btn" data-act="sample">Isi 3 contoh</button></div>';
  } else if (!shown.length) {
    list = '<div class="empty">Tidak ada tugas di filter ini.</div>';
  } else {
    list = '<div class="list">' + shown.map(function (t) { return row(t, true, false, true); }).join('') + '</div>';
  }
  return {
    body: hdr('Semua yang pernah dibuat', 'To-do') +
      '<div class="tiles"><div class="tile"><b>' + act.length + '</b><span>Aktif</span></div>' +
      '<div class="tile"><b>' + dn.length + '</b><span>Selesai</span></div>' +
      '<div class="tile"><b>' + S.log.length + '</b><span>Total pomodoro</span></div></div>' +
      '<div class="seg" role="group" aria-label="Filter">' + seg + '</div>' +
      (D.open ? formHTML() : '<button class="btn" data-act="toggleForm">' + ICON.plus + 'Tambah tugas</button>') + list
  };
}
export function stepper(label, sub, k) {
  var v = S.settings[k], mn = LIM[k][0], mx = LIM[k][1];
  return '<div class="setrow"><div><div class="lbl">' + label + '</div><div class="sub">' + sub + '</div></div>' +
    '<div class="stepper"><button data-act="step" data-k="' + k + '" data-d="-1" aria-label="Kurangi ' + label + '"' + (v <= mn ? ' disabled' : '') + '>&minus;</button>' +
    '<output aria-live="polite">' + v + '</output>' +
    '<button data-act="step" data-k="' + k + '" data-d="1" aria-label="Tambah ' + label + '"' + (v >= mx ? ' disabled' : '') + '>+</button></div></div>';
}
export function viewSetelan() {
  var s = S.settings;
  var size = ui.songMeta && ui.songMeta.size ? ' · ' + (ui.songMeta.size / 1048576).toFixed(1) + ' MB' : '';
  var themeSeg = [['light', 'Terang'], ['dark', 'Gelap']].map(function (x) {
    return '<button data-act="theme" data-v="' + x[0] + '" aria-pressed="' + (S.theme === x[0]) + '">' + x[1] + '</button>';
  }).join('');
  return {
    body: hdr('Atur sesuai ritme kamu', 'Pengaturan') +
      '<div class="card"><h2>Tampilan</h2><div class="seg" style="margin-top:10px" role="group" aria-label="Tampilan">' + themeSeg + '</div></div>' +
      '<div class="card"><h2>Waktu pomodoro</h2>' +
      '<p class="sub" style="margin:6px 0 0">Sebelum mulai fokus, kamu bisa memilih 25 / 5, 50 / 10, atau pilihan ketiga. Pilihan ketiga bisa kamu ubah di sini (awalnya 15 / 3).</p>' +
      stepper('Kustom: fokus', 'menit', 'cf') +
      stepper('Kustom: istirahat', 'menit', 'cb') +
      stepper('Menyusun to-do', 'menit di awal sesi', 'plan') + '</div>' +
      '<div class="card"><h2>Musik alarm</h2>' +
      '<div class="songname" style="margin-top:10px">' + ICON.note + '<span>' + (ui.hasSong && ui.songMeta ? esc(ui.songMeta.name) + '<span class="sub">' + size + '</span>' : 'Nada bawaan') + '</span></div>' +
      '<div class="actions"><button class="btn" data-act="pickSong">Pilih lagu dari perangkat</button>' +
      '<button class="btn" data-act="preview">' + (ui.previewing ? 'Hentikan' : 'Coba putar') + '</button>' +
      (ui.hasSong ? '<button class="btn" data-act="defaultSong">Pakai nada bawaan</button>' : '') + '</div>' +
      '<p class="sub" style="margin:12px 0 0">Musik berhenti sendiri setelah 30 detik. Lagu disimpan di browser ini, jadi di HP lain perlu dipilih lagi.</p></div>'
  };
}

export function renderNav() {
  var items = [['fokus', 'Fokus', ICON.timer], ['todo', 'To-do', ICON.list], ['setelan', 'Pengaturan', ICON.set]];
  var running = S.timer && S.timer.status === 'running';
  $('#nav').innerHTML = items.map(function (i) {
    return '<button type="button" data-act="tab" data-v="' + i[0] + '"' + (S.tab === i[0] ? ' aria-current="page"' : '') + '>' +
      i[2] + '<span>' + i[1] + '</span>' + (i[0] === 'fokus' && running ? '<i class="badge" title="Timer berjalan"></i>' : '') + '</button>';
  }).join('');
}
export function render() {
  ui.drag = null;
  var v = $('#view'), sc = $('.scroll', v), top = sc ? sc.scrollTop : 0;
  var key = S.tab + ':' + S.phase;
  var out = S.tab === 'fokus' ? viewFokus() : S.tab === 'todo' ? viewTodo() : viewSetelan();
  v.innerHTML = '<div class="scroll">' + out.body + '</div>' + (out.dock ? '<div class="dock">' + out.dock + '</div>' : '');
  var n = $('.scroll', v);
  if (n) n.scrollTop = key === lastKey ? top : 0;
  lastKey = key;
  renderNav();
  if (S.timer && S.tab === 'fokus') paint(S.timer, remMs(S.timer)); else if (!S.timer) document.title = 'Pomodoro Fokus';
}

let toastT;
export function toast(m) {
  var t = $('#toast'); t.textContent = m; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(function () { t.hidden = true; }, 3500);
}
