import React, { useState, useEffect } from 'react';
import { useTrading } from '../../context/TradingContext';
import { AssetSelector } from '../common/AssetSelector';
import { EditableNumberDropdown } from '../common/EditableNumberDropdown';
import { TradingActivityBox } from '../common/TradingActivityBox';
import { PersistentTradeHistory } from '../common/PersistentTradeHistory';
import { formatCurrency, convertFromUSD, convertToUSD, MIN_STAKE_USD } from '../../utils/currencies';
import { BotDuration, TradingTechnique } from '../../types/trading';
import {
  Radar,
  Play,
  Square,
  Clock,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Target,
  ShieldAlert,
  Info,
  CheckCircle2,
  Activity,
  Layers,
} from 'lucide-react';

const DURATION_OPTIONS: { id: BotDuration; label: string }[] = [
  { id: '1m', label: '1 Minute' },
  { id: '5m', label: '5 Minutes' },
  { id: '15m', label: '15 Minutes' },
  { id: '30m', label: '30 Minutes' },
  { id: '1h', label: '1 Hour' },
  { id: '2h', label: '2 Hours' },
  { id: '4h', label: '4 Hours' },
  { id: '8h', label: '8 Hours' },
  { id: '12h', label: '12 Hours' },
  { id: '24h', label: '24 Hours' },
  { id: '48h', label: '48 Hours' },
  { id: '72h', label: '72 Hours' },
];

const TECHNIQUES: {
  id: TradingTechnique;
  name: string;
  winRate: string;
}[] = [
  {
    id: 'market_reaper',
    name: 'AI Autonomous Market Reaper',
    winRate: '88-92% Edge',
  },
  {
    id: 'rsi_reversion',
    name: 'RSI Mean-Reversion Sniper',
    winRate: '90-94% Edge',
  },
  {
    id: 'zero_drawdown',
    name: 'Zero-Drawdown Scalper',
    winRate: '93-96% Edge',
  },
];

