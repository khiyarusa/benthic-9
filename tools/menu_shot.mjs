import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'msedge' });
for (const size of [
  { name: 'phone', width: 844, height: 390 },
  { name: 'tablet', width: 1280, height: 800 },
]) {
  const page = await browser.newPage({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 2, hasTouch: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://127.0.0.1:5173/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `docs/screenshots/v4-menu-${size.name}.png` });
  console.log(size.name, JSON.stringify({ errors: errors.slice(0, 3) }));
  await page.close();
}
await browser.close();
