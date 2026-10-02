import { create } from 'zustand';
import { storage } from '@/utils/storage';
import { ASSET_DATA, AssetDetails } from '@/constants/assets';
import { fetchAllAssetQuotes, getFinnhubApiKey } from '@/services/finnhubApi';

const STORAGE_KEY = '@walletly_market_store_v1';
const AUTO_REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes between Finnhub anchor pulls

export type TickDirection = 'up' | 'down' | null;

interface MarketState {
  assets: Record<string, AssetDetails>;
  assetsList: AssetDetails[];
  isLive: boolean;
  isSyncing: boolean;
  lastSyncTimestamp: number;
  tickDirections: Record<string, TickDirection>;

  // Actions
  initMarket: () => Promise<void>;
  refreshAnchor: (force?: boolean) => Promise<void>;
  driftTick: () => void;
  startLiveDrift: () => () => void;
}

let driftTimerId: ReturnType<typeof setInterval> | null = null;
let activeListenersCount = 0;

export const useMarketStore = create<MarketState>((set, get) => ({
  assets: { ...ASSET_DATA },
  assetsList: Object.values(ASSET_DATA),
  isLive: false,
  isSyncing: false,
  lastSyncTimestamp: 0,
  tickDirections: {},

  initMarket: async () => {
    try {
      const stored = await storage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.assets && typeof parsed.lastSyncTimestamp === 'number') {
          // Calculate elapsed time for offline drift
          const elapsedMs = Date.now() - parsed.lastSyncTimestamp;
          const updatedAssets = { ...parsed.assets };

          // If time passed while offline (e.g. > 10 min), apply subtle natural drift
          if (elapsedMs > 10 * 60 * 1000) {
            const steps = Math.min(12, Math.floor(elapsedMs / (30 * 60 * 1000)));
            Object.keys(updatedAssets).forEach((ticker) => {
              let price = updatedAssets[ticker].price;
              for (let i = 0; i < steps; i++) {
                const shock = (Math.random() * 2 - 1) * 0.004;
                price = Math.max(1, Number((price * (1 + shock)).toFixed(2)));
              }
              updatedAssets[ticker] = {
                ...updatedAssets[ticker],
                price,
              };
            });
          }

          set({
            assets: updatedAssets,
            assetsList: Object.values(updatedAssets),
            lastSyncTimestamp: parsed.lastSyncTimestamp,
          });
        }
      }
    } catch {
      // Fallback to default ASSET_DATA on storage read failure
    }

    // After loading cached state, pull fresh anchor if online
    await get().refreshAnchor();
  },

  refreshAnchor: async (force = false) => {
    const state = get();
    const now = Date.now();

    // Avoid calling API if recently updated (< 15 mins) unless forced
    if (!force && now - state.lastSyncTimestamp < AUTO_REFRESH_INTERVAL_MS && state.isLive) {
      return;
    }

    const apiKey = getFinnhubApiKey();
    if (!apiKey) {
      set({ isLive: false, isSyncing: false });
      return;
    }

    set({ isSyncing: true });

    try {
      const liveQuotes = await fetchAllAssetQuotes();
      const currentAssets = { ...get().assets };
      let hadLiveQuote = false;

      Object.keys(currentAssets).forEach((alias) => {
        const quote = liveQuotes[alias];
        if (quote && typeof quote.c === 'number' && quote.c > 0) {
          hadLiveQuote = true;
          const current = currentAssets[alias];

          // Use real percent change from Wall Street (quote.dp)
          // to scale the asset's educational base price realistically
          const realChangePercent = quote.dp;
          const basePrice = current.price;
          const nextPrice = Number((basePrice * (1 + realChangePercent / 100)).toFixed(2));
          const changeValue = Number((nextPrice - basePrice).toFixed(2));

          currentAssets[alias] = {
            ...current,
            price: nextPrice,
            change: realChangePercent,
            high52: Math.max(current.high52, quote.h || current.high52),
            low52: Math.min(current.low52, quote.l || current.low52),
            sparkline: [
              ...current.sparkline.slice(1),
              nextPrice,
            ],
            history1D: [
              ...current.history1D.slice(1),
              nextPrice,
            ],
          };
        }
      });

      const updatedState = {
        assets: currentAssets,
        assetsList: Object.values(currentAssets),
        isLive: hadLiveQuote,
        isSyncing: false,
        lastSyncTimestamp: now,
      };

      set(updatedState);

      // Persist to storage utility for offline use
      await storage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          assets: currentAssets,
          lastSyncTimestamp: now,
        })
      );
    } catch (err) {
      console.warn('[MarketStore] Error refreshing anchor prices:', err);
      set({ isSyncing: false });
    }
  },

  driftTick: () => {
    const currentAssets = { ...get().assets };
    const newDirections: Record<string, TickDirection> = {};

    Object.keys(currentAssets).forEach((ticker) => {
      const asset = currentAssets[ticker];
      // Micro-tick: neutral random walk (symmetric ±0.18%, no directional bias)
      const shock = (Math.random() * 2 - 1.0) * 0.0018;
      const nextPrice = Math.max(1, Number((asset.price * (1 + shock)).toFixed(2)));

      if (nextPrice > asset.price) {
        newDirections[ticker] = 'up';
      } else if (nextPrice < asset.price) {
        newDirections[ticker] = 'down';
      } else {
        newDirections[ticker] = null;
      }

      const sparkline = [...asset.sparkline];
      sparkline[sparkline.length - 1] = nextPrice;

      const history1D = [...asset.history1D];
      history1D[history1D.length - 1] = nextPrice;

      currentAssets[ticker] = {
        ...asset,
        price: nextPrice,
        sparkline,
        history1D,
      };
    });

    set({
      assets: currentAssets,
      assetsList: Object.values(currentAssets),
      tickDirections: newDirections,
    });

    // Clear flashing direction after 1.2 seconds
    setTimeout(() => {
      set({ tickDirections: {} });
    }, 1200);
  },

  startLiveDrift: () => {
    activeListenersCount++;

    if (activeListenersCount === 1 && !driftTimerId) {
      // Drift every 4.5 seconds while user is actively viewing the screen
      driftTimerId = setInterval(() => {
        get().driftTick();
      }, 4500);
    }

    return () => {
      activeListenersCount = Math.max(0, activeListenersCount - 1);
      if (activeListenersCount === 0 && driftTimerId) {
        clearInterval(driftTimerId);
        driftTimerId = null;
      }
    };
  },
}));
