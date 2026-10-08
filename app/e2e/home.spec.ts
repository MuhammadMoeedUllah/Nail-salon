import { test, expect } from '@playwright/test';
import { BASE, login } from './helpers';

test('home answers what needs the owner', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/\/app\/home/);
  // the week's owed-by-law number leads, with its verdict in words
  await expect(page.locator('#h-week')).toBeVisible();
  await expect(page.locator('text=/Owed by law this week|Nothing owed beyond the agreed pay/').first()).toBeVisible();
  // who is in now: the seed clocks in Mai, Hoa and Jenny
  for (const n of ['Mai', 'Hoa', 'Jenny']) await expect(page.locator('section[aria-labelledby=h-now]')).toContainText(n);
  // the review button opens the current week
  await page.locator('a', { hasText: /Review this week|Xem lương tuần này/ }).click();
  await expect(page).toHaveURL(/\/app\/pay\/\d{4}-\d{2}-\d{2}/);
});

test('setup checklist can be hidden', async ({ page }) => {
  await login(page);
  const hide = page.locator('button', { hasText: /Hide this list|Ẩn danh sách này/ });
  test.skip((await hide.count()) === 0, 'setup already complete');
  await hide.click();
  await expect(hide).toHaveCount(0);
  await page.goto(`${BASE}/app/home`);
  await expect(page.locator('text=/Get set up|Bắt đầu sử dụng/')).toHaveCount(0);
});
