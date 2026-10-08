import { test, expect } from '@playwright/test';
import { BASE, login } from './helpers';

test.describe.configure({ mode: 'serial' });

test('add a technician with a generated PIN and a pay plan', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/app/workers`);
  await page.getByRole('link', { name: /Add technician|Thêm thợ/ }).first().click();
  await page.locator('#displayName').fill('Thu');
  await page.locator('#legalName').fill('Thu Bui');
  await page.locator('form').getByText('English', { exact: true }).click();
  await page.getByRole('button', { name: /Make a PIN|Tạo mã PIN/ }).click();
  await expect(page.locator('#pin')).toHaveValue(/^\d{4}$/);
  await expect(page.getByText(/Write it on the card for Thu/)).toBeVisible();
  await page.getByText('Commission only', { exact: true }).click();
  await page.locator('#commissionPct').fill('55');
  await expect(page.locator('p', { hasText: 'Pay plan:' })).toContainText('55% commission');
  await page.getByRole('button', { name: /^Save$|^Lưu$/ }).click();
  await expect(page).toHaveURL(/\/app\/workers$/);
  await expect(page.getByTestId('toast')).toContainText('Added Thu');
  await expect(page.locator('li', { hasText: 'Thu' })).toContainText('55% commission');
});

test('a PIN already in use is refused, and leaving asks first', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/app/workers/new`);
  await page.locator('#displayName').fill('Dup');
  await page.locator('#legalName').fill('Dup Person');
  await page.locator('#pin').fill('1111');
  await page.getByRole('button', { name: /^Save$|^Lưu$/ }).click();
  await expect(page.locator('#pin-error')).toContainText(/already uses this PIN/);
  await expect(page.locator('#pin')).toBeFocused();
  await page.locator('#displayName').fill('Dup2');
  await page.getByRole('link', { name: /Technicians|Thợ/ }).first().click();
  await expect(page.getByText(/Leave without saving\?/)).toBeVisible();
  await page.getByRole('button', { name: /^Leave$|^Rời trang$/ }).click();
  await expect(page).toHaveURL(/\/app\/workers$/);
});

test('the Active switch saves at once and can be undone', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/app/workers`);
  const row = page.locator('li', { hasText: 'Thu' });
  const sw = row.getByRole('switch');
  await expect(sw).toBeChecked();
  await sw.click();
  await expect(page.getByTestId('toast')).toContainText(/Thu is off the tablet/);
  await expect(row).toContainText(/Not working here/);
  await page.getByTestId('toast').getByRole('button', { name: /Undo|Hoàn tác/ }).click();
  await expect(row.getByRole('switch')).toBeChecked();
  // leave Thu inactive so later specs see the seeded team only
  await row.getByRole('switch').click();
  await expect(row).toContainText(/Not working here/);
});
