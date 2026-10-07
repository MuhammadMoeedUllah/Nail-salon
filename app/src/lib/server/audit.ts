import { db } from './db';
import { edits } from './db/schema';
import { newId } from './auth';

export type Actor = { type: 'user' | 'device' | 'worker' | 'system'; id?: string | null; name?: string | null };

export interface EditInput {
  salonId: string;
  entity: 'punch' | 'ticket' | 'worker' | 'pay_run' | 'pay_line' | 'salon' | 'device' | 'import';
  entityId: string;
  action: 'create' | 'update' | 'void' | 'approve' | 'pay' | 'reopen' | 'revoke' | 'import';
  field?: string;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string | null;
  actor: Actor;
}

const str = (v: unknown) => (v === undefined || v === null ? null : typeof v === 'string' ? v : JSON.stringify(v));

/** Append one row to the edit trail. Never throws on serialisation problems. */
export async function recordEdit(e: EditInput) {
  await db.insert(edits).values({
    id: newId(),
    salonId: e.salonId,
    entity: e.entity,
    entityId: e.entityId,
    action: e.action,
    field: e.field ?? null,
    oldValue: str(e.oldValue),
    newValue: str(e.newValue),
    reason: e.reason ?? null,
    actorType: e.actor.type,
    actorId: e.actor.id ?? null,
    actorName: e.actor.name ?? null
  });
}

/** Record one edit per changed field. */
export async function recordDiff(
  base: Omit<EditInput, 'field' | 'oldValue' | 'newValue' | 'action'> & { action?: EditInput['action'] },
  before: Record<string, unknown>,
  after: Record<string, unknown>
) {
  for (const k of Object.keys(after)) {
    if (str(before[k]) !== str(after[k])) {
      await recordEdit({ ...base, action: base.action ?? 'update', field: k, oldValue: before[k], newValue: after[k] });
    }
  }
}
