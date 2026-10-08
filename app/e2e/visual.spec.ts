import { test, expect } from '@playwright/test';
import { BASE, login, setLocale, OWNER_ROUTES } from './helpers';

// Screenshots of every redesigned route, and no sideways scrolling on a phone (UX-09).
const OUT = process.env.SHOTS_DIR ?? 'test-results/visual';
const VIEWPORTS = [
  { tag: 'phone', width: 390, height: 844, scale: 2, langs: ['en', 'vi'] as const },
  { tag: 'tablet', width: 1180, height: 820, scale: 1, langs: ['en'] as const }
];

for (const vp of VIEWPORTS) {
  test(`visual ${vp.tag}`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.scale });
    const page = await ctx.newPage();
    await login(page);
    const overflow: string[] = [];
    for (const l of vp.langs) {
      await setLocale(page, l);
      for (const r of OWNER_ROUTES) {
        await page.goto(`${BASE}${r.path}`);
        await page.waitForLoadState('networkidle');
        const wide = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        if (wide > 1) overflow.push(`${r.name} (${l}) is ${wide}px too wide`);
        await page.screenshot({ path: `${OUT}/${vp.tag}-${r.name}${l === 'vi' ? '-vi' : ''}.jpg`, type: 'jpeg', quality: 55, fullPage: true });
      }
    }
    await setLocale(page, 'en');
    await ctx.close();
    expect(overflow, overflow.join('\n')).toEqual([]);
  });
}

// The tablet clock in both orientations, and the signed-out pages on a phone (UX-57).
test('visual kiosk and signed-out pages', async ({ browser }) => {
  const overflow: string[] = [];
  const check = async (page: import('@playwright/test').Page, name: string) => {
    const wide = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (wide > 1) overflow.push(`${name} is ${wide}px too wide`);
    await page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 55 });
  };
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/kiosk/pair`);
  await page.fill('#email', 'owner@example.com');
  await page.fill('#password', 'password123');
  await page.fill('#deviceName', 'Visual check');
  await page.click('button[type=submit]');
  await page.waitForURL(/\/kiosk$/);
  await check(page, 'kiosk-board');
  await page.locator('main button', { hasText: 'Hoa' }).click();
  await expect(page.locator('text=/Enter your PIN|Nhập mã PIN/')).toBeVisible();
  await check(page, 'kiosk-pin');
  await page.setViewportSize({ width: 820, height: 1180 });
  await check(page, 'kiosk-pin-portrait');
  await ctx.close();

  const anon = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const p = await anon.newPage();
  for (const path of ['/login', '/signup', '/kiosk/pair']) {
    await p.goto(`${BASE}${path}`);
    await check(p, `public${path.replaceAll('/', '-')}`);
  }
  await anon.close();
  expect(overflow, overflow.join('\n')).toEqual([]);
});
