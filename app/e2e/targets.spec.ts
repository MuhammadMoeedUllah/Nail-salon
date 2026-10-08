import { test, expect } from '@playwright/test';
import { BASE, login, OWNER_ROUTES, smallTargets } from './helpers';

// Every visible control is at least 44 x 44 px at phone and tablet sizes (R4).
for (const vp of [{ width: 390, height: 844 }, { width: 1180, height: 820 }]) {
  test(`touch targets at ${vp.width}px`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    await login(page);
    const problems: string[] = [];
    for (const r of OWNER_ROUTES) {
      await page.goto(`${BASE}${r.path}`);
      for (const p of await smallTargets(page)) problems.push(`${r.name}: ${p}`);
    }
    await ctx.close();
    expect(problems, problems.join('\n')).toEqual([]);
  });
}
