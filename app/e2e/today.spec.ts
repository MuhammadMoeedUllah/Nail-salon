import { test, expect } from '@playwright/test';
import { BASE, login, TODAY, THIS_WEEK } from './helpers';

test.describe.configure({ mode: 'serial' });

test('phone: add a ticket from the bottom sheet in three taps', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await login(page);
  await page.goto(`${BASE}/app/today`);
  await page.locator('div.fixed button', { hasText: /Add ticket|Thêm phiếu/ }).click();
  const sheet = page.locator('[role=dialog]');
  await sheet.locator('button', { hasText: 'Jenny' }).click();
  await sheet.locator('button', { hasText: 'Pedicure' }).first().click();
  await sheet.locator('button', { hasText: /^\$10$/ }).click();
  await expect(sheet.locator('button[type=submit]')).toContainText('$40.00 + $10.00');
  await sheet.locator('button[type=submit]').click();
  await expect(sheet.locator('[role=status]', { hasText: /Added: Pedicure/ })).toBeVisible();
  await sheet.locator('button[aria-label=Close]').click();
  await expect(page.locator('#tech-' + (await page.locator('article[id^=tech-]', { hasText: 'Jenny' }).getAttribute('id'))!.slice(5))).toContainText(/2 tickets/);
  await ctx.close();
});

test('void a ticket with a one-tap reason, then undo it', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/app/today`);
  const hoa = page.locator('article[id^=tech-]', { hasText: 'Hoa' });
  await expect(hoa.locator('button', { hasText: /^\s*(Void|Hủy phiếu)\s*$/ }).first()).toBeVisible(); // cards open once the page is interactive
  const count = await hoa.locator('button', { hasText: /^\s*(Void|Hủy phiếu)\s*$/ }).count();
  await hoa.locator('button', { hasText: /^\s*(Void|Hủy phiếu)\s*$/ }).first().click();
  const sheet = page.locator('[role=dialog]');
  await sheet.locator('button', { hasText: /Entered twice|Ghi trùng/ }).click();
  await sheet.locator('button[type=submit]').click();
  await expect(page.locator('[data-testid=toast]')).toContainText(/Voided|Đã hủy/);
  await expect(hoa.locator('button', { hasText: /^\s*(Void|Hủy phiếu)\s*$/ })).toHaveCount(count - 1);
  await page.locator('[data-testid=toast] button', { hasText: /Undo|Hoàn tác/ }).click();
  await expect(hoa.locator('button', { hasText: /^\s*(Void|Hủy phiếu)\s*$/ })).toHaveCount(count);
});

test('clock out now, then undo; add hours by hand', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/app/today`);
  const mai = page.locator('article[id^=tech-]', { hasText: 'Mai' });
  await mai.locator('button', { hasText: /Clock out now|Ra ca ngay/ }).click();
  await expect(page.locator('[data-testid=toast]')).toContainText(/clocked out at|đã ra ca lúc/);
  await expect(mai.locator('button', { hasText: /Clock out now|Ra ca ngay/ })).toHaveCount(0);
  await page.locator('[data-testid=toast] button', { hasText: /Undo|Hoàn tác/ }).click();
  await expect(mai.locator('button', { hasText: /Clock out now|Ra ca ngay/ })).toHaveCount(1);
  // add hours for Linh from her card
  const linh = page.locator('article[id^=tech-]', { hasText: 'Linh' });
  const shifts = await linh.locator('li', { hasText: '→' }).count();
  await linh.locator('button', { hasText: /Add hours|Thêm giờ làm/ }).click();
  const sheet = page.locator('[role=dialog]');
  await sheet.locator('button[type=submit]').click();
  await expect(page.locator('[data-testid=toast]')).toContainText(/Hours added|Đã thêm giờ/);
  await expect(linh.locator('li', { hasText: '→' })).toHaveCount(shifts + 1);
});

test('fix a forgotten clock-out with reason chips', async ({ page }) => {
  await login(page);
  // the seed leaves Kim's last shift this week open; Home links straight to it
  await page.goto(`${BASE}/app/home`);
  const todo = page.locator('a', { hasText: /Kim did not clock out|Kim chưa ra ca/ });
  test.skip((await todo.count()) === 0, 'no forgotten shift seeded (first day of the week)');
  await todo.click();
  await page.waitForURL(/focus=/);
  const kim = page.locator('article[id^=tech-]', { hasText: 'Kim' });
  await kim.locator('button', { hasText: /Fix time|Sửa giờ/ }).click();
  const sheet = page.locator('[role=dialog]');
  await expect(sheet.locator('button[aria-pressed=true]', { hasText: /Forgot to clock out|Quên ra ca/ })).toBeVisible();
  await sheet.locator('#fx-out').fill('19:30');
  await sheet.locator('button[type=submit]', { hasText: /Save time|Lưu giờ/ }).click();
  await expect(page.locator('[data-testid=toast]')).toContainText(/Saved Kim|Đã lưu giờ của Kim/);
  await page.goto(`${BASE}/app/home`);
  await expect(page.locator('a', { hasText: /Kim did not clock out|Kim chưa ra ca/ })).toHaveCount(0);
});

test('day strip moves between days of the week', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/app/today`);
  await page.locator(`nav a[href="?date=${THIS_WEEK}"]`).click();
  await page.waitForURL(new RegExp(`date=${THIS_WEEK}`));
  if (THIS_WEEK !== TODAY) await expect(page.locator('a', { hasText: /Back to today|Về hôm nay/ }).first()).toBeVisible();
});

test('fix a shift with reason chips, then undo the fix', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/app/today`);
  const hoa = page.locator('article[id^=tech-]', { hasText: 'Hoa' });
  await hoa.locator('button', { hasText: /Fix time|Sửa giờ/ }).first().click();
  const sheet = page.locator('[role=dialog]');
  // an open shift preselects "Forgot to clock out"
  await expect(sheet.locator('button[aria-pressed=true]', { hasText: /Forgot to clock out|Quên ra ca/ })).toBeVisible();
  await sheet.locator('#fx-out').fill('20:00');
  await sheet.locator('button[type=submit]', { hasText: /Save time|Lưu giờ/ }).click();
  await expect(page.locator('[data-testid=toast]')).toContainText(/Saved Hoa|Đã lưu giờ của Hoa/);
  await expect(hoa.locator('button', { hasText: /Clock out now|Ra ca ngay/ })).toHaveCount(0);
  await page.locator('[data-testid=toast] button', { hasText: /Undo|Hoàn tác/ }).click();
  await expect(hoa.locator('button', { hasText: /Clock out now|Ra ca ngay/ })).toHaveCount(1);
});

test('the actions menu works from the keyboard and opens a sheet', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/app/today`);
  const trigger = page.getByRole('button', { name: 'More actions' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const items = page.getByRole('menuitem');
  await expect(items.first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(items.nth(1)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(items.first()).toBeFocused(); // wraps around
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.getByRole('menuitem', { name: 'Add hours' }).click();
  await expect(page.locator('[role=dialog]')).toBeVisible();
});
