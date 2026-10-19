import React from 'react';
import { useTrading } from '../context/TradingContext';
import { TradingTab } from '../types/trading';
import { SlidersHorizontal, Layers3, Bot } from 'lucide-react';

export const NavigationTabs: React.FC = () => {
  const { activeTab, setActiveTab, isManualBotActive, bulkConfig, botConfig } = useTrading();

  const tabs: {
    id: TradingTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isActiveFlag?: boolean;
  }[] = [
    {
      id: 'manual',
      label: 'Manual Trader',
      icon: SlidersHorizontal,
      isActiveFlag: isManualBotActive,
    },
    {
      id: 'bulk',
      label: 'Bulk Trader',
      icon: Layers3,
      isActiveFlag: bulkConfig.isRunning,
    },
    {
      id: 'bot',
      label: 'Bot Trader',
      icon: Bot,
      isActiveFlag: botConfig.isRunning,
    },
  ];

  return (
    <div className="w-full bg-slate-950 border-b border-slate-800/80 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="grid grid-cols-3 gap-2 sm:gap-3 max-w-2xl mx-auto sm:mx-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border transition-all cursor-pointer select-none text-center sm:text-left active:scale-[0.98] ${
                  isSelected
                    ? 'bg-slate-900 border-emerald-500/70 text-white shadow-lg ring-1 ring-emerald-500/50'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg shrink-0 ${
                    isSelected ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-bold text-xs sm:text-sm tracking-tight truncate">
                    {tab.label}
                  </span>
                  {tab.isActiveFlag && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
