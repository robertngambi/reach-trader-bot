import React, { useState, useEffect } from 'react';
import { useTrading } from '../../context/TradingContext';
import {
  derivService,
  PRECONFIGURED_API_TOKEN,
  PRECONFIGURED_APP_ID,
  DERIV_FALLBACK_NUMERIC_APP_ID,
} from '../../services/derivService';
import { formatCurrency } from '../../utils/currencies';
import {
  X,
  Lock,
  Unlock,
  Key,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Server,
  Wallet,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

const MASTER_SEC_KEY = 'REACH-TRADER.bot';

export const LiveBrokerModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    accountType,
    setAccountType,
    realBalance,
    demoBalance,
    currency,
    liveBrokerStatus,
    syncBrokerBalance,
  } = useTrading();

  // Unlocked state (session-persisted)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('rt_sec_unlocked') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Configuration Fields
  const [appId, setAppId] = useState<string>(() => {
    return localStorage.getItem('rt_deriv_app_id') || PRECONFIGURED_APP_ID;
  });
  const [apiToken, setApiToken] = useState<string>(() => {
    return localStorage.getItem('rt_deriv_api_token') || PRECONFIGURED_API_TOKEN;
  });
  const [accountId, setAccountId] = useState<string>(() => {
    return localStorage.getItem('rt_deriv_account_id') || 'ROT9256649227';
  });
  const [serverUrl, setServerUrl] = useState<string>(() => {
    return localStorage.getItem('rt_deriv_server') || 'wss://ws.derivws.com/websockets/v3';
  });

  const [showToken, setShowToken] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    if (liveBrokerStatus.loginId && liveBrokerStatus.loginId !== 'DEMO') {
      setAccountId(liveBrokerStatus.loginId);
    }
  }, [liveBrokerStatus.loginId]);

  if (activeModal !== 'liveBroker') return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === MASTER_SEC_KEY) {
      setIsUnlocked(true);
      sessionStorage.setItem('rt_sec_unlocked', 'true');
      setPasswordError(null);
      setPasswordInput('');
    } else {
      setPasswordError('Access denied. Incorrect security credentials.');
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('rt_sec_unlocked');
    setPasswordError(null);
    setPasswordInput('');
  };

  const handleSaveAndConnect = () => {
    localStorage.setItem('rt_deriv_app_id', appId.trim());
    localStorage.setItem('rt_deriv_api_token', apiToken.trim());
    localStorage.setItem('rt_deriv_account_id', accountId.trim());
    localStorage.setItem('rt_deriv_server', serverUrl.trim());

    derivService.setCredentials(appId.trim(), apiToken.trim(), true);
    derivService.connect();

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      derivService.fetchBalance();
    }, 1200);
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    syncBrokerBalance();
    setTimeout(() => setIsSyncing(false), 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setActiveModal(null)}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shrink-0">
            <Server className="w-6 h-6" />
          </div>
          <div className="min-w-0 pr-6">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base sm:text-lg text-slate-100 truncate">
                Deriv Account Configuration
              </h3>
              {isUnlocked && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  Unlocked
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate">
              Gateway connection keys, API token, and broker ledger synchronization
            </p>
          </div>
        </div>

        {/* Live Broker Balance & Status Badge */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 mb-4 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-3 h-3 rounded-full ${
                liveBrokerStatus.isAuthorized
                  ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse'
                  : liveBrokerStatus.isConnected
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
              }`}
            />
            <div>
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <span>Deriv Gateway:</span>
                <span className="text-emerald-400 font-mono">
                  {liveBrokerStatus.isAuthorized
                    ? `Connected (${liveBrokerStatus.loginId || accountId})`
                    : liveBrokerStatus.isConnected
                    ? 'Connected (Awaiting Auth)'
                    : 'Disconnected'}
                </span>
              </div>
              <div className="text-[11px] font-mono-numbers text-slate-400">
                Real Cash Balance: <strong className="text-emerald-400">{formatCurrency(realBalance, currency)}</strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700 text-xs text-slate-300 hover:text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Refresh balance directly from Deriv live servers"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>

        {!isUnlocked ? (
          /* Password Security Box */
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2.5 text-amber-300 font-bold text-sm">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div>Security Verification Required</div>
                <div className="text-[11px] font-normal text-slate-400">
                  Enter your master authorization password to access and edit configuration keys.
                </div>
              </div>
            </div>

            <form onSubmit={handleUnlock} className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Security Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={e => {
                      setPasswordInput(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder="Enter security password to access..."
                    className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 outline-none font-mono tracking-wider transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              {passwordError && (
                <div className="text-xs text-rose-400 font-semibold flex items-center gap-1.5 animate-fadeIn">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Verify & Unlock Configuration</span>
              </button>
            </form>
          </div>
        ) : (
          /* Unlocked Configuration Form: All Boxes in One Clean Page */
          <div className="space-y-3.5 animate-fadeIn">
            {/* Box 1: Deriv App ID */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200">
                  Deriv App ID
                </label>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setAppId(PRECONFIGURED_APP_ID)}
                    className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 font-mono cursor-pointer"
                  >
                    34GgfKy...
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppId(DERIV_FALLBACK_NUMERIC_APP_ID)}
                    className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-emerald-400 font-mono cursor-pointer"
                  >
                    1089
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={appId}
                onChange={e => setAppId(e.target.value)}
                placeholder="e.g. 34GgfKyXUVchTDNkvz8iH or 1089"
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 outline-none"
              />
            </div>

            {/* Box 2: Deriv API Token */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200">
                  Deriv API Token (PAT)
                </label>
                <button
                  type="button"
                  onClick={() => setShowToken(prev => !prev)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                >
                  {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showToken ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <input
                type={showToken ? 'text' : 'password'}
                value={apiToken}
                onChange={e => setApiToken(e.target.value)}
                placeholder="Paste your Deriv API token here..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 outline-none"
              />
            </div>

            {/* Box 3: Target Account ID */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
              <label className="text-xs font-bold text-slate-200 block">
                Authorized Account ID
              </label>
              <input
                type="text"
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                placeholder="e.g. ROT9256649227 or CR..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 outline-none"
              />
            </div>

            {/* Box 4: Server URL */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
              <label className="text-xs font-bold text-slate-200 block">
                WebSocket Gateway URL
              </label>
              <input
                type="text"
                value={serverUrl}
                onChange={e => setServerUrl(e.target.value)}
                placeholder="wss://ws.derivws.com/websockets/v3"
                className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 outline-none"
              />
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSaveAndConnect}
                className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save & Connect Broker</span>
              </button>

              <button
                type="button"
                onClick={handleLock}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Keys</span>
              </button>
            </div>

            {savedSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Configuration saved! Broker stream initialized and balance synchronized.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
