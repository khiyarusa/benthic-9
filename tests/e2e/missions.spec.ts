import { expect, test } from '@playwright/test';

test.describe('campaign direction and codex', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 900, 'landscape only');

  test('shows one next objective, a three-act board and a locked codex', async ({ page }) => {
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

    const primary = page.locator('.primary');
    await expect(primary).toBeVisible();
    await expect(primary).toContainText('هدف بعدی');

    await page.locator('.navbar .nav-btn[data-panel="missions"]').click();
    await expect(page.locator('.board-act')).toHaveCount(3);
    await expect(page.locator('.board-item')).toHaveCount(12);
    await page.locator('.workspace__close').first().click();

    await page.locator('.navbar .nav-btn[data-panel="codex"]').click();
    await expect(page.locator('.codex-card')).toHaveCount(11);
    await expect(page.locator('.codex-card--locked').first()).toBeVisible();
    await page.locator('.workspace__close').first().click();

    // advanced mode reveals the technical panels, basic mode hides them
    const basicCount = await page.locator('.navbar .nav-btn').count();
    await page.locator('.navbar .nav-btn[data-panel="log"]').click();
    await page.getByRole('button', { name: 'تنظیمات' }).click();
    await page.getByText('حالت پیشرفته').click();
    await page.waitForTimeout(400);
    const advancedCount = await page.locator('.navbar .nav-btn').count();
    expect(advancedCount).toBeGreaterThan(basicCount);
  });
});
