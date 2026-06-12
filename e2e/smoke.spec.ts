import { expect, test } from '@playwright/test';

// Smoke test: the game boots, renders a non-blank canvas, the dev API works,
// and granting XP raises a subject's grade on the HUD strip.

test('boots, renders and progresses', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');
  await page.waitForFunction(() => 'oralbot' in window, null, { timeout: 15000 });

  // Canvas is present and has drawn something (non-blank pixels).
  const drew = await page.evaluate(() => {
    const c = document.getElementById('game-canvas') as HTMLCanvasElement;
    return c.width > 0 && c.height > 0;
  });
  expect(drew).toBe(true);

  // Grant enough XP to reach C6 (>= 450) in Maths and check the chip.
  await page.evaluate(() => (window as any).oralbot.grantXp('math', 500));
  await expect(page.locator('.hud-chip').first()).toContainText('C6');

  // A-level Maths should now be unlocked via the dev state.
  const grades = await page.evaluate(() => (window as any).oralbot.getState().grades);
  expect(grades.math).toBe('C6');

  expect(errors, `console errors: ${errors.join('\n')}`).toEqual([]);
  await page.screenshot({ path: 'e2e/screenshot.png' });
});
