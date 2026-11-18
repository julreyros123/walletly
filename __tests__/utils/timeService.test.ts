import {
  initTimeService,
  syncServerTime,
  updateHighWaterMark,
  getTrustedTime,
} from '../../src/utils/timeService';
import { storage } from '../../src/utils/storage';
import * as localRepo from '../../src/db/localRepository';

describe('timeService utils', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('getTrustedTime', () => {
    test('getTrustedTime normal clock returns isValid true and isTampered false', () => {
      const result = getTrustedTime();
      expect(result.isValid).toBe(true);
      expect(result.isTampered).toBe(false);
      expect(result.tamperReason).toBeNull();
      expect(typeof result.todayISO).toBe('string');
      expect(result.todayISO).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof result.trustedTimestamp).toBe('number');
    });

    test('getTrustedTime rolled back clock behind high water mark detects clock_set_backwards', async () => {
      const highTimestamp = Date.now() + 500000;
      await updateHighWaterMark(highTimestamp);

      // Now date is behind highTimestamp - 60000
      const result = getTrustedTime();
      expect(result.isValid).toBe(false);
      expect(result.isTampered).toBe(true);
      expect(result.tamperReason).toBe('clock_set_backwards');
    });
  });

  describe('updateHighWaterMark', () => {
    test('updateHighWaterMark timestamp greater than current water mark saves new value', async () => {
      const setItemSpy = jest.spyOn(storage, 'setItem');
      const futureTimestamp = Date.now() + 1000000;
      await updateHighWaterMark(futureTimestamp);
      expect(setItemSpy).toHaveBeenCalledWith('cbudget_time_high_water_mark', String(futureTimestamp));
    });

    test('updateHighWaterMark timestamp less than current water mark does not save', async () => {
      const setItemSpy = jest.spyOn(storage, 'setItem');
      setItemSpy.mockClear();
      const pastTimestamp = 1000;
      await updateHighWaterMark(pastTimestamp);
      expect(setItemSpy).not.toHaveBeenCalled();
    });
  });

  describe('syncServerTime', () => {
    test('syncServerTime successful server date header returns epoch timestamp', async () => {
      const serverDateStr = 'Wed, 21 Oct 2026 07:28:00 GMT';
      const expectedEpoch = new Date(serverDateStr).getTime();

      global.fetch = jest.fn().mockResolvedValue({
        headers: {
          get: (header: string) => (header.toLowerCase() === 'date' ? serverDateStr : null),
        },
      } as any);

      const result = await syncServerTime();
      expect(result).toBe(expectedEpoch);
    });

    test('syncServerTime network error or offline returns null without crashing', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await syncServerTime();
      expect(result).toBeNull();
    });

    test('syncServerTime response with missing date header returns null', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        headers: {
          get: () => null,
        },
      } as any);

      const result = await syncServerTime();
      expect(result).toBeNull();
    });
  });

  describe('initTimeService', () => {
    test('initTimeService restores high water mark and offset from storage', async () => {
      jest.spyOn(localRepo, 'loadLocalAppState').mockResolvedValue(null);
      jest.spyOn(storage, 'getItem').mockImplementation(async (key: string) => {
        if (key === 'cbudget_time_high_water_mark') return '1700000000000';
        if (key === 'cbudget_server_time_offset') return '500';
        return null;
      });

      await initTimeService();
      // Second call returns immediately because isInitialized is true
      await initTimeService();
    });
  });
});
