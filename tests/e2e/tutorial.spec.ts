import { expect, test } from '@playwright/test';

test.describe('first shift tutorial', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 900, 'landscape only');

  test('guides the commander through the first actions', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'کمپین جدید' }).click();

    const card = page.locator('.tutorial-card');
    await expect(card).toBeVisible();
    await expect(card).toContainText('اولین شیفت فرمانده');
    await expect(page.locator('.tutorial-card__step')).toContainText('۱ از ۱۲');

    await page.getByRole('button', { name: 'ادامه' }).click();
    await expect(page.locator('.tutorial-card__step')).toContainText('۲ از ۱۲');

    // the spotlight must sit on the real navigation button
    await expect(page.locator('.tutorial-spotlight')).toBeVisible();
    await expect(page.locator('[data-panel="crew"]')).toBeVisible();

    await page.locator('[data-panel="crew"]').click();
    await expect(page.locator('.tutorial-card__step')).toContainText('۳ از ۱۲', { timeout: 6000 });

    // the sheet closed automatically so the next target is reachable
    await expect(page.locator('.sheet')).toHaveCount(0);

    await page.getByRole('button', { name: 'رد کردن آموزش' }).click();
    await expect(page.locator('.tutorial-card')).toHaveCount(0);

    await page.reload();
    await page.getByRole('button', { name: 'کمپین جدید' }).click();
    await expect(page.locator('.tutorial-card')).toHaveCount(0);
  });
});
