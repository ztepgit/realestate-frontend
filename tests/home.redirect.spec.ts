import { test, expect } from '@playwright/test';

test('redirect to login when not authenticated', async ({ page }) => {
  await page.goto('/');

  // AuthGuard ควรพาไปหน้า login
  await expect(page).toHaveURL(/\/login/);
});