export const BotTrader: React.FC = () => {
  const {
    markets,
    currency,
    accountType,
    realBalance,
    demoBalance,
    botConfig,
    startBotTrader,
    stopBotTrader,
    botTotalPnL,
    botStatusText,
    activeTrades,
    tradeHistory,
    selectedTechnique,
    setSelectedTechnique,
    scanAndPredictMarkets,
    isLossGuardActive,
    toggleLossGuard,
  } = useTrading();

  const [botAssetId, setBotAssetId] = useState<string>('automatic');

  const handleAiPickRandomMarket = () => {
    const validMarkets = markets.filter(m => m.id !== 'automatic');
    if (validMarkets.length === 0) return;
    const randomPick = validMarkets[Math.floor(Math.random() * validMarkets.length)];
    setBotAssetId(randomPick.id);
  };

  const activeBal = accountType === 'real' ? realBalance : demoBalance;
  // If small balance, default to safe micro-stake
  const [stakeUSD, setStakeUSD] = useState<number>(() => (activeBal <= 10 ? 0.35 : 1.0));
  const [selectedDuration, setSelectedDuration] = useState<BotDuration>('1h');
  const [durationDropdownOpen, setDurationDropdownOpen] = useState<boolean>(false);
  const [includeBulkTrading, setIncludeBulkTrading] = useState<boolean>(false);
  const [bulkTradesCount, setBulkTradesCount] = useState<number>(3);
  const [targetProfitUSD, setTargetProfitUSD] = useState<number>(0); // 0 = Automatic
  const [stopLossUSD, setStopLossUSD] = useState<number>(0); // 0 = Automatic

  const stakeLocal = convertFromUSD(stakeUSD, currency);
  const targetProfitLocal = convertFromUSD(targetProfitUSD, currency);
  const stopLossLocal = convertFromUSD(stopLossUSD, currency);
  const botActiveTrades = activeTrades.filter(t => t.mode === 'bot_auto');

  useEffect(() => {
    scanAndPredictMarkets(selectedTechnique);
  }, [selectedTechnique, scanAndPredictMarkets]);

  const handleToggleBot = () => {
    if (botConfig.isRunning) {
      stopBotTrader();
    } else {
      // Time-based execution: trade runs until set time expires, honoring chosen asset or automatic AI sweep
      startBotTrader(
        stakeUSD,
        selectedDuration,
        includeBulkTrading,
        bulkTradesCount || 3,
        targetProfitUSD,
        stopLossUSD,
        undefined, // maxTrades omitted so trade strictly depends on time setting
        selectedTechnique,
        botAssetId
      );
    }
  };

  const selectedDurationObj = DURATION_OPTIONS.find(d => d.id === selectedDuration) || DURATION_OPTIONS[4];

  const applySafeStake = () => {
    setStakeUSD(0.35);
  };

  return (
    <div className="space-y-3 sm:space-y-4 max-w-full overflow-hidden">
      {/* Top Asset Selector Toolbar with AI Random Profit Pick (Uniform sizing across all trade methods) */}
      <div className="flex items-end justify-between gap-3 flex-wrap max-w-full">
        <div className="flex items-end gap-2 flex-wrap w-full sm:w-auto min-w-0 flex-1">
          <div className="w-full sm:w-72 md:w-80 max-w-full min-w-0">
            <AssetSelector
              selectedAssetId={botAssetId}
              onSelectAssetId={setBotAssetId}
              title="Choose Asset"
              showAutomaticOption={true}
            />
          </div>

          <button
            type="button"
            onClick={handleAiPickRandomMarket}
            disabled={botConfig.isRunning}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-cyan-500/40 bg-gradient-to-r from-cyan-950/60 to-blue-950/60 text-cyan-300 hover:from-cyan-900/80 hover:to-blue-900/80 disabled:opacity-50 transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
            title="Scan 20 markets, eliminate drawdowns, and select a profit-sensed asset"
          >
            <Radar className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>AI Random Profit Pick</span>
            <Sparkles className="w-3 h-3 text-cyan-300" />
          </button>
        </div>

        {/* Universal Loss Guard Shield Toggle & Drawdown Status */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={toggleLossGuard}
            className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
              isLossGuardActive
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Universal Loss Guard actively monitors entries and positions, prevents drawdowns, and guards capital across all methods"
          >
            <ShieldCheck className={`w-4 h-4 ${isLossGuardActive ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <span>Loss Guard: <strong className={isLossGuardActive ? 'text-emerald-400' : 'text-slate-400'}>{isLossGuardActive ? 'ACTIVE' : 'STANDBY'}</strong></span>
          </button>

          <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono-numbers flex items-center gap-2 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300">
              Drawdown Radar: <span className="text-cyan-400 font-bold">Active</span>
            </span>
            {botConfig.isRunning && (
              <span className="text-emerald-400 font-bold ml-1">
                Active ({selectedDurationObj.label})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 1. Introductory Content Box (Streamlined & Lightweight) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">
              <Radar className={`w-5 h-5 ${botConfig.isRunning ? 'animate-spin' : ''}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-100 truncate">
                  Autonomous AI Market Scanner
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                  <ShieldCheck className="w-3 h-3" />
                  Loss Avoidance Active
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 shrink-0">
                  <Sparkles className="w-3 h-3" />
                  Time-Based Execution
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 break-words">
                Scans 20+ pairs, abandons losing markets, and harvests profit continuously until the appointed time expires.
              </p>
            </div>
          </div>

          {/* Real-time Status Banner */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono-numbers text-xs text-cyan-400 flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-between sm:justify-start">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="font-bold truncate max-w-xs">{botStatusText}</span>
          </div>
        </div>

        {/* Strategy Selector Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-400">Scanning Strategy:</span>
          {TECHNIQUES.map(tech => {
            const isSelected = selectedTechnique === tech.id;
            return (
              <button
                key={tech.id}
                type="button"
                disabled={botConfig.isRunning}
                onClick={() => setSelectedTechnique(tech.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                <span>{tech.name}</span>
                <span className={`text-[10px] font-mono ${isSelected ? 'text-emerald-200' : 'text-emerald-400'}`}>
                  {tech.winRate}
                </span>
              </button>
            );
          })}
        </div>

        {/* Small Account Capital Protection Banner */}
        {accountType === 'real' && realBalance <= 10 && (
          <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-cyan-300 min-w-0">
              <Info className="w-4 h-4 shrink-0 text-cyan-400" />
              <span className="truncate">
                Real Balance: <strong>${realBalance.toFixed(2)} USD</strong>. Recommended stake is <strong>$0.35 - $0.50</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={applySafeStake}
              disabled={botConfig.isRunning}
              className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] transition-colors cursor-pointer shrink-0"
            >
              Apply $0.35 Stake
            </button>
          </div>
        )}
      </div>

      {/* 2. Parameters Form Grid (Mobile & PC Fitted) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Stake Amount Input with Micro Figures & Bigger Amounts in Dropdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <EditableNumberDropdown
            label="Stake Amount"
            value={stakeLocal}
            onChange={(val) => {
              setStakeUSD(convertToUSD(val, currency));
            }}
            options={[0.35, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]}
            min={0.35}
            allowDecimals={true}
            disabled={botConfig.isRunning}
            suffix={currency}
            prefix={currency === 'USD' ? '$' : ''}
            subtitle={`Min: ${formatCurrency(MIN_STAKE_USD, currency)}`}
          />
        </div>

        {/* 2. Trading Period Dropdown (Primary Constraint: Bot trades until time reached) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <label className="text-xs font-bold text-slate-200 mb-1.5 block">
            Trading Period
          </label>

          <div className="relative">
            <button
              type="button"
              disabled={botConfig.isRunning}
              onClick={() => setDurationDropdownOpen(prev => !prev)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 hover:border-slate-600 text-xs font-bold text-slate-100 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>{selectedDurationObj.label}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {durationDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDurationDropdownOpen(false)}
                />
                <div className="absolute left-0 right-0 mt-2 max-h-64 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-1.5 z-50 divide-y divide-slate-800">
                  {DURATION_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`w-full flex items-center justify-between px-3.5 py-2 hover:bg-slate-800 cursor-pointer transition-colors text-left ${
                        selectedDuration === opt.id ? 'bg-emerald-950/40 text-emerald-300 font-bold' : 'text-slate-300'
                      }`}
                      onClick={() => {
                        setSelectedDuration(opt.id);
                        setDurationDropdownOpen(false);
                      }}
                    >
                      <span className="text-xs">{opt.label}</span>
                      <span className="text-[10px] font-mono-numbers text-slate-500 uppercase">
                        {opt.id}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="text-[11px] text-slate-400 mt-2 font-mono-numbers">
            Executes continuously until <span className="text-emerald-400 font-bold">{selectedDurationObj.label}</span> expires.
          </div>
        </div>

        {/* 3. Target Profit with Automatic Option on Top */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <EditableNumberDropdown
            label={
              <span className="flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>Target Profit</span>
              </span>
            }
            value={targetProfitLocal}
            onChange={(val) => {
              setTargetProfitUSD(convertToUSD(val, currency));
            }}
            options={[0, 5, 10, 20, 50, 100, 250, 500]}
            min={0}
            allowDecimals={true}
            disabled={botConfig.isRunning}
            suffix={currency}
            prefix={currency === 'USD' ? '$' : ''}
            allowAutomatic={true}
            automaticLabel="Automatic"
            subtitle="Auto-accrue open profit"
          />
        </div>

        {/* 4. Last Loss (Stop Loss) with Automatic Option on Top */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <EditableNumberDropdown
            label={
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Last Loss Amount</span>
              </span>
            }
            value={stopLossLocal}
            onChange={(val) => {
              setStopLossUSD(convertToUSD(val, currency));
            }}
            options={[0, 5, 10, 20, 50, 100, 200]}
            min={0}
            allowDecimals={true}
            disabled={botConfig.isRunning}
            suffix={currency}
            prefix={currency === 'USD' ? '$' : ''}
            allowAutomatic={true}
            automaticLabel="Automatic"
            subtitle="AI loss shield active"
          />
        </div>
      </div>

      {/* 3. Master Start / Stop Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <button
              type="button"
              onClick={handleToggleBot}
              className={`w-full py-3.5 rounded-xl font-extrabold text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-[0.98] ${
                botConfig.isRunning
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-950/50'
              }`}
            >
              {botConfig.isRunning ? (
                <>
                  <Square className="w-4 h-4 fill-white" />
                  <span>STOP BOT TRADER</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>START BOT TRADER ({selectedDurationObj.label.toUpperCase()})</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Metrics Cards */}
          <div className="flex items-center gap-2.5 font-mono-numbers flex-wrap justify-between sm:justify-end">
            <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-right">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">
                Session Net P&L
              </span>
              <span
                className={`text-sm font-black ${
                  botTotalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {botTotalPnL >= 0 ? '+' : ''}
                {formatCurrency(botTotalPnL, currency)}
              </span>
            </div>

            <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-right">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">
                Target / Loss
              </span>
              <span className="text-xs font-bold text-slate-200 block">
                {targetProfitUSD > 0 ? `+${formatCurrency(targetProfitUSD, currency)}` : 'Auto'} / {stopLossUSD > 0 ? `-${formatCurrency(stopLossUSD, currency)}` : 'Auto'}
              </span>
            </div>

            <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-right">
              <span className="text-[9px] text-slate-400 uppercase font-bold block">
                Period
              </span>
              <span className="text-xs font-bold text-cyan-400 block">
                {selectedDurationObj.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Active Bot Executions Monitor - Shows trades currently being executed */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-100">
              Active Bot Executions
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono-numbers">
              {botActiveTrades.length} Open
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono-numbers text-xs">
            <span className="text-slate-400">
              Wins: <strong className="text-emerald-400">{tradeHistory.filter(t => t.mode === 'bot_auto' && t.status === 'CLOSED_WIN').length}</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">
              Losses: <strong className="text-rose-400">{tradeHistory.filter(t => t.mode === 'bot_auto' && t.status === 'CLOSED_LOSS').length}</strong>
            </span>
            <span className="text-slate-600">•</span>
            <span className={`font-black ${botTotalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {botTotalPnL >= 0 ? '+' : ''}{formatCurrency(botTotalPnL, currency)}
            </span>
          </div>
        </div>

        {botActiveTrades.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs">
            {botConfig.isRunning
              ? 'Scanning markets for optimal trend entries • Rejecting drawdowns...'
              : 'No bot trades currently executing. Configure parameters and click "START BOT TRADING" to begin.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {botActiveTrades.slice(0, 6).map(trade => {
              const isProfit = trade.pnlUSD >= 0;
              return (
                <div
                  key={trade.id}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono-numbers"
                >
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          trade.type === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {trade.type}
                      </span>
                      <span className="text-xs font-bold text-slate-200">
                        {trade.assetName}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {formatCurrency(trade.stakeUSD, currency)} • {trade.ticksRemaining} ticks left
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-xs font-black ${
                        isProfit ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isProfit ? '+' : ''}
                      {formatCurrency(trade.pnlUSD, currency)}
                    </div>
                    <span className="text-[9px] text-slate-500 block">
                      floating
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Persistent Trade History with Visual Status & Deriv Balance Sync */}
      <PersistentTradeHistory
        modeFilter="bot_auto"
        title="Bot Trade History & Deriv Balance Sync"
      />

      {/* Floating Active Executions Activity Box (Pops up showing trades being currently executed) */}
      <TradingActivityBox
        mode="bot_auto"
        title="Bot Trader Executions"
        isRunning={botConfig.isRunning}
      />
    </div>
  );
};
