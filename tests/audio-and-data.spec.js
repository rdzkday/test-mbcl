import { test, expect } from '@playwright/test';
import { open, store, tab, btn, advance, planOne, pickFirst, task, KEY } from './helpers.js';

/** WAV mono 8 kHz, ~0.3 detik, cukup untuk elemen audio. */
function wav() {
  const n = 2400, b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(8000, 24); b.writeUInt32LE(16000, 28);
  b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(Math.sin(i / 6) * 8000), 44 + i * 2);
  return b;
}

async function toAlarm(page) {
  await planOne(page, 'Tugas A');
  await pickFirst(page);
  await btn(page, 'Siapkan Pomodoro').click();
  await btn(page, 'Mulai fokus').click();
  await advance(page, '25:00');
  await expect(page.locator('#alarm')).toBeVisible();
}

test('tanpa lagu: nada beep bunyi saat alarm', async ({ page }) => {
  await open(page);
  await toAlarm(page);
  const a = await page.evaluate(() => window.__audio);
  expect(a.beep).toBeGreaterThan(0);
  await btn(page, 'Hentikan musik').click();
  await expect(page.locator('#alarm')).toBeHidden();
});

test('lagu dari perangkat tersimpan, bunyi saat alarm, dan hilang saat kembali ke bawaan', async ({ page }) => {
  await open(page);
  await tab(page, 'Pengaturan');
  await page.setInputFiles('#songfile', { name: 'lagu-uji.wav', mimeType: 'audio/wav', buffer: wav() });
  await expect(page.locator('#toast')).toContainText('Lagu disimpan di browser ini.');
  await expect(page.locator('.songname')).toContainText('lagu-uji.wav');

  // tersimpan di IndexedDB dan terbaca lagi setelah reload
  await page.reload();
  await tab(page, 'Pengaturan');
  await expect(page.locator('.songname')).toContainText('lagu-uji.wav');
  const stored = await page.evaluate(() => new Promise((res) => {
    const r = indexedDB.open('pomo-media', 1);
    r.onsuccess = () => { const q = r.result.transaction('kv').objectStore('kv').get('song'); q.onsuccess = () => res({ name: q.result.name, size: q.result.size }); };
  }));
  expect(stored.name).toBe('lagu-uji.wav');

  // alarm memutar file itu, bukan beep
  await page.evaluate(() => { window.__audio.play.length = 0; window.__audio.beep = 0; });
  await tab(page, 'Fokus');
  await toAlarm(page);
  const a = await page.evaluate(() => window.__audio);
  expect(a.play.some((p) => p.src.startsWith('blob:') && !p.muted)).toBe(true);
  expect(a.beep).toBe(0);
  await btn(page, 'Hentikan musik').click();

  await tab(page, 'Pengaturan');
  await btn(page, 'Pakai nada bawaan').click();
  await expect(page.locator('.songname')).toContainText('Nada bawaan');
  // penghapusan IndexedDB berjalan async; tunggu sampai kosong sebelum reload
  await expect.poll(() => page.evaluate(() => new Promise((res) => {
    const r = indexedDB.open('pomo-media', 1);
    r.onsuccess = () => { const q = r.result.transaction('kv').objectStore('kv').get('song'); q.onsuccess = () => res(q.result == null); };
  }))).toBe(true);
  await page.reload();
  await tab(page, 'Pengaturan');
  await expect(page.locator('.songname')).toContainText('Nada bawaan');
});

test('lagu: tombol coba putar, batas 30 MB, dan berhenti sendiri setelah 30 detik', async ({ page }) => {
  await open(page);
  await tab(page, 'Pengaturan');
  await page.setInputFiles('#songfile', { name: 'besar.mp3', mimeType: 'audio/mpeg', buffer: Buffer.alloc(30 * 1024 * 1024 + 1) });
  await expect(page.locator('#toast')).toContainText('Maksimal 30 MB');
  await expect(page.locator('.songname')).toContainText('Nada bawaan');

  await page.setInputFiles('#songfile', { name: 'lagu-uji.wav', mimeType: 'audio/wav', buffer: wav() });
  await expect(page.locator('.songname')).toContainText('lagu-uji.wav');
  await btn(page, 'Coba putar').click();
  await expect(btn(page, 'Hentikan', true)).toBeVisible();
  await advance(page, '00:31');
  await expect(btn(page, 'Coba putar')).toBeVisible();
});

test('data lama pomo.v1 tetap terbaca', async ({ page }) => {
  // bentuk lama: tanpa ord/spent/pre/dayStart/theme, pengaturan sebagian
  const old = {
    tasks: [
      { id: 'o1', title: 'Tugas lama 1', desc: 'deskripsi', pri: 'high', at: new Date('2026-03-10T07:00:00+07:00').getTime(), done: false, pomos: 2 },
      { id: 'o2', title: 'Tugas lama 2', desc: '', pri: 'low', at: new Date('2026-03-10T07:30:00+07:00').getTime(), done: true, doneAt: new Date('2026-03-10T08:00:00+07:00').getTime(), pomos: 1 }
    ],
    settings: { cf: 20 },
    phase: 'idle', timer: null, sel: [], session: [], last: [],
    log: [{ t: new Date('2026-03-10T07:55:00+07:00').getTime(), ids: ['o2'], min: 25 }]
  };
  await open(page, { state: old });
  await expect(page.locator('.tile', { hasText: 'Pomodoro hari ini' }).locator('b')).toHaveText('1');
  await expect(page.locator('.tile', { hasText: 'To-do hari ini' }).locator('b')).toHaveText('1');
  await tab(page, 'To-do');
  await expect(page.locator('.task')).toHaveCount(2);
  await expect(page.locator('.task', { hasText: 'Tugas lama 1' })).toContainText('2 pomodoro');
  const s = await store(page);
  expect(s.tasks.every((t) => typeof t.ord === 'number' && typeof t.spent === 'number')).toBe(true);
  expect(s.settings).toMatchObject({ plan: 5, cf: 20, cb: 3 });
  expect(s.theme).toBe('light');

  // tetap dapat dipakai: kustom 20/3, dan data tersimpan lagi dengan kunci yang sama
  await tab(page, 'Fokus');
  await btn(page, 'Lewati, pilih tugas').click();
  await pickFirst(page);
  await btn(page, 'Siapkan Pomodoro').click();
  await expect(page.getByRole('button', { name: '20 / 3 kustom' })).toBeVisible();
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys).toEqual([KEY]);
});

test('sesi yang sedang jalan tetap benar setelah reload', async ({ page }) => {
  await open(page);
  await planOne(page, 'Tugas A');
  await pickFirst(page);
  await btn(page, 'Siapkan Pomodoro').click();
  await btn(page, 'Mulai fokus').click();
  await advance(page, '05:00');
  await page.reload();
  const t = (await page.locator('#time').innerText()).replace(/\s/g, '');
  const [m, s] = t.split(':').map(Number);
  expect(m * 60 + s).toBeGreaterThanOrEqual(20 * 60 - 3);
  expect(m * 60 + s).toBeLessThanOrEqual(20 * 60);
});
