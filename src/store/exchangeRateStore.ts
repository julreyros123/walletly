import { create } from 'zustand';
import { fetchLiveExchangeRates, ExchangeRatesData, DEFAULT_EXCHANGE_DATA } from '@/services/currencyService';

interface ExchangeRateState {
  data: ExchangeRatesData;
  isLoading: boolean;
  lastFetchedAt: number | null;
  fetchRates: (force?: boolean) => Promise<void>;
  convert: (amount: number, from: string, to: string) => number;
}

export const useExchangeRateStore = create<ExchangeRateState>((set, get) => ({
  data: { ...DEFAULT_EXCHANGE_DATA },
  isLoading: false,
  lastFetchedAt: null,

  fetchRates: async (force: boolean = false) => {
    // Avoid double-fetching if already loading
    if (get().isLoading) return;
    set({ isLoading: true });

    try {
      const freshData = await fetchLiveExchangeRates(force);
      set({
        data: freshData,
        isLoading: false,
        lastFetchedAt: Date.now(),
      });
    } catch (err) {
      console.warn('[ExchangeRateStore] Error fetching exchange rates:', err);
      set({ isLoading: false });
    }
  },

  convert: (amount: number, from: string, to: string): number => {
    if (from === to || !amount || isNaN(amount)) return amount;
    const rates = get().data.rates;
    const fromRate = rates[from] || 1;
    const toRate = rates[to] || 1;

    // Convert from source to USD base, then from USD to target
    const inUSD = amount / fromRate;
    return Number((inUSD * toRate).toFixed(2));
  },
}));
