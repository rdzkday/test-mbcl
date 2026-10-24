import { $, esc } from './util.js';
import { S, ui } from './state.js';
import { render, toast } from './views.js';

/* ---------- audio ---------- */
const audio = new Audio();
audio.preload = 'auto';
let ctx = null, beepNodes = [], capT = null, playing = false, unlocked = false;

export function getCtx() {
  try {
    if (!ctx) { var A = window.AudioContext || window.webkitAudioContext; if (A) ctx = new A(); }
    return ctx;
  } catch (e) { return null; }
}
export function unlockAudio() {
  var c = getCtx();
  if (c && c.state === 'suspended') c.resume().catch(function () {});
  if (!unlocked && ui.hasSong && !playing) {
    audio.muted = true;
    var p = audio.play();
    if (p && p.then) {
      p.then(function () { audio.pause(); audio.currentTime = 0; audio.muted = false; unlocked = true; })
        .catch(function () { audio.muted = false; });
    } else { audio.muted = false; }
  }
}
document.addEventListener('pointerdown', unlockAudio, { passive: true });

export function beep() {
  var c = getCtx(); if (!c) return;
  var t0 = c.currentTime + 0.05;
  for (var i = 0; i < 12; i++) {
    var o = c.createOscillator(), g = c.createGain(), t = t0 + i * 0.5;
    o.type = 'sine'; o.frequency.value = i % 2 ? 784 : 988;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.25, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + 0.5);
    beepNodes.push(o);
  }
  clearTimeout(capT); capT = setTimeout(function () { stopSound(); }, 6500);
}
export function startSound() {
  stopSound(true);
  playing = true;
  if (ui.hasSong) {
    audio.currentTime = 0; audio.muted = false;
    var p = audio.play();
    if (p && p.catch) p.catch(function () { beep(); });
    clearTimeout(capT); capT = setTimeout(function () { stopSound(); }, 30000);
  } else { beep(); }
}
export function stopSound(silent) {
  playing = false;
  clearTimeout(capT);
  try { audio.pause(); audio.currentTime = 0; } catch (e) {}
  beepNodes.forEach(function (n) { try { n.stop(); } catch (e) {} });
  beepNodes = [];
  if (!silent) {
    var had = alarmInfo || ui.previewing;
    alarmInfo = null; ui.previewing = false;
    renderAlarm();
    if (had && S.tab === 'setelan') render();
  }
}
audio.addEventListener('ended', function () { if (playing) stopSound(); });
audio.addEventListener('error', function () {
  if (ui.hasSong && !clearing) toast('Lagu tidak bisa diputar. Coba file lain.');
});

let alarmInfo = null, objUrl = null, clearing = false;
export function alarm(title, sub) { alarmInfo = { title: title, sub: sub }; renderAlarm(); startSound(); }
export function renderAlarm() {
  var el = $('#alarm');
  if (!alarmInfo) { el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  el.innerHTML = '<div><b>' + esc(alarmInfo.title) + '</b><span>' + esc(alarmInfo.sub) + '</span></div>' +
    '<button type="button" data-act="stopAlarm">Hentikan musik</button>';
}

/* ---------- song storage (IndexedDB) ---------- */
export function idb() {
  return new Promise(function (res, rej) {
    try {
      var r = indexedDB.open('pomo-media', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    } catch (e) { rej(e); }
  });
}
export function idbGet() {
  return idb().then(function (d) {
    return new Promise(function (res, rej) {
      var q = d.transaction('kv').objectStore('kv').get('song');
      q.onsuccess = function () { res(q.result || null); };
      q.onerror = function () { rej(q.error); };
    });
  }).catch(function () { return null; });
}
export function idbSet(v) {
  return idb().then(function (d) {
    return new Promise(function (res, rej) {
      var tx = d.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(v, 'song');
      tx.oncomplete = function () { res(true); };
      tx.onerror = function () { rej(tx.error); };
      tx.onabort = function () { rej(tx.error); };
    });
  }).catch(function () { return false; });
}
export function idbDel() {
  return idb().then(function (d) {
    return new Promise(function (res, rej) {
      var tx = d.transaction('kv', 'readwrite');
      tx.objectStore('kv').delete('song');
      tx.oncomplete = function () { res(true); };
      tx.onerror = function () { rej(tx.error); };
    });
  }).catch(function () { return false; });
}
export function setAudioBlob(blob) {
  if (objUrl) URL.revokeObjectURL(objUrl);
  objUrl = URL.createObjectURL(blob);
  audio.src = objUrl; audio.load();
  ui.hasSong = true; unlocked = false;
}
export function clearAudio() {
  clearing = true;
  audio.removeAttribute('src'); audio.load();
  if (objUrl) { URL.revokeObjectURL(objUrl); objUrl = null; }
  ui.hasSong = false; unlocked = false;
  setTimeout(function () { clearing = false; }, 300);
}
export function onSong(file) {
  if (!file) return;
  if (file.size > 30 * 1024 * 1024) { toast('File terlalu besar. Maksimal 30 MB.'); return; }
  if (!/^audio\//.test(file.type) && !/\.(mp3|m4a|wav|ogg|aac|flac|opus)$/i.test(file.name)) {
    toast('Pilih file audio (mp3, m4a, wav, ogg).'); return;
  }
  stopSound(true); ui.previewing = false;
  setAudioBlob(file);
  ui.songMeta = { name: file.name, size: file.size };
  idbSet({ name: file.name, size: file.size, blob: file }).then(function (ok) {
    toast(ok ? 'Lagu disimpan di browser ini.' : 'Lagu aktif, tapi tidak bisa disimpan. Pilih ulang setelah halaman dibuka lagi.');
  });
  render();
}
