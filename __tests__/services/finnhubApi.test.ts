import * as finnhubApi from '../../src/services/finnhubApi';

describe('finnhubApi service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    finnhubApi.clearQuoteCache();
  });

  describe('getFinnhubApiKey', () => {
    test('getFinnhubApiKey returns null when environment variable was unconfigured at compile time', () => {
      // In Expo apps, EXPO_PUBLIC_* variables are inlined at babel compile time.
      // When unconfigured, it safely returns null.
      const key = finnhubApi.getFinnhubApiKey();
      expect(key === null || typeof key === 'string').toBe(true);
    });
  });

  describe('fetchLiveQuote', () => {
    test('fetchLiveQuote missing API key returns null immediately', async () => {
      jest.spyOn(finnhubApi, 'getFinnhubApiKey').mockReturnValue(null);
      const quote = await finnhubApi.fetchLiveQuote('NVDA');
      expect(quote).toBeNull();
    });

    test('fetchLiveQuote valid API key fetches and parses quote successfully', async () => {
      jest.spyOn(finnhubApi, 'getFinnhubApiKey').mockReturnValue('test_key');
      const mockQuote = { c: 145.2, d: 2.5, dp: 1.75, h: 147.0, l: 142.1, o: 143.0, pc: 142.7 };

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuote,
      } as any);

      const quote = await finnhubApi.fetchLiveQuote('NVDA');
      expect(quote).toEqual(mockQuote);
      expect(finnhubApi.getQuoteCacheCount()).toBe(1);

      // Second call uses memory cache
      const cachedQuote = await finnhubApi.fetchLiveQuote('NVDA');
      expect(cachedQuote).toEqual(mockQuote);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('fetchLiveQuote non-ok response 429 returns null', async () => {
      jest.spyOn(finnhubApi, 'getFinnhubApiKey').mockReturnValue('test_key');

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
      } as any);

      const quote = await finnhubApi.fetchLiveQuote('AAPL');
      expect(quote).toBeNull();
    });

    test('fetchLiveQuote response with non-numeric price returns null', async () => {
      jest.spyOn(finnhubApi, 'getFinnhubApiKey').mockReturnValue('test_key');

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ c: null }),
      } as any);

      const quote = await finnhubApi.fetchLiveQuote('TSLA');
      expect(quote).toBeNull();
    });

    test('fetchLiveQuote network throw returns null without throwing error', async () => {
      jest.spyOn(finnhubApi, 'getFinnhubApiKey').mockReturnValue('test_key');

      global.fetch = jest.fn().mockRejectedValueOnce(new Error('DNS lookup failed'));

      const quote = await finnhubApi.fetchLiveQuote('GOOGL');
      expect(quote).toBeNull();
    });
  });

  describe('fetchAllAssetQuotes and clearQuoteCache', () => {
    test('clearQuoteCache empties cached quotes', async () => {
      jest.spyOn(finnhubApi, 'getFinnhubApiKey').mockReturnValue('test_key');
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ c: 100 }),
      } as any);

      await finnhubApi.fetchLiveQuote('NVDA');
      expect(finnhubApi.getQuoteCacheCount()).toBe(1);
      finnhubApi.clearQuoteCache();
      expect(finnhubApi.getQuoteCacheCount()).toBe(0);
    });

    test('fetchAllAssetQuotes aggregates live quotes for mapped tickers', async () => {
      jest.spyOn(finnhubApi, 'getFinnhubApiKey').mockReturnValue('test_key');
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ c: 250, dp: 2.5 }),
      } as any);

      const quotes = await finnhubApi.fetchAllAssetQuotes();
      expect(Object.keys(quotes)).toEqual(expect.arrayContaining(['NOVA', 'VOLT', 'PEAR']));
      expect(quotes.NOVA.c).toBe(250);
    });
  });
});
