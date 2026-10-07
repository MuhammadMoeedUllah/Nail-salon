// Standalone migration runner: pnpm db:migrate
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const url = process.env.DATABASE_URL ?? './data/salon.db';
mkdirSync(dirname(resolve(url)), { recursive: true });
const sqlite = new Database(url);
sqlite.pragma('journal_mode = WAL');
migrate(drizzle(sqlite), { migrationsFolder: resolve('./drizzle') });
console.log('migrated', url);
