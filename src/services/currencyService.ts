import { CurrencyCode, CurrencyInfo } from '../types/trading';

/**
 * Currency Exchange Rate Service
 * Fetches accurate, real-time live forex rates against USD.
 * Features automatic periodic background polling, fallback endpoints,
 * caching in localStorage, and listener subscriptions.
 */

export interface LiveRatesData {
  rates: Record<CurrencyCode, number>;
  lastUpdated: number;
  source: string;
}

// Fallback baseline rates (approximate market rates)
export const DEFAULT_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  NGN: 1495.0, // Nigerian Naira
  ZAR: 18.25,  // South African Rand
  MWK: 1740.0, // Malawian Kwacha
  ZMW: 27.65,  // Zambian Kwacha
  ZIG: 27.20,  // Zimbabwe Gold (ZiG / ZWG)
};

type RatesListener = (rates: Record<CurrencyCode, number>, lastUpdated: number) => void;

class CurrencyService {
  private currentRates: Record<CurrencyCode, number> = { ...DEFAULT_RATES };
  private lastUpdated: number = 0;
  private listeners: Set<RatesListener> = new Set();
  private updateInterval: any = null;
  private isFetching: boolean = false;

  constructor() {
    this.loadFromStorage();
    // Auto-fetch on boot
    this.fetchLiveRates();
    // Poll every 5 minutes (300,000 ms)
    this.startAutoRefresh(5 * 60 * 1000);
  }

  private loadFromStorage() {
    try {
      const savedRates = localStorage.getItem('rt_live_currency_rates');
      const savedTime = localStorage.getItem('rt_currency_last_updated');
      if (savedRates) {
        const parsed = JSON.parse(savedRates);
        this.currentRates = { ...DEFAULT_RATES, ...parsed };
      }
      if (savedTime) {
        this.lastUpdated = parseInt(savedTime, 10) || 0;
      }
    } catch (e) {
      console.warn('[CurrencyService] Failed to load cached rates', e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('rt_live_currency_rates', JSON.stringify(this.currentRates));
      localStorage.setItem('rt_currency_last_updated', this.lastUpdated.toString());
    } catch (e) {
      console.warn('[CurrencyService] Failed to cache rates', e);
    }
  }

  public getRates(): Record<CurrencyCode, number> {
    return { ...this.currentRates };
  }

  public getRate(currency: CurrencyCode): number {
    return this.currentRates[currency] || DEFAULT_RATES[currency] || 1.0;
  }

  public getLastUpdated(): number {
    return this.lastUpdated;
  }

  public isRateFetching(): boolean {
    return this.isFetching;
  }

  public subscribe(listener: RatesListener): () => void {
    this.listeners.add(listener);
    // Send immediate current rates
    listener(this.currentRates, this.lastUpdated);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(cb => {
      try {
        cb(this.currentRates, this.lastUpdated);
      } catch (err) {
        console.warn('[CurrencyService] Listener warning:', err);
      }
    });
  }

  /**
   * Fetch accurate live forex rates from free open exchange API
   */
  public async fetchLiveRates(): Promise<{ success: boolean; rates: Record<CurrencyCode, number>; error?: string }> {
    if (this.isFetching) {
      return { success: true, rates: this.currentRates };
    }

    this.isFetching = true;

    try {
      // Primary API: open.er-api.com (reliable, 100% free open exchange rate API, no auth key required)
      let response: Response | null = null;
      try {
        response = await fetch('https://open.er-api.com/v6/latest/USD', {
          cache: 'no-cache',
          headers: { Accept: 'application/json' },
        });
      } catch (err) {
        console.warn('[CurrencyService] Primary API unreachable, attempting secondary...', err);
      }

      let data: any = null;
      if (response && response.ok) {
        data = await response.json();
      } else {
        // Fallback API: Fawaz Ahmed's open currency API
        const backupRes = await fetch(
          'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json'
        );
        if (backupRes.ok) {
          const backupData = await backupRes.json();
          data = { rates: backupData.usd };
        }
      }

      if (data && (data.rates || data.usd)) {
        const rawRates = data.rates || data.usd;
        
        // Normalize keys (upper case)
        const normalized: Record<string, number> = {};
        Object.keys(rawRates).forEach(k => {
          normalized[k.toUpperCase()] = Number(rawRates[k]);
        });

        // Extract rates
        const updated: Record<CurrencyCode, number> = {
          USD: 1.0,
          NGN: normalized['NGN'] || this.currentRates.NGN || DEFAULT_RATES.NGN,
          ZAR: normalized['ZAR'] || this.currentRates.ZAR || DEFAULT_RATES.ZAR,
          MWK: normalized['MWK'] || this.currentRates.MWK || DEFAULT_RATES.MWK,
          ZMW: normalized['ZMW'] || this.currentRates.ZMW || DEFAULT_RATES.ZMW,
          // Zimbabwe Gold (ZiG) is officially coded as ZWG in ISO 4217, or referenced as ZIG
          ZIG: normalized['ZWG'] || normalized['ZIG'] || this.currentRates.ZIG || DEFAULT_RATES.ZIG,
        };

        this.currentRates = updated;
        this.lastUpdated = Date.now();
        this.saveToStorage();
        this.notify();
        this.isFetching = false;
        return { success: true, rates: updated };
      } else {
        throw new Error('Invalid rate payload received from API');
      }
    } catch (error: any) {
      console.warn('[CurrencyService] Rate update error, using cached/default rates:', error?.message);
      this.isFetching = false;
      return { success: false, rates: this.currentRates, error: error?.message };
    }
  }

  public startAutoRefresh(intervalMs: number = 5 * 60 * 1000) {
    if (this.updateInterval) clearInterval(this.updateInterval);
    this.updateInterval = setInterval(() => {
      this.fetchLiveRates();
    }, intervalMs);
  }

  public stopAutoRefresh() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

export const currencyService = new CurrencyService();
