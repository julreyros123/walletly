/**
 * Local SQLite schema (offline store).
 *
 * Every synced table mirrors its Supabase counterpart column-for-column so a row can
 * move between the two without translation. Two extra local-only columns exist on each:
 *   - sync_status: 'synced' (matches Supabase) | 'pending' (local change not yet pushed)
 *   - local_updated_at: epoch ms of the last local write (debugging / ordering)
 *
 * Types: Postgres UUID/TEXT/DATE/TIMESTAMPTZ -> TEXT, NUMERIC -> REAL, BOOLEAN -> INTEGER (0/1).
 */

export const LOCAL_DB_NAME = 'cbudget.db';

/** Bump this and add a step in MIGRATIONS whenever the local schema changes. */
export const LOCAL_DB_VERSION = 1;

export type SyncedTable =
  | 'profiles'
  | 'transactions'
  | 'budgets'
  | 'saving_challenges'
  | 'user_investments'
  | 'guardian_reports'
  | 'user_app_state';

/** Primary key column(s) of each synced table — must match Supabase. */
export const TABLE_PRIMARY_KEYS: Record<SyncedTable, string[]> = {
  profiles: ['id'],
  transactions: ['transaction_id'],
  budgets: ['budget_id'],
  saving_challenges: ['challenge_id'],
  user_investments: ['id'],
  guardian_reports: ['id'],
  user_app_state: ['user_id'],
};

/** Columns that exist in Supabase for each table (local-only sync columns excluded). */
export const TABLE_COLUMNS: Record<SyncedTable, string[]> = {
  profiles: [
    'id', 'email', 'name', 'age', 'is_onboarded', 'phone', 'city', 'school_grade',
    'avatar_url', 'avatar_color', 'avatar_emoji', 'guardian_email', 'guardian_linked',
    'push_token', 'created_at', 'updated_at',
  ],
  transactions: [
    'transaction_id', 'user_id', 'type', 'category', 'amount', 'description',
    'transaction_date', 'created_at', 'updated_at',
  ],
  budgets: [
    'budget_id', 'user_id', 'category', 'allocated_amount', 'spent_amount', 'month',
    'created_at', 'updated_at',
  ],
  saving_challenges: [
    'challenge_id', 'user_id', 'title', 'target_amount', 'current_amount', 'end_date',
    'icon', 'color', 'is_completed', 'created_at', 'updated_at',
  ],
  user_investments: [
    'id', 'user_id', 'ticker', 'asset_class', 'quantity', 'average_buy_price',
    'created_at', 'updated_at',
  ],
  guardian_reports: [
    'id', 'user_id', 'guardian_email', 'financial_health_score', 'streak_days',
    'badges_count', 'sent_at',
  ],
  user_app_state: ['user_id', 'state', 'updated_at'],
};

export const BOOLEAN_COLUMNS = new Set(['is_onboarded', 'guardian_linked', 'is_completed']);

const SYNC_COLS = `
    sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending')),
    local_updated_at INTEGER NOT NULL DEFAULT 0`;

/** Ordered migrations: MIGRATIONS[n] upgrades a database from version n to n+1. */
export const MIGRATIONS: string[] = [
  // v0 -> v1: initial schema
  `
  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT,
    name TEXT,
    age INTEGER,
    is_onboarded INTEGER NOT NULL DEFAULT 0,
    phone TEXT,
    city TEXT,
    school_grade TEXT,
    avatar_url TEXT,
    avatar_color TEXT,
    avatar_emoji TEXT,
    guardian_email TEXT,
    guardian_linked INTEGER NOT NULL DEFAULT 0,
    push_token TEXT,
    created_at TEXT,
    updated_at TEXT,${SYNC_COLS}
  );

  CREATE TABLE IF NOT EXISTS transactions (
    transaction_id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL DEFAULT 'Other',
    amount REAL NOT NULL CHECK (amount > 0),
    description TEXT,
    transaction_date TEXT NOT NULL,
    created_at TEXT,
    updated_at TEXT,${SYNC_COLS}
  );
  CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions (user_id, transaction_date DESC);

  CREATE TABLE IF NOT EXISTS budgets (
    budget_id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '__total__',
    allocated_amount REAL NOT NULL DEFAULT 0 CHECK (allocated_amount >= 0),
    spent_amount REAL NOT NULL DEFAULT 0 CHECK (spent_amount >= 0),
    month TEXT NOT NULL,
    created_at TEXT,
    updated_at TEXT,${SYNC_COLS},
    UNIQUE (user_id, category, month)
  );

  CREATE TABLE IF NOT EXISTS saving_challenges (
    challenge_id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'Savings Goal',
    target_amount REAL NOT NULL DEFAULT 0 CHECK (target_amount >= 0),
    current_amount REAL NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
    end_date TEXT,
    icon TEXT,
    color TEXT,
    is_completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT,
    updated_at TEXT,${SYNC_COLS}
  );
  CREATE INDEX IF NOT EXISTS idx_goals_user ON saving_challenges (user_id);

  CREATE TABLE IF NOT EXISTS user_investments (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    ticker TEXT NOT NULL,
    asset_class TEXT NOT NULL CHECK (asset_class IN ('stock', 'crypto', 'bond')),
    quantity REAL NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    average_buy_price REAL NOT NULL DEFAULT 0 CHECK (average_buy_price >= 0),
    created_at TEXT,
    updated_at TEXT,${SYNC_COLS},
    UNIQUE (user_id, ticker)
  );

  CREATE TABLE IF NOT EXISTS guardian_reports (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    guardian_email TEXT NOT NULL,
    financial_health_score INTEGER NOT NULL,
    streak_days INTEGER NOT NULL,
    badges_count INTEGER NOT NULL,
    sent_at TEXT,${SYNC_COLS}
  );

  CREATE TABLE IF NOT EXISTS user_app_state (
    user_id TEXT PRIMARY KEY NOT NULL,
    state TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT,${SYNC_COLS}
  );

  -- Offline write queue: each row is one pending Supabase operation, replayed in id order.
  CREATE TABLE IF NOT EXISTS sync_outbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('insert', 'upsert', 'update', 'delete')),
    payload TEXT,
    match TEXT,
    options TEXT,
    created_at INTEGER NOT NULL,
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT
  );

  -- Local device cache of the full gamification snapshot, keyed by storage key
  -- (one per signed-in user plus one for guest mode). Replaces the AsyncStorage blob.
  CREATE TABLE IF NOT EXISTS local_app_state (
    storage_key TEXT PRIMARY KEY NOT NULL,
    state TEXT NOT NULL,
    saved_at INTEGER NOT NULL
  );
  `,
];
