import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { BASE, login, setLocale, OWNER_ROUTES, PUBLIC_ROUTES } from './helpers';

// Zero serious or critical axe findings on every redesigned route, in both languages (UX-09, UX-57).
for (const l of ['en', 'vi'] as const) {
  test(`axe: owner routes (${l})`, async ({ page }) => {
    await login(page);
    await setLocale(page, l);
    const problems: string[] = [];
    for (const r of OWNER_ROUTES) {
      await page.goto(`${BASE}${r.path}`);
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      for (const v of res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'))
        problems.push(`${r.name}: ${v.id} (${v.nodes.length}) ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
    }
    await setLocale(page, 'en');
    expect(problems, problems.join('\n')).toEqual([]);
  });
}

test('axe: signed-out pages', async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const problems: string[] = [];
  for (const r of PUBLIC_ROUTES) {
    await page.goto(`${BASE}${r.path}`);
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    for (const v of res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'))
      problems.push(`${r.name}: ${v.id} (${v.nodes.length}) ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
  }
  await ctx.close();
  expect(problems, problems.join('\n')).toEqual([]);
});

test('axe: tablet clock board and PIN pad', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/kiosk/pair`);
  await page.fill('#email', 'owner@example.com');
  await page.fill('#password', 'password123');
  await page.fill('#deviceName', 'A11y check');
  await page.click('button[type=submit]');
  await page.waitForURL(/\/kiosk$/);
  const problems: string[] = [];
  const scan = async (name: string) => {
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    for (const v of res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'))
      problems.push(`${name}: ${v.id} (${v.nodes.length}) ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
  };
  await scan('kiosk board');
  await page.locator('main button', { hasText: 'Hoa' }).click();
  await expect(page.locator('text=/Enter your PIN|Nhập mã PIN/')).toBeVisible();
  await scan('kiosk PIN pad');
  await ctx.close();
  expect(problems, problems.join('\n')).toEqual([]);
});
