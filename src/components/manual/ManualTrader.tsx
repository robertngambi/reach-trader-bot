import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { TradingChart } from '../chart/TradingChart';
import { AssetSelector } from '../common/AssetSelector';
import { EditableNumberDropdown } from '../common/EditableNumberDropdown';
import { EditableNumberInput } from '../common/EditableNumberInput';
import { TradingActivityBox } from '../common/TradingActivityBox';
import { PersistentTradeHistory } from '../common/PersistentTradeHistory';
import { formatCurrency, convertFromUSD, convertToUSD, MIN_STAKE_USD } from '../../utils/currencies';
import {
  TrendingUp,
  TrendingDown,
  Bot,
  Radar,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  Play,
  Square,
  CheckCircle2,
  Activity,
} from 'lucide-react';

export const ManualTrader: React.FC = () => {
  const {
    markets,
    selectedMarket,
    setSelectedMarketId,
    candles,
    livePrice,
    currency,
    currentBalance,
    openTrade,
    closeTrade,
    activeTrades,
    isLossGuardActive,
    toggleLossGuard,
    isManualBotActive,
    toggleManualBot,
    manualBotStatusText,
    scanAndPredictMarkets,
    pickRandomProfitableMarket,
  } = useTrading();

  // Method's own independent asset selection
  const [manualAssetId, setManualAssetId] = useState<string>(selectedMarket.id || 'vol-75');
  const currentManualMarket = markets.find(m => m.id === manualAssetId) || selectedMarket;

  const [stakeInputUSD, setStakeInputUSD] = useState<number>(() => (currentBalance <= 10 ? 0.35 : 1.0));
  const [ticksInput, setTicksInput] = useState<number>(8);
  const [scanNotice, setScanNotice] = useState<string | null>(null);

  const manualPositions = activeTrades.filter(
    t => t.mode === 'manual' || t.mode === 'bot_manual'
  );

  const handleSelectAsset = (id: string) => {
    if (id === 'automatic') {
      const scan = scanAndPredictMarkets();
      if (scan.randomProfitable) {
        setManualAssetId('automatic');
        setSelectedMarketId(scan.randomProfitable.market.id);
      }
    } else {
      setManualAssetId(id);
      setSelectedMarketId(id);
    }
  };

  const handleAiScanAndRandomPick = () => {
    const scan = scanAndPredictMarkets();
    if (scan.randomProfitable) {
      handleSelectAsset(scan.randomProfitable.market.id);
      setScanNotice(
        `AI Radar: Avoided ${scan.drawdownPool.length} Drawdown Markets • Random Profit Sensed: ${scan.randomProfitable.market.name} (${scan.randomProfitable.winProbability}% Win Sense, Signal: ${scan.randomProfitable.signal})`
      );
      setTimeout(() => setScanNotice(null), 7000);
    }
  };

  // Evaluate current manual market's drawdown health
  const isErraticVol = currentManualMarket.volatilityRate > 2.7;
  const isExhaustion = Math.abs(currentManualMarket.change24h) > 8.5;
  const isCurrentDrawdownRisk = isErraticVol || isExhaustion;

  const handleBuy = () => {
    openTrade('BUY', stakeInputUSD, 'manual', currentManualMarket, ticksInput || 8);
  };

  const handleSell = () => {
    openTrade('SELL', stakeInputUSD, 'manual', currentManualMarket, ticksInput || 8);
  };

  const stakeLocal = convertFromUSD(stakeInputUSD, currency);

  const handleLocalStakeChange = (valStr: string) => {
    const val = parseFloat(valStr);
    if (!isNaN(val) && val >= 0) {
      setStakeInputUSD(convertToUSD(val, currency));
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Toolbar: "Choose Asset", "AI Scan & Random Profit Pick", and "Loss Guard" Toggle */}
      <div className="flex items-end justify-between gap-3 flex-wrap max-w-full">
        <div className="flex items-end gap-2 flex-wrap w-full sm:w-auto min-w-0 flex-1">
          <div className="w-full sm:w-72 md:w-80 max-w-full min-w-0">
            <AssetSelector
              selectedAssetId={manualAssetId}
              onSelectAssetId={handleSelectAsset}
              title="Choose Asset"
              showAutomaticOption={true}
            />
          </div>

          {/* AI Scan & Random Profit Pick Button (Avoids Drawdown) */}
          <button
            type="button"
            onClick={handleAiScanAndRandomPick}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-cyan-500/40 bg-gradient-to-r from-cyan-950/60 to-blue-950/60 text-cyan-300 hover:from-cyan-900/80 hover:to-blue-900/80 transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
            title="Scan all 20 markets, avoid drawdown risks, and randomly pick top profit-sensed market"
          >
            <Radar className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>AI Random Profit Pick</span>
            <Sparkles className="w-3 h-3 text-cyan-300" />
          </button>
        </div>

        {/* Universal Loss Guard Shield Toggle */}
        <div className="flex items-center gap-2 shrink-0">
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
        </div>
      </div>

      {/* Autonomous Trader Control Card for Manual Trading */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2.5 rounded-xl border shrink-0 ${
            isManualBotActive
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}>
            <Bot className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-sm text-slate-100">
                Autonomous Trader (Manual Mode)
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                isManualBotActive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isManualBotActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                <span>{isManualBotActive ? 'Autonomously Trading' : 'Standby'}</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-300 hidden sm:inline">
                Stake: {formatCurrency(stakeInputUSD, currency)} • {ticksInput} Ticks
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {manualBotStatusText}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => toggleManualBot(stakeInputUSD, ticksInput)}
          className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shrink-0 active:scale-95 ${
            isManualBotActive
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white'
          }`}
          title={isManualBotActive ? 'Click to stop autonomous background trading' : 'Click to start autonomous background trading'}
        >
          {isManualBotActive ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isManualBotActive ? 'Stop Autonomous Trader' : 'Start Autonomous Trader'}</span>
        </button>
      </div>

      {/* Live Market Drawdown Radar Status Badge */}
      <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono-numbers">
        <div className="flex items-center gap-2">
          {isCurrentDrawdownRisk ? (
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Drawdown Warning: High volatility / exhaustion detected on {currentManualMarket.name}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Profit Sensed: {currentManualMarket.name} • Safe from drawdowns</span>
            </span>
          )}
        </div>
        <span className="text-slate-400 text-[10px]">
          Volatility: {currentManualMarket.volatilityRate.toFixed(1)}x • 24h: {currentManualMarket.change24h >= 0 ? '+' : ''}{currentManualMarket.change24h}%
        </span>
      </div>

      {/* Temporary Notice from AI Scanner */}
      {scanNotice && (
        <div className="px-3.5 py-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs font-mono-numbers flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Radar className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
            <span>{scanNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setScanNotice(null)}
            className="text-cyan-400 hover:text-white text-xs px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Trading Graph with Candle/Line Toggle & Indicators/POC grouped on top margin */}
      <TradingChart
        market={currentManualMarket}
        candles={candles}
        livePrice={livePrice}
      />

      {/* Execution Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Stake and Number of ticks Configuration */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="space-y-3">
            <EditableNumberDropdown
              label="Stake Amount"
              value={stakeLocal}
              onChange={(val) => {
                setStakeInputUSD(convertToUSD(val, currency));
              }}
              options={[0.35, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]}
              min={0.35}
              allowDecimals={true}
              suffix={currency}
              prefix={currency === 'USD' ? '$' : ''}
              subtitle={`Min: ${formatCurrency(MIN_STAKE_USD, currency)}`}
            />

            {/* Number of ticks (editable dropdown, allows typing any number from 1) */}
            <div className="pt-1">
              <EditableNumberDropdown
                label="Number of ticks"
                value={ticksInput}
                onChange={setTicksInput}
                options={[5, 8, 10, 15, 20]}
                min={1}
                max={1000}
              />
            </div>
          </div>
        </div>

        {/* BUY Button Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              BUY (CALL)
            </span>
            <span className="text-slate-400 font-mono-numbers">Payout: +90%</span>
          </div>

          <div className="my-auto py-2">
            <span className="text-xs text-slate-400">
              Enter long position. Automatic profit capture upon tick expiry.
            </span>
          </div>

          <button
            type="button"
            onClick={handleBuy}
            disabled={currentBalance < stakeInputUSD}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
          >
            <TrendingUp className="w-4 h-4" />
            <span>BUY • {formatCurrency(stakeInputUSD, currency)}</span>
          </button>
        </div>

        {/* SELL Button Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-rose-400 flex items-center gap-1">
              <TrendingDown className="w-4 h-4" />
              SELL (PUT)
            </span>
            <span className="text-slate-400 font-mono-numbers">Payout: +90%</span>
          </div>

          <div className="my-auto py-2">
            <span className="text-xs text-slate-400">
              Enter short position. Automatic profit capture upon tick expiry.
            </span>
          </div>

          <button
            type="button"
            onClick={handleSell}
            disabled={currentBalance < stakeInputUSD}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
          >
            <TrendingDown className="w-4 h-4" />
            <span>SELL • {formatCurrency(stakeInputUSD, currency)}</span>
          </button>
        </div>
      </div>

      {/* Active Positions Monitor */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-100">Live Active Positions</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 font-mono-numbers">
              {manualPositions.length}
            </span>
          </div>
        </div>

        {manualPositions.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs">
            No open positions. Click BUY or SELL above to execute a manual trade.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-numbers">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="pb-2">Asset</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Stake</th>
                  <th className="pb-2">Entry</th>
                  <th className="pb-2">Current</th>
                  <th className="pb-2">Ticks</th>
                  <th className="pb-2">P&L</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {manualPositions.map(trade => {
                  const isProfit = trade.pnlUSD >= 0;
                  return (
                    <tr key={trade.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 font-bold text-slate-200">{trade.assetName}</td>
                      <td className="py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            trade.type === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {trade.type}
                        </span>
                      </td>
                      <td className="py-2.5 font-semibold text-slate-200">
                        {formatCurrency(trade.stakeUSD, currency)}
                      </td>
                      <td className="py-2.5 text-slate-400">{trade.entryPrice.toFixed(2)}</td>
                      <td className="py-2.5 text-slate-200 font-bold">{trade.currentPrice.toFixed(2)}</td>
                      <td className="py-2.5 text-cyan-400">
                        {trade.ticksRemaining} / {trade.totalTicks}
                      </td>
                      <td className="py-2.5 font-bold">
                        <span className={isProfit ? 'text-emerald-400' : 'text-rose-400'}>
                          {isProfit ? '+' : ''}
                          {formatCurrency(trade.pnlUSD, currency)} ({trade.pnlPercentage.toFixed(0)}%)
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => closeTrade(trade.id)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-bold cursor-pointer"
                        >
                          Close
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Persistent Trade History with Visual Status & Deriv Balance Sync */}
      <PersistentTradeHistory
        modeFilter="manual"
        title="Manual Trade History & Deriv Balance Sync"
      />

      {/* Step-by-Step Pop-up Trading Activity Box */}
      <TradingActivityBox
        mode="manual"
        title="Manual Trading Activity"
        isRunning={manualPositions.length > 0}
      />
    </div>
  );
};
