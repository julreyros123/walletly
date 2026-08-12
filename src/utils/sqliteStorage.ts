import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'cbudget.db';
const KV_TABLE = 'app_kv';

type SQLiteDatabase = Awaited<ReturnType<typeof SQLite.openDatabaseAsync>>;

let dbPromise: Promise<SQLiteDatabase> | null = null;

async function getDatabase() {
  if (Platform.OS === 'web') {
    return null;
  }

  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS ${KV_TABLE} (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      return db;
    })();
  }

  return dbPromise;
}

export const sqliteStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      } catch {
        return null;
      }
    }

    const db = await getDatabase();
    if (!db) return null;

    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM ${KV_TABLE} WHERE key = ?`,
      [key],
    );

    return row?.value ?? null;
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, value);
        }
      } catch {
        // Ignore localStorage failures in restricted browser contexts.
      }
      return;
    }

    const db = await getDatabase();
    if (!db) return;

    await db.runAsync(
      `INSERT INTO ${KV_TABLE} (key, value, updated_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value,
         updated_at = CURRENT_TIMESTAMP`,
      [key, value],
    );
  },

  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(key);
        }
      } catch {
        // Ignore localStorage failures in restricted browser contexts.
      }
      return;
    }

    const db = await getDatabase();
    if (!db) return;

    await db.runAsync(`DELETE FROM ${KV_TABLE} WHERE key = ?`, [key]);
  },
};
