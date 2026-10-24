import { $ } from './util.js';
import { ui, save } from './state.js';
import { applyOrder } from './timer.js';
import { render } from './views.js';

const app = $('#app');

/* ---------- ui.drag urutan ---------- */
app.addEventListener('pointerdown', function (e) {
  var g = e.target.closest('.grip');
  if (!g || (e.pointerType === 'mouse' && e.button !== 0)) return;
  var row = g.closest('.task'), list = row && row.parentNode;
  if (!list || list.dataset.sort == null) return;
  e.preventDefault();
  var r = row.getBoundingClientRect();
  ui.drag = { row: row, list: list, off: e.clientY - r.top, id: e.pointerId, scroller: list.closest('.scroll') };
  try { g.setPointerCapture(e.pointerId); } catch (err) {}
  row.classList.add('dragging');
});
document.addEventListener('pointermove', function (e) {
  if (!ui.drag || e.pointerId !== ui.drag.id) return;
  e.preventDefault();
  var row = ui.drag.row, list = ui.drag.list, sc = ui.drag.scroller;
  if (sc) {
    var sr = sc.getBoundingClientRect();
    if (e.clientY < sr.top + 36) sc.scrollTop -= 10;
    else if (e.clientY > sr.bottom - 36) sc.scrollTop += 10;
  }
  row.style.transform = '';
  var top = e.clientY - ui.drag.off, center = top + row.offsetHeight / 2, target = null, kids = list.children;
  for (var i = 0; i < kids.length; i++) {
    var k = kids[i];
    if (k === row) continue;
    var kr = k.getBoundingClientRect();
    if (kr.top + kr.height / 2 > center) { target = k; break; }
  }
  if (row.nextElementSibling !== target) list.insertBefore(row, target);
  var nat = row.getBoundingClientRect().top;
  row.style.transform = 'translateY(' + (top - nat) + 'px)';
}, { passive: false });
export function endDrag(e) {
  if (!ui.drag || e.pointerId !== ui.drag.id) return;
  var d = ui.drag; ui.drag = null;
  d.row.style.transform = ''; d.row.classList.remove('dragging');
  applyOrder([].map.call(d.list.children, function (r) { return r.dataset.id; }));
  save(); render();
}
document.addEventListener('pointerup', endDrag);
document.addEventListener('pointercancel', endDrag);
app.addEventListener('keydown', function (e) {
  var g = e.target.closest && e.target.closest('.grip');
  if (!g || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
  e.preventDefault();
  var row = g.closest('.task'), list = row.parentNode;
  if (list.dataset.sort == null) return;
  var ids = [].map.call(list.children, function (r) { return r.dataset.id; });
  var i = ids.indexOf(g.dataset.id), j = i + (e.key === 'ArrowUp' ? -1 : 1);
  if (i < 0 || j < 0 || j >= ids.length) return;
  var tmp = ids[i]; ids[i] = ids[j]; ids[j] = tmp;
  applyOrder(ids); save(); render();
  var ng = $('.grip[data-id="' + g.dataset.id + '"]'); if (ng) ng.focus();
});
