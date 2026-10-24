import { test, expect } from '@playwright/test';
import { open, tab, btn, planOne, pickFirst, task, store } from './helpers.js';

const WIDTHS = [360, 390, 420];
const THEMES = ['light', 'dark'];

/** Rasio kontras teks vs latar efektif untuk semua elemen yang punya teks. Mengembalikan yang di bawah batas. */
function auditContrast() {
  const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  cv.canvas.width = cv.canvas.height = 1;
  const rgba = (c) => {
    cv.clearRect(0, 0, 1, 1); cv.fillStyle = '#000'; cv.fillStyle = c; cv.fillRect(0, 0, 1, 1);
    const d = cv.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255];
  };
  const over = (f, b) => [0, 1, 2].map((i) => f[i] * f[3] + b[i] * (1 - f[3]));
  const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const bgOf = (el) => {
    const stack = [];
    for (let e = el; e; e = e.parentElement) stack.push(getComputedStyle(e).backgroundColor);
    let base = rgba(getComputedStyle(document.body).backgroundColor);
    if (base[3] === 0) base = [255, 255, 255, 1];
    let c = base.slice(0, 3);
    for (let i = stack.length - 1; i >= 0; i--) { const a = rgba(stack[i]); if (a[3] > 0) c = over(a, c); }
    return c;
  };
  const bad = [];
  const walker = document.createTreeWalker(document.getElementById('app'), NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (seen.has(el) || el.closest('[hidden]') || el.closest(':disabled') || el.closest('[aria-hidden="true"]')) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const bg = bgOf(el);
    const fg = rgba(cs.color);
    const f = over(fg, bg);
    const L1 = lum(f), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const px = parseFloat(cs.fontSize), large = px >= 24 || (px >= 18.66 && Number(cs.fontWeight) >= 700);
    if (ratio < (large ? 3 : 4.5)) bad.push(`${(n.textContent.trim()).slice(0, 30)} | ${ratio.toFixed(2)} | ${cs.color} on rgb(${bg.map(Math.round)})`);
  }
  return bad;
}

const overflowX = () => document.documentElement.scrollWidth > document.documentElement.clientWidth ||
  [...document.querySelectorAll('#app *')].some((e) => { const r = e.getBoundingClientRect(); const a = document.getElementById('app').getBoundingClientRect(); return e.offsetParent && r.width > 0 && (r.right > a.right + 1 || r.left < a.left - 1) && !e.closest('.scroll > .list > .task.dragging'); });

/** Kunjungi semua layar penting; jalankan pemeriksaan di tiap layar. */
async function tour(page, check) {
  const longName = 'Tugas dengan judul yang sangat panjang supaya baris harus turun ke bawah tanpa memotong layar';
  await check('fokus-idle');
  await btn(page, 'Mulai sesi baru').click();
  await page.fill('#f-title', longName);
  await page.fill('#f-desc', 'Deskripsi ' + 'panjang '.repeat(12));
  await btn(page, 'Tambah tugas', true).click();
  await check('fokus-plan');
  await btn(page, 'Selesai, pilih tugas').click();
  await check('fokus-select');
  await pickFirst(page);
  await btn(page, 'Siapkan Pomodoro').click();
  await check('fokus-siap');
  await btn(page, 'Mulai fokus').click();
  await check('fokus-jalan');
  await page.clock.fastForward('25:00');
  await check('alarm-istirahat');
  await btn(page, 'Hentikan musik').click();
  await check('istirahat');
  await tab(page, 'To-do'); await check('todo');
  await tab(page, 'Pengaturan'); await check('pengaturan');
}

for (const theme of THEMES) {
  for (const w of WIDTHS) {
    test(`tema ${theme} @${w}px: kontras cukup, tanpa scroll ke samping`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 760 });
      await open(page, { state: { tasks: [task({ title: 'Contoh', done: true, doneAt: Date.now(), spent: 600 })], settings: { plan: 5, cf: 15, cb: 3 }, theme } });
      expect((await store(page)).theme).toBe(theme);
      await expect(page.locator('html')).toHaveAttribute('data-app-theme', theme);
      const problems = [];
      await tour(page, async (name) => {
        if (await page.evaluate(overflowX)) problems.push(`${name}: ada scroll/overflow ke samping`);
        for (const b of await page.evaluate(auditContrast)) problems.push(`${name}: kontras ${b}`);
      });
      expect(problems).toEqual([]);
    });
  }
}

test('tema Terang bawaan, bisa diganti Gelap di Pengaturan dan tetap setelah reload', async ({ page }) => {
  await open(page);
  await expect(page.locator('html')).toHaveAttribute('data-app-theme', 'light');
  await tab(page, 'Pengaturan');
  await page.getByRole('button', { name: 'Gelap', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-app-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-app-theme', 'dark');
  await tab(page, 'Pengaturan');
  await page.getByRole('button', { name: 'Terang', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-app-theme', 'light');
});
