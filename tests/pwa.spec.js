import { test, expect } from '@playwright/test';

// Tes ini butuh service worker, jadi tidak memakai pengaturan 'block' dari config.
test.use({ serviceWorkers: 'allow' });

test('manifest valid dan ikon tersedia', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const res = await request.get(new URL(href, page.url()).href);
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m).toMatchObject({ name: 'Pomodoro Fokus', display: 'standalone', start_url: './', scope: './' });
  const sizes = m.icons.map((i) => i.sizes);
  expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
  expect(m.icons.some((i) => i.purpose === 'maskable')).toBe(true);
  for (const i of m.icons) {
    const r = await request.get(new URL(i.src, page.url()).href);
    expect(r.ok(), i.src).toBe(true);
    expect(r.headers()['content-type']).toBe('image/png');
  }
});

test('Chromium menilai aplikasi bisa dipasang (installable)', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  const cdp = await context.newCDPSession(page);
  const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
  expect(installabilityErrors).toEqual([]);
});

test('jalan tanpa internet setelah dibuka sekali, data tetap ada', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  // tunggu cache terisi lengkap
  await expect.poll(() => page.evaluate(async () => {
    const keys = await caches.keys();
    if (!keys.length) return 0;
    return (await (await caches.open(keys[0])).keys()).length;
  })).toBeGreaterThanOrEqual(17);
  await page.reload(); // supaya halaman dikendalikan service worker
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  await page.getByRole('button', { name: 'Mulai sesi baru' }).click();
  await page.fill('#f-title', 'Tugas offline');
  await page.getByRole('button', { name: 'Tambah tugas', exact: true }).click();

  await context.setOffline(true);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.reload();
  await expect(page.locator('[data-sort] .task .name')).toHaveText(['Tugas offline']);
  await page.locator('#nav').getByRole('button', { name: 'To-do' }).click();
  await expect(page.locator('.task')).toContainText('Tugas offline');
  expect(errors).toEqual([]);
  await context.setOffline(false);
});

test('hanya satu cache aplikasi yang tersisa', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  const names = await page.evaluate(() => caches.keys());
  expect(names.filter((n) => n.startsWith('pomo-shell-'))).toHaveLength(1);
});
