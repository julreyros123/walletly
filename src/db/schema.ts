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
export const LOCAL_DB_VERSION = 4;

export type SyncedTable =
  | 'profiles'
  | 'transactions'
  | 'budgets'
  | 'saving_challenges'
  | 'user_investments'
  | 'guardian_reports'
  | 'user_app_state'
  | 'user_lessons'
  | 'investment_orders'
  | 'user_achievements'
  | 'daily_checkin_logs'
  | 'arcade_scores'
  | 'quiz_attempts'
  | 'savings_vault_history';

/** Primary key column(s) of each synced table — must match Supabase. */
export const TABLE_PRIMARY_KEYS: Record<SyncedTable, string[]> = {
  profiles: ['id'],
  transactions: ['transaction_id'],
  budgets: ['budget_id'],
  saving_challenges: ['challenge_id'],
  user_investments: ['id'],
  guardian_reports: ['id'],
  user_app_state: ['user_id'],
  user_lessons: ['id'],
  investment_orders: ['id'],
  user_achievements: ['id'],
  daily_checkin_logs: ['id'],
  arcade_scores: ['id'],
  quiz_attempts: ['id'],
  savings_vault_history: ['id'],
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
  user_lessons: ['id', 'user_id', 'lesson_id', 'completed_at'],
  investment_orders: [
    'id', 'user_id', 'ticker', 'side', 'shares', 'price', 'total_amount', 'executed_at',
  ],
  user_achievements: ['id', 'user_id', 'achievement_id', 'unlocked_at'],
  daily_checkin_logs: [
    'id', 'user_id', 'checkin_date', 'streak_count', 'day_in_cycle', 'xp_reward',
    'cash_reward', 'claimed_at',
  ],
  arcade_scores: [
    'id', 'user_id', 'game_id', 'score', 'xp_earned', 'cash_profit', 'played_at',
  ],
  quiz_attempts: [
    'id', 'user_id', 'lesson_id', 'score_percent', 'passed', 'attempted_at',
  ],
  savings_vault_history: [
    'id', 'user_id', 'amount', 'cycle', 'note', 'rolled_over_at',
  ],
};

export const BOOLEAN_COLUMNS = new Set(['is_onboarded', 'guardian_linked', 'is_completed', 'passed']);

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

  // v1 -> v2: user_lessons table for dedicated lesson completion sync
  `
  CREATE TABLE IF NOT EXISTS user_lessons (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending')),
    local_updated_at INTEGER NOT NULL DEFAULT 0,
    UNIQUE (user_id, lesson_id)
  );
  CREATE INDEX IF NOT EXISTS idx_user_lessons_user ON user_lessons (user_id);
  `,

  // v2 -> v3: expanded tables for investment orders, user achievements, daily check-in logs, arcade scores, quiz attempts, and savings vault history
  `
  CREATE TABLE IF NOT EXISTS investment_orders (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    ticker TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
    shares REAL NOT NULL,
    price REAL NOT NULL,
    total_amount REAL NOT NULL,
    executed_at TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending')),
    local_updated_at INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_investment_orders_user ON investment_orders (user_id, executed_at DESC);

  CREATE TABLE IF NOT EXISTS user_achievements (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    unlocked_at TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending')),
    local_updated_at INTEGER NOT NULL DEFAULT 0,
    UNIQUE (user_id, achievement_id)
  );
  CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements (user_id);

  CREATE TABLE IF NOT EXISTS daily_checkin_logs (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    checkin_date TEXT NOT NULL,
    streak_count INTEGER NOT NULL,
    day_in_cycle INTEGER NOT NULL,
    xp_reward INTEGER NOT NULL,
    cash_reward REAL NOT NULL,
    claimed_at TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending')),
    local_updated_at INTEGER NOT NULL DEFAULT 0,
    UNIQUE (user_id, checkin_date)
  );
  CREATE INDEX IF NOT EXISTS idx_daily_checkin_logs_user ON daily_checkin_logs (user_id, checkin_date DESC);

  CREATE TABLE IF NOT EXISTS arcade_scores (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    game_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    xp_earned INTEGER NOT NULL,
    cash_profit REAL NOT NULL DEFAULT 0,
    played_at TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending')),
    local_updated_at INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_arcade_scores_user ON arcade_scores (user_id, played_at DESC);

  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    lesson_id TEXT NOT NULL,
    score_percent INTEGER NOT NULL,
    passed INTEGER NOT NULL DEFAULT 1,
    attempted_at TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending')),
    local_updated_at INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts (user_id, lesson_id);

  CREATE TABLE IF NOT EXISTS savings_vault_history (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    amount REAL NOT NULL,
    cycle TEXT NOT NULL,
    note TEXT,
    rolled_over_at TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending')),
    local_updated_at INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_savings_vault_history_user ON savings_vault_history (user_id, rolled_over_at DESC);
  `,

  // v3 -> v4: performance indexes for high-frequency queries and auto-recovery
  `
  CREATE INDEX IF NOT EXISTS idx_local_app_state_saved ON local_app_state (storage_key, saved_at DESC);
  CREATE INDEX IF NOT EXISTS idx_sync_outbox_order ON sync_outbox (id ASC);
  CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions (user_id, category);
  CREATE INDEX IF NOT EXISTS idx_user_investments_ticker ON user_investments (user_id, ticker);
  `,
];
