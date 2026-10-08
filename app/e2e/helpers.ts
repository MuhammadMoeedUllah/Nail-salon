import type { Page } from '@playwright/test';

export const BASE = process.env.BASE_URL ?? 'http://localhost:3123';
const TZ = 'America/New_York';
export const ymd = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
export const shiftDate = (date: string, n: number) => {
  const d = new Date(date + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const weekStartOf = (date: string) => shiftDate(date, -((new Date(date + 'T12:00:00Z').getUTCDay() + 6) % 7));
export const TODAY = ymd(new Date());
export const THIS_WEEK = weekStartOf(TODAY);
export const LAST_WEEK = shiftDate(THIS_WEEK, -7);

export async function login(page: Page, email = 'owner@example.com', password = 'password123') {
  await page.goto(`${BASE}/login`);
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type=submit]');
  await page.waitForURL(/\/app\//);
}

export async function setLocale(page: Page, l: 'en' | 'vi', next = '/app/home') {
  await page.goto(`${BASE}/locale?l=${l}&next=${encodeURIComponent(next)}`);
}

/** Owner routes that have been redesigned; the a11y, target and visual specs walk these. */
export const OWNER_ROUTES: { name: string; path: string }[] = [
  { name: 'home', path: '/app/home' },
  { name: 'today', path: '/app/today' },
  { name: 'pay', path: '/app/pay' },
  { name: 'pay-week', path: `/app/pay/${LAST_WEEK}` },
  { name: 'more', path: '/app/more' },
  { name: 'workers', path: '/app/workers' },
  { name: 'worker-new', path: '/app/workers/new' },
  { name: 'services', path: '/app/services' },
  { name: 'settings', path: '/app/settings' },
  { name: 'tablets', path: '/app/tablets' },
  { name: 'audit', path: '/app/audit' },
  { name: 'import', path: '/app/tickets/import' }
];

/** Pages a signed-out visitor sees. */
export const PUBLIC_ROUTES: { name: string; path: string }[] = [
  { name: 'login', path: '/login' },
  { name: 'signup', path: '/signup' },
  { name: 'pair', path: '/kiosk/pair' }
];

/** Visible interactive elements smaller than the hard floor (44 px), ignoring inline text links (WCAG 2.5.8 exception). */
export async function smallTargets(page: Page, min = 44) {
  return page.evaluate((min) => {
    const out: string[] = [];
    const els = document.querySelectorAll<HTMLElement>('button, a[href], input:not([type=hidden]), select, textarea, [role=button], summary');
    for (const el of els) {
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      if (el.closest('[aria-hidden=true], [inert]')) continue;
      if (cs.clip === 'rect(0px, 0px, 0px, 0px)' || cs.clipPath === 'inset(50%)') continue; // visually hidden until focused
      if (el.tagName === 'A' && cs.display === 'inline') continue;
      let box = el.getBoundingClientRect();
      if (el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox')) {
        const lab = el.closest('label');
        if (lab) box = lab.getBoundingClientRect();
      }
      if (box.width === 0 && box.height === 0) continue;
      if (box.width < 2 && box.height < 2) continue; // sr-only
      if (box.height < min || box.width < min) out.push(`${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40)}" ${Math.round(box.width)}x${Math.round(box.height)}`);
    }
    return out;
  }, min);
}
