import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { CURRENCIES, formatCurrency } from '../../utils/currencies';
import { TradePosition } from '../../types/trading';
import {
  Settings,
  X,
  RotateCcw,
  Sun,
  Moon,
  Globe,
  ChevronDown,
  CheckCircle2,
  HelpCircle,
  Info,
  History,
  SlidersHorizontal,
  Layers3,
  Bot,
  ListFilter,
  RefreshCw,
  User,
} from 'lucide-react';

import { CurrencyExchangeDropdown } from '../common/CurrencyExchangeDropdown';

export const SettingsModal: React.FC = () => {
  const {
    userName,
    setUserName,
    activeModal,
    setActiveModal,
    currency,
    setCurrency,
    theme,
    setTheme,
    restoreDemoAccount,
    demoBalance,
    realBalance,
    tradeHistory,
    currencyRates,
    ratesLastUpdated,
    isFetchingRates,
    refreshCurrencyRates,
    liveBrokerStatus,
  } = useTrading();

  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');
  const [historyMethodFilter, setHistoryMethodFilter] = useState<'all' | 'manual' | 'bulk' | 'bot'>('all');
  const [restoredNotice, setRestoredNotice] = useState<boolean>(false);

  if (activeModal !== 'settings') return null;

  const handleRestoreDemo = () => {
    restoreDemoAccount();
    setRestoredNotice(true);
    setTimeout(() => setRestoredNotice(false), 2500);
  };

  const currentCurr = CURRENCIES[currency];

  // Filter trade history by selected method
  const filteredHistory = tradeHistory.filter(t => {
    if (historyMethodFilter === 'all') return true;
    if (historyMethodFilter === 'manual') return t.mode === 'manual' || t.mode === 'bot_manual';
    if (historyMethodFilter === 'bulk') return t.mode === 'bulk';
    if (historyMethodFilter === 'bot') return t.mode === 'bot_auto';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setActiveModal(null)}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            {activeTab === 'settings' ? <Settings className="w-6 h-6" /> : <History className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-100">
              {activeTab === 'settings' ? 'Platform Settings' : 'Trade History'}
            </h3>
            <p className="text-xs text-slate-400">
              {activeTab === 'settings' ? 'Currency exchange, background theme, and demo account' : 'Audit logs and past trading activities'}
            </p>
          </div>
        </div>

        {/* Top Switcher Tabs: Settings vs Trade History */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span>General Settings</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'history'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span>Trade History ({tradeHistory.length})</span>
          </button>
        </div>

        {activeTab === 'settings' ? (
          <div className="space-y-4">
            {/* 1. Trader Profile & Deriv Account Identification */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>Trader Identity & Deriv Accounts</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                    {liveBrokerStatus.isAuthorized ? 'Broker Synced' : 'Ready'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {/* Connected Deriv Broker Accounts */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[10px]">Demo Account:</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="font-mono font-bold text-emerald-400 block mt-0.5">
                      {liveBrokerStatus.patAccounts?.demo?.accountId || 'DOT94237631'}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      ${demoBalance.toFixed(2)} USD
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400/80 text-[10px] font-bold">Real Broker Account:</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <span className="font-mono font-semibold text-emerald-400 block mt-0.5 text-xs">
                      ACC: ROT9256649227
                    </span>
                    <span className="text-[10px] text-emerald-300/90 block font-mono font-bold">
                      ${realBalance.toFixed(2)} USD
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Currency Exchange Section with Drop Menu on top and Update Button */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Real-Time Currency Exchange</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                    Live Forex
                  </span>
                </div>
              </div>

              {/* Real-Time Drop Menu with Update Button On Top */}
              <div className="w-full">
                <CurrencyExchangeDropdown variant="full" showUpdateButton={true} />
              </div>

              {/* Live Forex Sync Status & Conversion Note */}
              <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Current Base:</span>
                  <span className="font-mono-numbers text-slate-200 font-bold">
                    1 USD = {currentCurr.rateAgainstUSD >= 100 ? currentCurr.rateAgainstUSD.toLocaleString('en-US', { maximumFractionDigits: 0 }) : currentCurr.rateAgainstUSD.toFixed(2)} {currentCurr.code}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {ratesLastUpdated > 0 ? (
                    <span>Last synced: {new Date(ratesLastUpdated).toLocaleTimeString()}</span>
                  ) : (
                    <span>Live forex gateway active</span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Change Background Theme */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <label className="text-xs font-bold text-slate-200 block mb-2">
                Background Theme
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-slate-800 border-cyan-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Moon className="w-4 h-4 text-cyan-400" />
                  <span>Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-slate-100 border-amber-500 text-slate-900 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>White</span>
                </button>
              </div>
            </div>

            {/* 3. Restore Demo Account Button */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-200">
                  Restore Demo Account
                </label>
                <span className="text-xs font-bold font-mono-numbers text-amber-500">
                  {formatCurrency(demoBalance, currency)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleRestoreDemo}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
              >
                <RotateCcw className="w-4 h-4 text-cyan-400" />
                <span>Restore Demo Account ($10,000 USD)</span>
              </button>

              {restoredNotice && (
                <div className="mt-2 p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Demo account restored to $10,000 USD</span>
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveModal('liveBroker')}
                className="py-2 px-2.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Live Broker</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('guide')}
                className="py-2 px-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Guide</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('about')}
                className="py-2 px-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
                <span>About</span>
              </button>
            </div>
          </div>
        ) : (
          /* TRADE HISTORY TAB */
          <div className="space-y-3">
            {/* All Trading Methods Names Filter on top */}
            <div className="p-2 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5 px-1">
                Filter by Trading Method:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setHistoryMethodFilter('all')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                    historyMethodFilter === 'all'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Methods
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryMethodFilter('manual')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                    historyMethodFilter === 'manual'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Manual Trader
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryMethodFilter('bulk')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                    historyMethodFilter === 'bulk'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Bulk Trader
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryMethodFilter('bot')}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                    historyMethodFilter === 'bot'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Bot Trader
                </button>
              </div>
            </div>

            {/* Past Trading Activities Table on bottom */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800 text-xs">
                <span className="font-bold text-slate-300">
                  Past Trading Activities ({filteredHistory.length})
                </span>
                <span className="text-[11px] text-slate-500 font-mono-numbers">
                  Method: {historyMethodFilter.toUpperCase()}
                </span>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No trade history records found for {historyMethodFilter} method.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs font-mono-numbers">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-medium">
                        <th className="pb-2">Time</th>
                        <th className="pb-2">Market</th>
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Method</th>
                        <th className="pb-2">Stake</th>
                        <th className="pb-2">Entry</th>
                        <th className="pb-2">Exit</th>
                        <th className="pb-2 text-right">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredHistory.map(trade => {
                        const isWin = trade.status === 'CLOSED_WIN';
                        return (
                          <tr key={trade.id} className="hover:bg-slate-900/60">
                            <td className="py-2 text-slate-400">
                              {new Date(trade.closeTime || trade.openTime).toLocaleTimeString()}
                            </td>
                            <td className="py-2 font-bold text-slate-200">
                              {trade.assetName}
                            </td>
                            <td className="py-2">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${
                                  trade.type === 'BUY'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-rose-500/20 text-rose-400'
                                }`}
                              >
                                {trade.type}
                              </span>
                            </td>
                            <td className="py-2 text-slate-400 capitalize">
                              {trade.mode === 'bot_manual' ? 'Manual (Bot)' : trade.mode.replace('_', ' ')}
                            </td>
                            <td className="py-2 text-slate-300">
                              {formatCurrency(trade.stakeUSD, currency)}
                            </td>
                            <td className="py-2 text-slate-400">{trade.entryPrice.toFixed(2)}</td>
                            <td className="py-2 text-slate-300 font-semibold">
                              {(trade.exitPrice || trade.currentPrice).toFixed(2)}
                            </td>
                            <td className="py-2 text-right font-bold">
                              <span className={isWin ? 'text-emerald-400' : 'text-rose-400'}>
                                {isWin ? '+' : ''}
                                {formatCurrency(trade.pnlUSD, currency)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
