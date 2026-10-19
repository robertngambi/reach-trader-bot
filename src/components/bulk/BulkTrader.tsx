import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { AssetSelector } from '../common/AssetSelector';
import { EditableNumberDropdown } from '../common/EditableNumberDropdown';
import { EditableNumberInput } from '../common/EditableNumberInput';
import { TradingActivityBox } from '../common/TradingActivityBox';
import { PersistentTradeHistory } from '../common/PersistentTradeHistory';
import { formatCurrency, convertFromUSD, convertToUSD, MIN_STAKE_USD } from '../../utils/currencies';
import {
  Radar,
  Square,
  Target,
  ShieldAlert,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export const BulkTrader: React.FC = () => {
  const {
    markets,
    selectedMarket,
    currency,
    accountType,
    realBalance,
    bulkConfig,
    startBulkTrader,
    stopBulkTrader,
    bulkTotalPnL,
    bulkScanStatus,
    activeTrades,
    scanAndPredictMarkets,
    isLossGuardActive,
    toggleLossGuard,
  } = useTrading();

  // Method's own independent asset selection - Defaults to Automatic (AI Random Best Asset Sweep)
  const [bulkAssetId, setBulkAssetId] = useState<string>('automatic');
  const [bulkScanNotice, setBulkScanNotice] = useState<string | null>(null);
  const currentBulkMarket = bulkAssetId === 'automatic'
    ? markets[0] || selectedMarket
    : markets.find(m => m.id === bulkAssetId) || selectedMarket;

  const [stakeUSD, setStakeUSD] = useState<number>(() => (accountType === 'real' && realBalance <= 10 ? 0.35 : 1.0));
  const [tradesCount, setTradesCount] = useState<number>(5);
  const [ticks, setTicks] = useState<number>(8);
  const [targetProfitUSD, setTargetProfitUSD] = useState<number>(0); // 0 = Automatic
  const [stopLossUSD, setStopLossUSD] = useState<number>(0); // 0 = Automatic

  const stakeLocal = convertFromUSD(stakeUSD, currency);
  const targetProfitLocal = convertFromUSD(targetProfitUSD, currency);
  const stopLossLocal = convertFromUSD(stopLossUSD, currency);

  const bulkActivePositions = activeTrades.filter(t => t.mode === 'bulk');

  const handleAiPickRandomMarket = () => {
    const scan = scanAndPredictMarkets();
    if (scan.randomProfitable) {
      setBulkAssetId(scan.randomProfitable.market.id);
      setBulkScanNotice(
        `AI Radar: Avoided ${scan.drawdownPool.length} Drawdowns • Random Profit Sensed: ${scan.randomProfitable.market.name} (${scan.randomProfitable.winProbability}% Accuracy, Signal: ${scan.randomProfitable.signal})`
      );
      setTimeout(() => setBulkScanNotice(null), 7000);
    }
  };

  const handleStartScan = () => {
    if (bulkConfig.isRunning) {
      stopBulkTrader();
    } else {
      const isAuto = bulkAssetId === 'automatic';
      startBulkTrader(
        stakeUSD,
        tradesCount || 5,
        ticks || 8,
        targetProfitUSD,
        stopLossUSD,
        isAuto ? undefined : currentBulkMarket,
        undefined // Continuous autonomous bulk trading until stopped or target reached
      );
    }
  };

  const profitProgress = targetProfitUSD > 0 ? Math.min(Math.max((bulkTotalPnL / targetProfitUSD) * 100, 0), 100) : 0;
  const lossProgress = stopLossUSD > 0 && bulkTotalPnL < 0 ? Math.min((Math.abs(bulkTotalPnL) / stopLossUSD) * 100, 100) : 0;

  return (
    <div className="space-y-3 sm:space-y-4 max-w-full overflow-hidden">
      {/* Top Asset Selector Toolbar with AI Random Profit Pick & Loss Guard Shield */}
      <div className="flex items-end justify-between gap-3 flex-wrap max-w-full">
        <div className="flex items-end gap-2 flex-wrap w-full sm:w-auto min-w-0 flex-1">
          <div className="w-full sm:w-72 md:w-80 max-w-full min-w-0">
            <AssetSelector
              selectedAssetId={bulkAssetId}
              onSelectAssetId={setBulkAssetId}
              title="Choose Asset"
              showAutomaticOption={true}
            />
          </div>

          <button
            type="button"
            onClick={handleAiPickRandomMarket}
            disabled={bulkConfig.isRunning}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border border-cyan-500/40 bg-gradient-to-r from-cyan-950/60 to-blue-950/60 text-cyan-300 hover:from-cyan-900/80 hover:to-blue-900/80 disabled:opacity-50 transition-all cursor-pointer shadow-md active:scale-95"
            title="Scan 20 markets, eliminate drawdowns, and randomly select a profit-sensed asset"
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

          <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono-numbers flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300">
              Drawdown Radar: <span className="text-cyan-400 font-bold">Active</span>
            </span>
            {bulkConfig.isRunning && (
              <span className="text-emerald-400 font-bold ml-1">
                Batches of {tradesCount}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      {bulkScanNotice && (
        <div className="px-3.5 py-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs font-mono-numbers flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Radar className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
            <span>{bulkScanNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setBulkScanNotice(null)}
            className="text-cyan-400 hover:text-white text-xs px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Parameter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Trading Stake */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md flex flex-col justify-between">
          <EditableNumberDropdown
            label="Stake Amount"
            value={stakeLocal}
            onChange={(val) => {
              setStakeUSD(convertToUSD(val, currency));
            }}
            options={[0.35, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]}
            min={0.35}
            allowDecimals={true}
            disabled={bulkConfig.isRunning}
            suffix={currency}
            prefix={currency === 'USD' ? '$' : ''}
            subtitle={`Min: ${formatCurrency(MIN_STAKE_USD, currency)}`}
          />
        </div>

        {/* 2. Number of trades */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md flex flex-col justify-between">
          <EditableNumberDropdown
            label="Number of trades"
            value={tradesCount}
            onChange={setTradesCount}
            options={[1, 3, 5, 10, 15, 20]}
            min={1}
            max={10000}
            disabled={bulkConfig.isRunning}
          />
        </div>

        {/* 3. Number of ticks */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md flex flex-col justify-between">
          <EditableNumberDropdown
            label="Number of ticks"
            value={ticks}
            onChange={setTicks}
            options={[5, 8, 10, 15, 20]}
            min={1}
            max={10000}
            disabled={bulkConfig.isRunning}
          />
        </div>

        {/* 4. Target Profit Amount with Automatic on top */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md flex flex-col justify-between">
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
            disabled={bulkConfig.isRunning}
            suffix={currency}
            prefix={currency === 'USD' ? '$' : ''}
            allowAutomatic={true}
            automaticLabel="Automatic"
            subtitle="Accrue open profit"
          />
        </div>

        {/* 5. Last Loss Amount (Stop Loss) with Automatic on top */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-md flex flex-col justify-between">
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
            disabled={bulkConfig.isRunning}
            suffix={currency}
            prefix={currency === 'USD' ? '$' : ''}
            allowAutomatic={true}
            automaticLabel="Automatic"
            subtitle="Loss guard active"
          />
        </div>
      </div>

      {/* SCAN Button & Metrics Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 max-w-sm">
            <button
              type="button"
              onClick={handleStartScan}
              className={`w-full py-3.5 rounded-xl font-extrabold text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-[0.98] ${
                bulkConfig.isRunning
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-950/40'
              }`}
            >
              {bulkConfig.isRunning ? (
                <>
                  <Square className="w-4 h-4 fill-white" />
                  <span>STOP AUTONOMOUS BULK TRADER</span>
                </>
              ) : (
                <>
                  <Radar className="w-4 h-4 animate-pulse" />
                  <span>START AUTONOMOUS BULK TRADER</span>
                </>
              )}
            </button>
            <div className="text-[11px] font-mono-numbers text-cyan-400 mt-1.5 text-center">
              {bulkScanStatus}
            </div>
          </div>

          <div className="flex-1 grid grid-cols-3 gap-2.5 font-mono-numbers">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Session Net P&L
              </span>
              <span
                className={`text-base font-black ${
                  bulkTotalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {bulkTotalPnL >= 0 ? '+' : ''}
                {formatCurrency(bulkTotalPnL, currency)}
              </span>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Target Profit
              </span>
              <span className="text-base font-black text-emerald-400">
                +{formatCurrency(targetProfitUSD, currency)}
              </span>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${profitProgress}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                Stop Loss Limit
              </span>
              <span className="text-base font-black text-rose-400">
                -{formatCurrency(stopLossUSD, currency)}
              </span>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                <div
                  className="bg-rose-500 h-full transition-all duration-300"
                  style={{ width: `${lossProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Executions Monitor */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-100">
              Active Bulk Executions
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono-numbers">
              {bulkActivePositions.length} Open
            </span>
          </div>
        </div>

        {bulkActivePositions.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs">
            No bulk trades currently executing. Click "SCAN MARKETS NOW" to start scanning and batch execution.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {bulkActivePositions.map(trade => {
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Persistent Trade History with Visual Status & Deriv Balance Sync */}
      <PersistentTradeHistory
        modeFilter="bulk"
        title="Bulk Trade History & Deriv Balance Sync"
      />

      {/* Step-by-Step Pop-up Trading Activity Box */}
      <TradingActivityBox
        mode="bulk"
        title="Bulk Scanner Activity"
        isRunning={bulkConfig.isRunning}
      />
    </div>
  );
};
