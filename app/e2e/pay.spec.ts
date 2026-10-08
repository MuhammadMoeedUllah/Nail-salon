import { test, expect } from '@playwright/test';
import { BASE, login, LAST_WEEK, THIS_WEEK } from './helpers';

test.describe.configure({ mode: 'serial' });

test('phone: technician cards explain the amount in plain words', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await login(page);
  await page.goto(`${BASE}/app/pay/${LAST_WEEK}`);
  const card = page.locator('article[id^=line-]').first();
  await card.locator('button', { hasText: /Why this amount|Vì sao ra số này/ }).click();
  await expect(card.locator('ol li').first()).toBeVisible();
  await expect(card.locator('ol')).not.toContainText(/Cents|Minutes|Pct/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await ctx.close();
});

test('approve, record how each was paid, and send a statement', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  await login(page);
  await page.goto(`${BASE}/app/pay/${LAST_WEEK}`);
  const approve = page.locator('button', { hasText: /Approve week|Duyệt tuần/ });
  test.skip((await approve.count()) === 0, 'week already approved by another spec');
  await approve.click();
  await page.waitForTimeout(400); // a second press within 350 ms counts as a double tap and is ignored
  await page.locator('button[type=submit]', { hasText: /Confirm: approve|Xác nhận: duyệt/ }).click();
  await expect(page.locator('[data-testid=run-status] [aria-current=step]')).toContainText(/Approved|Đã duyệt/);
  // paid another way: the first technician in cash
  await page.locator('button', { hasText: /Paid another way|Trả cách khác/ }).click();
  const sheet = page.locator('[role=dialog]');
  await sheet.locator('fieldset').first().locator('label', { hasText: /^\s*(Cash|Tiền mặt)\s*$/ }).click();
  await sheet.locator('button[type=submit]', { hasText: /Save as paid|Lưu đã trả/ }).click();
  await expect(page.locator('[data-testid=run-status] [aria-current=step]')).toContainText(/Paid|Đã trả/);
  // send: copying the link marks the statement as sent
  await page.locator('a', { hasText: /Send statements|Gửi bảng lương/ }).click();
  await page.waitForURL(/\/send$/);
  const first = page.locator('li.card').first();
  await first.locator('button', { hasText: /Copy link|Chép link/ }).click();
  await expect(first).toContainText(/Sent|Đã gửi/);
  await ctx.close();
});

test('approval waits while a shift has no clock-out', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/app/pay/${THIS_WEEK}`);
  const banner = page.locator('[role=alert]', { hasText: /Fix before approving|Cần sửa trước khi duyệt/ });
  test.skip((await banner.count()) === 0, 'no open shift this week');
  await expect(page.locator('button', { hasText: /Approve week|Duyệt tuần/ })).toBeDisabled();
});
