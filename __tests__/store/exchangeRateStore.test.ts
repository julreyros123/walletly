import { useExchangeRateStore } from '../../src/store/exchangeRateStore';
import * as currencyService from '../../src/services/currencyService';

describe('exchangeRateStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useExchangeRateStore.setState({
      data: {
        base: 'USD',
        rates: { USD: 1, PHP: 60.0, EUR: 0.9, GBP: 0.8 },
        usdPhpRate: 60.0,
        usdPhpChangePercent: 0.1,
        isUp: true,
        timestamp: Date.now(),
        lastUpdatedStr: '12:00 PM',
      },
      isLoading: false,
      lastFetchedAt: null,
    });
  });

  describe('convert', () => {
    test('convert identical currency returns exact same amount', () => {
      const result = useExchangeRateStore.getState().convert(500, 'PHP', 'PHP');
      expect(result).toBe(500);
    });

    test('convert boundary 0 amount returns 0', () => {
      const result = useExchangeRateStore.getState().convert(0, 'USD', 'PHP');
      expect(result).toBe(0);
    });

    test('convert NaN amount returns NaN without crashing', () => {
      const result = useExchangeRateStore.getState().convert(NaN, 'USD', 'PHP');
      expect(isNaN(result)).toBe(true);
    });

    test('convert USD to PHP converts correctly using rates', () => {
      // 100 USD = 100 * 60 = 6000 PHP
      const result = useExchangeRateStore.getState().convert(100, 'USD', 'PHP');
      expect(result).toBe(6000);
    });

    test('convert PHP to USD converts correctly using rates', () => {
      // 3000 PHP / 60 = 50 USD
      const result = useExchangeRateStore.getState().convert(3000, 'PHP', 'USD');
      expect(result).toBe(50);
    });

    test('convert cross currency EUR to PHP converts via USD base', () => {
      // 90 EUR -> 90 / 0.9 = 100 USD -> 100 * 60 = 6000 PHP
      const result = useExchangeRateStore.getState().convert(90, 'EUR', 'PHP');
      expect(result).toBe(6000);
    });

    test('convert unlisted currency falls back to rate of 1', () => {
      const result = useExchangeRateStore.getState().convert(100, 'UNKNOWN', 'USD');
      expect(result).toBe(100);
    });
  });

  describe('fetchRates', () => {
    test('fetchRates fetches fresh data and updates state', async () => {
      const freshRates = {
        base: 'USD',
        rates: { USD: 1, PHP: 62.5, EUR: 0.92, GBP: 0.77 },
        usdPhpRate: 62.5,
        usdPhpChangePercent: 0.5,
        isUp: true,
        timestamp: Date.now(),
        lastUpdatedStr: '1:00 PM',
      };
      jest.spyOn(currencyService, 'fetchLiveExchangeRates').mockResolvedValueOnce(freshRates);

      await useExchangeRateStore.getState().fetchRates(true);

      expect(useExchangeRateStore.getState().data.usdPhpRate).toBe(62.5);
      expect(useExchangeRateStore.getState().isLoading).toBe(false);
      expect(useExchangeRateStore.getState().lastFetchedAt).not.toBeNull();
    });

    test('fetchRates already loading avoids double fetch', async () => {
      useExchangeRateStore.setState({ isLoading: true });
      const fetchSpy = jest.spyOn(currencyService, 'fetchLiveExchangeRates');

      await useExchangeRateStore.getState().fetchRates();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    test('fetchRates error resets isLoading to false', async () => {
      jest.spyOn(currencyService, 'fetchLiveExchangeRates').mockRejectedValueOnce(new Error('Fetch failed'));

      await useExchangeRateStore.getState().fetchRates();
      expect(useExchangeRateStore.getState().isLoading).toBe(false);
    });
  });
});
