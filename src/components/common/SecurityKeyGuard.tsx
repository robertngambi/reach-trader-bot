import React, { useState } from 'react';
import { Lock, Unlock, Key, Save, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface SecurityKeyGuardProps {
  appId: string;
  onAppIdChange: (val: string) => void;
  apiToken: string;
  onApiTokenChange: (val: string) => void;
  onSaveAndConnect: () => void;
  isConnected?: boolean;
}

// Master authorization constant verified internally without exposing in UI copy
const MASTER_SEC_KEY = 'REACH-TRADER.bot';

export const SecurityKeyGuard: React.FC<SecurityKeyGuardProps> = ({
  appId,
  onAppIdChange,
  apiToken,
  onApiTokenChange,
  onSaveAndConnect,
  isConnected = false,
}) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('rt_sec_unlocked') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.trim() === MASTER_SEC_KEY) {
      setIsUnlocked(true);
      sessionStorage.setItem('rt_sec_unlocked', 'true');
      setErrorMsg(null);
      setPasswordInput('');
    } else {
      setErrorMsg('Access denied. Incorrect security credentials.');
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('rt_sec_unlocked');
    setErrorMsg(null);
  };

  const handleSave = () => {
    onSaveAndConnect();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          {isUnlocked ? (
            <Unlock className="w-4 h-4 text-emerald-400" />
          ) : (
            <Lock className="w-4 h-4 text-amber-400" />
          )}
          <span className="font-bold text-xs sm:text-sm text-slate-100">
            Deriv Gateway Keys Configuration
          </span>
        </div>

        {isUnlocked ? (
          <button
            type="button"
            onClick={handleLock}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] font-bold border border-slate-800 transition-colors cursor-pointer"
          >
            <Lock className="w-3 h-3" />
            <span>Lock</span>
          </button>
        ) : (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            Protected
          </span>
        )}
      </div>

      {!isUnlocked ? (
        /* Password Security Gate Form */
        <form onSubmit={handleUnlock} className="space-y-3 py-2">
          <p className="text-xs text-slate-400 leading-relaxed">
            Enter master authorization key to view and edit Deriv broker API credentials.
          </p>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="password"
                value={passwordInput}
                onChange={e => {
                  setPasswordInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Enter authorization key..."
                className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 outline-none transition-colors"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Unlock</span>
            </button>
          </div>

          {errorMsg && (
            <div className="text-[11px] text-rose-400 font-medium flex items-center gap-1.5 animate-fadeIn">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </form>
      ) : (
        /* Unlocked Editable Configuration Keys */
        <div className="space-y-3 pt-1 animate-fadeIn">
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Deriv App ID
            </label>
            <input
              type="text"
              value={appId}
              onChange={e => onAppIdChange(e.target.value.trim())}
              placeholder="e.g. 34GgfKyXUVchTDNkvz8iH or 1089"
              className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Deriv API Token (PAT or Legacy Token)
            </label>
            <input
              type="text"
              value={apiToken}
              onChange={e => onApiTokenChange(e.target.value.trim())}
              placeholder="e.g. pat_6aa3bd..."
              className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Connect Broker</span>
            </button>

            {savedNotice && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Configuration saved & live stream established!</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleLock}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer ml-auto"
            >
              Lock Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
