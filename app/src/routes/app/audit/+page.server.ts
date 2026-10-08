import { and, desc, eq, gte } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guard';
import { db } from '$lib/server/db';
import { edits, workers } from '$lib/server/db/schema';
import { addDays, localDate, nowIso } from '$lib/time';
import { retentionYears } from '$lib/rules';
import { describeEdits } from '$lib/server/auditHistory';

const GROUPS = ['all', 'hours', 'tickets', 'team', 'pay', 'salon'] as const;
const short = (v: string | null) => (v && v.length > 160 ? v.slice(0, 157) + '…' : v);

export const load: PageServerLoad = async (event) => {
  const { salon, locale } = requireUser(event);
  const today = localDate(nowIso(), salon.timezone);
  const qShow = event.url.searchParams.get('show') ?? 'all';
  const show = (GROUPS as readonly string[]).includes(qShow) ? qShow : 'all';
  const tech = event.url.searchParams.get('tech') ?? '';

  const rows = await db.select().from(edits).where(and(eq(edits.salonId, salon.id), gte(edits.ts, addDays(today, -91) + 'T00:00:00'))).orderBy(desc(edits.ts)).limit(600);
  const ws = await db.select({ id: workers.id, name: workers.displayName, active: workers.active }).from(workers).where(eq(workers.salonId, salon.id)).orderBy(workers.sortOrder, workers.displayName);
  const described = await describeEdits(rows, salon, locale);
  const items = described
    .map((e) => ({ id: e.id, ts: e.ts, text: e.text, group: e.group, workerId: e.workerId, reason: e.reason, entity: e.entity, entityId: e.entityId, action: e.action, field: e.field, oldValue: short(e.oldValue), newValue: short(e.newValue) }))
    .filter((x) => (show === 'all' || x.group === show) && (!tech || x.workerId === tech));

  const firstOfMonth = today.slice(0, 8) + '01';
  const lastMonthEnd = addDays(firstOfMonth, -1);
  return {
    locale,
    tz: salon.timezone,
    today,
    show,
    tech,
    presets: {
      this_month: { from: firstOfMonth, to: today },
      last_month: { from: lastMonthEnd.slice(0, 8) + '01', to: lastMonthEnd },
      this_year: { from: today.slice(0, 4) + '-01-01', to: today }
    },
    workers: ws,
    items: items.slice(0, 200),
    total: items.length,
    retention: retentionYears(salon.state, today),
    state: salon.state
  };
};
