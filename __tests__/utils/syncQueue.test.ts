import { syncQueue } from '../../src/utils/syncQueue';
import { storage } from '../../src/utils/storage';

describe('syncQueue utils', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await syncQueue.clear();
  });

  test('getPendingCount returns 0 for empty queue', () => {
    expect(syncQueue.getPendingCount()).toBe(0);
  });

  test('subscribe registers listener and calls it with current pending count', () => {
    const callback = jest.fn();
    const unsubscribe = syncQueue.subscribe(callback);
    expect(callback).toHaveBeenCalledWith(0);
    unsubscribe();
  });

  test('enqueue adds item to queue and increments pending count', async () => {
    await syncQueue.enqueue({
      table: 'transactions',
      action: 'insert',
      payload: { id: 'tx-1', amount: 50 },
    });

    expect(syncQueue.getPendingCount()).toBe(1);
  });

  test('clear empties the queue and resets pending count to 0', async () => {
    await syncQueue.enqueue({
      table: 'budgets',
      action: 'upsert',
      payload: { id: 'b-1', amount: 200 },
    });
    expect(syncQueue.getPendingCount()).toBeGreaterThan(0);

    await syncQueue.clear();
    expect(syncQueue.getPendingCount()).toBe(0);
  });

  test('process returns early when no authenticated user session exists', async () => {
    await syncQueue.enqueue({
      table: 'transactions',
      action: 'insert',
      payload: { id: 'tx-2', amount: 100 },
    });

    // Calling process when unauthenticated should not crash
    await expect(syncQueue.process()).resolves.not.toThrow();
  });
});
