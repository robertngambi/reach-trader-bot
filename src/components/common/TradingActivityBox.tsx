import React, { useState, useEffect } from 'react';
import { useTrading } from '../../context/TradingContext';
import { TradePosition } from '../../types/trading';
import { formatCurrency } from '../../utils/currencies';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface TradingActivityBoxProps {
  mode: 'manual' | 'bulk' | 'bot_auto';
  title?: string;
  isRunning?: boolean;
}

export const TradingActivityBox: React.FC<TradingActivityBoxProps> = ({
  mode,
  title = 'Live Trading Activity',
  isRunning,
}) => {
  const { activeTrades, tradeHistory, currency } = useTrading();
  const [isMinimized, setIsMinimized] = useState(false);
  const [dismissedSessionId, setDismissedSessionId] = useState<string | null>(null);

  // Active trades belonging to this mode
  const currentActive = activeTrades.filter(
    t => t.mode === mode || (mode === 'manual' && t.mode === 'bot_manual')
  );

  // Recent completed trades for this mode (within last 15 seconds)
  const recentClosed = tradeHistory
    .filter(
      t =>
        (t.mode === mode || (mode === 'manual' && t.mode === 'bot_manual')) &&
        Date.now() - (t.closeTime || 0) < 15000
    )
    .slice(0, 10);

  // Update session trades when active trades exist
  useEffect(() => {
    if (currentActive.length > 0) {
      setDismissedSessionId(null);
      setIsMinimized(false);
    }
  }, [currentActive.length]);

  // If trade is stopped explicitly (isRunning === false) and no active trades exist, disappear immediately!
  if (isRunning === false && currentActive.length === 0) {
    return null;
  }

  // If no active trades and no recent closed trades, or user dismissed, don't show
  const hasContent = currentActive.length > 0 || (isRunning !== false && recentClosed.length > 0);
  if (!hasContent || dismissedSessionId === 'dismissed') {
    return null;
  }

  const allTrades = [...currentActive, ...recentClosed];
  const totalTradesCount = allTrades.length;
  const completedCount = recentClosed.length;
  const isAllDone = currentActive.length === 0 && recentClosed.length > 0;

  const totalPnL = allTrades.reduce((acc, t) => acc + t.pnlUSD, 0);

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-50 w-[94vw] sm:w-[380px] max-w-full bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden animate-fadeIn text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-950/95 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
          <span className="font-extrabold text-[11px] tracking-tight text-slate-100 truncate max-w-[190px]">
            {title}
          </span>
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
              isAllDone
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 animate-pulse'
            }`}
          >
            {isAllDone ? 'Finished' : `${currentActive.length} Active`}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized(prev => !prev)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </button>
          <button
            type="button"
            onClick={() => setDismissedSessionId('dismissed')}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-2.5 space-y-2 max-h-72 overflow-y-auto">
          {/* Progress & Session Status Banner */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 font-mono-numbers text-[11px]">
            <div>
              <span className="text-[9px] text-slate-400 block uppercase font-bold leading-none mb-0.5">
                {isAllDone ? 'Session Finished' : 'Trades Progress'}
              </span>
              <span className="font-bold text-slate-200 text-[10px]">
                {isAllDone
                  ? `All ${completedCount} trades executed`
                  : `Step ${completedCount + 1} of ${totalTradesCount}`}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[9px] text-slate-400 block uppercase font-bold leading-none mb-0.5">
                Net P&L
              </span>
              <span
                className={`font-black text-xs ${
                  totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {totalPnL >= 0 ? '+' : ''}
                {formatCurrency(totalPnL, currency)}
              </span>
            </div>
          </div>

          {/* List of Step-by-Step Trades */}
          <div className="space-y-1">
            {allTrades.map((trade, idx) => {
              const isClosed = trade.status !== 'OPEN';
              const isWin = trade.status === 'CLOSED_WIN';
              const isFavorable = trade.pnlUSD >= 0;

              return (
                <div
                  key={trade.id}
                  className={`p-1.5 rounded-lg border flex items-center justify-between text-[10px] font-mono-numbers transition-all ${
                    isClosed
                      ? isWin
                        ? 'bg-emerald-950/25 border-emerald-500/30'
                        : 'bg-rose-950/25 border-rose-500/30'
                      : 'bg-slate-950 border-slate-800 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[9px] text-slate-500 font-bold shrink-0 w-3.5">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span
                          className={`text-[8px] font-extrabold px-1 py-0.2 rounded shrink-0 ${
                            trade.type === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {trade.type}
                        </span>
                        <span className="font-bold text-slate-200 text-[10px] truncate">
                          {trade.assetName}
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">
                        {formatCurrency(trade.stakeUSD, currency)} • Entry: {trade.entryPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Status / Ticks / Outcome */}
                  <div className="text-right shrink-0 pl-1.5">
                    {isClosed ? (
                      <div className="flex items-center gap-0.5 justify-end">
                        {isWin ? (
                          <span className="flex items-center gap-0.5 text-emerald-400 font-extrabold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            +{formatCurrency(trade.pnlUSD, currency)} WIN
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-rose-400 font-extrabold text-[10px]">
                            <XCircle className="w-3 h-3 shrink-0" />
                            {formatCurrency(trade.pnlUSD, currency)} LOSS
                          </span>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-1 justify-end text-cyan-400 font-bold text-[9px]">
                          <Clock className="w-2.5 h-2.5 animate-spin shrink-0" />
                          <span>{trade.ticksRemaining}t left</span>
                        </div>
                        <span
                          className={`text-[9px] font-bold ${
                            isFavorable ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isFavorable ? '+' : ''}
                          {formatCurrency(trade.pnlUSD, currency)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dismiss button when all done */}
          {isAllDone && (
            <button
              type="button"
              onClick={() => setDismissedSessionId('dismissed')}
              className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold transition-colors cursor-pointer"
            >
              Dismiss Activity Log
            </button>
          )}
        </div>
      )}
    </div>
  );
};
