import { and, desc, eq, gte, lte } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guard';
import { db } from '$lib/server/db';
import { edits, workers } from '$lib/server/db/schema';
import { addDays, localDate, nowIso } from '$lib/time';
import { retentionYears } from '$lib/rules';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const load: PageServerLoad = async (event) => {
  const { salon, locale } = requireUser(event);
  const today = localDate(nowIso(), salon.timezone);
  const qf = event.url.searchParams.get('from');
  const qt = event.url.searchParams.get('to');
  const from = qf && DATE.test(qf) ? qf : addDays(today, -90);
  const to = qt && DATE.test(qt) ? qt : today;
  const entity = event.url.searchParams.get('entity') ?? '';
  const conds = [eq(edits.salonId, salon.id), gte(edits.ts, from + 'T00:00:00'), lte(edits.ts, to + 'T23:59:59.999Z')];
  if (entity) conds.push(eq(edits.entity, entity));
  const rows = await db.select().from(edits).where(and(...conds)).orderBy(desc(edits.ts)).limit(300);
  const ws = await db.select({ id: workers.id, name: workers.displayName }).from(workers).where(eq(workers.salonId, salon.id));
  const nameOf = new Map(ws.map((w) => [w.id, w.name]));
  return {
    locale,
    from,
    to,
    entity,
    tz: salon.timezone,
    retention: retentionYears(salon.state, today),
    state: salon.state,
    edits: rows.map((e) => ({ ...e, who: e.actorName ?? e.actorType, target: e.entity === 'worker' ? (nameOf.get(e.entityId) ?? e.entityId.slice(0, 8)) : e.entityId.slice(0, 8) }))
  };
};
