/**
 * Finnhub Stock API Service
 * Handles live quotes, ticker mapping, in-memory caching, and graceful offline fallback.
 */

import { storage } from '@/utils/storage';
import {
  loadMarketPriceHistory,
  saveMarketPriceHistory,
  type MarketHistoryPoint,
} from '@/db/localRepository';

export interface FinnhubQuote {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
}

// Fictional Alias -> Real Wall Street Ticker mapping
export const ASSET_TICKER_MAP: Record<string, string> = {
  NOVA: 'NVDA', // NovaChip AI -> Nvidia Corp
  VOLT: 'TSLA', // Volt Motors -> Tesla Inc
  BREW: 'SBUX', // StarBrew Café -> Starbucks Corp
  APEX: 'AMZN', // Apex Logi-Retail -> Amazon.com Inc
  SOLR: 'ENPH', // Solaris Power -> Enphase Energy Inc
  PEAR: 'AAPL', // Pear Electronics -> Apple Inc
  NEXS: 'GOOGL', // Nexus Web -> Alphabet Inc (Google)
  LITE: 'SPY',  // LiteSave Index Fund -> S&P 500 ETF
};

const HISTORY_STORAGE_PREFIX = 'cbudget_finnhub_history_v1_';

/**
 * Bundled fallback daily percentage changes (in %) used when the device has not yet
 * downloaded multi-day Finnhub history (Section 2.3.2.4 & Table 8).
 */
export const BUNDLED_FINNHUB_CHANGES: Record<string, number[]> = {
  LITE: [2.0, -1.5, 3.0, -4.5, -1.0, 1.6, 0.8, -0.6, 1.9, 1.1],
  SOLR: [0.8, 0.5, -0.4, 1.1, -0.3, 0.9, 0.4, -0.5, 0.7, 0.6],
  BREW: [1.2, -0.8, 1.5, -1.1, 0.9, -0.4, 1.3, 0.6, -0.7, 1.0],
  NEXS: [1.8, -1.2, 2.1, -1.6, 1.4, 0.9, -1.1, 1.7, -0.5, 1.3],
  APEX: [0.9, -0.6, 1.3, -0.9, 0.7, 1.0, -0.4, 0.8, 0.5, 0.6],
  PEAR: [1.4, -0.9, 1.7, -1.3, 1.1, 0.6, -0.8, 1.5, 0.4, 0.9],
  VOLT: [3.2, -2.8, 4.1, -3.6, 2.4, -1.9, 3.5, -2.1, 2.8, -1.4],
  NOVA: [3.8, -2.4, 4.6, -3.9, 2.9, 1.8, -2.7, 3.4, -1.5, 2.6],
};

// 15-minute in-memory cache to prevent burning API limits
const CACHE_TTL_MS = 15 * 60 * 1000;
const quoteCache: Record<string, { data: FinnhubQuote; timestamp: number }> = {};

/**
 * Retrieves the configured Finnhub API Key from environment variables.
 */
export function getFinnhubApiKey(): string | null {
  const key = process.env.EXPO_PUBLIC_FINNHUB_API_KEY;
  if (!key || key.trim() === '' || key.trim() === 'your_api_key_here') {
    return null;
  }
  return key.trim();
}

/**
 * Fetches a live quote for a real Wall Street symbol.
 * Returns cached data if available and fresh (< 15 min old).
 * Returns null if no API key is set, device is offline, or rate-limited.
 */
