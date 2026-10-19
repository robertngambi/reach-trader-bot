import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { PaymentMethodType } from '../../types/trading';
import {
  formatCurrency,
  convertFromUSD,
  convertToUSD,
  MIN_DEPOSIT_USD,
} from '../../utils/currencies';
import {
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ArrowUpCircle,
  ShieldCheck,
  ExternalLink,
  Globe2,
  RefreshCw,
  Coins,
} from 'lucide-react';

export const WithdrawModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    currency,
    realBalance,
    processWithdraw,
    accountType,
    setAccountType,
    liveBrokerStatus,
    syncBrokerBalance,
  } = useTrading();

  const [withdrawMode, setWithdrawMode] = useState<'in-app' | 'broker'>('in-app');
  const [method, setMethod] = useState<PaymentMethodType>('card');
  const [amountUSD, setAmountUSD] = useState<number>(Math.min(realBalance, 50) || 10);
  const [cardNumber, setCardNumber] = useState<string>('4532 •••• •••• 8824');
  const [mobileNumber, setMobileNumber] = useState<string>('+265 99 123 4567');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (activeModal !== 'withdraw') return null;

  const currentLocalAmount = convertFromUSD(amountUSD, currency);

  const handleSyncBroker = () => {
    setIsSyncing(true);
    syncBrokerBalance();
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (amountUSD < MIN_DEPOSIT_USD) {
      setErrorMessage(`Minimum withdrawal is ${formatCurrency(MIN_DEPOSIT_USD, currency)} ($5.00)`);
      return;
    }

    if (realBalance < amountUSD) {
      setErrorMessage(
        `Insufficient real account balance (${formatCurrency(realBalance, currency)} available). Please switch to Real Account or deposit capital.`
      );
      return;
    }

    setIsProcessing(true);
    const details = {
      method,
      amountUSD: amountUSD.toString(),
      account: method === 'card' ? cardNumber : mobileNumber,
    };

    const result = await processWithdraw(amountUSD, method, details);
    setIsProcessing(false);

    if (result.success) {
      setSuccessMessage(
        `Withdrawal of ${formatCurrency(amountUSD, currency)} successfully dispatched via ${
          method === 'card' ? 'Debit Card' : method === 'airtel' ? 'Airtel Money' : 'MTN MoMo'
        }.`
      );
      setTimeout(() => {
        setActiveModal(null);
      }, 1800);
    } else {
      setErrorMessage(result.error || 'Withdrawal could not be completed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={() => setActiveModal(null)}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <ArrowUpCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-lg text-slate-100">
                Withdraw Trading Profits
              </h3>
              {liveBrokerStatus.isAuthorized && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {liveBrokerStatus.loginId}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono-numbers">
              Available Real Balance: {formatCurrency(realBalance, currency)}
            </p>
          </div>
        </div>

        {/* Cashier Mode Switcher */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => setWithdrawMode('in-app')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              withdrawMode === 'in-app'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Instant In-App Payout</span>
          </button>
          <button
            type="button"
            onClick={() => setWithdrawMode('broker')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              withdrawMode === 'broker'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Deriv Broker Cashier & P2P</span>
          </button>
        </div>

        {/* Tab 1: In-App Payout Form */}
        {withdrawMode === 'in-app' && (
          <div>
            {/* Payment Method Selector */}
            <div className="mb-5">
              <label className="text-xs font-bold text-slate-300 block mb-2">
                Withdrawal Destination:
              </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMethod('card')}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                method === 'card'
                  ? 'bg-slate-800 border-cyan-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-5 h-5 mb-1 text-cyan-400" />
              <span className="text-xs font-bold">Debit Card</span>
              <span className="text-[10px] text-slate-500">Direct Refund</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('airtel')}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                method === 'airtel'
                  ? 'bg-slate-800 border-cyan-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-5 h-5 mb-1 text-red-500" />
              <span className="text-xs font-bold">Airtel Money</span>
              <span className="text-[10px] text-slate-500">Mobile Wallet</span>
            </button>

            <button
              type="button"
              onClick={() => setMethod('mtn')}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                method === 'mtn'
                  ? 'bg-slate-800 border-cyan-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-5 h-5 mb-1 text-amber-400" />
              <span className="text-xs font-bold">MTN MoMo</span>
              <span className="text-[10px] text-slate-500">Direct Transfer</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-300">
                Amount to Withdraw:
              </label>
              <button
                type="button"
                onClick={() => setAmountUSD(realBalance)}
                className="text-[11px] text-cyan-400 hover:underline font-bold"
              >
                Withdraw All ({formatCurrency(realBalance, currency)})
              </button>
            </div>

            <div className="relative">
              <input
                type="number"
                step="5"
                min={convertFromUSD(MIN_DEPOSIT_USD, currency)}
                required
                value={Math.round(currentLocalAmount)}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    setAmountUSD(convertToUSD(val, currency));
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-4 py-2.5 text-base font-bold font-mono-numbers text-slate-100 outline-none"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                {currency} (~${amountUSD.toFixed(0)} USD)
              </span>
            </div>
          </div>

          {method === 'card' ? (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300">
                Linked Card for Payout:
              </label>
              <input
                type="text"
                value={cardNumber}
                onChange={e => setCardNumber(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono-numbers text-slate-100 outline-none"
              />
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300">
                {method === 'airtel' ? 'Airtel Money Phone Number' : 'MTN MoMo Registered Line'}
              </label>
              <input
                type="tel"
                value={mobileNumber}
                onChange={e => setMobileNumber(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono-numbers text-slate-100 outline-none"
              />
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-950/40 cursor-pointer active:scale-[0.98]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Withdrawal API Transfer...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm Withdrawal • {formatCurrency(amountUSD, currency)}</span>
                </>
              )}
            </button>
            </div>
          </form>
        </div>
      )}

        {/* Tab 2: Deriv Broker Cashier & P2P Options */}
        {withdrawMode === 'broker' && (
          <div className="space-y-4 text-xs">
            {/* Live Broker Notice */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-slate-200">Official Deriv Broker Payouts</span>
                </div>
                {liveBrokerStatus.isAuthorized ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Connected: {liveBrokerStatus.loginId}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Broker Not Synced
                  </span>
                )}
              </div>
              <p className="text-slate-300 leading-relaxed">
                When trading live with a Deriv broker account, your profits accumulate in your broker balance. Withdrawals are processed through Deriv’s verified payout channels to ensure security and fraud protection.
              </p>
            </div>

            {/* Withdrawal Channels */}
            <div className="space-y-2.5">
              {/* Channel 1: Official Deriv Cashier */}
              <a
                href="https://app.deriv.com/cashier/withdrawal"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-105 transition-transform">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-100 flex items-center gap-1.5">
                      <span>Deriv Cashier Payout</span>
                      <ExternalLink className="w-3 h-3 text-cyan-400" />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Withdraw to Card, Skrill, Neteller, or Crypto (BTC, USDT, etc.)
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-cyan-400 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 shrink-0">
                  Withdraw Funds
                </span>
              </a>

              {/* Channel 2: Deriv P2P (Peer-to-Peer Cash Out) */}
              <a
                href="https://app.deriv.com/cashier/p2p"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-100 flex items-center gap-1.5">
                      <span>Deriv P2P (Sell USD for Cash)</span>
                      <ExternalLink className="w-3 h-3 text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Sell USD balance and receive Airtel Money, MTN MoMo, or Local Bank
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                  Sell on P2P
                </span>
              </a>

              {/* Channel 3: Payment Agents */}
              <a
                href="https://app.deriv.com/cashier/payment-agent"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:scale-105 transition-transform">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-100 flex items-center gap-1.5">
                      <span>Authorized Payment Agents</span>
                      <ExternalLink className="w-3 h-3 text-purple-400" />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Receive local physical cash or instant bank deposit via certified agents
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-purple-400 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 shrink-0">
                  Find Agents
                </span>
              </a>
            </div>

            {/* Sync Live Balance Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSyncBroker}
                disabled={isSyncing}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-98"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Refreshing Real Broker Balance...' : 'Sync & Check Live Balance Now'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
