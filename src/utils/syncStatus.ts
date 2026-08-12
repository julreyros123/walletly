import { runOffline } from '@/utils/offlineSchema';
import { sqliteStorage } from '@/utils/sqliteStorage';
import { uuidFromString } from '@/utils/uuid';

export type SyncBackend = 'supabase' | 'sqlite';
export type SyncConnection = 'online' | 'offline';

export interface SyncStatusSnapshot {
  backend: SyncBackend;
  connection: SyncConnection;
  lastSyncedAt: string | null;
  userId: string | null;
  deviceId: string | null;
  syncCursor: string | null;
}

const SYNC_STATUS_KEY = 'cbudget_sync_status';

const DEFAULT_SYNC_STATUS: SyncStatusSnapshot = {
  backend: 'sqlite',
  connection: 'offline',
  lastSyncedAt: null,
  userId: null,
  deviceId: null,
  syncCursor: null,
};

export async function loadSyncStatus() {
  const raw = await sqliteStorage.getItem(SYNC_STATUS_KEY);
  if (!raw) return DEFAULT_SYNC_STATUS;

  try {
    return { ...DEFAULT_SYNC_STATUS, ...(JSON.parse(raw) as Partial<SyncStatusSnapshot>) };
  } catch (error) {
    console.warn('Failed to parse sync status cache:', error);
    return DEFAULT_SYNC_STATUS;
  }
}

export async function saveSyncStatus(status: SyncStatusSnapshot) {
  await sqliteStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(status));
}

export async function persistSyncStatus(status: SyncStatusSnapshot) {
  await saveSyncStatus(status);

  if (!status.userId) return;

  const syncStateId = uuidFromString(`sync-state:${status.userId}`);
  await runOffline(
    `INSERT INTO sync_state (sync_state_id, user_id, last_sync_at, sync_cursor, created_at, updated_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id) DO UPDATE SET
       last_sync_at = excluded.last_sync_at,
       sync_cursor = excluded.sync_cursor,
       updated_at = CURRENT_TIMESTAMP`,
    [syncStateId, status.userId, status.lastSyncedAt, status.syncCursor],
  );
}

