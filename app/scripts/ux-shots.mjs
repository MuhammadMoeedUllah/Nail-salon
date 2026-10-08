// After-screenshots for docs/ux-audit (UX-59). Run against a freshly seeded server:
//   CHROMIUM_PATH=/path/to/chrome node scripts/ux-shots.mjs [outDir] [baseUrl]
// It approves and pays the week before last on the way, so use a throwaway database.
import { chromium } from '@playwright/test';

const OUT = process.argv[2] ?? `../docs/ux-audit/${new Date().toISOString().slice(0, 10)}-after`;
const B = process.argv[3] ?? 'http://localhost:3123';
const TZ = 'America/New_York';
const ymd = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
const shift = (date, n) => {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const TODAY = ymd(new Date());
const THIS_WEEK = shift(TODAY, -((new Date(TODAY + 'T12:00:00Z').getUTCDay() + 6) % 7));
const LAST_WEEK = shift(THIS_WEEK, -7);
const PAID_WEEK = shift(THIS_WEEK, -14);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const shot = (page, name, full = true) => page.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 60, fullPage: full });

async function owner(viewport, scale) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale, timezoneId: TZ, locale: 'en-US' });
  const page = await ctx.newPage();
  await page.goto(`${B}/login`);
  await page.fill('#email', 'owner@example.com');
  await page.fill('#password', 'password123');
  await page.click('button[type=submit]');
  await page.waitForURL(/\/app\//);
  return { ctx, page };
}
async function visit(page, path, name, full = true) {
  await page.goto(`${B}${path}`);
  await page.waitForLoadState('networkidle');
  await shot(page, name, full);
}
async function twoPress(page, label) {
  await page.locator('button', { hasText: label }).first().click();
  await page.waitForTimeout(400);
  await page.locator('button[type=submit]', { hasText: /Confirm/ }).first().click();
  await page.waitForLoadState('networkidle');
}

// 1. phone, owner
{
  const { ctx, page } = await owner({ width: 390, height: 844 }, 2);
  await visit(page, '/app/home', 'phone-home');
  await visit(page, '/app/today', 'phone-today');
  await page.locator('div.fixed button', { hasText: /Add ticket/ }).click();
  await page.waitForTimeout(400);
  await shot(page, 'phone-ticket-sheet', false);
  await page.keyboard.press('Escape');
  await visit(page, '/app/pay', 'phone-pay-list');
  await visit(page, `/app/pay/${LAST_WEEK}`, 'phone-pay-week-draft');
  // approve and pay the week before last, then look at it and at one statement
  await page.goto(`${B}/app/pay/${PAID_WEEK}`);
  await twoPress(page, /Approve week/);
  await twoPress(page, /Mark all paid by check today/);
  await visit(page, `/app/pay/${PAID_WEEK}`, 'phone-pay-week-paid');
  const st = await page.locator(`a[href^="/app/pay/${PAID_WEEK}/"]:not([href$="/send"])`).first().getAttribute('href');
  await visit(page, st, 'phone-statement');
  await visit(page, `/app/pay/${PAID_WEEK}/send`, 'phone-send');
  for (const [path, name] of [['/app/workers', 'phone-workers'], ['/app/workers/new', 'phone-worker-new'], ['/app/services', 'phone-services'], ['/app/settings', 'phone-settings'], ['/app/tablets', 'phone-tablets'], ['/app/audit', 'phone-audit'], ['/app/tickets/import', 'phone-import'], ['/app/more', 'phone-more']])
    await visit(page, path, name);
  await page.goto(`${B}/locale?l=vi&next=/app/today`);
  await page.waitForLoadState('networkidle');
  await shot(page, 'phone-today-vi');
  await visit(page, '/app/home', 'phone-home-vi');
  await page.goto(`${B}/locale?l=en&next=/app/home`);
  await ctx.close();
}

// 2. tablet landscape, owner
{
  const { ctx, page } = await owner({ width: 1180, height: 820 }, 1);
  for (const [path, name] of [['/app/home', 'tablet-home'], ['/app/today', 'tablet-today'], ['/app/pay', 'tablet-pay-list'], [`/app/pay/${LAST_WEEK}`, 'tablet-pay-week-draft'], ['/app/workers', 'tablet-workers'], ['/app/settings', 'tablet-settings'], ['/app/tickets/import', 'tablet-import'], ['/app/audit', 'tablet-audit']])
    await visit(page, path, name);
  const st = await page.goto(`${B}/app/pay/${PAID_WEEK}`).then(() => page.locator(`a[href^="/app/pay/${PAID_WEEK}/"]:not([href$="/send"])`).first().getAttribute('href'));
  await visit(page, st, 'tablet-statement');
  await ctx.close();
}

// 3. the tablet clock
{
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, timezoneId: TZ, locale: 'en-US' });
  const page = await ctx.newPage();
  await page.goto(`${B}/kiosk/pair`);
  await page.fill('#email', 'owner@example.com');
  await page.fill('#password', 'password123');
  await page.fill('#deviceName', 'Front desk');
  await page.click('button[type=submit]');
  await page.waitForURL(/\/kiosk$/);
  await page.waitForTimeout(500);
  await shot(page, 'kiosk-grid', false);
  await page.locator('main button', { hasText: 'Linh' }).click();
  await page.waitForTimeout(300);
  await shot(page, 'kiosk-pin', false);
  for (const d of ['1', '1', '1', '1']) await page.locator('button', { hasText: new RegExp(`^${d}$`) }).click();
  await page.waitForTimeout(500);
  await shot(page, 'kiosk-done', false);
  // the tablet speaks each technician's language, so match both
  await page.locator('button', { hasText: /^\s*(Close|Đóng)\s*$/ }).click();
  await page.locator('main button', { hasText: 'Mai' }).click();
  for (const d of ['2', '2', '2', '2']) await page.locator('button', { hasText: new RegExp(`^${d}$`) }).click();
  await page.waitForTimeout(500);
  await shot(page, 'kiosk-actions', false);
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.locator('button', { hasText: /^\s*(Close|Đóng|Cancel|Hủy)\s*$/ }).first().click({ timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(500);
  await shot(page, 'kiosk-grid-portrait', false);
  await ctx.close();
}

// 4. signed out
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await visit(page, '/login', 'phone-login', false);
  await visit(page, '/signup', 'phone-signup');
  await ctx.close();
}

await browser.close();
console.log(`screenshots in ${OUT}`);
