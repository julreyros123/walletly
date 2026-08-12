import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

const DB_NAME = 'cbudget.db';

type SQLiteDatabase = Awaited<ReturnType<typeof SQLite.openDatabaseAsync>>;

let dbPromise: Promise<SQLiteDatabase> | null = null;

export async function getOfflineDb() {
  if (Platform.OS === 'web') {
    return null;
  }

  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }

  return dbPromise;
}

export async function initializeOfflineSchema() {
  const db = await getOfflineDb();
  if (!db) return;

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS offline_devices (
      offline_id TEXT PRIMARY KEY NOT NULL,
      device_id TEXT NOT NULL UNIQUE,
      currency_pref TEXT NOT NULL DEFAULT 'PHP',
      upgraded_to_user_id TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      category_id TEXT PRIMARY KEY NOT NULL,
      owner_type TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      transaction_id TEXT PRIMARY KEY NOT NULL,
      owner_type TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      category_id TEXT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      transaction_date TEXT NOT NULL,
      is_recurring INTEGER NOT NULL DEFAULT 0,
      recurring_id TEXT,
      synced_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recurring_schedules (
      recurring_id TEXT PRIMARY KEY NOT NULL,
      owner_type TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      category_id TEXT,
      amount REAL NOT NULL,
      frequency TEXT NOT NULL,
      next_run_date TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS budgets (
      budget_id TEXT PRIMARY KEY NOT NULL,
      owner_type TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      category_id TEXT,
      limit_amount REAL NOT NULL,
      period TEXT NOT NULL,
      is_recommended INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      recommendation_id TEXT PRIMARY KEY NOT NULL,
      owner_type TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      category_id TEXT,
      rule_triggered TEXT NOT NULL,
      message TEXT NOT NULL,
      generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      is_dismissed INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS literacy_lessons (
      lesson_id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      category TEXT NOT NULL,
      target_user_type TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lesson_progress (
      progress_id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, lesson_id)
    );

    CREATE TABLE IF NOT EXISTS streaks (
      streak_id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL UNIQUE,
      current_count INTEGER NOT NULL DEFAULT 0,
      longest_count INTEGER NOT NULL DEFAULT 0,
      last_activity_date TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS badges (
      badge_id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE,
      icon TEXT,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_badges (
      user_badge_id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      badge_id TEXT NOT NULL,
      earned_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, badge_id)
    );

    CREATE TABLE IF NOT EXISTS saving_challenges (
      challenge_id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL NOT NULL DEFAULT 0,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      subscription_id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL UNIQUE,
      tier TEXT NOT NULL DEFAULT 'free',
      status TEXT NOT NULL DEFAULT 'active',
      start_date TEXT NOT NULL,
      renewal_date TEXT,
      payment_reference TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sync_state (
      sync_state_id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL UNIQUE,
      last_sync_at TEXT,
      sync_cursor TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function runOffline(sql: string, params: unknown[] = []) {
  const db = await getOfflineDb();
  if (!db) return null;
  return db.runAsync(sql, ...(params as never[]));
}

export async function getOfflineFirst<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  const db = await getOfflineDb();
  if (!db) return null;
  return db.getFirstAsync<T>(sql, ...(params as never[]));
}

export async function getOfflineAll<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  const db = await getOfflineDb();
  if (!db) return [];
  return db.getAllAsync<T>(sql, ...(params as never[]));
}
