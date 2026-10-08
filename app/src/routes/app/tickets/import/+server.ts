import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/guard';
import { db } from '$lib/server/db';
import { tickets, importBatches, workers } from '$lib/server/db/schema';
import { newId } from '$lib/server/auth';
import { recordEdit } from '$lib/server/audit';
import { localToIso } from '$lib/time';

const Body = z.object({
  format: z.string().max(40),
  fileName: z.string().max(200).optional(),
  staffMap: z.record(z.string(), z.string()),
  tickets: z
    .array(
      z.object({
        workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        time: z.string().regex(/^\d{2}:\d{2}$/),
        staffName: z.string().min(1),
        serviceName: z.string().min(1).max(120),
        priceCents: z.number().int().min(0).max(10_000_000),
        tipCardCents: z.number().int().min(0).max(1_000_000),
        tipCashCents: z.number().int().min(0).max(1_000_000),
        paymentMethod: z.enum(['card', 'cash', 'other']).nullable(),
        externalId: z.string().min(1).max(200),
        ticketNo: z.string().max(40).nullable()
      })
    )
    .max(5000)
});

export const POST: RequestHandler = async (event) => {
  const { salon, user } = requireUser(event);
  const parsed = Body.safeParse(await event.request.json().catch(() => null));
  if (!parsed.success) return json({ ok: false, error: 'bad_request' }, { status: 400 });
  const b = parsed.data;
  const ws = await db.select().from(workers).where(eq(workers.salonId, salon.id));
  const valid = new Set(ws.map((w) => w.id));
  const source = `csv:${b.format}`;
  const batchId = newId();
  let imported = 0;
  let skipped = 0;
  const unmatched = new Set<string>();
  for (const t of b.tickets) {
    const workerId = b.staffMap[t.staffName];
    if (!workerId || !valid.has(workerId)) {
      unmatched.add(t.staffName);
      skipped++;
      continue;
    }
    const exists = await db
      .select({ id: tickets.id })
      .from(tickets)
      .where(and(eq(tickets.salonId, salon.id), eq(tickets.source, source), eq(tickets.externalId, t.externalId)))
      .get();
    if (exists) {
      skipped++;
      continue;
    }
    await db.insert(tickets).values({
      id: newId(),
      salonId: salon.id,
      workerId,
      workDate: t.workDate,
      ts: localToIso(t.workDate, t.time, salon.timezone),
      ticketNo: t.ticketNo,
      serviceName: t.serviceName,
      priceCents: t.priceCents,
      tipCardCents: t.tipCardCents,
      tipCashCents: t.tipCashCents,
      paymentMethod: t.paymentMethod,
      source,
      importBatchId: batchId,
      externalId: t.externalId,
      createdByUserId: user.id
    });
    imported++;
  }
  await db.insert(importBatches).values({
    id: batchId,
    salonId: salon.id,
    format: b.format,
    fileName: b.fileName ?? null,
    rowCount: b.tickets.length,
    importedCount: imported,
    skippedCount: skipped,
    unmatched: JSON.stringify([...unmatched]),
    createdByUserId: user.id
  });
  await recordEdit({ salonId: salon.id, entity: 'import', entityId: batchId, action: 'import', newValue: { format: b.format, file: b.fileName, imported, skipped }, actor: { type: 'user', id: user.id, name: user.name } });
  return json({ ok: true, imported, skipped, unmatched: [...unmatched] });
};
