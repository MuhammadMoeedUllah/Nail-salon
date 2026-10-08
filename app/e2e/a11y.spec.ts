import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { BASE, login, setLocale, OWNER_ROUTES } from './helpers';

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
