import { test, expect } from '@playwright/test';
import { BASE, login } from './helpers';

test.describe.configure({ mode: 'serial' });

test('services: reorder with arrows, sort by use with undo, add and hide', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/app/services`);
  const list = page.getByRole('list', { name: /Services in ticket order/ });
  const names = () => list.locator('li').evaluateAll((els) => els.map((e) => e.querySelector('button.flex-1 span span')?.textContent?.trim()));
  const first = (await names())[0];
  const second = (await names())[1];
  await page.getByRole('button', { name: `Move ${second} up` }).click();
  await expect.poll(async () => (await names())[0]).toBe(second);
  await page.getByRole('button', { name: `Move ${second} down` }).click();
  await expect.poll(async () => (await names())[0]).toBe(first);

  const before = await names();
  await page.getByRole('button', { name: /Most used first/ }).click();
  await expect(page.getByTestId('toast')).toContainText(/Sorted by tickets/);
  await page.getByTestId('toast').getByRole('button', { name: /Undo/ }).click();
  await expect.poll(names).toEqual(before);

  await page.getByRole('button', { name: /Add service/ }).first().click();
  const sheet = page.locator('[role=dialog]');
  await sheet.locator('#sv-en').fill('Paraffin wax');
  await sheet.locator('#sv-vi').fill('Sáp paraffin');
  await sheet.locator('#sv-price').fill('10');
  await page.getByRole('button', { name: /^Save$/ }).click();
  await expect(page.getByTestId('toast')).toContainText('Added Paraffin wax');
  const row = list.locator('li', { hasText: 'Paraffin wax' });
  await expect(row).toContainText('$10');
  await row.getByRole('switch').click();
  await expect(page.getByTestId('toast')).toContainText(/Paraffin wax is hidden/);
  await expect(row).toContainText('Hidden');
});

test('settings: closing time saves with a toast; a login can be added and removed', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/app/settings`);
  await page.locator('#closingTime').fill('20:00');
  await page.locator('#salon').getByRole('button', { name: /^Save$/ }).click();
  await expect(page.getByTestId('toast')).toContainText('Settings saved');
  await page.reload();
  await expect(page.locator('#closingTime')).toHaveValue('20:00');
  await page.locator('#closingTime').fill('19:30');
  await page.locator('#salon').getByRole('button', { name: /^Save$/ }).click();
  await expect(page.getByTestId('toast')).toContainText('Settings saved');

  await page.locator('#u-name').fill('Ana');
  await page.locator('#u-email').fill('ana@example.com');
  await page.locator('#u-password').fill('password123');
  await page.getByRole('button', { name: /Show password/ }).click();
  await expect(page.locator('#u-password')).toHaveAttribute('type', 'text');
  await page.getByText('Bookkeeper', { exact: true }).click();
  await page.getByRole('button', { name: /^Add a login$/ }).click();
  await expect(page.getByTestId('toast')).toContainText('Ana can sign in now');
  const row = page.locator('#logins li', { hasText: 'ana@example.com' });
  await expect(row).toContainText('Bookkeeper');
  await row.getByRole('button', { name: /^Remove$/ }).click();
  await page.waitForTimeout(400); // the second press of a two-press button is ignored within 350 ms
  await row.getByRole('button', { name: /Remove Ana/ }).click();
  await expect(page.getByTestId('toast')).toContainText('Ana can no longer sign in');
  await expect(page.locator('#logins li', { hasText: 'ana@example.com' })).toHaveCount(0);
});

test('tablets: a switch saves at once and undo puts it back', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/app/tablets`);
  await expect(page.locator('code')).toContainText('/kiosk/pair');
  const sounds = page.getByRole('switch', { name: /^Sounds/ });
  await expect(sounds).not.toBeChecked();
  await sounds.click();
  await expect(page.getByTestId('toast')).toContainText('Sounds: on');
  await page.getByTestId('toast').getByRole('button', { name: /Undo/ }).click();
  await expect(sounds).not.toBeChecked();
});
