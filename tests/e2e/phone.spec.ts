import { expect, test } from '@playwright/test';

/**
 * Guards the two defects reported from a real phone:
 *  - the bottom of the screen turned white,
 *  - the background went blurry when the tutorial appeared.
 * Both were caused by oversized composited layers, so the test checks the
 * computed styles rather than eyeballing a screenshot.
 */
test.describe('phone layout', () => {
  test.use({ viewport: { width: 740, height: 360 }, deviceScaleFactor: 2.6, hasTouch: true });

  test('bottom bar stays opaque and the coach never covers the target', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.getByRole('button', { name: 'شروع کمپین' }).click();
    await expect(page.locator('.coach')).toBeVisible();

    const styles = await page.evaluate(() => {
      const nav = document.querySelector('.navbar') as HTMLElement;
      const navStyle = getComputedStyle(nav);
      const shadowUsers: Array<{ cls: string; shadow: string }> = [];
      for (const el of Array.from(document.querySelectorAll<HTMLElement>('*'))) {
        const shadow = getComputedStyle(el).boxShadow;
        if (shadow && /\b\d{4,}px/.test(shadow)) {
          shadowUsers.push({ cls: el.className?.toString() ?? '', shadow });
        }
      }
      const blurred = Array.from(document.querySelectorAll<HTMLElement>('*')).filter((el) => {
        const style = getComputedStyle(el);
        return style.backdropFilter && style.backdropFilter !== 'none';
      }).length;
      return {
        navImage: navStyle.backgroundImage,
        navColor: navStyle.backgroundColor,
        shadowUsers,
        blurred,
      };
    });

    // a light metal texture blended with soft-light was turning this bar white
    expect(styles.navImage).not.toContain('brushed-metal');
    expect(styles.navImage).not.toContain('url(');
    expect(styles.shadowUsers).toEqual([]);
    expect(styles.blurred).toBe(0);

    // advance to a step with a real target and check the geometry
    await page.getByRole('button', { name: 'ادامه' }).click();
    await expect(page.locator('.coach-veil')).toHaveCount(4);

    const geometry = await page.evaluate(() => {
      const card = document.querySelector('.coach')!.getBoundingClientRect();
      const target = document.querySelector('[data-panel="crew"]')!.getBoundingClientRect();
      const nav = document.querySelector('[data-ui="nav"]')!.getBoundingClientRect();
      const overlap = (a: DOMRect, b: DOMRect) =>
        Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
        Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      return {
        area: (card.width * card.height) / (window.innerWidth * window.innerHeight),
        targetOverlap: overlap(card, target),
        navOverlap: overlap(card, nav),
      };
    });

    expect(geometry.area).toBeLessThan(0.22);
    expect(geometry.targetOverlap).toBe(0);
    expect(geometry.navOverlap).toBe(0);
  });

  test('workspaces take the full screen and expose live facts', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('benthic9.advanced', 'on');
      localStorage.setItem('benthic9.tutorial.v3', JSON.stringify({ index: 12, done: true, paused: false, minimized: false }));
    });
    await page.reload();
    await page.getByRole('button', { name: 'شروع کمپین' }).click();

    await page.locator('.navbar .nav-btn[data-panel="power"]').click();
    const workspace = page.locator('.workspace');
    await expect(workspace).toBeVisible();
    await expect(workspace.locator('.workspace__fact')).toHaveCount(3);

    const box = await workspace.boundingBox();
    expect(box?.height).toBeGreaterThan(300);
    expect(box?.width).toBeGreaterThan(700);

    await page.locator('.workspace__close').click();
    await expect(workspace).toHaveCount(0);
  });
});
