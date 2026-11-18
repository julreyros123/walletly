import {
  CURRENCY_SYMBOLS,
  getCurrencySymbol,
  formatCurrency,
  formatNumberMask,
  parseMaskedNumber,
  convertCurrency,
} from '../../src/utils/currency';
import { usePreferencesStore, SupportedCurrency } from '../../src/store/preferencesStore';
import { useExchangeRateStore } from '../../src/store/exchangeRateStore';

describe('currency utils', () => {
  beforeEach(() => {
    usePreferencesStore.setState({ currency: 'PHP' });
  });

  describe('getCurrencySymbol', () => {
    test('getCurrencySymbol PHP customCurrency returns ₱', () => {
      expect(getCurrencySymbol('PHP')).toBe('₱');
    });

    test('getCurrencySymbol USD customCurrency returns $', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
    });

    test('getCurrencySymbol EUR customCurrency returns €', () => {
      expect(getCurrencySymbol('EUR')).toBe('€');
    });

    test('getCurrencySymbol GBP customCurrency returns £', () => {
      expect(getCurrencySymbol('GBP')).toBe('£');
    });

    test('getCurrencySymbol undefined customCurrency uses store currency PHP', () => {
      usePreferencesStore.setState({ currency: 'PHP' });
      expect(getCurrencySymbol()).toBe('₱');
    });

    test('getCurrencySymbol undefined customCurrency uses store currency USD', () => {
      usePreferencesStore.setState({ currency: 'USD' });
      expect(getCurrencySymbol()).toBe('$');
    });

    test('getCurrencySymbol unsupported currency string falls back to default ₱', () => {
      expect(getCurrencySymbol('XYZ' as SupportedCurrency)).toBe('₱');
    });
  });

  describe('formatCurrency', () => {
    test('formatCurrency positive integer with default options formats correctly', () => {
      usePreferencesStore.setState({ currency: 'PHP' });
      expect(formatCurrency(1500)).toBe('₱1,500');
    });

    test('formatCurrency boundary 0 amount formats to 0 with symbol', () => {
      expect(formatCurrency(0, { currency: 'USD' })).toBe('$0');
    });

    test('formatCurrency boundary 1 amount formats to 1 with symbol', () => {
      expect(formatCurrency(1, { currency: 'EUR' })).toBe('€1');
    });

    test('formatCurrency negative amount formats with minus sign', () => {
      expect(formatCurrency(-500, { currency: 'USD' })).toBe('$-500');
    });

    test('formatCurrency specified decimals 2 formats with 2 decimal places', () => {
      expect(formatCurrency(1234.567, { currency: 'USD', decimals: 2 })).toBe('$1,234.57');
    });

    test('formatCurrency specified decimals 0 truncates or rounds fraction', () => {
      expect(formatCurrency(1234.56, { currency: 'USD', decimals: 0 })).toBe('$1,235');
    });

    test('formatCurrency large boundary amount formats with multiple commas', () => {
      expect(formatCurrency(1000000, { currency: 'PHP' })).toBe('₱1,000,000');
    });
  });

  describe('formatNumberMask', () => {
    test('formatNumberMask empty string returns empty string', () => {
      expect(formatNumberMask('')).toBe('');
    });

    test('formatNumberMask non-numeric string returns empty string', () => {
      expect(formatNumberMask('abcdef')).toBe('');
    });

    test('formatNumberMask integer string formats with commas', () => {
      expect(formatNumberMask('25000')).toBe('25,000');
    });

    test('formatNumberMask single digit boundary 0 returns 0', () => {
      expect(formatNumberMask('0')).toBe('0');
    });

    test('formatNumberMask single digit boundary 1 returns 1', () => {
      expect(formatNumberMask('1')).toBe('1');
    });

    test('formatNumberMask leading zeros strips extra zeros', () => {
      expect(formatNumberMask('007')).toBe('7');
    });

    test('formatNumberMask trailing decimal dot preserves the dot', () => {
      expect(formatNumberMask('25000.')).toBe('25,000.');
    });

    test('formatNumberMask decimal with fraction digits formats both parts', () => {
      expect(formatNumberMask('25000.5')).toBe('25,000.5');
    });

    test('formatNumberMask multiple decimals joins subsequent decimals into fractional part', () => {
      expect(formatNumberMask('10.20.30')).toBe('10.2030');
    });

    test('formatNumberMask value with non-digit chars cleans and formats digits', () => {
      expect(formatNumberMask('$1,500.50')).toBe('1,500.50');
    });

    test('formatNumberMask decimal only starting with dot formats leading zero', () => {
      expect(formatNumberMask('.75')).toBe('0.75');
    });
  });

  describe('parseMaskedNumber', () => {
    test('parseMaskedNumber empty string returns 0', () => {
      expect(parseMaskedNumber('')).toBe(0);
    });

    test('parseMaskedNumber comma-separated integer parses to number', () => {
      expect(parseMaskedNumber('25,000')).toBe(25000);
    });

    test('parseMaskedNumber comma-separated float parses to float', () => {
      expect(parseMaskedNumber('25,000.50')).toBe(25000.5);
    });

    test('parseMaskedNumber boundary 0 string returns 0', () => {
      expect(parseMaskedNumber('0')).toBe(0);
    });

    test('parseMaskedNumber negative formatted string parses to negative number', () => {
      expect(parseMaskedNumber('-1,250.75')).toBe(-1250.75);
    });

    test('parseMaskedNumber invalid non-numeric string returns 0', () => {
      expect(parseMaskedNumber('invalid_text')).toBe(0);
    });
  });

  describe('convertCurrency', () => {
    test('convertCurrency delegates to useExchangeRateStore convert', () => {
      useExchangeRateStore.setState({
        data: {
          base: 'USD',
          rates: { USD: 1, PHP: 60, EUR: 0.9, GBP: 0.8 },
          usdPhpRate: 60,
          usdPhpChangePercent: 0,
          isUp: true,
          timestamp: Date.now(),
          lastUpdatedStr: '12:00 PM',
        },
      });

      const converted = convertCurrency(100, 'USD', 'PHP');
      expect(converted).toBe(6000);
    });
  });
});
