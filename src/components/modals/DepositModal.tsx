import React, { useState } from 'react';
import { useTrading } from '../../context/TradingContext';
import { PaymentMethodType } from '../../types/trading';
import {
  formatCurrency,
  convertFromUSD,
  convertToUSD,
  MIN_DEPOSIT_USD,
  MAX_DEPOSIT_USD,
} from '../../utils/currencies';
import {
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ShieldCheck,
  ArrowDownCircle,
  Globe2,
  ExternalLink,
  RefreshCw,
  Coins,
} from 'lucide-react';

export const DepositModal: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    currency,
    processDeposit,
    accountType,
    setAccountType,
    liveBrokerStatus,
    syncBrokerBalance,
  } = useTrading();

  const [depositMode, setDepositMode] = useState<'in-app' | 'broker'>('in-app');
  const [method, setMethod] = useState<PaymentMethodType>('card');
  const [amountUSD, setAmountUSD] = useState<number>(50.0);
  const [cardNumber, setCardNumber] = useState<string>('4532 •••• •••• 8824');
  const [cardExpiry, setCardExpiry] = useState<string>('08/28');
  const [cardCvv, setCardCvv] = useState<string>('342');
  const [cardName, setCardName] = useState<string>('Trader Robert');
  const [mobileNumber, setMobileNumber] = useState<string>('+265 99 123 4567');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (activeModal !== 'deposit') return null;

  const minLocal = convertFromUSD(MIN_DEPOSIT_USD, currency);
  const maxLocal = convertFromUSD(MAX_DEPOSIT_USD, currency);
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
    if (amountUSD < MIN_DEPOSIT_USD || amountUSD > MAX_DEPOSIT_USD) return;

    setIsProcessing(true);
    setSuccessMessage(null);

    const details: Record<string, string> = {
      method,
      amountUSD: amountUSD.toString(),
      ...(method === 'card'
        ? { cardNumber, cardExpiry, cardCvv, cardName }
        : { mobileNumber }),
    };

    const success = await processDeposit(amountUSD, method, details);
    setIsProcessing(false);

    if (success) {
      setSuccessMessage(
        `Successfully deposited ${formatCurrency(amountUSD, currency)} via ${
          method === 'card' ? 'Debit Card' : method === 'airtel' ? 'Airtel Money' : 'MTN MoMo'
        }!`
      );
      // Auto switch to real account so user sees their new balance
      setAccountType('real');
      setTimeout(() => {
        setActiveModal(null);
      }, 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setActiveModal(null)}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ArrowDownCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-lg text-slate-100">
                Deposit Trading Capital
              </h3>
              {liveBrokerStatus.isAuthorized && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {liveBrokerStatus.loginId}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Fund your balance via Instant In-App Gateways or Official Deriv Cashier
            </p>
          </div>
        </div>

        {/* Cashier Mode Switcher */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => setDepositMode('in-app')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              depositMode === 'in-app'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Instant In-App Gateway</span>
          </button>
          <button
            type="button"
            onClick={() => setDepositMode('broker')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              depositMode === 'broker'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Deriv Broker Cashier & P2P</span>
          </button>
        </div>

        {/* Tab 1: Instant In-App Form */}
        {depositMode === 'in-app' && (
          <div>
            {/* Payment Method Option Buttons */}
            <div className="mb-5">
              <label className="text-xs font-bold text-slate-300 block mb-2">
                Select Payment Gateway:
              </label>
          <div className="grid grid-cols-3 gap-2">
            {/* Debit Card Option */}
            <button
              type="button"
              onClick={() => setMethod('card')}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                method === 'card'
                  ? 'bg-slate-800 border-emerald-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-5 h-5 mb-1 text-cyan-400" />
              <span className="text-xs font-bold">Debit Card</span>
              <span className="text-[10px] text-slate-500">Visa / Mastercard</span>
            </button>

            {/* Airtel Money Option */}
            <button
              type="button"
              onClick={() => {
                setMethod('airtel');
                if (!mobileNumber) setMobileNumber('+265 99 123 4567');
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                method === 'airtel'
                  ? 'bg-slate-800 border-emerald-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-5 h-5 mb-1 text-red-500" />
              <span className="text-xs font-bold">Airtel Money</span>
              <span className="text-[10px] text-slate-500">Instant USSD API</span>
            </button>

            {/* MTN MoMo Option */}
            <button
              type="button"
              onClick={() => {
                setMethod('mtn');
                if (!mobileNumber) setMobileNumber('+27 83 123 4567');
              }}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                method === 'mtn'
                  ? 'bg-slate-800 border-emerald-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-5 h-5 mb-1 text-amber-400" />
              <span className="text-xs font-bold">MTN MoMo</span>
              <span className="text-[10px] text-slate-500">Push Payment API</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Selection & Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-300">
                Deposit Amount:
              </label>
              <span className="text-[11px] text-slate-400 font-mono-numbers">
                Min: {formatCurrency(MIN_DEPOSIT_USD, currency)} • Max: {formatCurrency(MAX_DEPOSIT_USD, currency)}
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                step="5"
                min={minLocal}
                max={maxLocal}
                required
                value={Math.round(currentLocalAmount)}
                onChange={e => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    setAmountUSD(convertToUSD(val, currency));
                  }
                }}
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-base font-bold font-mono-numbers text-slate-100 outline-none"
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                {currency} (~${amountUSD.toFixed(0)} USD)
              </span>
            </div>

            {/* Preset Amount Chips */}
            <div className="flex items-center gap-2 mt-2">
              {[10, 25, 50, 100, 250, 500].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmountUSD(amt)}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    Math.abs(amountUSD - amt) < 0.1
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Method Form Fields */}
          {method === 'card' && (
            <div className="space-y-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                <span>Debit Card Information</span>
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Card Number (e.g. 4532 8821 9021 8824)"
                  value={cardNumber}
                  onChange={e => setCardNumber(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono-numbers text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={e => setCardExpiry(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono-numbers text-slate-100 outline-none focus:border-cyan-500"
                />
                <input
                  type="password"
                  placeholder="CVV"
                  value={cardCvv}
                  onChange={e => setCardCvv(e.target.value)}
                  required
                  maxLength={4}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono-numbers text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Cardholder Name"
                  value={cardName}
                  onChange={e => setCardName(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {(method === 'airtel' || method === 'mtn') && (
            <div className="space-y-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>{method === 'airtel' ? 'Airtel Money Phone Number' : 'MTN MoMo Registered Line'}</span>
              </div>
              <input
                type="tel"
                placeholder="+265 99 123 4567 or +27 83 123 4567"
                value={mobileNumber}
                onChange={e => setMobileNumber(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono-numbers text-slate-100 outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-400">
                A secure USSD push notification will trigger directly to your phone for PIN authentication.
              </p>
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
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-[0.98]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Real-time API Transaction...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm Deposit • {formatCurrency(amountUSD, currency)}</span>
                </>
              )}
            </button>
            </div>
          </form>
        </div>
      )}

        {/* Tab 2: Deriv Broker Cashier & P2P Options */}
        {depositMode === 'broker' && (
          <div className="space-y-4 text-xs">
            {/* Live Broker Notice */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-slate-200">Official Deriv Cashier Gateways</span>
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
                By international financial compliance (AML & KYC), real broker account deposits are credited directly into your Deriv account. Once deposited, Reach Trader streams and uses that balance automatically.
              </p>
            </div>

            {/* Gateway Channels */}
            <div className="space-y-2.5">
              {/* Channel 1: Official Deriv Cashier */}
              <a
                href="https://app.deriv.com/cashier/deposit"
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
                      <span>Deriv Web Cashier</span>
                      <ExternalLink className="w-3 h-3 text-cyan-400" />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Visa, Mastercard, Skrill, Neteller, Crypto (BTC, USDT, ETH)
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-cyan-400 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 shrink-0">
                  Open Cashier
                </span>
              </a>

              {/* Channel 2: Deriv P2P (Peer-to-Peer) */}
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
                      <span>Deriv P2P (Peer-to-Peer)</span>
                      <ExternalLink className="w-3 h-3 text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Buy USD with local mobile money (Airtel, MTN, M-Pesa, Local Banks)
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                  Open P2P
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
                      Deposit in cash or bank transfer via authorized local representatives
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
