import { create } from 'zustand';
import { loadSyncStatus, saveSyncStatus, type SyncStatusSnapshot } from '@/utils/syncStatus';

interface SyncState extends SyncStatusSnapshot {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setStatus: (status: SyncStatusSnapshot) => Promise<void>;
}

export const useSyncStore = create<SyncState>((set) => ({
  backend: 'sqlite',
  connection: 'offline',
  lastSyncedAt: null,
  userId: null,
  deviceId: null,
  syncCursor: null,
  hydrated: false,

  hydrate: async () => {
    const status = await loadSyncStatus();
    set({ ...status, hydrated: true });
  },

  setStatus: async (status) => {
    set({ ...status, hydrated: true });
    await saveSyncStatus(status);
  },
}));

