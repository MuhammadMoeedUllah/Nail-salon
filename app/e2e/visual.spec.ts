import { test, expect } from '@playwright/test';
import { BASE, login, setLocale, OWNER_ROUTES } from './helpers';

// Screenshots of every redesigned route, and no sideways scrolling on a phone (UX-09).
const OUT = process.env.SHOTS_DIR ?? 'test-results/visual';
const VIEWPORTS = [
  { tag: 'phone', width: 390, height: 844, scale: 2, langs: ['en', 'vi'] as const },
  { tag: 'tablet', width: 1180, height: 820, scale: 1, langs: ['en'] as const }
];

for (const vp of VIEWPORTS) {
  test(`visual ${vp.tag}`, async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.scale });
    const page = await ctx.newPage();
    await login(page);
    const overflow: string[] = [];
    for (const l of vp.langs) {
      await setLocale(page, l);
      for (const r of OWNER_ROUTES) {
        await page.goto(`${BASE}${r.path}`);
        await page.waitForLoadState('networkidle');
        const wide = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        if (wide > 1) overflow.push(`${r.name} (${l}) is ${wide}px too wide`);
        await page.screenshot({ path: `${OUT}/${vp.tag}-${r.name}${l === 'vi' ? '-vi' : ''}.jpg`, type: 'jpeg', quality: 55, fullPage: true });
      }
    }
    await setLocale(page, 'en');
    await ctx.close();
    expect(overflow, overflow.join('\n')).toEqual([]);
  });
}
