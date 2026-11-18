import {
  fetchLiveExchangeRates,
  DEFAULT_EXCHANGE_DATA,
  ExchangeRatesData,
} from '../../src/services/currencyService';
import { storage } from '../../src/utils/storage';

describe('currencyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetchLiveExchangeRates returns fresh cached data when within TTL and force is false', async () => {
    const cachedData: ExchangeRatesData = {
      base: 'USD',
      rates: { USD: 1, PHP: 58.5, EUR: 0.91, GBP: 0.78 },
      usdPhpRate: 58.5,
      usdPhpChangePercent: 0.2,
      isUp: true,
      timestamp: Date.now() - 5000, // 5 seconds old (< 30 min)
      lastUpdatedStr: '10:00 AM',
    };

    jest.spyOn(storage, 'getItem').mockResolvedValueOnce(JSON.stringify(cachedData));

    const result = await fetchLiveExchangeRates(false);
    expect(result.usdPhpRate).toBe(58.5);
    expect(result.rates.PHP).toBe(58.5);
  });

  test('fetchLiveExchangeRates fetches live data from primary endpoint when cache is expired or force is true', async () => {
    jest.spyOn(storage, 'getItem').mockResolvedValue(null);
    const setItemSpy = jest.spyOn(storage, 'setItem');

    const mockApiResponse = {
      rates: {
        USD: 1,
        PHP: 62.5,
        EUR: 0.93,
        GBP: 0.79,
      },
    };

    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as any);

    const result = await fetchLiveExchangeRates(true);
    expect(result.usdPhpRate).toBe(62.5);
    expect(result.rates.PHP).toBe(62.5);
    expect(setItemSpy).toHaveBeenCalled();
  });

  test('fetchLiveExchangeRates falls back to second endpoint if primary endpoint fails', async () => {
    jest.spyOn(storage, 'getItem').mockResolvedValue(null);

    // Primary endpoint fails
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error('Network error on primary endpoint'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ rates: { USD: 1, PHP: 61.2, EUR: 0.92, GBP: 0.78 } }),
      } as any);

    const result = await fetchLiveExchangeRates(true);
    expect(result.usdPhpRate).toBe(61.2);
  });

  test('fetchLiveExchangeRates returns DEFAULT_EXCHANGE_DATA if all endpoints and cache fail', async () => {
    jest.spyOn(storage, 'getItem').mockResolvedValue(null);

    global.fetch = jest.fn().mockRejectedValue(new Error('Complete offline'));

    const result = await fetchLiveExchangeRates(true);
    expect(result).toEqual(DEFAULT_EXCHANGE_DATA);
  });
});
