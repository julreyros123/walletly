import { useCallback, useMemo } from 'react';
import { usePreferencesStore, SupportedCurrency } from '@/store/preferencesStore';

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  PHP: '₱',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

/**
 * Reactive React hook that subscribes directly to currency changes in usePreferencesStore.
 * Whenever the user changes currency, any component using this hook updates instantaneously.
 */
export function useCurrency() {
  const currency = usePreferencesStore((state) => state.currency);
  const symbol = CURRENCY_SYMBOLS[currency] || '₱';

  const format = useCallback(
    (amount: number, decimals: number = 0) => {
      const formattedNumber = amount.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      return `${symbol}${formattedNumber}`;
    },
    [symbol]
  );

  return useMemo(
    () => ({
      currency,
      symbol,
      format,
    }),
    [currency, symbol, format]
  );
}

/**
 * Returns the currency symbol corresponding to the preferred currency.
 */
export function getCurrencySymbol(customCurrency?: SupportedCurrency): string {
  const current = customCurrency || usePreferencesStore.getState().currency || 'PHP';
  return CURRENCY_SYMBOLS[current] || '₱';
}

/**
 * Formats an amount with the user's preferred currency symbol and comma separators.
 */
export function formatCurrency(
  amount: number,
  options?: {
    decimals?: number;
    currency?: SupportedCurrency;
  }
): string {
  const symbol = getCurrencySymbol(options?.currency);
  const decimals = options?.decimals ?? 0;
  const formattedNumber = amount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${symbol}${formattedNumber}`;
}
