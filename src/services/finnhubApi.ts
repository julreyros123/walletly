/**
 * Finnhub Stock API Service
 * Handles live quotes, ticker mapping, in-memory caching, and graceful offline fallback.
 */

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

