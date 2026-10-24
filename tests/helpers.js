import { expect } from '@playwright/test';

export const KEY = 'pomo.v1';
// 10 Maret 2026, 09.00 WIB
export const T0 = new Date('2026-03-10T09:00:00+07:00');

/** Buka aplikasi dengan jam palsu (jam tetap berjalan normal, bisa dimajukan). */
export async function open(page, { time = T0, state } = {}) {
  await page.clock.install({ time });
  if (state) {
    await page.addInitScript(([k, s]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify(s)); }, [KEY, state]);
  }
  // Rekam panggilan audio supaya bunyi alarm bisa diperiksa tanpa speaker.
  await page.addInitScript(() => {
    window.__audio = { play: [], beep: 0 };
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      window.__audio.play.push({ src: this.currentSrc || this.src, muted: this.muted });
      return play.call(this).catch(() => {});
    };
    const start = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function () { window.__audio.beep++; return start.apply(this, arguments); };
  });
  await page.goto('/');
  await expect(page.locator('#view')).not.toBeEmpty();
}

export const store = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), KEY);
export const tab = (page, name) => page.locator('#nav').getByRole('button', { name }).click();
export const btn = (page, name, exact = false) => page.getByRole('button', { name, exact });
export const clock = (page) => page.locator('#time');
export const advance = (page, mmss) => page.clock.fastForward(mmss);

export async function addTask(page, title, desc = '') {
  await page.fill('#f-title', title);
  if (desc) await page.fill('#f-desc', desc);
  await btn(page, 'Tambah tugas', true).click();
}

/** Mulai sesi baru → susun satu tugas → selesai menyusun (masuk fase select). */
export async function planOne(page, title) {
  await btn(page, 'Mulai sesi baru').click();
  await addTask(page, title);
  await btn(page, 'Selesai, pilih tugas').click();
}

export const pickFirst = (page) => page.locator('.pickbtn').first().click();

export function task(over = {}) {
  const now = Date.now();
  return Object.assign({ id: 't' + Math.random().toString(36).slice(2, 6), title: 'Tugas', desc: '', pri: 'med', at: now, ord: now, done: false, pomos: 0, spent: 0 }, over);
}
