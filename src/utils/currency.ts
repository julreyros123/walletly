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

/**
 * Formats a raw or partially typed numeric string with thousands separators (commas).
 * Preserves trailing decimal dots or zeros so user typing is seamless.
 * e.g. "25000" -> "25,000"
 * e.g. "25000." -> "25,000."
 * e.g. "25000.5" -> "25,000.5"
 */
export function formatNumberMask(value: string): string {
  if (!value) return '';
  // Remove any character that is not a digit or period
  const clean = value.replace(/[^0-9.]/g, '');
  if (!clean) return '';

  const parts = clean.split('.');
  let integerPart = parts[0] || '';
  if (integerPart.length > 1 && integerPart.startsWith('0')) {
    integerPart = integerPart.replace(/^0+(?=\d)/, '');
  }

  const hasDecimal = parts.length > 1;
  const decimalPart = parts.slice(1).join('');

  const formattedInteger = integerPart ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0';

  if (hasDecimal) {
    return `${integerPart ? formattedInteger : '0'}.${decimalPart}`;
  }
  return formattedInteger;
}

/**
 * Parses a masked or formatted numeric string back to a pure number (float).
 * e.g. "25,000.50" -> 25000.5
 */
export function parseMaskedNumber(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/,/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
