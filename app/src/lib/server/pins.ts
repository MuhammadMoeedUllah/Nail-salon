import { randomInt } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from './db';
import { workers } from './db/schema';
import { verifyPin } from './auth';

/** PINs people guess first; never handed out by the generator (UX-45). */
export function weakPin(pin: string): boolean {
  return /^(\d)\1{3}$/.test(pin) || '0123456789'.includes(pin) || '9876543210'.includes(pin) || ['1212', '2580', '0852', '1004', '2000', '6969', '1122', '2468'].includes(pin);
}

/** True when another active technician in the salon already has this PIN (the tablet finds people by PIN). */
export async function pinTaken(salonId: string, pin: string, exceptId?: string): Promise<boolean> {
  const rows = await db.select({ id: workers.id, pinHash: workers.pinHash }).from(workers).where(and(eq(workers.salonId, salonId), eq(workers.active, true)));
  for (const w of rows) if (w.id !== exceptId && (await verifyPin(w.pinHash, salonId, pin))) return true;
  return false;
}

/** A random 4-digit PIN that is neither weak nor in use in this salon. */
export async function generatePin(salonId: string, exceptId?: string): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const pin = String(randomInt(0, 10000)).padStart(4, '0');
    if (weakPin(pin)) continue;
    if (!(await pinTaken(salonId, pin, exceptId))) return pin;
  }
  throw new Error('Could not find a free PIN');
}
