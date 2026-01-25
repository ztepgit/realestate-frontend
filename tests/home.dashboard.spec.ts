import { Page } from '@playwright/test';

export async function login(page: Page) {
  await page.goto('/login');

  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');

  await page.click('button[type="submit"]');

  // รอ session + redirect
  await page.waitForURL('/');
}
