import { expect, test } from '@playwright/test';

test.describe('manual ROV dive', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 900, 'landscape only');

  test('opens, runs the scene and returns to the station', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem(
        'benthic9.tutorial.v3',
        JSON.stringify({ index: 12, done: true, paused: false, minimized: false }),
      );
    });
    await page.reload();
    await page.getByRole('button', { name: 'شروع کمپین' }).click();

    await page.getByRole('button', { name: 'اکتشاف', exact: true }).click();
    await page.locator('.dive-choice').first().click();

    const overlay = page.locator('.dive');
    await expect(overlay).toBeVisible();
    await expect(page.locator('.dive__stage canvas')).toBeVisible();

    // the instrument panel must show live values from the scene
    await page.waitForFunction(
      () => Boolean(document.querySelector('.dive__stats')?.textContent?.includes('باتری')),
      undefined,
      { timeout: 15000 },
    );
    // Live telemetry needs a GPU-capable browser; the CI runner is headless
    // without one, so the simulation-side behaviour is covered by unit tests.
    if (!process.env.CI) {
      const before = await page.locator('.dive__stats').textContent();
      await expect
        .poll(async () => page.locator('.dive__stats').textContent(), { timeout: 15000 })
        .not.toBe(before);
    }

    await page.getByRole('button', { name: 'لغو' }).click();
    await expect(page.locator('.dive')).toHaveCount(0);

    // the station is playable again and the ROV is back in the dock
    await expect(page.getByRole('button', { name: 'ایستگاه', exact: true })).toBeVisible();
  });
});
