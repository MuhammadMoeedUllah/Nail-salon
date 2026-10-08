import { test, expect } from '@playwright/test';
import { BASE, login } from './helpers';

test.describe.configure({ mode: 'serial' });

// June dates keep these tickets out of the weeks other specs approve and pay.
const CSV = `Date,Time,Time Zone,Category,Item,Qty,Price Point Name,SKU,Modifiers Applied,Gross Sales,Discounts,Net Sales,Tax,Transaction ID,Payment ID,Device Name,Notes,Details,Event Type,Location,Dining Option,Customer ID,Customer Name,Customer Reference ID,Unit,Count,Itemization Type,Commission,Employee
2026-06-01,10:15:00,Eastern Time (US & Canada),Nails,Gel Manicure,1,Regular,,,"$45.00","$0.00","$45.00","$0.00",JUN1,JPAY1,iPad,,,Payment,Main,,,,,,1,Service,"$27.00",Linh Nguyen
2026-06-01,11:40:00,Eastern Time (US & Canada),Nails,Pedicure,1,Regular,,,"$40.00","$0.00","$40.00","$0.00",JUN2,JPAY2,iPad,,,Payment,Main,,,,,,1,Service,"$24.00",Mai Tran
2026-06-01,12:00:00,Eastern Time (US & Canada),Retail,Cuticle Oil,1,Regular,,,"$12.00","$0.00","$12.00","$1.06",JUN3,JPAY3,iPad,,,Payment,Main,,,,,,1,Item,"$0.00",Mai Tran
2026-06-01,12:30:00,Eastern Time (US & Canada),Nails,Polish change,1,Regular,,,"$15.00","$0.00","$15.00","$0.00",JUN4,JPAY4,iPad,,,Payment,Main,,,,,,1,Service,"$0.00",Front Desk`;
const file = { name: 'square-june.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV) };

test('import: first file asks who is who, the second remembers and skips duplicates', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/app/tickets/import`);
  await page.locator('input[type=file]').setInputFiles(file);
  await expect(page.getByTestId('import-format')).toContainText('Square Items Detail · 4 rows');
  await expect(page.getByLabel('Linh Nguyen')).toHaveValue(/.+/);
  await expect(page.getByLabel('Front Desk')).toHaveValue('');
  await expect(page.getByTestId('import-go')).toContainText('Import 2 tickets');
  await page.getByTestId('import-go').click();
  await expect(page.getByTestId('import-done')).toContainText('Imported 2 tickets');
  await expect(page.getByRole('link', { name: /Open Mon, Jun 1/ })).toBeVisible();

  await page.getByRole('button', { name: /Import another file/ }).click();
  await page.locator('input[type=file]').setInputFiles(file);
  await expect(page.getByText('Using your matches from last time.')).toBeVisible();
  await expect(page.getByLabel('Linh Nguyen')).toHaveCount(0);
  await page.getByTestId('import-go').click();
  await expect(page.getByTestId('import-done')).toContainText('Imported 0 tickets');
  await expect(page.getByText(/2 were already in the app/)).toBeVisible();
});

test('audit: presets drive the export and history reads as sentences with filters', async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/app/audit`);
  const range = page.getByTestId('export-range');
  const thisMonth = await range.textContent();
  await page.getByText('Last month', { exact: true }).click();
  await expect(range).not.toHaveText(thisMonth ?? '');
  const href = await page.locator('a', { hasText: 'PDF binder' }).getAttribute('href');
  expect(href).toMatch(/from=\d{4}-\d{2}-01&to=\d{4}-\d{2}-\d{2}&format=pdf/);
  const pdf = await page.request.get(`${BASE}${href}`);
  expect((await pdf.body()).subarray(0, 4).toString()).toBe('%PDF');

  const history = page.getByTestId('history');
  await expect(history).toContainText('imported 2 tickets from square-june.csv');
  await page.getByRole('link', { name: 'Pay', exact: true }).click();
  await expect(page).toHaveURL(/show=pay/);
  await expect(page.getByText('imported 2 tickets from square-june.csv')).toHaveCount(0);
  await page.getByRole('link', { name: 'All', exact: true }).click();
  await expect(page).not.toHaveURL(/show=/);
  await expect(history).toContainText('imported 2 tickets from square-june.csv');
  const first = page.locator('[data-testid=history] li').first();
  await first.getByText('Details').click();
  await expect(first.locator('dl')).toBeVisible();
  await page.locator('#tech').selectOption({ label: 'Linh' });
  await expect(page).toHaveURL(/tech=/);
  const items = page.locator('[data-testid=history] li');
  if (await items.count()) await expect(items.first()).toContainText('Linh');
  else await expect(page.getByText('No changes match this filter.')).toBeVisible();
});
