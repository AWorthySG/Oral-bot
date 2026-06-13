import { expect, test } from '@playwright/test';

// Verifies the on-screen touch controls appear on a touch device and that
// dragging the joystick actually moves the player.
test('touch joystick moves the player', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto('/');
  await page.waitForFunction(() => 'oralbot' in window, null, { timeout: 15000 });

  // The joystick and interact button should be visible on touch.
  await expect(page.locator('.touch-stick')).toBeVisible();
  await expect(page.locator('.touch-e')).toBeVisible();

  const before = await page.evaluate(() => (window as any).oralbot.getState().pos);

  // Drag the joystick upward (forward) and hold briefly.
  const box = (await page.locator('.touch-stick').boundingBox())!;
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy - 60, { steps: 4 });
  await page.waitForTimeout(700);
  await page.mouse.up();

  const after = await page.evaluate(() => (window as any).oralbot.getState().pos);
  const moved = Math.hypot(after.x - before.x, after.z - before.z);
  expect(moved, `player should move; travelled ${moved.toFixed(2)}`).toBeGreaterThan(1);

  await page.screenshot({ path: 'e2e/touch.png' });
  await context.close();
});
