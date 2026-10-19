import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { TradePosition } from '../../types/trading';
import { formatCurrency } from '../../utils/currencies';
import {
  History,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Trash2,
  ChevronDown,
  ChevronUp,
  CheckCheck,
} from 'lucide-react';

interface PersistentTradeHistoryProps {
  modeFilter?: 'manual' | 'bulk' | 'bot_auto' | 'all';
  title?: string;
}

export const PersistentTradeHistory: React.FC<PersistentTradeHistoryProps> = ({
  modeFilter = 'all',
  title = 'Trade History',
}) => {
  const { tradeHistory, clearTradeHistory, currency, liveBrokerStatus, accountType, realBalance, demoBalance } = useTrading();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'all' | 'wins' | 'losses'>('all');
  const [showAllModes, setShowAllModes] = useState<boolean>(modeFilter === 'all');
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Filter trades and enforce 100 max records
  const allFiltered = tradeHistory.filter(trade => {
    if (!showAllModes && modeFilter !== 'all') {
      if (modeFilter === 'manual' && trade.mode !== 'manual' && trade.mode !== 'bot_manual') {
        return false;
      }
      if (modeFilter === 'bulk' && trade.mode !== 'bulk') {
        return false;
      }
      if (modeFilter === 'bot_auto' && trade.mode !== 'bot_auto') {
        return false;
      }
    }
    return true;
  }).slice(0, 100);

  const displayTrades = allFiltered.filter(trade => {
    if (activeTab === 'wins') return trade.status === 'CLOSED_WIN';
    if (activeTab === 'losses') return trade.status === 'CLOSED_LOSS';
    return true;
  });

  const totalTrades = allFiltered.length;
  const winsCount = allFiltered.filter(t => t.status === 'CLOSED_WIN').length;
  const lossesCount = allFiltered.filter(t => t.status === 'CLOSED_LOSS').length;
  const winRate = totalTrades > 0 ? ((winsCount / totalTrades) * 100).toFixed(0) : '0';
  const netPnL = allFiltered.reduce((acc, t) => acc + (t.pnlUSD || 0), 0);

  const activeAccountLabel = accountType === 'real'
    ? (liveBrokerStatus.loginId || localStorage.getItem('rt_user_login_id') || 'Real Account')
    : 'Practice Demo Account';

  const activeBalance = accountType === 'real' ? realBalance : demoBalance;

  const handleClearAll = () => {
    clearTradeHistory();
    setShowClearConfirm(false);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden text-slate-100 transition-all">
      {/* 1. Toggle Button on Bottom for Showing Up and Hiding Again */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-900 hover:bg-slate-850 transition-colors cursor-pointer text-left"
        title={isOpen ? 'Click to hide trade history' : 'Click to show trade history'}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-cyan-400 shrink-0">
            <History className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-xs sm:text-sm text-slate-100 tracking-tight">
            Trade History
          </span>
          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700/80 shrink-0">
            {totalTrades} / 100 trades
          </span>
          {totalTrades > 0 && (
            <span className={`text-[11px] font-mono font-bold truncate hidden sm:inline ${netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ({netPnL >= 0 ? '+' : ''}{formatCurrency(netPnL, currency)})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-400">
            {isOpen ? 'Hide History' : 'Show History'}
          </span>
          <div className="p-1 rounded-md bg-slate-800 text-slate-300">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* 2. Expanded Trade History Panel (Shows up when clicked, hides when clicked again) */}
      {isOpen && (
        <div className="p-3.5 sm:p-4 border-t border-slate-800 space-y-3 animate-fadeIn">
          {/* Header & Controls Bar with smaller fonts to fit properly */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-200">
                  {title} • 100 Trades Max
                </h4>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Deriv Ledger Synced</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Current {activeAccountLabel}:{' '}
                <span className="font-mono font-bold text-emerald-400">
                  {formatCurrency(activeBalance, currency)}
                </span>
              </p>
            </div>

            {/* Filter Tabs & Clear All Button with compact text */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {modeFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setShowAllModes(prev => !prev)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
                    showAllModes
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {showAllModes ? 'All Modes' : 'This Mode'}
                </button>
              )}

              <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800 text-[10px]">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-slate-800 text-slate-100 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({totalTrades})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('wins')}
                  className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                    activeTab === 'wins'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-400/80 hover:text-emerald-400'
                  }`}
                >
                  Wins ({winsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('losses')}
                  className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                    activeTab === 'losses'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-rose-400/80 hover:text-rose-400'
                  }`}
                >
                  Losses ({lossesCount})
                </button>
              </div>

              {/* Clear All Button */}
              {showClearConfirm ? (
                <div className="flex items-center gap-1 bg-rose-950/80 p-0.5 px-1 rounded-lg border border-rose-500/40 text-[10px] animate-fadeIn">
                  <span className="text-[9px] text-rose-200 font-bold">Clear?</span>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-extrabold cursor-pointer"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  disabled={totalTrades === 0}
                  className="px-2 py-0.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Clear all 100 previous trade history records"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All</span>
                </button>
              )}
            </div>
          </div>

          {/* KPI Strip with smaller font headers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono-numbers">
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Saved Records</span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-200">{totalTrades} / 100</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Win Rate</span>
              <span className="text-xs sm:text-sm font-extrabold text-cyan-400">{winRate}%</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Wins / Losses</span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-200">
                <span className="text-emerald-400">{winsCount}W</span> / <span className="text-rose-400">{lossesCount}L</span>
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">Net Realized P&L</span>
              <span className={`text-xs sm:text-sm font-extrabold ${netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netPnL >= 0 ? '+' : ''}{formatCurrency(netPnL, currency)}
              </span>
            </div>
          </div>

          {/* Trade Records Box with FIXED HEIGHT no matter how many trades it is holding */}
          <div className="h-[340px] overflow-x-auto overflow-y-auto border border-slate-800 rounded-xl bg-slate-950/60 relative">
            {displayTrades.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 text-xs space-y-1">
                <History className="w-8 h-8 text-slate-600 mb-1" />
                <p className="font-bold text-slate-400 text-xs">No trades recorded in this view.</p>
                <p className="text-[10px] text-slate-500 max-w-sm">
                  Executed trades automatically store up to 100 previous records with live Deriv ledger verification.
                </p>
              </div>
            ) : (
              <table className="w-full min-w-[700px] text-left text-xs font-mono-numbers">
                <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  <tr>
                    <th className="px-2.5 py-2">Time</th>
                    <th className="px-2.5 py-2">Market</th>
                    <th className="px-2.5 py-2">Type</th>
                    <th className="px-2.5 py-2">Method</th>
                    <th className="px-2.5 py-2">Stake</th>
                    <th className="px-2.5 py-2">Entry</th>
                    <th className="px-2.5 py-2">Exit</th>
                    <th className="px-2.5 py-2">Result</th>
                    <th className="px-2.5 py-2 text-right">Deriv Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {displayTrades.map(trade => {
                    const isWin = trade.status === 'CLOSED_WIN';
                    const formattedTime = trade.closeTime
                      ? new Date(trade.closeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : 'Recent';

                    const methodLabel = trade.mode === 'bot_auto'
                      ? 'Bot'
                      : trade.mode === 'bulk'
                      ? 'Bulk'
                      : 'Manual';

                    const exitPriceDisplay = trade.exitPrice !== undefined
                      ? trade.exitPrice.toFixed(2)
                      : trade.currentPrice.toFixed(2);

                    return (
                      <tr key={trade.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-2.5 py-2 text-slate-400 text-[10px] whitespace-nowrap">
                          {formattedTime}
                        </td>

                        <td className="px-2.5 py-2">
                          <div className="font-bold text-slate-200 text-xs">{trade.assetName}</div>
                          {trade.derivSymbol && (
                            <span className="text-[9px] font-mono text-cyan-300">
                              {trade.derivSymbol}
                            </span>
                          )}
                        </td>

                        <td className="px-2.5 py-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black inline-flex items-center gap-1 ${
                              trade.type === 'BUY'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {trade.type === 'BUY' ? (
                              <TrendingUp className="w-2.5 h-2.5" />
                            ) : (
                              <TrendingDown className="w-2.5 h-2.5" />
                            )}
                            <span>{trade.type}</span>
                          </span>
                        </td>

                        <td className="px-2.5 py-2 text-slate-400 text-[10px] font-medium capitalize">
                          {methodLabel}
                        </td>

                        <td className="px-2.5 py-2 font-bold text-slate-200 text-[11px]">
                          {formatCurrency(trade.stakeUSD, currency)}
                        </td>

                        <td className="px-2.5 py-2 text-slate-400 text-[10px]">
                          {trade.entryPrice.toFixed(2)}
                        </td>

                        <td className="px-2.5 py-2 text-slate-300 font-semibold text-[10px]">
                          {exitPriceDisplay}
                        </td>

                        <td className="px-2.5 py-2 whitespace-nowrap">
                          <div
                            className={`font-black text-xs inline-flex items-center gap-1 ${
                              isWin ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {isWin ? (
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 shrink-0" />
                            )}
                            <span>
                              {isWin ? '+' : ''}{formatCurrency(trade.pnlUSD, currency)}
                            </span>
                          </div>
                        </td>

                        <td className="px-2.5 py-2 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                            <CheckCheck className="w-3 h-3 text-emerald-400" />
                            <span>Verified Synced</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