export async function fetchLiveQuote(realSymbol: string): Promise<FinnhubQuote | null> {
  const apiKey = getFinnhubApiKey();
  if (!apiKey) {
    return null;
  }

  // Check cache first
  const cached = quoteCache[realSymbol];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const proxyUrl = process.env.EXPO_PUBLIC_MARKET_PROXY_URL;
    const url = proxyUrl
      ? `${proxyUrl}?symbol=${encodeURIComponent(realSymbol)}`
      : `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(realSymbol)}&token=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // 429 = Rate limited or invalid key; gracefully fail to fallback
      return null;
    }

    const data: FinnhubQuote = await response.json();

    // Validate that response contains valid numeric price
    if (typeof data.c === 'number' && data.c > 0) {
      quoteCache[realSymbol] = {
        data,
        timestamp: Date.now(),
      };
      return data;
    }

    return null;
  } catch {
    // Offline or network timeout - fallback to offline simulation
    return null;
  }
}

/**
 * Fetches live quotes for all mapped CBudget assets.
 * Returns a dictionary keyed by the fictional alias (e.g. { NOVA: quote, VOLT: quote }).
 */
export async function fetchAllAssetQuotes(): Promise<Record<string, FinnhubQuote>> {
  const results: Record<string, FinnhubQuote> = {};
  const aliases = Object.keys(ASSET_TICKER_MAP);

  const fetchPromises = aliases.map(async (alias) => {
    const realSymbol = ASSET_TICKER_MAP[alias];
    const quote = await fetchLiveQuote(realSymbol);
    if (quote) {
      results[alias] = quote;
    }
  });

  await Promise.all(fetchPromises);
  return results;
}

/**
 * Clears the in-memory 15-minute quote cache.
 */
export function clearQuoteCache(): void {
  for (const key of Object.keys(quoteCache)) {
    delete quoteCache[key];
  }
}

/**
 * Returns the number of cached quotes currently held in memory.
 */
export function getQuoteCacheCount(): number {
  return Object.keys(quoteCache).length;
}

export type PriceHistorySource = 'finnhub_live' | 'sqlite_cached' | 'bundled_sample';

export interface AssetReplayHistory {
  ticker: string;
  changes: number[];
  source: PriceHistorySource;
}

/**
 * Fetches multi-day daily candles from Finnhub when online, computes chronological
 * daily percentage changes r_t, and stores them to SQLite market_price_history
 * for offline Equation 4 simulation replay. Falls back to SQLite cache or bundled sample data.
 */
export async function getAssetReplayHistory(
  alias: string,
  preferNetwork = false
): Promise<AssetReplayHistory> {
  const realSymbol = ASSET_TICKER_MAP[alias] || alias;
  const apiKey = getFinnhubApiKey();

  if (preferNetwork && apiKey) {
    try {
      const nowSec = Math.floor(Date.now() / 1000);
      const fromSec = nowSec - 25 * 24 * 60 * 60;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const url = `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(
        realSymbol
      )}&resolution=D&from=${fromSec}&to=${nowSec}&token=${encodeURIComponent(apiKey)}`;

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const candle = (await response.json()) as {
          s?: string;
          c?: number[];
          t?: number[];
        };
        if (candle?.s === 'ok' && Array.isArray(candle.c) && candle.c.length >= 2) {
          const points: MarketHistoryPoint[] = [];
          const changes: number[] = [];
          for (let i = 1; i < candle.c.length; i++) {
            const prev = candle.c[i - 1];
            const curr = candle.c[i];
            if (prev > 0 && curr > 0) {
              const pct = Math.round((((curr - prev) / prev) * 100 + Number.EPSILON) * 100) / 100;
              const ts = Array.isArray(candle.t) && candle.t[i] ? candle.t[i] * 1000 : Date.now();
              const isoDate = new Date(ts).toISOString().slice(0, 10);
              changes.push(pct);
              points.push({
                dayIndex: points.length + 1,
                tradeDate: isoDate,
                closePrice: curr,
                pctChange: pct,
              });
            }
          }

          if (changes.length > 0) {
            await saveMarketPriceHistory(alias, points);
            await storage
              .setItem(`${HISTORY_STORAGE_PREFIX}${alias}`, JSON.stringify(changes))
              .catch((err) => console.warn('[FinnhubApi] History storage cache warning:', err));
            return { ticker: alias, changes, source: 'finnhub_live' };
          }
        }
      }
    } catch (err) {
      console.warn(`[FinnhubApi] Multi-day history fallback for ${alias}:`, err);
    }
  }

  // Try local SQLite market_price_history first
  const sqlPoints = await loadMarketPriceHistory(alias);
  if (sqlPoints.length > 0) {
    return {
      ticker: alias,
      changes: sqlPoints.map((p) => p.pctChange),
      source: 'sqlite_cached',
    };
  }

  // Try key-value storage mirror (e.g. web / fallback)
  try {
    const raw = await storage.getItem(`${HISTORY_STORAGE_PREFIX}${alias}`);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const clean = parsed.map(Number).filter((n) => Number.isFinite(n));
        if (clean.length > 0) {
          return { ticker: alias, changes: clean, source: 'sqlite_cached' };
        }
      }
    }
  } catch (err) {
    console.warn('[FinnhubApi] Failed reading cached history mirror:', err);
  }

  // Fallback to bundled sample Finnhub movements (Section 2.3.2.4)
  return {
    ticker: alias,
    changes: BUNDLED_FINNHUB_CHANGES[alias] || BUNDLED_FINNHUB_CHANGES.LITE,
    source: 'bundled_sample',
  };
}

