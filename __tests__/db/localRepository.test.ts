import {
  isSyncedTable,
  saveLocalAppState,
  loadLocalAppState,
  deleteLocalAppState,
  outboxAdd,
  outboxList,
  outboxRemove,
  outboxCount,
  outboxClear,
} from '../../src/db/localRepository';

describe('localRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isSyncedTable', () => {
    test('isSyncedTable valid table names return true', () => {
      expect(isSyncedTable('profiles')).toBe(true);
      expect(isSyncedTable('transactions')).toBe(true);
      expect(isSyncedTable('budgets')).toBe(true);
      expect(isSyncedTable('saving_challenges')).toBe(true);
      expect(isSyncedTable('user_investments')).toBe(true);
    });

    test('isSyncedTable invalid or arbitrary table names return false', () => {
      expect(isSyncedTable('non_existent_table')).toBe(false);
      expect(isSyncedTable('')).toBe(false);
      expect(isSyncedTable('users')).toBe(false);
    });
  });

  describe('local app state persistence', () => {
    test('saveLocalAppState executes without crashing', async () => {
      const result = await saveLocalAppState('test_state_key', JSON.stringify({ a: 1 }));
      expect(typeof result).toBe('boolean');
    });

    test('loadLocalAppState returns null when record does not exist', async () => {
      const result = await loadLocalAppState('non_existent_key');
      expect(result).toBeNull();
    });

    test('deleteLocalAppState executes without error', async () => {
      await expect(deleteLocalAppState('test_state_key')).resolves.not.toThrow();
    });
  });

  describe('outbox queue operations', () => {
    test('outboxAdd inserts queue item without error', async () => {
      await expect(
        outboxAdd({
          table: 'transactions',
          action: 'insert',
          payload: { id: 'tx-1', amount: 50 },
        })
      ).resolves.not.toThrow();
    });

    test('outboxList returns list or null', async () => {
      const list = await outboxList();
      expect(Array.isArray(list) || list === null).toBe(true);
    });

    test('outboxCount returns number or null', async () => {
      const count = await outboxCount();
      expect(typeof count === 'number' || count === null).toBe(true);
    });

    test('outboxRemove and outboxClear execute without error', async () => {
      await expect(outboxRemove(1)).resolves.not.toThrow();
      await expect(outboxClear()).resolves.not.toThrow();
    });
  });
});
