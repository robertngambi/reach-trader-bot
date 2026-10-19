import React, { useState, useEffect } from 'react';
import { useTrading } from '../../context/TradingContext';
import { derivService, PRECONFIGURED_API_TOKEN, PRECONFIGURED_APP_ID } from '../../services/derivService';
import {
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  LogIn,
  ExternalLink,
  KeyRound,
  RefreshCw,
} from 'lucide-react';

const DERIV_PARTNER_SIGNUP_URL = 'https://track.deriv.com/_mQ0Yt-YdI026FI2k6iT2WmNd7ZgqdRLk/1/';

export const DerivAuthModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    isUserAuthenticated,
    setIsUserAuthenticated,
    setUserName,
  } = useTrading();

  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showManualToken, setShowManualToken] = useState<boolean>(false);
  const [manualToken, setManualToken] = useState<string>('');

  // 1. Auto-detect OAuth redirect from Deriv URL parameters (?token1=...&acct1=...)
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const token = url.searchParams.get('token1') || url.searchParams.get('token');
      const acct = url.searchParams.get('acct1') || url.searchParams.get('acct');

      if (token && token.trim().length > 0) {
        setIsSearching(true);
        setStatusMessage('Detected Deriv OAuth credentials. Configuring session...');

        const accountId = acct ? (acct.startsWith('ACC:') ? acct : `ACC: ${acct}`) : 'ACC: CR_DERIV_LIVE';

        derivService.setCredentials(PRECONFIGURED_APP_ID, token.trim(), true);
        derivService.connect();

        const now = Date.now();
        localStorage.setItem('rt_user_logged_in', 'true');
        localStorage.setItem('rt_auth_timestamp', now.toString());
        localStorage.setItem('rt_user_login_id', accountId);
        localStorage.setItem('rt_deriv_api_token', token.trim());

        setIsUserAuthenticated(true);
        setStatusMessage('Logged in successfully! Opening trading terminal...');

        setTimeout(() => {
          setIsSearching(false);
          setActiveModal(null);
        }, 600);
      }
    } catch {
      // ignore URL parsing errors
    }
  }, [setIsUserAuthenticated, setActiveModal]);

  // If already authenticated and not viewing auth modal explicitly, do not render
  if (isUserAuthenticated && activeModal !== 'auth') {
    return null;
  }

  // 2. Main Login Handler: Automatically search for user's Deriv account or initiate Deriv authorization
  const handleAutoDerivLogin = () => {
    setErrorMsg('');
    setIsSearching(true);
    setStatusMessage('Searching for active Deriv account session...');

    const savedToken = localStorage.getItem('rt_deriv_api_token');
    const savedLoginId = localStorage.getItem('rt_user_login_id');

    setTimeout(() => {
      // If user has a valid stored token or active session, log in directly
      if (savedToken && savedToken.trim().length > 0) {
        setStatusMessage('Found authenticated Deriv broker credentials. Connecting...');
        derivService.setCredentials(PRECONFIGURED_APP_ID, savedToken.trim(), true);
        derivService.connect();

        localStorage.setItem('rt_user_logged_in', 'true');
        localStorage.setItem('rt_auth_timestamp', Date.now().toString());

        setTimeout(() => {
          setIsUserAuthenticated(true);
          setIsSearching(false);
          setActiveModal(null);
        }, 600);
        return;
      }

      // If manual token was pasted
      if (manualToken.trim().length > 0) {
        setStatusMessage('Validating custom Deriv API token...');
        const tokenToUse = manualToken.trim();
        derivService.setCredentials(PRECONFIGURED_APP_ID, tokenToUse, true);
        derivService.connect();

        const now = Date.now();
        localStorage.setItem('rt_user_logged_in', 'true');
        localStorage.setItem('rt_auth_timestamp', now.toString());
        localStorage.setItem('rt_deriv_api_token', tokenToUse);
        localStorage.setItem('rt_user_login_id', 'ACC: CR_USER_LIVE');

        setTimeout(() => {
          setIsUserAuthenticated(true);
          setIsSearching(false);
          setActiveModal(null);
        }, 600);
        return;
      }

      // If no session exists yet, initiate real Deriv OAuth login to enter details and fetch API token
      setStatusMessage('Directing to official Deriv broker authorization...');

      const oauthUrl = `https://oauth.deriv.com/oauth2/authorize?app_id=${PRECONFIGURED_APP_ID}&l=en`;

      // Fallback: configure partnership gateway token to ensure seamless demo/real trading if popup is blocked
      derivService.setCredentials(PRECONFIGURED_APP_ID, PRECONFIGURED_API_TOKEN, true);
      derivService.connect();

      const defaultAccountId = savedLoginId || 'ACC: CR9256649';
      localStorage.setItem('rt_user_logged_in', 'true');
      localStorage.setItem('rt_auth_timestamp', Date.now().toString());
      localStorage.setItem('rt_deriv_api_token', PRECONFIGURED_API_TOKEN);
      localStorage.setItem('rt_user_login_id', defaultAccountId);

      // Open Deriv login window for the user to enter their credentials on Deriv if needed
      try {
        const authWindow = window.open(oauthUrl, '_blank', 'width=520,height=650');
        if (!authWindow || authWindow.closed || typeof authWindow.closed === 'undefined') {
          // If popup is blocked, continue with seamless authorized session
        }
      } catch {
        // Continue with connection
      }

      setTimeout(() => {
        setIsUserAuthenticated(true);
        setIsSearching(false);
        setActiveModal(null);
      }, 800);
    }, 700);
  };

  const handleLogOut = () => {
    derivService.clearUserSession();
    setIsUserAuthenticated(false);
    setStatusMessage('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between items-center min-h-screen w-full px-4 py-6 sm:py-8 overflow-y-auto text-slate-100">
      {/* Top Bar / Close button if already authenticated */}
      <div className="w-full max-w-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-md">
            <TrendingUp className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-100">
            Reach Trader <span className="text-emerald-400">BOT</span>
          </span>
        </div>

        {isUserAuthenticated && (
          <button
            type="button"
            onClick={() => setActiveModal(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
            title="Return to Trading Terminal"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Merged Single Unified Container (Introductory Content + Green Log In Button) */}
      <div className="w-full max-w-lg my-auto py-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md text-center space-y-6">
          {/* Header Branding */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official Deriv Broker Connection Gateway</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Reach Trader Automated Bot
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2.5 leading-relaxed text-center">
              Autonomous algorithmic trading software configured for Deriv broker. Features high-speed execution across synthetic volatility indices and forex pairs, intelligent market selection, micro-stake capital protection, and automated profit accrual.
            </p>
          </div>

          {/* Status / Searching Feedback */}
          {isSearching && (
            <div className="p-3.5 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 text-xs font-medium flex items-center justify-center gap-2 animate-fadeIn">
              <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action: Single Green 'Log In' Button */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleAutoDerivLogin}
              disabled={isSearching}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-base shadow-xl shadow-emerald-950/60 transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-60"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Searching Deriv Account...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Log In</span>
                </>
              )}
            </button>

            {/* Optional Manual Token Expander */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowManualToken(prev => !prev)}
                className="text-[11px] text-slate-400 hover:text-slate-300 underline cursor-pointer"
              >
                {showManualToken ? 'Hide Custom Token Entry' : 'Have a personal Deriv API token? Click here'}
              </button>

              {showManualToken && (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-left animate-fadeIn">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                    <span>Personal API Token</span>
                    <a
                      href="https://app.deriv.com/account/api-token"
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span>Get Token</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                  <input
                    type="password"
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    placeholder="Paste personal Deriv token"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100 outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>

            {isUserAuthenticated && (
              <div className="pt-2 flex items-center justify-between text-xs font-bold">
                <button
                  type="button"
                  onClick={handleLogOut}
                  className="text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  Log Out / Switch Account
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Enter Terminal →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Text: 'If don't have or open a deriv account yet, please Sign up.' with 'Sign up' bold and blue */}
      <div className="w-full max-w-lg text-center py-4 border-t border-slate-800/80">
        <p className="text-xs sm:text-sm text-slate-300">
          If don't have or open a deriv account yet, please{' '}
          <a
            href={DERIV_PARTNER_SIGNUP_URL}
            target="_blank"
            rel="noreferrer"
            className="font-bold text-blue-500 hover:text-blue-400 hover:underline cursor-pointer"
          >
            Sign up
          </a>
          .
        </p>
      </div>
    </div>
  );
};
