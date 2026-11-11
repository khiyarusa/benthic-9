import { chromium } from 'playwright';

const shots = [
  { name: 'v3-phone', width: 844, height: 390, dpr: 2 },
  { name: 'v3-wide', width: 915, height: 412, dpr: 2 },
  { name: 'v3-tablet', width: 1280, height: 800, dpr: 1 },
];

const browser = await chromium.launch({ channel: 'msedge' });
for (const spec of shots) {
  const page = await browser.newPage({
    viewport: { width: spec.width, height: spec.height },
    deviceScaleFactor: spec.dpr,
    hasTouch: true,
  });
  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('benthic9.tutorial.v2', JSON.stringify({ index: 12, done: true, paused: false }));
  });
  await page.reload();
  await page.getByRole('button', { name: 'کمپین جدید' }).click();
  await page.waitForTimeout(2400);
  await page.screenshot({ path: `docs/screenshots/${spec.name}-station.png` });
  await page.getByRole('button', { name: 'ایستگاه', exact: true }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `docs/screenshots/${spec.name}-panel.png` });
  await page.close();
}

// fresh tutorial shot
const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true });
await page.goto('http://127.0.0.1:5173/');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.getByRole('button', { name: 'کمپین جدید' }).click();
await page.waitForTimeout(1800);
await page.screenshot({ path: 'docs/screenshots/v3-tutorial.png' });
await browser.close();
console.log('shots done');
