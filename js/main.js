import { now } from './util.js';
import { S, ui, rollover } from './state.js';
import { tick, complete, syncWake } from './timer.js';
import { render } from './views.js';
import { idbGet, setAudioBlob } from './audio.js';
import './actions.js';
import './drag.js';

document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible') { tick(); syncWake(); }
});

/* ---------- start ---------- */
if (S.timer && S.timer.status === 'running' && S.timer.endAt <= now()) {
  complete(true);
}
rollover();
render();
syncWake();
setInterval(tick, 250);
idbGet().then(function (r) {
  if (r && r.blob) { setAudioBlob(r.blob); ui.songMeta = { name: r.name, size: r.size }; render(); }
});

/* PWA: service worker hanya jalan di https atau localhost */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  });
}
