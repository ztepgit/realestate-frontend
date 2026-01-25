import { test, expect } from '@playwright/test';

// กำหนด URL ของหน้า Login (แก้ port ตามจริง)
const LOGIN_URL = 'http://localhost:3000/login';

test.describe('Authentication Page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(LOGIN_URL);
  });

  test('should show login form by default', async ({ page }) => {
    // เช็คว่ามีคำว่า Welcome Back
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    // เช็คว่าปุ่มเขียนว่า Sign In
    await expect(page.getByTestId('submit-btn')).toHaveText('Sign In');
  });

  test('should show validation alert if fields are empty', async ({ page }) => {
    // ดักจับ Alert
    page.once('dialog', dialog => {
      expect(dialog.message()).toContain('Please fill in all fields');
      dialog.dismiss().catch(() => {});
    });

    // กดปุ่ม Submit โดยไม่กรอกอะไร
    await page.getByTestId('submit-btn').click();
  });

  test('should toggle between Login and Signup', async ({ page }) => {
    // กดปุ่มสลับไปโหมด Sign Up
    await page.getByTestId('toggle-mode-btn').click();

    // เช็คว่าหัวข้อเปลี่ยนเป็น Create Account
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
    // ปุ่มต้องเปลี่ยนเป็น Sign Up
    await expect(page.getByTestId('submit-btn')).toHaveText('Sign Up');

    // กดสลับกลับมา Login
    await page.getByTestId('toggle-mode-btn').click();
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  });

  test('should redirect to home page after successful login', async ({ page }) => {
    // 1. Mock API Login ให้ตอบกลับว่าสำเร็จ (ไม่ต้องใช้ Backend จริง)
    await page.route('**/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ accessToken: 'fake-token', user: { id: 1, email: 'test@test.com' } })
      });
    });

    // 2. กรอกข้อมูล
    await page.getByTestId('email-input').fill('test@test.com');
    await page.getByTestId('password-input').fill('123456');

    // 3. กดปุ่ม Login
    await page.getByTestId('submit-btn').click();

    // 4. รอให้ URL เปลี่ยนไปหน้าแรก ('/')
    await expect(page).toHaveURL('http://localhost:3000/');
  });
});