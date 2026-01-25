# Playwright E2E Testing (Frontend)

เอกสารนี้อธิบายการใช้งาน **Playwright** สำหรับทดสอบ End‑to‑End (E2E) ฝั่ง Frontend (Next.js + TypeScript)

---

## 1. Playwright คืออะไร

Playwright คือเครื่องมือ E2E Testing สำหรับทดสอบ Web Application แบบเสมือนผู้ใช้จริง
- เปิด Browser จริง (Chromium / Firefox / WebKit)
- คลิก ป้อนข้อมูล เปลี่ยนหน้าได้เหมือนคน
- เหมาะกับการเทส Flow สำคัญ เช่น Login, CRUD, Permission

---

## 2. การติดตั้ง

```bash
npm install -D @playwright/test
npx playwright install
```

คำสั่งนี้จะติดตั้ง:
- Playwright Test Runner
- Browser binaries (Chromium, Firefox, WebKit)

---

## 3. โครงสร้างไฟล์ที่แนะนำ

```
frontend/
├─ playwright.config.ts
├─ tests/
│  ├─ auth.spec.ts
│  ├─ home.spec.ts
│  ├─ property.spec.ts
│  └─ helpers/
│     └─ login.ts
└─ app/
```

---

## 4. playwright.config.ts (ตัวอย่าง)

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 720 },
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
```

> หมายเหตุ: ถ้าจะดู UI ให้ใช้ `--headed` ตอนรัน test

---

## 5. คำสั่งรัน Test

### รันทั้งหมด (Headless)
```bash
npx playwright test
```

### เปิด Browser ดู UI
```bash
npx playwright test --headed
```

### เปิด Playwright UI (Debug)
```bash
npx playwright test --ui
```

---

## 6. ตัวอย่าง Test พื้นฐาน

### tests/home.spec.ts

```ts
import { test, expect } from '@playwright/test';

test('โหลดหน้า Home และเห็น Property Cards', async ({ page }) => {
  await page.goto('/');

  const cards = page.locator('[data-testid^="fav-btn-"]');
  await expect(cards.first()).toBeVisible();
});
```

---

## 7. ใช้ Helper (เช่น Login)

### tests/helpers/login.ts

```ts
import { Page } from '@playwright/test';

export async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', '123456');
  await page.click('button[type="submit"]');
}
```

เรียกใช้ใน test:
```ts
import { login } from './helpers/login';
```

---

## 8. การ Debug Test

### หยุดดูหน้าจอชั่วคราว
```ts
await page.pause();
```

### ทำให้ test ช้าลง (config)
```ts
use: {
  launchOptions: {
    slowMo: 500,
  },
}
```

---

## 9. Best Practices

- 1 test = 1 user flow
- ใช้ `data-testid` แทน class / text
- แยก logic ซ้ำ ๆ ไปไว้ใน `helpers/`
- อย่าเขียน test ผูกกับ UI detail มากเกินไป

---

## 10. คำสั่งที่ใช้จริงตอนสอบ / ส่งงาน

```bash
npx playwright test --headed
```

คำสั่งเดียวจบ เห็น UI ทุก test และตรวจสอบได้ง่าย

---

Happy Testing 🚀

