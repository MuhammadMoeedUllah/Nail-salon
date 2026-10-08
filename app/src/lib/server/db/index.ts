import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';
import * as schema from './schema';

const url = env.DATABASE_URL ?? './data/salon.db';
mkdirSync(dirname(resolve(url)), { recursive: true });

const sqlite = new Database(url);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');
sqlite.pragma('busy_timeout = 5000');

export const db = drizzle(sqlite, { schema });
export { sqlite };

// Run pending migrations at boot so a fresh deploy needs no extra step.
// SvelteKit imports server modules while building to analyse routes; skip then.
if (!building) {
  try {
    migrate(db, { migrationsFolder: resolve(env.MIGRATIONS_DIR ?? './drizzle') });
  } catch (e) {
    console.error('[db] migration failed', e);
    throw e;
  }
}
