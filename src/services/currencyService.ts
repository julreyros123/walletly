import { storage } from '@/utils/storage';

const CACHE_KEY = 'cbudget_exchange_rates_v1';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache

export interface ExchangeRatesData {
  base: string;
  rates: Record<string, number>;
  usdPhpRate: number;
  usdPhpChangePercent: number;
  isUp: boolean;
  timestamp: number;
  lastUpdatedStr: string;
}

// Fallback baseline in case device is completely offline on very first launch
export const DEFAULT_EXCHANGE_DATA: ExchangeRatesData = {
  base: 'USD',
  rates: {
    USD: 1,
    PHP: 63.00,
    EUR: 0.92,
    GBP: 0.77,
  },
  usdPhpRate: 63.00,
  usdPhpChangePercent: 0.15,
  isUp: true,
  timestamp: Date.now(),
  lastUpdatedStr: new Date().toLocaleTimeString(),
};

/**
 * Fetches real-time currency exchange rates from high-availability, public exchange rate APIs.
 * Includes local storage caching to minimize bandwidth and guarantee 100% offline functionality.
 */
export async function fetchLiveExchangeRates(force: boolean = false): Promise<ExchangeRatesData> {
  const now = Date.now();

  // 1. Try reading from local cache first
  try {
    const cachedStr = await storage.getItem(CACHE_KEY);
    if (cachedStr) {
      const cached: ExchangeRatesData = JSON.parse(cachedStr);
      if (!force && now - cached.timestamp < CACHE_TTL_MS && cached.usdPhpRate > 0) {
        return cached;
      }
    }
  } catch (err) {
    console.warn('[CurrencyService] Error reading cached exchange rates:', err);
  }

  // 2. Fetch live data from primary and secondary endpoints
  const endpoints = [
    'https://open.er-api.com/v6/latest/USD',
    'https://api.exchangerate-api.com/v4/latest/USD',
  ];

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const data = await response.json();
      const phpRate = Number(data?.rates?.PHP);

      if (phpRate && phpRate > 0) {
        // Calculate daily delta against historical baseline (approx 62.90) or previous cached rate
        let prevRate = 62.90;
        try {
          const cachedStr = await storage.getItem(CACHE_KEY);
          if (cachedStr) {
            const cached: ExchangeRatesData = JSON.parse(cachedStr);
            if (cached.usdPhpRate > 0) prevRate = cached.usdPhpRate;
          }
        } catch {
          // ignore cache read error
        }

        const delta = phpRate - prevRate;
        const changePct = prevRate > 0 ? (delta / prevRate) * 100 : 0;
        const isUp = delta >= 0;

        const result: ExchangeRatesData = {
          base: 'USD',
          rates: {
            USD: 1,
            PHP: Number(phpRate.toFixed(2)),
            EUR: Number((data.rates?.EUR || 0.92).toFixed(4)),
            GBP: Number((data.rates?.GBP || 0.77).toFixed(4)),
            ...(data.rates || {}),
          },
          usdPhpRate: Number(phpRate.toFixed(2)),
          usdPhpChangePercent: Number(changePct.toFixed(2)),
          isUp,
          timestamp: now,
          lastUpdatedStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        // Save fresh rates to offline cache
        await storage.setItem(CACHE_KEY, JSON.stringify(result)).catch((e) => {
          console.warn('[CurrencyService] Failed to cache exchange rates:', e);
        });

        return result;
      }
    } catch (netErr) {
      console.warn(`[CurrencyService] Error fetching from ${url}:`, netErr);
    }
  }

  // 3. If offline, retrieve last cached data or fallback to default
  try {
    const cachedStr = await storage.getItem(CACHE_KEY);
    if (cachedStr) {
      const cached: ExchangeRatesData = JSON.parse(cachedStr);
      if (cached.usdPhpRate > 0) {
        return cached;
      }
    }
  } catch (err) {
    console.warn('[CurrencyService] Failed to read fallback cache:', err);
  }

  return DEFAULT_EXCHANGE_DATA;
}
