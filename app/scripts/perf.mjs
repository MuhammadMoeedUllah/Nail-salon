// Lab performance check for the performance budget (UX-56): /app/today and /kiosk on a throttled "mobile" profile.
//   CHROMIUM_PATH=/path/to/chrome node scripts/perf.mjs [baseUrl]
// CPU 4x slower, 150 ms round trip, 1.6 Mbit/s down, cold cache. Prints JSON with LCP, FCP, TBT and JS sizes.
import { chromium } from '@playwright/test';

const B = process.argv[2] ?? 'http://localhost:3123';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

const OBSERVE = () => {
  window.__lcp = 0;
  window.__long = [];
  new PerformanceObserver((l) => l.getEntries().forEach((e) => (window.__lcp = e.startTime))).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__long.push([e.startTime, e.duration]))).observe({ type: 'longtask', buffered: true });
};

async function measure(page, url) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  const r = await page.evaluate(() => {
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0;
    const tbt = window.__long.filter(([s]) => s >= fcp).reduce((sum, [, d]) => sum + Math.max(0, d - 50), 0);
    const js = performance.getEntriesByType('resource').filter((e) => e.name.split('?')[0].endsWith('.js'));
    const css = performance.getEntriesByType('resource').filter((e) => e.name.split('?')[0].endsWith('.css'));
    const fonts = performance.getEntriesByType('resource').filter((e) => /\.(woff2?|ttf)(\?|$)/.test(e.name));
    const kb = (list, k) => Math.round(list.reduce((s, e) => s + (e[k] || 0), 0) / 102.4) / 10;
    return {
      lcpMs: Math.round(window.__lcp),
      fcpMs: Math.round(fcp),
      tbtMs: Math.round(tbt),
      jsFiles: js.length,
      jsKbOverWire: kb(js, 'encodedBodySize'),
      jsKbUnpacked: kb(js, 'decodedBodySize'),
      cssKbOverWire: kb(css, 'encodedBodySize'),
      fontKb: kb(fonts, 'encodedBodySize')
    };
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  return r;
}

const out = {};
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(OBSERVE);
  const page = await ctx.newPage();
  await page.goto(`${B}/login`);
  await page.fill('#email', 'owner@example.com');
  await page.fill('#password', 'password123');
  await page.click('button[type=submit]');
  await page.waitForURL(/\/app\//);
  out['/app/today (phone)'] = await measure(page, `${B}/app/today`);
  out['/app/home (phone)'] = await measure(page, `${B}/app/home`);
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 } });
  await ctx.addInitScript(OBSERVE);
  const page = await ctx.newPage();
  await page.goto(`${B}/kiosk/pair`);
  await page.fill('#email', 'owner@example.com');
  await page.fill('#password', 'password123');
  await page.fill('#deviceName', 'Perf check');
  await page.click('button[type=submit]');
  await page.waitForURL(/\/kiosk$/);
  out['/kiosk (tablet)'] = await measure(page, `${B}/kiosk`);
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(out, null, 2));
