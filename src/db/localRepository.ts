import { getLocalDb, type LocalDb } from './database';
import {
  BOOLEAN_COLUMNS,
  TABLE_COLUMNS,
  TABLE_PRIMARY_KEYS,
  type SyncedTable,
} from './schema';

type Row = Record<string, unknown>;
type SQLValue = string | number | null;

/** Natural unique keys used when a payload doesn't carry the primary key (budget upserts). */
const NATURAL_KEYS: Partial<Record<SyncedTable, string[]>> = {
  budgets: ['user_id', 'category', 'month'],
  user_investments: ['user_id', 'ticker'],
};

export function isSyncedTable(name: string): name is SyncedTable {
  return Object.prototype.hasOwnProperty.call(TABLE_COLUMNS, name);
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function toSql(value: unknown): SQLValue {
  if (value === undefined || value === null) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function fromSql(table: SyncedTable, row: Row): Row {
  const out: Row = {};
  for (const col of TABLE_COLUMNS[table]) {
    let v = row[col];
    if (BOOLEAN_COLUMNS.has(col)) v = v === 1 || v === true;
    if (table === 'user_app_state' && col === 'state' && typeof v === 'string') {
      try {
        v = JSON.parse(v);
      } catch (e) {
        console.warn('[LocalRepo] Failed to parse user_app_state.state:', e);
        v = {};
      }
    }
    out[col] = v;
  }
  return out;
}

/** Keeps only columns that exist in the local mirror (drops legacy owner_id, limit_amount, ...). */
function pickColumns(table: SyncedTable, payload: Row): Row {
  const cols = TABLE_COLUMNS[table];
  const out: Row = {};
  for (const col of cols) {
    if (payload[col] !== undefined) out[col] = payload[col];
  }
  // Legacy -> canonical fallbacks so older payload shapes still land correctly.
  if (table === 'budgets') {
    if (out.allocated_amount === undefined && payload.limit_amount !== undefined) {
      out.allocated_amount = payload.limit_amount;
    }
    if (out.month === undefined && typeof payload.period === 'string') out.month = payload.period;
  }
  if (out.user_id === undefined && typeof payload.owner_id === 'string' && cols.includes('user_id')) {
    out.user_id = payload.owner_id;
  }
  return out;
}

async function findPk(db: LocalDb, table: SyncedTable, data: Row): Promise<string | null> {
  const pkCol = TABLE_PRIMARY_KEYS[table][0];
  if (typeof data[pkCol] === 'string') return data[pkCol] as string;
  const natural = NATURAL_KEYS[table];
  if (!natural || natural.some((c) => data[c] === undefined)) return null;
  const where = natural.map((c) => `${c} = ?`).join(' AND ');
  const existing = await db.getFirstAsync<Row>(
    `SELECT ${pkCol} AS pk FROM ${table} WHERE ${where}`,
    natural.map((c) => toSql(data[c]))
  );
  return existing ? String(existing.pk) : null;
}

async function upsertLocal(db: LocalDb, table: SyncedTable, data: Row, status: 'synced' | 'pending') {
  const pkCol = TABLE_PRIMARY_KEYS[table][0];
  const row = { ...data };
  if (row[pkCol] === undefined) row[pkCol] = (await findPk(db, table, row)) ?? newId();

  const cols = Object.keys(row);
  const placeholders = cols.map(() => '?').join(', ');
  const updates = cols
    .filter((c) => c !== pkCol)
    .map((c) => `${c} = excluded.${c}`)
    .concat(['sync_status = excluded.sync_status', 'local_updated_at = excluded.local_updated_at'])
    .join(', ');

  await db.runAsync(
    `INSERT INTO ${table} (${cols.join(', ')}, sync_status, local_updated_at)
     VALUES (${placeholders}, ?, ?)
     ON CONFLICT(${pkCol}) DO UPDATE SET ${updates}`,
    [...cols.map((c) => toSql(row[c])), status, Date.now()]
  );
}

function whereFromMatch(table: SyncedTable, match: Row): { sql: string; params: SQLValue[] } | null {
  const cols = Object.keys(match).filter((c) => TABLE_COLUMNS[table].includes(c));
  if (cols.length === 0) return null;
  return {
    sql: cols.map((c) => `${c} = ?`).join(' AND '),
    params: cols.map((c) => toSql(match[c])),
  };
}

// ───────────────────────── Local mutations (mirrors of outbox operations) ─────────────────────────

/** Applies a queued Supabase operation to the local mirror so the UI and offline reads see it. */
export async function applyLocalMutation(
  table: string,
  action: 'insert' | 'upsert' | 'update' | 'delete',
  payload?: unknown,
  match?: Row
): Promise<void> {
  if (!isSyncedTable(table)) return;
  const db = await getLocalDb();
  if (!db) return;

  try {
    if (action === 'insert' || action === 'upsert') {
      const rows = Array.isArray(payload) ? payload : [payload];
      await db.withExclusiveTransactionAsync(async () => {
        for (const r of rows) {
          if (r && typeof r === 'object') await upsertLocal(db, table, pickColumns(table, r as Row), 'pending');
        }
      });
    } else if (action === 'update' && match && payload && typeof payload === 'object') {
      const where = whereFromMatch(table, match);
      const data = pickColumns(table, payload as Row);
      const cols = Object.keys(data);
      if (!where || cols.length === 0) return;
      await db.runAsync(
        `UPDATE ${table} SET ${cols.map((c) => `${c} = ?`).join(', ')}, sync_status = 'pending', local_updated_at = ?
         WHERE ${where.sql}`,
        [...cols.map((c) => toSql(data[c])), Date.now(), ...where.params]
      );
    } else if (action === 'delete' && match) {
      const where = whereFromMatch(table, match);
      if (!where) return;
      await db.runAsync(`DELETE FROM ${table} WHERE ${where.sql}`, where.params);
    }
  } catch (e) {
    console.warn(`[LocalRepo] applyLocalMutation failed for ${table}.${action}:`, e);
  }
}

/** Marks rows touched by a successfully-pushed operation as synced, unless more queued ops still target them. */
export async function markSynced(table: string, payload: unknown, match: Row | undefined, outboxId: number) {
  if (!isSyncedTable(table)) return;
  const db = await getLocalDb();
  if (!db) return;
  const pkCol = TABLE_PRIMARY_KEYS[table][0];

  try {
    const sources: Row[] = [];
    if (Array.isArray(payload)) sources.push(...(payload as Row[]));
    else if (payload && typeof payload === 'object') sources.push(payload as Row);
    if (match) sources.push(match);

    for (const src of sources) {
      const data = pickColumns(table, src);
      const pk = await findPk(db, table, data);
      if (!pk) continue;
      const stillQueued = await db.getFirstAsync<{ n: number }>(
        `SELECT COUNT(*) AS n FROM sync_outbox
         WHERE table_name = ? AND id != ? AND (IFNULL(payload, '') LIKE ? OR IFNULL(match, '') LIKE ?)`,
        [table, outboxId, `%"${pk}"%`, `%"${pk}"%`]
      );
      if ((stillQueued?.n ?? 0) > 0) continue;
      await db.runAsync(`UPDATE ${table} SET sync_status = 'synced' WHERE ${pkCol} = ?`, [pk]);
    }
  } catch (e) {
    console.warn(`[LocalRepo] markSynced failed for ${table}:`, e);
  }
}

// ───────────────────────── Pull: merge Supabase rows into SQLite ─────────────────────────

/**
 * Merges the authoritative remote rows for one user into the local table.
 * - Local rows with pending changes are never overwritten (local edit wins until pushed).
 * - Synced local rows missing from the remote set were deleted on another device -> removed.
 */
export async function applyRemoteRows(table: SyncedTable, userId: string, remoteRows: Row[]): Promise<void> {
  const db = await getLocalDb();
  if (!db) return;
  const pkCol = TABLE_PRIMARY_KEYS[table][0];
  const ownerCol = table === 'profiles' ? 'id' : 'user_id';
  const natural = NATURAL_KEYS[table];

  try {
    await db.withExclusiveTransactionAsync(async () => {
      const remotePks = new Set<string>();

      for (const raw of remoteRows) {
        const data = pickColumns(table, raw);
        const pk = data[pkCol];
        if (typeof pk !== 'string') continue;
        remotePks.add(pk);

        const local = await db.getFirstAsync<{ sync_status: string }>(
          `SELECT sync_status FROM ${table} WHERE ${pkCol} = ?`,
          [pk]
        );
        if (local?.sync_status === 'pending') continue;

        if (natural && natural.every((c) => data[c] !== undefined)) {
          // A row created offline gets a local id; Supabase assigns its own. Reconcile on the natural key.
          const where = natural.map((c) => `${c} = ?`).join(' AND ');
          const clash = await db.getFirstAsync<{ pk: string; sync_status: string }>(
            `SELECT ${pkCol} AS pk, sync_status FROM ${table} WHERE ${where} AND ${pkCol} != ?`,
            [...natural.map((c) => toSql(data[c])), pk]
          );
          if (clash?.sync_status === 'pending') continue;
          if (clash) await db.runAsync(`DELETE FROM ${table} WHERE ${pkCol} = ?`, [clash.pk]);
        }

        await upsertLocal(db, table, data, 'synced');
      }

      const localSynced = await db.getAllAsync<{ pk: string }>(
        `SELECT ${pkCol} AS pk FROM ${table} WHERE ${ownerCol} = ? AND sync_status = 'synced'`,
        [userId]
      );
      for (const { pk } of localSynced) {
        if (!remotePks.has(pk)) {
          await db.runAsync(`DELETE FROM ${table} WHERE ${pkCol} = ?`, [pk]);
        }
      }
    });
  } catch (e) {
    console.warn(`[LocalRepo] applyRemoteRows failed for ${table}:`, e);
  }
}

// ───────────────────────── Reads ─────────────────────────

export async function getLocalRows(table: SyncedTable, userId: string): Promise<Row[] | null> {
  const db = await getLocalDb();
  if (!db) return null;
  const ownerCol = table === 'profiles' ? 'id' : 'user_id';
  const order = table === 'transactions' ? ' ORDER BY transaction_date DESC, created_at DESC' : '';
  try {
    const rows = await db.getAllAsync<Row>(`SELECT * FROM ${table} WHERE ${ownerCol} = ?${order}`, [userId]);
    return rows.map((r) => fromSql(table, r));
  } catch (e) {
    console.warn(`[LocalRepo] getLocalRows failed for ${table}:`, e);
    return null;
  }
}

/** Removes every local row belonging to a user (account deletion / full reset). */
export async function clearLocalUserData(userId: string): Promise<void> {
  const db = await getLocalDb();
  if (!db) return;
  try {
    await db.withExclusiveTransactionAsync(async () => {
      for (const table of Object.keys(TABLE_COLUMNS) as SyncedTable[]) {
        const ownerCol = table === 'profiles' ? 'id' : 'user_id';
        await db.runAsync(`DELETE FROM ${table} WHERE ${ownerCol} = ?`, [userId]);
      }
    });
  } catch (e) {
    console.warn('[LocalRepo] clearLocalUserData failed:', e);
  }
}

// ───────────────────────── Local snapshot cache (replaces AsyncStorage blob) ─────────────────────────

export async function saveLocalAppState(storageKey: string, json: string): Promise<boolean> {
  const db = await getLocalDb();
  if (!db) return false;
  try {
    await db.runAsync(
      `INSERT INTO local_app_state (storage_key, state, saved_at) VALUES (?, ?, ?)
       ON CONFLICT(storage_key) DO UPDATE SET state = excluded.state, saved_at = excluded.saved_at`,
      [storageKey, json, Date.now()]
    );
    return true;
  } catch (e) {
    console.warn('[LocalRepo] saveLocalAppState failed:', e);
    return false;
  }
}

export async function loadLocalAppState(storageKey: string): Promise<string | null> {
  const db = await getLocalDb();
  if (!db) return null;
  try {
    const row = await db.getFirstAsync<{ state: string }>(
      'SELECT state FROM local_app_state WHERE storage_key = ?',
      [storageKey]
    );
    return row?.state ?? null;
  } catch (e) {
    console.warn('[LocalRepo] loadLocalAppState failed:', e);
    return null;
  }
}

export async function deleteLocalAppState(storageKey: string): Promise<void> {
  const db = await getLocalDb();
  if (!db) return;
  try {
    await db.runAsync('DELETE FROM local_app_state WHERE storage_key = ?', [storageKey]);
  } catch (e) {
    console.warn('[LocalRepo] deleteLocalAppState failed:', e);
  }
}

// ───────────────────────── Outbox ─────────────────────────

export interface OutboxRow {
  id: number;
  table_name: string;
  action: 'insert' | 'upsert' | 'update' | 'delete';
  payload: string | null;
  match: string | null;
  options: string | null;
  created_at: number;
  retry_count: number;
}

export async function outboxAdd(item: {
  table: string;
  action: OutboxRow['action'];
  payload?: unknown;
  match?: Row;
  options?: Row;
}): Promise<boolean> {
  const db = await getLocalDb();
  if (!db) return false;
  try {
    await db.runAsync(
      `INSERT INTO sync_outbox (table_name, action, payload, match, options, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        item.table,
        item.action,
        item.payload === undefined ? null : JSON.stringify(item.payload),
        item.match ? JSON.stringify(item.match) : null,
        item.options ? JSON.stringify(item.options) : null,
        Date.now(),
      ]
    );
    return true;
  } catch (e) {
    console.warn('[LocalRepo] outboxAdd failed:', e);
    return false;
  }
}

export async function outboxList(): Promise<OutboxRow[] | null> {
  const db = await getLocalDb();
  if (!db) return null;
  try {
    return await db.getAllAsync<OutboxRow>('SELECT * FROM sync_outbox ORDER BY id ASC');
  } catch (e) {
    console.warn('[LocalRepo] outboxList failed:', e);
    return null;
  }
}

export async function outboxRemove(id: number): Promise<void> {
  const db = await getLocalDb();
  if (!db) return;
  await db.runAsync('DELETE FROM sync_outbox WHERE id = ?', [id]);
}

export async function outboxRecordFailure(id: number, error: string): Promise<void> {
  const db = await getLocalDb();
  if (!db) return;
  await db.runAsync(
    'UPDATE sync_outbox SET retry_count = retry_count + 1, last_error = ? WHERE id = ?',
    [error, id]
  );
}

export async function outboxCount(): Promise<number | null> {
  const db = await getLocalDb();
  if (!db) return null;
  try {
    const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM sync_outbox');
    return row?.n ?? 0;
  } catch (e) {
    console.warn('[LocalRepo] outboxCount failed:', e);
    return null;
  }
}

export async function outboxClear(): Promise<void> {
  const db = await getLocalDb();
  if (!db) return;
  try {
    await db.runAsync('DELETE FROM sync_outbox');
    // Rows that were pending will never be pushed now; mark them synced so pulls can overwrite them.
    for (const table of Object.keys(TABLE_COLUMNS) as SyncedTable[]) {
      await db.runAsync(`UPDATE ${table} SET sync_status = 'synced' WHERE sync_status = 'pending'`);
    }
  } catch (e) {
    console.warn('[LocalRepo] outboxClear failed:', e);
  }
}
