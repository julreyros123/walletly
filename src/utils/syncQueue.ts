import { supabase, isSupabaseConfigured } from '@/utils/supabase';
import { storage } from '@/utils/storage';

export interface SyncQueueItem {
  id: string;
  table: string;
  action: 'insert' | 'upsert' | 'update' | 'delete';
  payload?: any;
  match?: Record<string, any>;
  createdAt: number;
  retryCount: number;
}

const SYNC_QUEUE_KEY = 'cbudget_offline_sync_queue';
const MAX_RETRIES = 5;

let isProcessing = false;
let memoryQueue: SyncQueueItem[] = [];
let queueLoaded = false;
const listeners = new Set<(count: number) => void>();

function notifyListeners() {
  const count = memoryQueue.length;
  listeners.forEach((listener) => {
    try {
      listener(count);
    } catch (e) {
      console.warn('[SyncQueue] Listener error:', e);
    }
  });
}

async function loadQueue(): Promise<SyncQueueItem[]> {
  if (queueLoaded) return memoryQueue;
  try {
    const stored = await storage.getItem(SYNC_QUEUE_KEY);
    if (stored) {
      memoryQueue = JSON.parse(stored);
    }
  } catch (err) {
    console.warn('[SyncQueue] Failed to load offline queue from storage:', err);
    memoryQueue = [];
  }
  queueLoaded = true;
  return memoryQueue;
}

async function persistQueue(): Promise<void> {
  try {
    await storage.setItem(SYNC_QUEUE_KEY, JSON.stringify(memoryQueue));
    notifyListeners();
  } catch (err) {
    console.warn('[SyncQueue] Failed to persist offline queue:', err);
  }
}

export const syncQueue = {
  subscribe: (callback: (pendingCount: number) => void) => {
    listeners.add(callback);
    callback(memoryQueue.length);
    return () => {
      listeners.delete(callback);
    };
  },

  getPendingCount: (): number => memoryQueue.length,

  clear: async (): Promise<void> => {
    memoryQueue = [];
    await persistQueue();
  },

  enqueue: async (
    item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'>
  ): Promise<void> => {
    await loadQueue();

    const queueItem: SyncQueueItem = {
      ...item,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: Date.now(),
      retryCount: 0,
    };

    memoryQueue.push(queueItem);
    await persistQueue();

    // Process immediately in background
    syncQueue.process().catch((err) => {
      console.warn('[SyncQueue] Auto-process error:', err);
    });
  },

  process: async (): Promise<void> => {
    if (isProcessing) return;
    if (!isSupabaseConfigured) return;

    // Claim the lock before any await so concurrent callers can't run in parallel
    isProcessing = true;

    try {
      await loadQueue();
      if (memoryQueue.length === 0) return;

      const {
        data: { session },
      } = await supabase.auth.getSession().catch((err) => {
        console.warn('[SyncQueue] Failed to read session:', err);
        return { data: { session: null } };
      });

      // Do not sync guest sessions to Supabase
      if (!session?.user?.id || session.user.id === 'guest') {
        return;
      }

      // Work on a snapshot; items enqueued during processing stay in memoryQueue untouched
      const snapshot = [...memoryQueue];
      const completedIds = new Set<string>();
      const retriedItems = new Map<string, SyncQueueItem>();

      for (const item of snapshot) {
        try {
          let error = null;

          if (item.action === 'insert') {
            const res = await supabase.from(item.table).insert(item.payload);
            error = res.error;
          } else if (item.action === 'upsert') {
            const res = await supabase.from(item.table).upsert(item.payload);
            error = res.error;
          } else if (item.action === 'update' && item.match) {
            let query = supabase.from(item.table).update(item.payload);
            Object.entries(item.match).forEach(([k, v]) => {
              query = query.eq(k, v);
            });
            const res = await query;
            error = res.error;
          } else if (item.action === 'delete' && item.match) {
            let query = supabase.from(item.table).delete();
            Object.entries(item.match).forEach(([k, v]) => {
              query = query.eq(k, v);
            });
            const res = await query;
            error = res.error;
          }

          if (error) {
            console.warn(`[SyncQueue] Operation failed for ${item.table}.${item.action}:`, error.message);
            const isSchemaMismatch =
              error.code === '42703' ||
              error.code === 'PGRST204' ||
              error.code === 'PGRST205' ||
              error.message?.includes('does not exist') ||
              error.message?.includes('schema cache');

            if (!isSchemaMismatch && item.retryCount < MAX_RETRIES) {
              retriedItems.set(item.id, {
                ...item,
                retryCount: item.retryCount + 1,
              });
            } else {
              if (isSchemaMismatch) {
                console.warn(`[SyncQueue] Dropping un-retryable schema mismatch item for ${item.table}.${item.action}`);
              } else {
                console.error(`[SyncQueue] Item exceeded max retries (${MAX_RETRIES}), dropping:`, item);
              }
              completedIds.add(item.id);
            }
          } else {
            completedIds.add(item.id);
          }
        } catch (execErr) {
          console.warn('[SyncQueue] Network/execution error during sync, preserving in queue:', execErr);
          retriedItems.set(item.id, {
            ...item,
            retryCount: item.retryCount + 1,
          });
          // Stop queue iteration on network drop so we don't spam failed requests.
          // Unprocessed items remain in memoryQueue because we only remove completed ids.
          break;
        }
      }

      // Reconcile against the live queue so items enqueued mid-sync are never lost
      memoryQueue = memoryQueue
        .filter((q) => !completedIds.has(q.id))
        .map((q) => retriedItems.get(q.id) ?? q);
      await persistQueue();
    } finally {
      isProcessing = false;
    }
  },
};
