import { expect, test } from '@playwright/test';

test.describe('BENTHIC-9 first session', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 900, 'landscape only');

  test('boots, starts a campaign and opens the station panels', async ({ page }) => {
    // technical panels live behind the advanced toggle since V6
    await page.addInitScript(() => localStorage.setItem('benthic9.advanced', 'on'));
    await page.goto('/');
    await expect(page.locator('.brand-title')).toHaveText('BENTHIC-9');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    // portrait gate must stay hidden in landscape
    await expect(page.locator('.orientation-gate')).toBeHidden();

    await page.getByRole('button', { name: 'شروع کمپین' }).click();
    await expect(page.locator('.topbar')).toBeVisible();

    const briefing = page.locator('.modal-card');
    if (await briefing.isVisible().catch(() => false)) {
      await page.getByRole('button', { name: 'شروع مأموریت' }).click();
    }

    const canvas = page.locator('.stage canvas');
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box?.width).toBeGreaterThan(600);
    expect(box?.height).toBeGreaterThan(200);

    // the simulation clock advances while running
    const clock = page.locator('.topbar__clock strong');
    const before = await clock.textContent();
    await page.waitForTimeout(2600);
    const after = await clock.textContent();
    expect(after).not.toBe(before);

    // management panels
    await page.getByRole('button', { name: 'برق', exact: true }).click();
    await expect(page.locator('.workspace__titles h2')).toContainText('مدیریت برق');
    await expect(page.getByRole('button', { name: 'راه‌اندازی مجدد' })).toBeDisabled();
    await page.locator('.workspace__close').click();

    // room drill-down from the station overview
    await page.getByRole('button', { name: 'ایستگاه', exact: true }).click();
    await page.locator('.room-card', { hasText: 'مرکز فرماندهی' }).click();
    await expect(page.locator('.sheet__title')).toContainText('مرکز فرماندهی');
    await expect(page.getByRole('tab', { name: 'تجهیزات' })).toBeVisible();

    await page.screenshot({ path: 'docs/screenshots/station-overview.png', fullPage: false });
  });

  test('research panel exposes the real technology tree', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('benthic9.advanced', 'on'));
    await page.goto('/');
    await page.getByRole('button', { name: 'شروع کمپین' }).click();
    const start = page.getByRole('button', { name: 'شروع مأموریت' });
    if (await start.isVisible().catch(() => false)) await start.click();

    await page.getByRole('button', { name: 'پژوهش', exact: true }).click();
    await expect(page.locator('.research-node')).toHaveCount(9);
    const alloyNode = page
      .locator('.research-node')
      .filter({ has: page.locator('.research-node__name', { hasText: /^آلیاژ فشار بالا$/ }) });
    await expect(alloyNode).toBeVisible();
    await expect(alloyNode).toContainText('آماده');

    await alloyNode.getByRole('button', { name: 'شروع پژوهش' }).click();
    await expect(alloyNode).toContainText('در حال پژوهش');
  });
});
