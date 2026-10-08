import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3123';
const SHOTS = process.env.SHOTS ?? 'test-results/shots';

test.describe.configure({ mode: 'serial' });

test('owner signs in, sees today, pay run, approves, statement, exports, audit', async ({ page, context }) => {
  await page.goto(`${BASE}/login`);
  await page.fill('#email', 'owner@example.com');
  await page.fill('#password', 'password123');
  await page.click('button[type=submit]');
  await page.waitForURL(/\/app\/home/);
  await expect(page.locator('h1')).toContainText(/Hello|Chào/);
  await page.goto(`${BASE}/app/today`);
  await expect(page.locator('h1')).toContainText(/Today|Hôm nay/);
  await page.screenshot({ path: `${SHOTS}/01-today.png`, fullPage: true });

  // add a ticket in three taps: technician, service tile, tip chip, then add (the builder pane is open from 1024 px)
  const builder = page.locator('section[aria-labelledby=builder-h]');
  await builder.locator('button', { hasText: 'Linh' }).click();
  await builder.locator('button', { hasText: 'Gel manicure' }).click();
  await expect(page.locator('#tbp-price')).toHaveValue('45.00');
  await builder.locator('button', { hasText: /^\$5$/ }).click();
  await builder.locator('button[type=submit]').click();
  await expect(builder.locator('[role=status]', { hasText: /Added: Gel manicure|Đã thêm: Gel tay/ })).toBeVisible();
  const linh = page.locator('#tech-' + (await page.locator('article[id^=tech-]').first().getAttribute('id'))!.slice(5));
  await expect(linh.locator('li', { hasText: 'Gel manicure' }).first()).toBeVisible();
  // repeat last in one tap
  const before = await linh.locator('li', { hasText: 'Gel manicure' }).count();
  await builder.locator('button', { hasText: /Repeat|Lặp lại/ }).click();
  await expect(linh.locator('li', { hasText: 'Gel manicure' })).toHaveCount(before + 1);
  // undo the repeat from the builder
  await builder.locator('button', { hasText: /^\s*(Undo|Hoàn tác)\s*$/ }).click();
  await expect(linh.locator('li', { hasText: 'Gel manicure' })).toHaveCount(before);
  // card tips handed over in cash, with Undo in the toast
  await linh.locator('button', { hasText: /Card tips handed over in cash|Đã đưa tip thẻ/ }).click();
  await expect(linh.locator('button', { hasText: /Card tips paid out in cash|Tip thẻ đã trả tiền mặt/ })).toBeVisible();
  await page.locator('[data-testid=toast] button', { hasText: /Undo|Hoàn tác/ }).click();
  await expect(linh.locator('button', { hasText: /Card tips handed over in cash|Đã đưa tip thẻ/ })).toBeVisible();

  // pay runs list
  await page.goto(`${BASE}/app/pay`);
  await expect(page.locator('h1')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/02-pay-list.png`, fullPage: true });
  const firstWeek = page.locator('tbody tr').nth(1).locator('a').first();
  const href = await firstWeek.getAttribute('href');
  expect(href).toBeTruthy();
  await page.goto(`${BASE}${href}`);
  await expect(page.locator('table tbody tr').first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/03-pay-week-draft.png`, fullPage: true });

  // approve
  const approveBtn = page.locator('form[action="?/approve"] button');
  if (await approveBtn.count()) {
    await approveBtn.click();
    await expect(page.locator('a', { hasText: 'Gusto CSV' })).toBeVisible();
  }
  await page.screenshot({ path: `${SHOTS}/04-pay-week-approved.png`, fullPage: true });

  // exports
  for (const f of ['gusto', 'adp', 'generic']) {
    const res = await page.request.get(`${BASE}${href}/export?format=${f}`);
    expect(res.status()).toBe(200);
    const txt = await res.text();
    expect(txt.length).toBeGreaterThan(50);
    if (f === 'gusto') expect(txt).toContain('Legal first name');
  }

  // statement
  const stHref = await page.locator('tbody a[href^="/app/pay/"]').first().getAttribute('href');
  await page.goto(`${BASE}${stHref}`);
  await expect(page.locator('article')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/05-statement.png`, fullPage: true });
  // Vietnamese
  await page.goto(page.url().split('?')[0] + '?lang=vi');
  await expect(page.locator('article h1')).toContainText('Bảng lương');
  await page.screenshot({ path: `${SHOTS}/06-statement-vi.png`, fullPage: true });

  // share link + pdf
  const pdfLink = page.locator('a', { hasText: 'PDF' }).first();
  const pdfHref = await pdfLink.getAttribute('href');
  expect(pdfHref).toMatch(/\/s\/.+\/pdf/);
  const pdf = await page.request.get(`${BASE}${pdfHref}`);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()['content-type']).toContain('application/pdf');
  const body = await pdf.body();
  expect(body.subarray(0, 4).toString()).toBe('%PDF');
  // shared page without login
  const anon = await context.browser()!.newContext();
  const ap = await anon.newPage();
  await ap.goto(`${BASE}${pdfHref.replace(/\/pdf.*$/, '')}`);
  await expect(ap.locator('article')).toBeVisible();
  await ap.screenshot({ path: `${SHOTS}/07-shared-statement.png`, fullPage: true });
  await anon.close();

  // mark paid in one click
  await page.goto(`${BASE}${href}`);
  const payBtn = page.locator('button', { hasText: /Mark all paid by check today|Đánh dấu đã trả hết/ });
  if (await payBtn.count()) await payBtn.click();
  await expect(page.locator('h1 .badge')).toContainText(/Paid|Đã trả/);

  // audit page + exports
  await page.goto(`${BASE}/app/audit`);
  await expect(page.locator('tbody tr').first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/08-audit.png`, fullPage: true });
  const pdfA = page.locator('a', { hasText: /Export PDF|Xuất PDF/ });
  const pdfAHref = await pdfA.getAttribute('href');
  const b = await page.request.get(`${BASE}${pdfAHref}`);
  expect(b.status()).toBe(200);
  expect((await b.body()).subarray(0, 4).toString()).toBe('%PDF');
  const z = await page.request.get(`${BASE}${pdfAHref!.replace('format=pdf', 'format=zip')}`);
  expect(z.status()).toBe(200);
  expect(z.headers()['content-type']).toContain('zip');

  // workers + settings
  await page.goto(`${BASE}/app/workers`);
  await page.screenshot({ path: `${SHOTS}/09-workers.png`, fullPage: true });
  await page.goto(`${BASE}/app/settings`);
  await expect(page.locator('h1')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/10-settings.png`, fullPage: true });

  // import page renders
  await page.goto(`${BASE}/app/tickets/import`);
  await expect(page.locator('input[type=file]')).toBeVisible();
});

test('tablet pairs and a technician clocks in and out with a PIN', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, permissions: [] });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/kiosk/pair`);
  await page.fill('#email', 'owner@example.com');
  await page.fill('#password', 'password123');
  await page.fill('#deviceName', 'Front desk iPad');
  await page.click('button[type=submit]');
  await page.waitForURL(/\/kiosk$/);
  await expect(page.locator('main button').first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/11-kiosk-grid.png` });

  await page.locator('main button', { hasText: 'Linh' }).click();
  await expect(page.locator('text=/Enter your PIN|Nhập mã PIN/')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/12-kiosk-pin.png` });
  // wrong pin
  for (const d of ['9', '9', '9', '9']) await page.locator('button', { hasText: new RegExp(`^${d}$`) }).click();
  await expect(page.locator('text=/Wrong PIN|Sai PIN/')).toBeVisible();
  // correct PIN clocks in immediately (auto clock-in) and offers Undo
  for (const d of ['1', '1', '1', '1']) await page.locator('button', { hasText: new RegExp(`^${d}$`) }).click();
  await expect(page.locator('text=/Clocked in at|Đã vào ca lúc/')).toBeVisible();
  await expect(page.locator('button', { hasText: /Undo|Hoàn tác/ })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/14-kiosk-done.png` });
  // undo, then clock in again
  await page.locator('button', { hasText: /Undo|Hoàn tác/ }).click();
  await expect(page.locator('text=/Undone|Đã hủy/')).toBeVisible();
  await page.locator('button', { hasText: /Close|Đóng/ }).click();
  await page.locator('main button', { hasText: 'Linh' }).click();
  for (const d of ['1', '1', '1', '1']) await page.locator('button', { hasText: new RegExp(`^${d}$`) }).click();
  await expect(page.locator('text=/Clocked in at|Đã vào ca lúc/')).toBeVisible();
  // the owner session must be gone on the tablet
  const r = await page.request.get(`${BASE}/app/today`, { maxRedirects: 0 });
  expect(r.status()).toBe(303);
  // clock out
  await page.locator('button', { hasText: /Close|Đóng/ }).click();
  await page.locator('main button', { hasText: 'Linh' }).click();
  for (const d of ['1', '1', '1', '1']) await page.locator('button', { hasText: new RegExp(`^${d}$`) }).click();
  await page.screenshot({ path: `${SHOTS}/13-kiosk-actions.png` });
  await page.locator('button', { hasText: /Clock out|Ra ca/ }).click();
  await expect(page.locator('text=/Clocked out at|Đã ra ca lúc/')).toBeVisible();
  await ctx.close();
});

test('a technician who forgot to clock out confirms the time at the tablet', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/kiosk/pair`);
  await page.fill('#email', 'owner@example.com');
  await page.fill('#password', 'password123');
  await page.click('button[type=submit]');
  await page.waitForURL(/\/kiosk$/);
  const kim = page.locator('main button', { hasText: 'Kim' });
  test.skip(!(await kim.textContent())?.match(/Not clocked out|Chưa ra ca/), 'no forgotten shift seeded (today is the first day of the week)');
  await kim.click();
  for (const d of ['4', '4', '4', '4']) await page.locator('main button', { hasText: new RegExp(`^${d}$`) }).click();
  await expect(page.locator('text=/You did not clock out|Bạn chưa ra ca/')).toBeVisible();
  await page.locator('button', { hasText: /Yes, I left at|Đúng, tôi về lúc/ }).click();
  // auto clock-in follows, and the done screen confirms both
  await expect(page.locator('text=/Clocked in at|Đã vào ca lúc/')).toBeVisible();
  await expect(page.locator('text=/Saved: you left at|Đã lưu: bạn về lúc/')).toBeVisible();
  await ctx.close();
});


test('offline punches queue on the tablet and send when Wi-Fi returns', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/kiosk/pair`);
  await page.fill('#email', 'owner@example.com');
  await page.fill('#password', 'password123');
  await page.click('button[type=submit]');
  await page.waitForURL(/\/kiosk$/);
  await ctx.setOffline(true);
  await page.locator('main button', { hasText: 'Jenny' }).click();
  for (const d of ['5', '5', '5', '5']) await page.locator('main button', { hasText: new RegExp(`^${d}$`) }).click();
  // the PIN cannot be checked offline, so the choice is offered and the punch is queued
  await page.locator('button', { hasText: /^.*(Clock out|Ra ca).*$/ }).first().click();
  await expect(page.locator('[role=status]', { hasText: /Offline|Mất mạng/ }).first()).toBeVisible();
  await expect(page.locator('text=/1 punch|1 lần/').first()).toBeVisible();
  await ctx.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.locator('text=/waiting to send|đang chờ gửi/')).toHaveCount(0, { timeout: 10000 });
  await ctx.close();
});
