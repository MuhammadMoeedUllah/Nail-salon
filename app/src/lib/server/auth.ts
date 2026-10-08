import { hash, verify } from '@node-rs/argon2';
import { createHash, randomBytes, timingSafeEqual, createHmac } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { sessions, users, devices, workers, type User, type Device } from './db/schema';
import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';

const ARGON = { memoryCost: 19456, timeCost: 2, parallelism: 1 };
const SESSION_DAYS = 30;
export const SESSION_COOKIE = 'sp_session';
export const DEVICE_COOKIE = 'sp_device';
export const LOCALE_COOKIE = 'sp_locale';

export const newId = () => crypto.randomUUID();
export const newToken = () => randomBytes(32).toString('base64url');
export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export async function hashPassword(pw: string) {
  return hash(pw, ARGON);
}
export async function verifyPassword(h: string, pw: string) {
  try {
    return await verify(h, pw, ARGON);
  } catch {
    return false;
  }
}
/** PINs are short, so they are salted with the salon id before hashing and brute force is rate limited. */
export async function hashPin(salonId: string, pin: string) {
  return hash(`${salonId}:${pin}`, ARGON);
}
export async function verifyPin(h: string, salonId: string, pin: string) {
  try {
    return await verify(h, `${salonId}:${pin}`, ARGON);
  } catch {
    return false;
  }
}

/** remember: a 30-day cookie; otherwise the session ends with the browser and lasts at most a day (UX-51). */
export async function createSession(userId: string, cookies: Cookies, remember = true) {
  const token = newToken();
  const expires = new Date(Date.now() + (remember ? SESSION_DAYS * 86400000 : 86400000));
  await db.insert(sessions).values({ id: sha256(token), userId, expiresAt: expires.toISOString() });
  cookies.set(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    ...(remember ? { expires } : {})
  });
}

export async function destroySession(cookies: Cookies) {
  const token = cookies.get(SESSION_COOKIE);
  if (token) await db.delete(sessions).where(eq(sessions.id, sha256(token)));
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

export async function userFromCookies(cookies: Cookies): Promise<User | null> {
  const token = cookies.get(SESSION_COOKIE);
  if (!token) return null;
  const row = await db
    .select({ user: users, exp: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, sha256(token)))
    .get();
  if (!row) return null;
  if (new Date(row.exp).getTime() < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, sha256(token)));
    return null;
  }
  return row.user;
}

export async function pairDevice(salonId: string, name: string, userId: string, cookies: Cookies): Promise<Device> {
  const token = newToken();
  const id = newId();
  await db.insert(devices).values({ id, salonId, name, tokenHash: sha256(token), pairedByUserId: userId });
  cookies.set(DEVICE_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(Date.now() + 365 * 86400000)
  });
  return (await db.select().from(devices).where(eq(devices.id, id)).get())!;
}

export async function deviceFromCookies(cookies: Cookies): Promise<Device | null> {
  const token = cookies.get(DEVICE_COOKIE);
  if (!token) return null;
  const d = await db.select().from(devices).where(eq(devices.tokenHash, sha256(token))).get();
  if (!d || d.revokedAt) return null;
  return d;
}

const PIN_MAX_FAILS = 5;
const PIN_LOCK_MINUTES = 5;

export type PinResult = { ok: true; worker: typeof workers.$inferSelect } | { ok: false; reason: 'locked' | 'wrong' | 'unknown' };

/** Verify a PIN against the salon's active workers. Locks a worker after repeated failures. */
export async function findWorkerByPin(salonId: string, pin: string, workerId?: string): Promise<PinResult> {
  const rows = await db.select().from(workers).where(eq(workers.salonId, salonId));
  const candidates = rows.filter((w) => w.active && (!workerId || w.id === workerId));
  const now = Date.now();
  for (const w of candidates) {
    if (w.pinLockedUntil && new Date(w.pinLockedUntil).getTime() > now) {
      if (workerId) return { ok: false, reason: 'locked' };
      continue;
    }
    if (await verifyPin(w.pinHash, salonId, pin)) {
      if (w.pinFailedCount > 0) await db.update(workers).set({ pinFailedCount: 0, pinLockedUntil: null }).where(eq(workers.id, w.id));
      return { ok: true, worker: w };
    }
  }
  if (workerId) {
    const w = candidates[0];
    if (w) {
      const fails = w.pinFailedCount + 1;
      await db
        .update(workers)
        .set({
          pinFailedCount: fails,
          pinLockedUntil: fails >= PIN_MAX_FAILS ? new Date(now + PIN_LOCK_MINUTES * 60000).toISOString() : null
        })
        .where(eq(workers.id, w.id));
      return { ok: false, reason: fails >= PIN_MAX_FAILS ? 'locked' : 'wrong' };
    }
  }
  return { ok: false, reason: 'unknown' };
}

/** Signed share tokens for statement links: no database lookup needed, cannot be forged. */
export function signShare(payLineId: string): string {
  const mac = createHmac('sha256', env.APP_SECRET ?? 'dev-secret').update(payLineId).digest('base64url').slice(0, 24);
  return `${payLineId}.${mac}`;
}
export function verifyShare(token: string): string | null {
  const i = token.lastIndexOf('.');
  if (i < 0) return null;
  const id = token.slice(0, i);
  const expected = signShare(id);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return id;
}
