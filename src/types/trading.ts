export type AccountType = 'demo' | 'real';

export type CurrencyCode = 'USD' | 'NGN' | 'ZAR' | 'MWK' | 'ZMW' | 'ZIG';

export interface CurrencyInfo {
  code: CurrencyCode;
  country: string;
  name: string;
  symbol: string;
  rateAgainstUSD: number; // e.g. 1 USD = X Currency
  flag: string;
}

export type TradingTab = 'manual' | 'bulk' | 'bot';

export type ChartType = 'candle' | 'line';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketAsset {
  id: string;
  name: string;
  category: string;
  currentPrice: number;
  change24h: number;
  volatilityRate: number; // 0.1 to 2.5
  description: string;
  pocPrice?: number;
  bullishZone?: [number, number];
  bearishZone?: [number, number];
  derivSymbol?: string;
  is24x7?: boolean;
  marketSchedule?: '24/7' | 'mon-fri';
}

export interface TradePosition {
  id: string;
  assetId: string;
  assetName: string;
  derivSymbol?: string;
  type: 'BUY' | 'SELL';
  mode: 'manual' | 'bot_manual' | 'bulk' | 'bot_auto';
  accountType?: 'demo' | 'real';
  stakeUSD: number;
  entryPrice: number;
  currentPrice: number;
  exitPrice?: number;
  pnlUSD: number;
  pnlPercentage: number;
  status: 'OPEN' | 'CLOSED_WIN' | 'CLOSED_LOSS';
  openTime: number;
  closeTime?: number;
  ticksRemaining?: number;
  totalTicks?: number;
  targetDurationMs?: number;
  notes?: string;
}

export type PaymentMethodType = 'card' | 'airtel' | 'mtn' | 'deriv_cashier' | 'profit_payout';

export interface TransactionRecord {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER' | 'PROFIT';
  method: PaymentMethodType;
  amountUSD: number;
  amountLocal: number;
  currency: CurrencyCode;
  timestamp: number;
  status: 'COMPLETED' | 'PROCESSING' | 'FAILED';
  reference: string;
  details?: Record<string, string>;
}

export type TradingTechnique = 'market_reaper' | 'rsi_reversion' | 'ema_trend' | 'zero_drawdown';

export interface MarketScanPrediction {
  market: MarketAsset;
  score: number;
  signal: 'BUY' | 'SELL';
  winProbability: number;
  isDrawdownRisk: boolean;
  drawdownReason?: string;
  profitSenseScore: number;
  technique?: TradingTechnique;
  strategyName?: string;
  rsiValue?: number;
  trendDiagnosis?: string;
  predictedProfitOutcome?: 'STRONG_PROFIT' | 'CONSISTENT_PROFIT' | 'AVOID_POTENTIAL_LOSS';
}

export interface BulkBotConfig {
  stakeUSD: number;
  tradesAtOnce: number;
  ticks: number;
  targetProfitUSD: number;
  stopLossUSD: number;
  isRunning: boolean;
  activeBatchId?: string;
  totalExecuted?: number;
  maxTrades?: number;
}

export type BotDuration = '1m' | '5m' | '10m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | '24h' | '48h' | '72h';

export interface AutomatedBotConfig {
  stakeUSD: number;
  duration: BotDuration;
  includeBulkTrading: boolean;
  bulkTradesCount: number;
  isRunning: boolean;
  startTime?: number;
  endTime?: number;
  targetProfitUSD?: number;
  stopLossUSD?: number;
  maxTrades?: number;
  tradesExecuted?: number;
  technique?: TradingTechnique;
  assetId?: string;
}

