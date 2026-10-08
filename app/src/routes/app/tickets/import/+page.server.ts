import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { requireUser } from '$lib/server/guard';
import { db } from '$lib/server/db';
import { workers, importMappings, importBatches } from '$lib/server/db/schema';

export const load: PageServerLoad = async (event) => {
  const { salon, locale } = requireUser(event);
  const ws = await db.select().from(workers).where(eq(workers.salonId, salon.id)).orderBy(workers.sortOrder, workers.displayName);
  const maps = await db.select().from(importMappings).where(eq(importMappings.salonId, salon.id));
  const recent = await db.select().from(importBatches).where(eq(importBatches.salonId, salon.id)).orderBy(desc(importBatches.createdAt)).limit(5);
  const parse = (s: string | null) => {
    try {
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  };
  return {
    locale,
    tz: salon.timezone,
    workers: ws.filter((w) => w.active).map((w) => ({ id: w.id, displayName: w.displayName, legalName: w.legalName })),
    // what the owner chose last time, per export format (UX-49)
    mappings: Object.fromEntries(maps.map((m) => [m.format, { staffMap: (parse(m.staffMap) ?? {}) as Record<string, string>, columnMap: parse(m.columnMap), tipsAre: m.tipsAre as 'card' | 'cash' | 'by_method' }])),
    recent: recent.map((b) => ({ id: b.id, format: b.format, fileName: b.fileName, imported: b.importedCount, skipped: b.skippedCount, createdAt: b.createdAt }))
  };
};
