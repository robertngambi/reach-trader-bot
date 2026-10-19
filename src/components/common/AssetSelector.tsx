import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { ChevronDown, Search, Sparkles } from 'lucide-react';
import { MarketAsset } from '../../types/trading';

interface AssetSelectorProps {
  selectedAssetId?: string;
  onSelectAssetId?: (id: string) => void;
  title?: string;
  showAutomaticOption?: boolean;
}

export const AUTOMATIC_MARKET_ASSET: MarketAsset = {
  id: 'automatic',
  name: 'Automatic (Recommended)',
  category: 'All Markets',
  description: 'Automated market scanning and best asset selection',
  currentPrice: 100.0,
  change24h: 0,
  volatilityRate: 1.0,
  is24x7: true,
};

export const AssetSelector: React.FC<AssetSelectorProps> = ({
  selectedAssetId,
  onSelectAssetId,
  title = 'Choose Asset',
  showAutomaticOption = false,
}) => {
  const { markets, selectedMarket, setSelectedMarketId } = useTrading();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const isAutomatic = selectedAssetId === 'automatic';
  const currentAsset = isAutomatic
    ? AUTOMATIC_MARKET_ASSET
    : selectedAssetId
    ? markets.find(m => m.id === selectedAssetId) || selectedMarket
    : selectedMarket;

  const handleSelect = (id: string) => {
    if (onSelectAssetId) {
      onSelectAssetId(id);
    } else {
      setSelectedMarketId(id);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const filteredMarkets = markets.filter(
    m =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full min-w-0">
      <span className="text-xs font-bold text-slate-300 mb-1.5">{title}</span>
      <div className="relative w-full min-w-0">
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className="w-full h-[42px] flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-xs sm:text-sm font-bold text-slate-100 transition-all cursor-pointer shadow-sm text-left truncate min-w-0"
        >
          <div className="flex items-center gap-2 truncate min-w-0">
            <span className="truncate">{currentAsset.name}</span>
            {!isAutomatic && currentAsset.derivSymbol && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 bg-slate-950 text-cyan-300 border-slate-800">
                {currentAsset.derivSymbol}
              </span>
            )}
            {!isAutomatic && currentAsset.is24x7 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono-numbers shrink-0 bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                24/7 Live
              </span>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute left-0 right-0 mt-2 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50 max-h-80 overflow-y-auto max-w-[calc(100vw-2rem)] sm:max-w-full">
              <div className="px-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search asset, Deriv symbol, or category..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent text-slate-200 outline-none text-xs"
                    autoFocus
                  />
                </div>
              </div>

              <div className="divide-y divide-slate-800/60 pt-1">
                {showAutomaticOption && (
                  <button
                    type="button"
                    onClick={() => handleSelect('automatic')}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-800 transition-colors cursor-pointer border-b border-slate-800/60 ${
                      isAutomatic ? 'bg-slate-800/80 font-bold text-slate-100' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-slate-100">
                      <span>Automatic</span>
                      <span className="text-[10px] text-slate-400 font-normal">(Recommended)</span>
                    </div>
                    {isAutomatic && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </button>
                )}
                {filteredMarkets.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleSelect(m.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left hover:bg-slate-800 transition-colors cursor-pointer ${
                      currentAsset.id === m.id ? 'bg-slate-800/80 text-emerald-400 font-bold' : 'text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-100">
                        <span>{m.name}</span>
                        {m.derivSymbol && (
                          <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-slate-950 text-cyan-300 border border-slate-800">
                            {m.derivSymbol}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                        <span>{m.category}</span>
                        <span>•</span>
                        <span className={m.is24x7 ? 'text-emerald-400' : 'text-amber-400'}>
                          {m.is24x7 ? '🟢 24/7 Active' : '🟡 Mon-Fri'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right font-mono-numbers">
                      <div className="text-slate-200">{m.currentPrice.toFixed(m.id === 'forex-eurusd' ? 4 : 2)}</div>
                      <div
                        className={`text-[10px] ${
                          m.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {m.change24h >= 0 ? '+' : ''}
                        {m.change24h}%
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
