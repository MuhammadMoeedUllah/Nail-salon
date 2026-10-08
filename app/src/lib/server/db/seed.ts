// Demo data: pnpm db:seed  (creates a salon with 5 technicians and two weeks of punches and tickets)
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { hash } from '@node-rs/argon2';
import { randomUUID } from 'node:crypto';
import * as s from './schema';

const url = process.env.DATABASE_URL ?? './data/salon.db';
mkdirSync(dirname(resolve(url)), { recursive: true });
const sqlite = new Database(url);
sqlite.pragma('journal_mode = WAL');
const db = drizzle(sqlite, { schema: s });
migrate(db, { migrationsFolder: resolve('./drizzle') });

const ARGON = { memoryCost: 19456, timeCost: 2, parallelism: 1 };
const id = () => randomUUID();
const TZ = 'America/New_York';

function iso(date: string, time: string) {
  // crude EDT/EST handling for demo data: use -04:00 Apr-Oct, -05:00 otherwise
  const m = Number(date.slice(5, 7));
  const off = m >= 4 && m <= 10 ? '-04:00' : '-05:00';
  return new Date(`${date}T${time}:00${off}`).toISOString();
}
function addDays(date: string, n: number) {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const existing = sqlite.prepare('select id from salons limit 1').get() as { id: string } | undefined;
  if (existing) {
    console.log('database already has a salon; not seeding');
    return;
  }
  const salonId = id();
  await db.insert(s.salons).values({ id: salonId, name: 'Lucky Nails & Spa', state: 'NY', region: 'NYC', timezone: TZ, workweekStart: 1, defaultLocale: 'en', address: '123 Bedford Ave, Brooklyn, NY 11211', licenseNo: 'NY-APP-00123' });
  const ownerId = id();
  await db.insert(s.users).values({ id: ownerId, salonId, email: 'owner@example.com', name: 'Tina Pham', role: 'owner', passwordHash: await hash('password123', ARGON), locale: 'en' });
  await db.insert(s.users).values({ id: id(), salonId, email: 'books@example.com', name: 'Dan the Bookkeeper', role: 'bookkeeper', passwordHash: await hash('password123', ARGON), locale: 'en' });

  const svcs = [
    ['Manicure', 'Làm tay', 2500], ['Pedicure', 'Làm chân', 4000], ['Gel manicure', 'Gel tay', 4500], ['Gel pedicure', 'Gel chân', 5500],
    ['Acrylic full set', 'Bột full set', 6000], ['Acrylic fill', 'Fill bột', 4500], ['Dip powder', 'Nhúng bột', 5000], ['Polish change', 'Thay nước sơn', 1500], ['Eyebrow wax', 'Wax chân mày', 1500]
  ] as const;
  await db.insert(s.services).values(svcs.map((x, i) => ({ id: id(), salonId, nameEn: x[0], nameVi: x[1], defaultPriceCents: x[2], sortOrder: i })));

  const techs = [
    { displayName: 'Linh', legalName: 'Linh Thi Nguyen', pin: '1111', payBasis: 'guarantee_or_commission', guaranteeCents: 90000, commissionPct: 60, locale: 'vi', busy: 1.0 },
    { displayName: 'Mai', legalName: 'Mai Tran', pin: '2222', payBasis: 'day_rate_plus_commission', dayRateCents: 10000, commissionPct: 30, locale: 'vi', busy: 0.9 },
    { displayName: 'Hoa', legalName: 'Hoa Pham', pin: '3333', payBasis: 'commission', commissionPct: 60, locale: 'vi', busy: 0.55 },
    { displayName: 'Kim', legalName: 'Kim Le', pin: '4444', payBasis: 'day_rate', dayRateCents: 13000, commissionPct: 0, locale: 'vi', busy: 0.8 },
    { displayName: 'Jenny', legalName: 'Jennifer Vo', pin: '5555', payBasis: 'hourly', hourlyRateCents: 1800, commissionPct: 10, locale: 'en', busy: 0.7 }
  ];
  const workerIds: string[] = [];
  for (const [i, t] of techs.entries()) {
    const wid = id();
    workerIds.push(wid);
    await db.insert(s.workers).values({
      id: wid, salonId, displayName: t.displayName, legalName: t.legalName, address: `${100 + i} Grand St, Brooklyn, NY`, occupation: 'Nail technician', locale: t.locale,
      pinHash: await hash(`${salonId}:${t.pin}`, ARGON), payBasis: t.payBasis, hourlyRateCents: (t as any).hourlyRateCents ?? 0, dayRateCents: (t as any).dayRateCents ?? 0,
      commissionPct: t.commissionPct, guaranteeCents: (t as any).guaranteeCents ?? 0, hiredOn: '2025-03-01', sortOrder: i
    });
  }

  // Two full weeks before the current week (Mon-Sun), 6 days a week, 9.5-10h days, then the current week up to today
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
  const dow = new Date(today + 'T00:00:00Z').getUTCDay();
  const thisMonday = addDays(today, -((dow + 6) % 7));
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let wk = 2; wk >= 0; wk--) {
    const monday = addDays(thisMonday, -7 * wk);
    for (let d = 0; d < 7; d++) {
      const date = addDays(monday, d);
      if (date >= today) break; // the current week only up to yesterday; today is seeded below
      const isSunday = d === 6;
      for (const [i, t] of techs.entries()) {
        if (isSunday && i % 2 === 0) continue; // half the team is off Sunday
        if (d === 2 && i === 3) continue; // Kim off Wednesday
        const inH = 9 + Math.floor(rnd() * 2) * 0.5; // 9:00 or 9:30
        const outH = 19 + Math.floor(rnd() * 3) * 0.5; // 19:00-20:00
        const pid = id();
        const tIn = iso(date, `${String(Math.floor(inH)).padStart(2, '0')}:${inH % 1 ? '30' : '00'}`);
        const tOut = iso(date, `${String(Math.floor(outH)).padStart(2, '0')}:${outH % 1 ? '30' : '00'}`);
        await db.insert(s.punches).values({ id: pid, salonId, workerId: workerIds[i], workDate: date, tsIn: tIn, tsOut: tOut, manualBreakMinutes: 30, source: 'tablet' });
        const n = Math.round((4 + rnd() * 5) * t.busy);
        for (let k = 0; k < n; k++) {
          const svc = svcs[Math.floor(rnd() * svcs.length)];
          const hour = 10 + Math.floor(rnd() * 9);
          const card = rnd() < 0.7;
          const tip = Math.round(svc[2] * (0.12 + rnd() * 0.1) / 100) * 100;
          await db.insert(s.tickets).values({
            id: id(), salonId, workerId: workerIds[i], workDate: date, ts: iso(date, `${String(hour).padStart(2, '0')}:${String(Math.floor(rnd() * 60)).padStart(2, '0')}`),
            ticketNo: String(1000 + Math.floor(rnd() * 9000)), serviceName: svc[0], priceCents: svc[2], tipCardCents: card ? tip : 0, tipCashCents: card ? 0 : tip, paymentMethod: card ? 'card' : 'cash', source: 'manual', createdByUserId: ownerId
          });
        }
      }
    }
  }
  // Kim forgot to clock out on her last shift this week (only inside the current week, so past weeks stay approvable)
  sqlite
    .prepare('update punches set ts_out = null where id = (select id from punches where worker_id = ? and work_date >= ? and work_date < ? order by work_date desc limit 1)')
    .run(workerIds[3], thisMonday, today);
  // Today: three technicians already clocked in with a ticket or two; Linh is still out so the tablet demo can clock her in.
  const now = Date.now();
  for (const [k, i] of [1, 2, 4].entries()) {
    const tIn = new Date(Math.floor((now - (150 - k * 40) * 60000) / 300000) * 300000).toISOString();
    await db.insert(s.punches).values({ id: id(), salonId, workerId: workerIds[i], workDate: today, tsIn: tIn, source: 'tablet' });
    for (let j = 0; j <= k % 2; j++) {
      const svc = svcs[(i + j) % svcs.length];
      await db.insert(s.tickets).values({
        id: id(), salonId, workerId: workerIds[i], workDate: today, ts: new Date(now - (20 + j * 35) * 60000).toISOString(),
        ticketNo: String(2000 + i * 10 + j), serviceName: svc[0], priceCents: svc[2], tipCardCents: j ? 0 : 500, tipCashCents: j ? 300 : 0, paymentMethod: j ? 'cash' : 'card', source: 'manual', createdByUserId: ownerId
      });
    }
  }
  await db.insert(s.edits).values({ id: id(), salonId, entity: 'salon', entityId: salonId, action: 'create', actorType: 'system', actorName: 'seed', newValue: 'demo data' });
  console.log('seeded demo salon. owner@example.com / password123 ; PINs 1111-5555');
}
main();
