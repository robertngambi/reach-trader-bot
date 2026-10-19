import React from 'react';
import { useTrading } from '../../context/TradingContext';
import {
  Info,
  X,
  Server,
  Cloud,
  ShieldCheck,
  Cpu,
  Zap,
  Globe2,
  TrendingUp,
} from 'lucide-react';

export const AboutModal: React.FC = () => {
  const { activeModal, setActiveModal } = useTrading();

  if (activeModal !== 'about') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={() => setActiveModal(null)}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-slate-950 font-black shadow-lg">
            <TrendingUp className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-100">
              About Reach Trader
            </h3>
            <p className="text-xs text-slate-400">
              Next-Gen Algorithmic Trading Systems & Cloud Bot Infrastructure
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Automated Mean-Reversion Core
            </h4>
            <p className="text-slate-400">
              Reach Trader operates on a high-frequency mean-reversion algorithm designed specifically for volatility indices and currency pairs. The bot continuously tracks Point of Control (POC) volume clusters, automatically buying during market dips/drawdowns and capturing profits during explosive rebound spikes.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-100 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-cyan-400" />
              Cloud Server Daemon Execution
            </h4>
            <p className="text-slate-400">
              Once activated with the "Stay Trade" feature, trading sessions run uninterrupted on enterprise cloud infrastructure. Even if your browser is closed, your phone runs out of battery, or connection drops, the bot continues executing according to your strict Target Profit and Stop Loss parameters.
            </p>
            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono-numbers">
              <span>Cloud Server Execution:</span>
              <span className="text-emerald-400 font-bold">24/7 Persistent Online</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-100 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-amber-400" />
              African & Global Currency Real-Time Gateway
            </h4>
            <p className="text-slate-400">
              Native real-time settlement for the United States (USD), Nigeria (NGN), South Africa (ZAR), Malawi (MWK), Zambia (ZMW), and Zimbabwe (ZiG), with instant Mobile Money APIs (Airtel Money, MTN MoMo) and debit card payment processing.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              Built-In Risk Guard
            </h4>
            <p className="text-slate-400">
              Strict stop-loss triggers, tick boundaries, and demo simulation safeguards ensure traders can experiment risk-free with $10,000 practice capital before executing in real markets.
            </p>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Reach Trader Release 3.4.0</span>
          <span>Cloud Tier: Production Ready</span>
        </div>
      </div>
    </div>
  );
};
