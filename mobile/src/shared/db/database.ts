import * as SQLite from 'expo-sqlite';
import { SCHEMA_SQL, SCHEMA_VERSION } from './schema';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Single shared connection. Opens the DB and applies migrations on first use. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = init().catch((e) => {
      dbPromise = null; // allow retry
      throw e;
    });
  }
  return dbPromise;
}

async function init() {
  const db = await SQLite.openDatabaseAsync('careerpulse.db');
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current < SCHEMA_VERSION) {
    await migrate(db, current);
    await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }
  return db;
}

/**
 * Add future migrations as `if (from < 2) { ... }` blocks, then bump SCHEMA_VERSION
 * (and edit docs/schema.sql + run scripts/sync-schema.sh for fresh installs).
 */
async function migrate(db: SQLite.SQLiteDatabase, from: number) {
  if (from < 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(SCHEMA_SQL);
    });
  }
}
