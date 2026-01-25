import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // โฟลเดอร์ที่เก็บไฟล์ test ของคุณ
  testDir: './tests',
  
  // รัน test แบบขนานกัน (เร็วขึ้น)
  fullyParallel: true,
  
  // ถ้า Test พัง ให้ลองใหม่ไหม? (0 = ไม่ลอง, 1 = ลองอีก 1 ครั้ง)
  retries: 0,
  
  // Reporter (แสดงผลลัพธ์ใน Terminal และ HTML)
  reporter: 'html',

  use: {
    // URL หลักของหน้าเว็บคุณ
    baseURL: 'http://localhost:3000',

    // เก็บ Trace ไว้ดูเวลา Test พัง (สำคัญมากเอาไว้ Debug)
    trace: 'on-first-retry',
     headless: false,
     
    launchOptions: {
      slowMo: 500, // 👈 ใส่ตรงนี้
    },
  },

  // ตั้งค่า Browser ที่จะใช้ทดสอบ
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // ถ้าอยากเทส Firefox หรือ Safari (Webkit) ให้ uncomment ด้านล่าง
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
  ],

  // ⚡️ WebServer: สั่งให้ Playwright รัน "npm run dev" ให้เราอัตโนมัติก่อนเทส
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true, // ถ้าเรารัน npm run dev ค้างไว้อยู่แล้ว ก็ใช้ของเดิมเลย
  },
});