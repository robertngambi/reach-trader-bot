import React, { useState, useRef, useEffect } from 'react';
import { useTrading } from '../../context/TradingContext';
import { CURRENCIES, formatCurrency } from '../../utils/currencies';
import { CurrencyCode } from '../../types/trading';
import { ChevronDown, RefreshCw, Check, ArrowRightLeft, Clock } from 'lucide-react';

interface CurrencyExchangeDropdownProps {
  variant?: 'topbar' | 'compact' | 'full';
  showUpdateButton?: boolean;
}

export const CurrencyExchangeDropdown: React.FC<CurrencyExchangeDropdownProps> = ({
  variant = 'topbar',
  showUpdateButton = true,
}) => {
  const {
    currency,
    setCurrency,
    currencyRates,
    ratesLastUpdated,
    isFetchingRates,
    refreshCurrencyRates,
  } = useTrading();

  const [isOpen, setIsOpen] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleUpdate = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await refreshCurrencyRates();
      setJustUpdated(true);
      setTimeout(() => setJustUpdated(false), 2000);
    } catch {
      // Handled in service
    }
  };

  const currentInfo = CURRENCIES[currency] || CURRENCIES.USD;
  const currentRate = currencyRates[currency] || currentInfo.rateAgainstUSD || 1.0;

  // Format last updated timestamp
  const formatTime = (ts: number) => {
    if (!ts || ts === 0) return 'Syncing...';
    const now = Date.now();
    const diffSec = Math.floor((now - ts) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div ref={containerRef} className="relative inline-flex items-center gap-1.5 z-30">
      {/* Dropdown Menu Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`group flex items-center gap-2 rounded-xl border transition-all cursor-pointer select-none ${
          variant === 'full'
            ? 'w-full justify-between px-3.5 py-2.5 bg-slate-900 hover:bg-slate-850 border-slate-750 text-slate-100 shadow-sm'
            : variant === 'compact'
            ? 'px-2 py-1 bg-slate-800/90 hover:bg-slate-750 border-slate-700/80 text-slate-200 text-xs shadow-sm'
            : 'px-2.5 py-1.5 bg-slate-900/95 hover:bg-slate-850 border-slate-750 text-slate-100 text-xs shadow-inner hover:border-slate-600'
        }`}
        title={`Current Currency: ${currentInfo.name} (${currentInfo.code}). Click to change.`}
      >
        <div className="flex items-center gap-2 truncate">
          <span className="text-sm leading-none shrink-0" role="img" aria-label={currentInfo.country}>
            {currentInfo.flag}
          </span>
          <div className="flex items-baseline gap-1.5 truncate">
            <span className="font-bold text-slate-100 tracking-wide text-xs">
              {currentInfo.code}
            </span>
            {/* Live Exchange Rate preview against USD */}
            {currency !== 'USD' && (
              <span className="hidden md:inline-block font-mono-numbers text-[10px] text-emerald-400 font-semibold truncate">
                ≈ {currentInfo.symbol} {currentRate >= 100 ? currentRate.toLocaleString('en-US', { maximumFractionDigits: 0 }) : currentRate.toFixed(2)}
              </span>
            )}
            {currency === 'USD' && (
              <span className="hidden md:inline-block text-[10px] text-cyan-400 font-medium">
                Base ($)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {/* Live indicator dot */}
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
            title="Real-time forex connection active"
          />
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 group-hover:text-slate-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Real-time Update Button */}
      {showUpdateButton && (
        <button
          type="button"
          onClick={handleUpdate}
          disabled={isFetchingRates}
          className={`relative flex items-center justify-center gap-1 rounded-xl border transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
            variant === 'full'
              ? 'px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs border-slate-700'
              : variant === 'compact'
              ? 'p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              : 'px-2.5 py-1.5 bg-slate-800/90 hover:bg-slate-750 text-slate-200 border-slate-700 text-xs font-bold active:scale-95 shadow-sm'
          } ${justUpdated ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' : ''}`}
          title={`Click to update real-time forex exchange rates against USD. Last updated: ${formatTime(
            ratesLastUpdated
          )}`}
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-cyan-400 transition-colors ${
              isFetchingRates ? 'animate-spin text-emerald-400' : 'group-hover:text-cyan-300'
            } ${justUpdated ? 'text-emerald-300' : ''}`}
          />
          <span className="hidden sm:inline font-bold text-[11px]">
            {isFetchingRates ? 'Syncing...' : justUpdated ? 'Updated' : 'Update'}
          </span>
        </button>
      )}

      {/* Floating Dropdown Menu Popover */}
      {isOpen && (
        <div
          className={`absolute left-0 mt-2 top-full w-72 sm:w-80 rounded-2xl bg-slate-900 border border-slate-750 shadow-2xl p-2 z-50 animate-fadeIn backdrop-blur-xl ${
            variant === 'full' ? 'left-0 right-0 w-auto' : ''
          }`}
          role="listbox"
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between px-2.5 py-2 border-b border-slate-800 mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-200">Real-Time Exchange</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                Live Forex
              </span>
            </div>

            <button
              type="button"
              onClick={handleUpdate}
              disabled={isFetchingRates}
              className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh rates from global API"
            >
              <RefreshCw className={`w-3 h-3 ${isFetchingRates ? 'animate-spin' : ''}`} />
              <span>{isFetchingRates ? 'Syncing...' : 'Update'}</span>
            </button>
          </div>

          {/* Subtitle / Last Updated Status */}
          <div className="flex items-center justify-between px-2.5 py-1 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>Synced {formatTime(ratesLastUpdated)}</span>
            </span>
            <span className="text-slate-500">Auto-syncs every 5m</span>
          </div>

          {/* Currencies List */}
          <div className="space-y-1 mt-1 max-h-64 overflow-y-auto pr-0.5">
            {Object.values(CURRENCIES).map((c) => {
              const liveRate = currencyRates[c.code] || c.rateAgainstUSD || 1.0;
              const isSelected = currency === c.code;

              return (
                <button
                  key={c.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setCurrency(c.code as CurrencyCode);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer group ${
                    isSelected
                      ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                      : 'hover:bg-slate-800/80 text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg leading-none shrink-0" role="img" aria-label={c.country}>
                      {c.flag}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-300">
                          {c.code}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[110px]">
                          {c.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {c.country} ({c.symbol})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-mono-numbers text-[11px] font-bold text-slate-200">
                        {c.code === 'USD' ? (
                          <span className="text-emerald-400 font-bold">$1.00 USD</span>
                        ) : (
                          `${c.symbol} ${
                            liveRate >= 100
                              ? liveRate.toLocaleString('en-US', { maximumFractionDigits: 0 })
                              : liveRate.toFixed(2)
                          }`
                        )}
                      </span>
                      {c.code !== 'USD' && (
                        <span className="text-[9px] text-slate-400 font-mono-numbers">
                          per $1 USD
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Notice Footer */}
          <div className="mt-2 pt-2 border-t border-slate-800 px-2.5 pb-1 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <ArrowRightLeft className="w-3 h-3 text-cyan-400" />
              <span>Real-time conversion applied bot-wide</span>
            </span>
            <span className="font-mono-numbers text-slate-500">6 Currencies</span>
          </div>
        </div>
      )}
    </div>
  );
};
