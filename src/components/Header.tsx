import React from 'react';
import { useTrading } from '../context/TradingContext';
import { formatCurrency } from '../utils/currencies';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Settings,
  HelpCircle,
  Info,
  Sun,
  Moon,
  TrendingUp,
  RotateCw,
  RotateCcw,
  Globe2,
  User,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    accountType,
    setAccountType,
    currentBalance,
    currency,
    theme,
    toggleTheme,
    setActiveModal,
    isScreenRotated,
    toggleScreenRotation,
    liveBrokerStatus,
    isUserAuthenticated,
  } = useTrading();

  const userAccName = localStorage.getItem('rt_user_login_id') || liveBrokerStatus.loginId || 'ROT9256649227';
  const activeAccountId = userAccName.replace(/^ACC:\s*/i, '');

  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black">
                <TrendingUp className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-100">
                    Reach Trader
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    BOT
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Actions Quick Bar */}
            <div className="flex sm:hidden items-center gap-1.5">
              {/* Rotate Screen Button for Mobile - Just a symbol */}
              <button
                type="button"
                onClick={toggleScreenRotation}
                className={`p-2 rounded-lg border transition-all cursor-pointer ${
                  isScreenRotated
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title={isScreenRotated ? 'Unrotate Screen' : 'Rotate Screen'}
              >
                {isScreenRotated ? (
                  <RotateCcw className="w-4 h-4 text-white" />
                ) : (
                  <RotateCw className="w-4 h-4 text-cyan-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('liveBroker')}
                className="p-2 rounded-lg bg-slate-800 text-cyan-400 hover:text-white border border-cyan-500/20"
                title="Live Broker"
              >
                <Globe2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                title="Toggle Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-200" />}
              </button>
              <button
                type="button"
                onClick={() => setActiveModal('settings')}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Account Balance & Controls */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
            {/* Deriv Account ID in Green Color - Compact, ACC: prefix, no outline border, NO background color */}
            <button
              type="button"
              onClick={() => setActiveModal('liveBroker')}
              className="flex items-center gap-1.5 px-1 py-1 rounded-lg bg-transparent hover:bg-transparent transition-all cursor-pointer group outline-none focus:outline-none border-0"
              title={`Deriv Broker Account: ACC: ${activeAccountId} (Click for Broker details)`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-mono font-semibold text-[10px] sm:text-[11px] text-emerald-400 tracking-wider group-hover:text-emerald-300 transition-colors">
                ACC: {activeAccountId}
              </span>
            </button>

            {/* Deriv Auth / Referral Portal Button */}
            <button
              type="button"
              onClick={() => setActiveModal('auth')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] sm:text-[11px] font-bold border border-slate-800 transition-colors cursor-pointer"
              title="Deriv Account Auth / Switch Account / Sign Up Referral"
            >
              <User className="w-3 h-3 text-cyan-400" />
              <span>{isUserAuthenticated ? 'Deriv Portal' : 'Log In'}</span>
            </button>

            {/* Unified Compact Account Container */}
            <div className="flex flex-col bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 shadow-inner min-w-[130px]">
              {/* Top: reduced size switcher renamed as just 'demo' and 'real' */}
              <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800/80 mb-1">
                <button
                  type="button"
                  onClick={() => setAccountType('demo')}
                  className={`flex-1 py-0.5 px-2 rounded-md text-[11px] font-bold transition-all cursor-pointer text-center capitalize ${
                    accountType === 'demo'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  demo
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType('real')}
                  className={`flex-1 py-0.5 px-2 rounded-md text-[11px] font-bold transition-all cursor-pointer text-center capitalize ${
                    accountType === 'real'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  real
                </button>
              </div>

              {/* Bottom: Account amount available */}
              <div className="flex items-center justify-between gap-1.5 px-0.5">
                <div className="flex items-center gap-1">
                  <Wallet className={`w-3 h-3 shrink-0 ${accountType === 'demo' ? 'text-[#b45309]' : 'text-emerald-400'}`} />
                  {liveBrokerStatus.isAuthorized && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
                      title={`Live Broker Connected (${liveBrokerStatus.loginId})`}
                    />
                  )}
                </div>
                <span
                  className={`font-mono-numbers font-bold text-xs sm:text-sm truncate text-right ${
                    accountType === 'demo' ? 'text-[#b45309]' : 'text-emerald-400'
                  }`}
                >
                  {formatCurrency(currentBalance, currency)}
                </span>
              </div>
            </div>

            {/* Deposit & Withdraw Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveModal('deposit')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Deposit Funds"
              >
                <ArrowDownCircle className="w-3.5 h-3.5" />
                <span>Deposit</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('withdraw')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all active:scale-95 cursor-pointer"
                title="Withdraw Funds"
              >
                <ArrowUpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Withdraw</span>
              </button>
            </div>

            {/* Desktop Action Icons */}
            <div className="hidden sm:flex items-center gap-1.5">
              {/* Rotate Screen Button for Desktop - Just a symbol */}
              <button
                type="button"
                onClick={toggleScreenRotation}
                className={`p-2 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                  isScreenRotated
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:text-white'
                }`}
                title={isScreenRotated ? 'Unrotate Screen' : 'Rotate Screen'}
              >
                {isScreenRotated ? (
                  <RotateCcw className="w-4 h-4 text-white" />
                ) : (
                  <RotateCw className="w-4 h-4 text-cyan-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('liveBroker')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer font-bold text-xs ${
                  liveBrokerStatus.isAuthorized
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                    : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white border-cyan-500/30'
                }`}
                title={
                  liveBrokerStatus.isAuthorized
                    ? `Live Broker Synced: ${liveBrokerStatus.loginId}`
                    : 'Connect Live Broker (Deriv API)'
                }
              >
                {liveBrokerStatus.isAuthorized ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ) : (
                  <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>{liveBrokerStatus.isAuthorized ? liveBrokerStatus.loginId || 'Live' : 'Live Broker'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('guide')}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors cursor-pointer"
                title="Quick User Guide"
              >
                <HelpCircle className="w-4 h-4 text-cyan-400" />
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('about')}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors cursor-pointer"
                title="About App"
              >
                <Info className="w-4 h-4 text-slate-300" />
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors cursor-pointer"
                title="Change Background Theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-200" />}
              </button>

              <button
                type="button"
                onClick={() => setActiveModal('settings')}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-colors cursor-pointer"
                title="Settings & Currency"
              >
                <Settings className="w-4 h-4 text-slate-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
