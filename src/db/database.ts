import type * as SQLiteTypes from 'expo-sqlite';
import { LOCAL_DB_NAME, LOCAL_DB_VERSION, MIGRATIONS } from './schema';

type SQLiteDatabase = SQLiteTypes.SQLiteDatabase;

let dbPromise: Promise<SQLiteDatabase | null> | null = null;

/**
 * Lazily loads expo-sqlite. A static import throws at module-evaluation time when the
 * native module is missing (e.g. dev client built before expo-sqlite was added), which
 * would crash every importer up to the root layout.
 */
function loadSQLite(): typeof SQLiteTypes | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-sqlite') as typeof SQLiteTypes;
  } catch (e) {
    console.warn('[LocalDB] expo-sqlite native module unavailable — rebuild the dev client.', e);
    return null;
  }
}

async function migrate(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  if (version >= LOCAL_DB_VERSION) return;

  while (version < LOCAL_DB_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) throw new Error(`[LocalDB] Missing migration for version ${version}`);
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(step);
    });
    version += 1;
    // PRAGMA cannot be parameterized; version is a trusted integer.
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }
}

async function open(): Promise<SQLiteDatabase | null> {
  const SQLite = loadSQLite();
  if (!SQLite) return null;
  try {
    const db = await SQLite.openDatabaseAsync(LOCAL_DB_NAME);
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await migrate(db);
    return db;
  } catch (e) {
    // Fall back to storage-based behaviour rather than crashing the app.
    console.error('[LocalDB] Failed to open/migrate SQLite database:', e);
    return null;
  }
}

/**
 * Returns the shared SQLite connection, opening + migrating it on first use.
 * Resolves to null if SQLite is unavailable (e.g. dev client built before expo-sqlite was added).
 */
export function getLocalDb(): Promise<SQLiteDatabase | null> {
  if (!dbPromise) dbPromise = open();
  return dbPromise;
}

export type LocalDb = SQLiteDatabase;
