import { test, expect } from '@playwright/test';
import { open, store, tab, btn, advance, planOne, pickFirst, addTask, task } from './helpers.js';

const at = (iso) => new Date(iso).getTime();
const tile = (page, label) => page.locator('.tile', { hasText: label }).locator('b');

test('reset 05.00: tugas lama hilang dari Fokus, tetap di To-do, "Kerjakan hari ini" memunculkannya lagi', async ({ page }) => {
  await open(page, { time: new Date('2026-03-10T04:50:00+07:00') });
  await planOne(page, 'Tugas lama');
  expect((await store(page)).phase).toBe('select');
  await expect(page.locator('.pickbtn')).toHaveCount(1);

  await advance(page, '15:00'); // 05.05
  await expect(page.locator('.pickbtn')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Fokus' })).toBeVisible();
  expect((await store(page)).phase).toBe('idle');
  await expect(tile(page, 'To-do hari ini')).toHaveText('0');
  await expect(page.getByText('1 to-do lama tidak ditampilkan')).toBeVisible();

  await tab(page, 'To-do');
  const row = page.locator('.task', { hasText: 'Tugas lama' });
  await expect(row).toBeVisible();
  await btn(page, 'Kerjakan hari ini').click();
  await tab(page, 'Fokus');
  await expect(tile(page, 'To-do hari ini')).toHaveText('1');
  await btn(page, 'Lewati, pilih tugas').click();
  await expect(page.locator('.pickbtn', { hasText: 'Tugas lama' })).toBeVisible();
});

test('reset 05.00 menunggu sesi yang sedang jalan', async ({ page }) => {
  await open(page, { time: new Date('2026-03-10T04:40:00+07:00') });
  await planOne(page, 'Tugas A');
  await pickFirst(page);
  await btn(page, 'Siapkan Pomodoro').click();
  await page.getByRole('button', { name: '50 / 10', exact: true }).click();
  await btn(page, 'Mulai fokus').click();
  await advance(page, '25:00'); // 05.05, sesi masih jalan
  expect((await store(page)).phase).toBe('focus');
  await expect(page.locator('.crow')).toContainText('Tugas A');

  await advance(page, '25:00'); // fokus selesai 05.30 → istirahat
  expect((await store(page)).phase).toBe('break');
  await btn(page, 'Hentikan musik').click();
  await advance(page, '10:00'); // istirahat selesai → select, lalu reset
  await advance(page, '00:01');
  expect((await store(page)).phase).toBe('idle');
  await expect(tile(page, 'To-do hari ini')).toHaveText('0');
});

test('tugas hari ini tampil sesuai urutan dibuat', async ({ page }) => {
  await open(page);
  await btn(page, 'Mulai sesi baru').click();
  for (const n of ['Satu', 'Dua', 'Tiga']) await addTask(page, n);
  await expect(page.locator('[data-sort] .task .name')).toHaveText(['Satu', 'Dua', 'Tiga']);
});

async function dragGrip(page, from, to) {
  const g = page.locator('[data-sort] .task').nth(from).locator('.grip');
  const target = page.locator('[data-sort] .task').nth(to);
  const a = await g.boundingBox(), b = await target.boundingBox();
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  const ty = to > from ? b.y + b.height - 4 : b.y + 4;
  await page.mouse.move(a.x + a.width / 2, ty, { steps: 12 });
  await page.mouse.up();
}

test('drag mengubah urutan dan tetap setelah reload', async ({ page }) => {
  await open(page);
  await btn(page, 'Mulai sesi baru').click();
  for (const n of ['Satu', 'Dua', 'Tiga']) await addTask(page, n);
  await dragGrip(page, 0, 2);
  await expect(page.locator('[data-sort] .task .name')).toHaveText(['Dua', 'Tiga', 'Satu']);
  await page.reload();
  // sesi menyusun masih jalan setelah reload; urutan datang dari data tersimpan
  await expect(page.locator('[data-sort] .task .name')).toHaveText(['Dua', 'Tiga', 'Satu']);
});

test('urutan bisa diubah dengan keyboard panah', async ({ page }) => {
  await open(page);
  await btn(page, 'Mulai sesi baru').click();
  for (const n of ['Satu', 'Dua', 'Tiga']) await addTask(page, n);
  await page.locator('.grip').nth(2).focus();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('[data-sort] .task .name')).toHaveText(['Tiga', 'Satu', 'Dua']);
  const ord = (await store(page)).tasks.sort((a, b) => a.ord - b.ord).map((t) => t.title);
  expect(ord).toEqual(['Tiga', 'Satu', 'Dua']);
});

test('drag bekerja dengan sentuhan (pointer touch)', async ({ browser }) => {
  const ctx = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 800 }, locale: 'id-ID', timezoneId: 'Asia/Jakarta' });
  const page = await ctx.newPage();
  await open(page);
  await btn(page, 'Mulai sesi baru').click();
  for (const n of ['Satu', 'Dua', 'Tiga']) await addTask(page, n);
  const grip = page.locator('[data-sort] .task').nth(0).locator('.grip');
  const b = await page.locator('[data-sort] .task').nth(2).boundingBox();
  const cdp = await ctx.newCDPSession(page);
  const g = await grip.boundingBox();
  const x = g.x + g.width / 2, y0 = g.y + g.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
  for (let i = 1; i <= 10; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 + ((b.y + b.height - 4 - y0) * i) / 10 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('[data-sort] .task .name')).toHaveText(['Dua', 'Tiga', 'Satu']);
  await ctx.close();
});

test('To-do: tanggal+jam dibuat dan filter Semua/Aktif/Selesai', async ({ page }) => {
  const a = task({ id: 'a', title: 'Aktif A', at: at('2026-03-09T21:15:00+07:00') });
  const b = task({ id: 'b', title: 'Selesai B', done: true, doneAt: at('2026-03-09T22:00:00+07:00'), spent: 1500, at: at('2026-03-09T21:20:00+07:00') });
  await open(page, { state: { tasks: [a, b], settings: { plan: 5, cf: 15, cb: 3 }, theme: 'light' } });
  await tab(page, 'To-do');
  await expect(page.locator('.task', { hasText: 'Aktif A' })).toContainText(/Dibuat 9 Mar(et)?, 21[.:]15/);
  await expect(page.locator('.task')).toHaveCount(2);
  await page.getByRole('button', { name: 'Aktif', exact: true }).click();
  await expect(page.locator('.task .name')).toHaveText(['Aktif A']);
  await page.getByRole('button', { name: 'Selesai', exact: true }).click();
  await expect(page.locator('.task .name')).toHaveText(['Selesai B']);
  await expect(page.locator('.task')).toContainText('Selesai 9 Mar');
  await expect(page.locator('.task')).toContainText('fokus 25 mnt');
  await page.getByRole('button', { name: 'Semua', exact: true }).click();
  await expect(page.locator('.task')).toHaveCount(2);
});
