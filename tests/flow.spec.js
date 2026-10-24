import { test, expect } from '@playwright/test';
import { open, store, btn, clock, advance, planOne, pickFirst, addTask } from './helpers.js';

test('alur 6 langkah berulang tanpa error', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page);

  // 1-2. susun to-do, pilih tugas
  await planOne(page, 'Tugas A');
  expect((await store(page)).phase).toBe('select');
  await pickFirst(page);
  await btn(page, 'Siapkan Pomodoro').click();

  // 3-4. pilih durasi; timer belum jalan sebelum Mulai
  expect((await store(page)).timer.status).toBe('ready');
  await expect(clock(page)).toHaveText('25:00');
  await page.waitForTimeout(1200);
  await expect(clock(page)).toHaveText('25:00');
  await btn(page, 'Mulai fokus').click();
  expect((await store(page)).timer.status).toBe('running');

  // 5. fokus habis → alarm bunyi, istirahat otomatis jalan
  await advance(page, '25:00');
  await expect(page.locator('#alarm')).toContainText('Waktu fokus selesai');
  let s = await store(page);
  expect(s.phase).toBe('break');
  expect(s.timer).toMatchObject({ kind: 'break', status: 'running', total: 300 });
  await btn(page, 'Hentikan musik').click();
  await advance(page, '05:00');
  await expect(page.locator('#alarm')).toContainText('Istirahat selesai');

  // 6. kembali ke daftar, lanjut sesi sebelumnya, ulangi
  expect((await store(page)).phase).toBe('select');
  await page.getByRole('button', { name: /Lanjut sesi sebelumnya/ }).click();
  await btn(page, 'Siapkan Pomodoro').click();
  await btn(page, 'Mulai fokus').click();
  await advance(page, '25:00');
  await expect(page.locator('#alarm')).toContainText('Waktu fokus selesai');
  await btn(page, 'Hentikan musik').click();
  await advance(page, '05:00');
  s = await store(page);
  expect(s.phase).toBe('select');
  expect(s.log).toHaveLength(2);

  // ulang dari awal: waktu menyusun 5 menit habis sendiri
  await btn(page, 'Tutup sesi').click();
  await btn(page, 'Mulai sesi baru').click();
  await advance(page, '05:00');
  await expect(page.locator('#alarm')).toContainText('Waktu menyusun habis');
  expect((await store(page)).phase).toBe('select');
  expect(errors).toEqual([]);
});

test('timer baru jalan setelah Mulai, jeda dan lanjut', async ({ page }) => {
  await open(page);
  await planOne(page, 'Tugas A');
  await pickFirst(page);
  await btn(page, 'Siapkan Pomodoro').click();
  await btn(page, 'Mulai fokus').click();
  await advance(page, '01:00');
  await btn(page, 'Jeda').click();
  const left = (await store(page)).timer.remaining;
  expect(left).toBeGreaterThan(23 * 60 + 55);
  expect(left).toBeLessThan(24 * 60 + 1);
  await advance(page, '10:00');
  expect((await store(page)).timer.remaining).toBe(left);
  await btn(page, 'Lanjut').click();
  expect((await store(page)).timer.status).toBe('running');
});

test('timer akurat setelah tab di background lalu dibuka lagi', async ({ page }) => {
  await open(page);
  await planOne(page, 'Tugas A');
  await pickFirst(page);
  await btn(page, 'Siapkan Pomodoro').click();
  await btn(page, 'Mulai fokus').click();
  // fastForward = loncat waktu tanpa tick di antaranya, seperti halaman yang dibekukan HP
  await advance(page, '10:00');
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  const text = (await clock(page).innerText()).replace(/\s/g, '');
  const [m, sec] = text.split(':').map(Number);
  const rest = m * 60 + sec;
  expect(rest).toBeGreaterThanOrEqual(14 * 60 + 58);
  expect(rest).toBeLessThanOrEqual(15 * 60);
  await expect(page.locator('#endt')).toContainText('Selesai pukul 09.25');
});

test('lama fokus dan jam selesai ditampilkan saat tugas dicentang', async ({ page }) => {
  await open(page);
  await planOne(page, 'Tugas A');
  await pickFirst(page);
  await btn(page, 'Siapkan Pomodoro').click();
  await btn(page, 'Mulai fokus').click();
  await advance(page, '10:00');
  await page.getByRole('button', { name: 'Tandai selesai: Tugas A' }).click();
  const row = page.locator('.task.crow');
  await expect(row).toContainText(/Selesai \d{2}[.:]\d{2}/);
  await expect(row).toContainText('10 mnt');
  const t = (await store(page)).tasks[0];
  expect(t.done).toBe(true);
  expect(Math.round(t.spent / 60)).toBe(10);
});

test('pilih 50/10 dan Kustom mengikuti Pengaturan', async ({ page }) => {
  await open(page);
  await planOne(page, 'Tugas A');
  await pickFirst(page);
  await btn(page, 'Siapkan Pomodoro').click();
  await expect(page.getByRole('button', { name: '25 / 5', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: '15 / 3 kustom' })).toBeVisible();

  await page.getByRole('button', { name: '50 / 10', exact: true }).click();
  await expect(clock(page)).toHaveText('50:00');
  await btn(page, 'Mulai fokus').click();
  await advance(page, '50:00');
  const s = await store(page);
  expect(s.timer).toMatchObject({ kind: 'break', total: 600 });

  // ubah Kustom di Pengaturan → pilihan ketiga ikut berubah
  await btn(page, 'Hentikan musik').click();
  await page.locator('#nav').getByRole('button', { name: 'Pengaturan' }).click();
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Tambah Kustom: fokus' }).click();
  await page.getByRole('button', { name: 'Kurangi Kustom: istirahat' }).click();
  await page.locator('#nav').getByRole('button', { name: 'Fokus' }).click();
  await btn(page, 'Lewati istirahat').click();
  await pickFirst(page);
  await btn(page, 'Siapkan Pomodoro').click();
  await expect(page.getByRole('button', { name: '20 / 2 kustom' })).toBeVisible();
  await page.getByRole('button', { name: '20 / 2 kustom' }).click();
  await expect(clock(page)).toHaveText('20:00');
});

test('batas Pengaturan: menyusun 1-15, kustom fokus 1-120, istirahat 1-60', async ({ page }) => {
  await open(page);
  await page.locator('#nav').getByRole('button', { name: 'Pengaturan' }).click();
  const out = (label) => page.locator('.setrow', { hasText: label }).locator('output');
  const press = async (label, dir, n) => {
    const b = page.getByRole('button', { name: (dir > 0 ? 'Tambah ' : 'Kurangi ') + label });
    for (let i = 0; i < n; i++) if (await b.isEnabled()) await b.click();
  };
  await press('Menyusun to-do', 1, 20);
  await expect(out('Menyusun to-do')).toHaveText('15');
  await press('Menyusun to-do', -1, 20);
  await expect(out('Menyusun to-do')).toHaveText('1');
  await press('Kustom: istirahat', 1, 70);
  await expect(out('Kustom: istirahat')).toHaveText('60');
  await press('Kustom: fokus', 1, 130);
  await expect(out('Kustom: fokus')).toHaveText('120');
});
