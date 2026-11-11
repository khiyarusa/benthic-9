import { expect, test } from '@playwright/test';

test.describe('first shift coaching', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 900, 'landscape only');

  test('keeps the taught control visible and clickable', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: 'شروع کمپین' }).click();

    const card = page.locator('.coach');
    await expect(card).toBeVisible();
    await expect(card).toContainText('ورود به ایستگاه');

    // the card must stay small: at most 22% of the viewport
    const area = await card.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      return (rect.width * rect.height) / (window.innerWidth * window.innerHeight);
    });
    expect(area).toBeLessThan(0.22);

    await card.getByRole('button', { name: 'ادامه' }).click();
    await expect(card).toContainText('خدمه را بشناس');

    // the spotlight must sit on the crew button, and the card must not cover it
    const crew = page.locator('[data-panel="crew"]');
    await expect(crew).toBeVisible();
    const geometry = await page.evaluate(() => {
      const cardRect = document.querySelector('.coach')!.getBoundingClientRect();
      const target = document.querySelector('[data-panel="crew"]')!.getBoundingClientRect();
      const spot = document.querySelector('.coach-spot')!.getBoundingClientRect();
      const overlap = (a: DOMRect, b: DOMRect) =>
        Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
        Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      return {
        cardOverlap: overlap(cardRect, target),
        spotOverlap: overlap(spot, target),
      };
    });
    expect(geometry.cardOverlap).toBe(0);
    expect(geometry.spotOverlap).toBeGreaterThan(0);

    // the taught action really advances the tutorial
    await crew.click();
    await expect(page.locator('.coach')).toContainText('وضعیت ایستگاه', { timeout: 6000 });
    await expect(page.locator('.sheet')).toBeVisible();
  });

  test('can be minimized, skipped and stays skipped after reload', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: 'شروع کمپین' }).click();

    await page.getByRole('button', { name: 'کوچک کردن راهنما' }).click();
    await expect(page.locator('.coach-pill')).toBeVisible();
    await page.locator('.coach-pill').click();
    await expect(page.locator('.coach')).toBeVisible();

    await page.locator('.coach').getByRole('button', { name: 'رد کردن' }).click();
    await expect(page.locator('.coach')).toHaveCount(0);

    await page.reload();
    await page.getByRole('button', { name: 'شروع کمپین' }).click();
    await expect(page.locator('.coach')).toHaveCount(0);
    await expect(page.locator('.next-action')).toBeVisible();
  });
});
