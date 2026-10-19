import { CurrencyCode, CurrencyInfo } from '../types/trading';
import { currencyService, DEFAULT_RATES } from '../services/currencyService';

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: {
    code: 'USD',
    country: 'United States',
    name: 'US Dollar',
    symbol: '$',
    rateAgainstUSD: 1.0,
    flag: '🇺🇸',
  },
  NGN: {
    code: 'NGN',
    country: 'Nigeria',
    name: 'Nigerian Naira',
    symbol: '₦',
    rateAgainstUSD: DEFAULT_RATES.NGN,
    flag: '🇳🇬',
  },
  ZAR: {
    code: 'ZAR',
    country: 'South Africa',
    name: 'South African Rand',
    symbol: 'R',
    rateAgainstUSD: DEFAULT_RATES.ZAR,
    flag: '🇿🇦',
  },
  MWK: {
    code: 'MWK',
    country: 'Malawi',
    name: 'Malawian Kwacha',
    symbol: 'MK',
    rateAgainstUSD: DEFAULT_RATES.MWK,
    flag: '🇲🇼',
  },
  ZMW: {
    code: 'ZMW',
    country: 'Zambia',
    name: 'Zambian Kwacha',
    symbol: 'K',
    rateAgainstUSD: DEFAULT_RATES.ZMW,
    flag: '🇿🇲',
  },
  ZIG: {
    code: 'ZIG',
    country: 'Zimbabwe',
    name: 'Zimbabwe Gold (ZiG)',
    symbol: 'ZiG',
    rateAgainstUSD: DEFAULT_RATES.ZIG,
    flag: '🇿🇼',
  },
};

// Keep CURRENCIES dictionary updated whenever currencyService receives fresh rates
currencyService.subscribe((rates) => {
  (Object.keys(rates) as CurrencyCode[]).forEach(c => {
    if (CURRENCIES[c]) {
      CURRENCIES[c].rateAgainstUSD = rates[c];
    }
  });
});

export const MIN_DEPOSIT_USD = 5.0;
export const MAX_DEPOSIT_USD = 1000.0;
export const MIN_STAKE_USD = 0.35;

/** Get the current live rate against USD for any supported currency */
export function getLiveRate(currency: CurrencyCode): number {
  return currencyService.getRate(currency);
}

/** Convert an amount in USD to the chosen currency */
export function convertFromUSD(amountUSD: number, currency: CurrencyCode): number {
  const rate = currencyService.getRate(currency);
  return amountUSD * rate;
}

/** Convert an amount in chosen currency back to USD */
export function convertToUSD(amountLocal: number, currency: CurrencyCode): number {
  const rate = currencyService.getRate(currency);
  return amountLocal / (rate || 1);
}

/** Format currency with symbol and decimal precision */
export function formatCurrency(
  amountUSD: number,
  currency: CurrencyCode,
  includeSymbol: boolean = true
): string {
  const info = CURRENCIES[currency];
  const rate = currencyService.getRate(currency);
  const localVal = amountUSD * rate;
  const decimals = rate > 100 ? 0 : 2;

  const formattedNum = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(localVal);

  if (!includeSymbol) return formattedNum;
  return `${info.symbol} ${formattedNum}`;
}
