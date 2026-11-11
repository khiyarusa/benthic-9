import { chromium } from 'playwright';
import fs from 'node:fs';

const SIZES = [
  { name: 'a23', width: 844, height: 390 },
  { name: 'wide', width: 915, height: 412 },
  { name: 'tablet', width: 1280, height: 800 },
];

const browser = await chromium.launch({ channel: 'msedge' });
const report = { sizes: {}, tutorial: {}, errors: [], perf: null };

const page = await browser.newPage({ viewport: { width: 844, height: 390 }, hasTouch: true, deviceScaleFactor: 2 });
page.on('pageerror', (e) => report.errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') report.errors.push('console: ' + m.text()); });

await page.goto('http://127.0.0.1:5173/');
await page.evaluate(() => {
  localStorage.clear();
});
await page.reload();
await page.getByRole('button', { name: 'کمپین جدید' }).click();
await page.waitForTimeout(1800);

// layout probe across viewports
for (const size of SIZES) {
  await page.setViewportSize({ width: size.width, height: size.height });
  await page.waitForTimeout(600);
  const probe = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const rect = canvas.getBoundingClientRect();
    const scene = window.__benthicGame?.scene.getScene('station');
    const rooms = scene?.roomRects ? [...scene.roomRects.entries()].map(([id, r]) => ({
      id, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.w), h: Math.round(r.h),
    })) : [];
    const offscreen = rooms.filter((r) => r.x < 0 || r.y < 0 || r.x + r.w > canvas.width || r.y + r.h > canvas.height).map((r) => r.id);
    const labels = scene?.labels ? [...scene.labels.entries()].map(([id, t]) => ({ id, w: Math.round(t.width), h: Math.round(t.height) })) : [];
    return {
      canvasCss: [Math.round(rect.width), Math.round(rect.height)],
      canvasPx: [canvas.width, canvas.height],
      dpr: window.devicePixelRatio,
      rooms: rooms.length,
      offscreen,
      minRoom: rooms.length ? Math.min(...rooms.map((r) => Math.min(r.w, r.h))) : 0,
      labels: labels.slice(0, 2),
    };
  });
  report.sizes[size.name] = probe;
}

// FPS sample
await page.setViewportSize({ width: 844, height: 390 });
await page.waitForTimeout(500);
report.perf = await page.evaluate(async () => {
  const game = window.__benthicGame;
  const frames = [];
  let last = performance.now();
  await new Promise((resolve) => {
    let count = 0;
    const tick = () => {
      const now = performance.now();
      frames.push(now - last);
      last = now;
      count += 1;
      if (count >= 120) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const sorted = frames.slice(5).sort((a, b) => a - b);
  const p = (q) => sorted[Math.floor(sorted.length * q)] ?? 0;
  return {
    fpsMedian: Math.round(1000 / p(0.5)),
    fpsP95FrameMs: Math.round(p(0.95)),
    worstMs: Math.round(sorted[sorted.length - 1]),
    drawCalls: game?.renderer?.drawCalls ?? null,
    objects: game?.scene.getScene('station')?.children?.list?.length ?? null,
  };
});

fs.writeFileSync('audit-report.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 1));
await browser.close();
