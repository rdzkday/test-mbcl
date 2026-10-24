// Membuat ikon PNG dari icons/*.svg memakai Chromium bawaan Playwright.
// Pakai: node scripts/make-icons.mjs
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'icons');
const jobs = [
  ['icon.svg', 'icon-192.png', 192],
  ['icon.svg', 'icon-512.png', 512],
  ['icon-maskable.svg', 'icon-maskable-512.png', 512],
  ['icon-maskable.svg', 'apple-touch-icon.png', 180]
];

const browser = await chromium.launch();
for (const [src, out, size] of jobs) {
  const svg = fs.readFileSync(path.join(dir, src), 'utf8');
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.screenshot({ path: path.join(dir, out), omitBackground: true });
  await page.close();
  console.log(out);
}
await browser.close();
