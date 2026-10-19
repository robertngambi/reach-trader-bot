import React from 'react';
import { useTrading } from '../../context/TradingContext';
import { exportUserGuidePDF } from '../../utils/pdfGenerator';
import {
  HelpCircle,
  X,
  FileDown,
  Layers,
  Bot,
  SlidersHorizontal,
  Cloud,
  CheckCircle2,
  TrendingUp,
  Target,
  ArrowRight,
} from 'lucide-react';

export const UserGuideModal: React.FC = () => {
  const { activeModal, setActiveModal } = useTrading();

  if (activeModal !== 'guide') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setActiveModal(null)}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Title & PDF Download Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-100">
                Quick Trading Bot User Guide
              </h3>
              <p className="text-xs text-slate-400">
                How to trade with the bot, indicators, and risk automation
              </p>
            </div>
          </div>

          {/* PDF EXPORT BUTTON */}
          <button
            type="button"
            onClick={exportUserGuidePDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-95 transition-all shrink-0"
            title="Download the full guide as a PDF document"
          >
            <FileDown className="w-4 h-4" />
            <span>Download PDF Guide</span>
          </button>
        </div>

        {/* Content Sections */}
        <div className="space-y-4 py-4 text-xs leading-relaxed text-slate-300">
          {/* Method 1: Manual Trader */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
              <h4>1. Manual Trader Mode</h4>
            </div>
            <ul className="space-y-1.5 list-disc pl-5 text-slate-400">
              <li>
                <strong className="text-slate-200">Switching Graphs:</strong> Use the "Switch to Line" or "Switch to Candle" button to observe price dynamics in candlestick wicks or flowing area lines.
              </li>
              <li>
                <strong className="text-slate-200">Point of Control (POC):</strong> The golden horizontal line indicates the heaviest trading volume level. Green shading marks the Bullish Demand (Buy Zone), and Red shading marks Bearish Resistance (Sell Zone).
              </li>
              <li>
                <strong className="text-slate-200">Execution:</strong> Click BUY (Call) or SELL (Put) with your configured stake and tick duration. Use AI Random Profit Pick to immediately sense optimal entries and avoid drawdowns.
              </li>
            </ul>
          </div>

          {/* Method 2: Bulk Trader */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h4>2. Bulk Trader Mode (Continuous Volatility Scanner)</h4>
            </div>
            <ul className="space-y-1.5 list-disc pl-5 text-slate-400">
              <li>
                <strong className="text-slate-200">Set Parameters:</strong> Enter your stake (min $0.50), trades at once (e.g. 5x), duration in ticks, target profit amount, and last loss amount (stop loss).
              </li>
              <li>
                <strong className="text-slate-200">Scanning Markets:</strong> Click the "SCAN MARKETS NOW" button. The bot scans all volatility indices continuously and places batches on high-momentum setups.
              </li>
              <li>
                <strong className="text-slate-200">Auto-Stop Protection:</strong> The scanner monitors net P&L and automatically terminates once your target profit or maximum loss threshold is hit.
              </li>
            </ul>
          </div>

          {/* Method 3: Bot Trader */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
              <Bot className="w-4 h-4 text-purple-400" />
              <h4>3. Bot Trader (AI Profit Diagnoser & Market Reaper)</h4>
            </div>
            <ul className="space-y-1.5 list-disc pl-5 text-slate-400">
              <li>
                <strong className="text-slate-200">AI Profit & Loss Diagnoser:</strong> Every candidate market is scanned and diagnosed before entry. High-profit setups (88% - 94% win edge) are executed, while potential losing setups (chop, high spread, trend exhaustion) are automatically detected and avoided.
              </li>
              <li>
                <strong className="text-slate-200">4 Quantitative Strategy Technics:</strong> Choose between AI Autonomous Market Reaper (default multi-asset harvester), RSI Mean-Reversion Sniper, EMA Ribbon Trend Surfer, or Zero-Drawdown Scalper.
              </li>
              <li>
                <strong className="text-slate-200">Random Market Reaping:</strong> Automatically sweeps across 20+ synthetic and forex pairs, cherry-picking sweet-spot momentum opportunities.
              </li>
              <li>
                <strong className="text-slate-200">Capital Protection ($0.35 Safe Micro-Stake):</strong> For balances around $5 - $10, using a $0.35 micro-stake ensures small fluctuations never risk your balance, allowing profits to compound consistently.
              </li>
              <li>
                <strong className="text-slate-200">Runtime Period:</strong> Choose your duration (1m, 5m, 10m, 30m, 1h, 6h, 12h, 24h, 48h, up to 72h) via the radio dropdown menu.
              </li>
            </ul>
          </div>

          {/* Stay Trade & Financials */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-slate-100 font-bold text-sm">
              <Cloud className="w-4 h-4 text-cyan-400" />
              <h4>4. "Stay Trade" & Multi-Currency Engine</h4>
            </div>
            <ul className="space-y-1.5 list-disc pl-5 text-slate-400">
              <li>
                <strong className="text-slate-200">Stay Trade:</strong> Keeps all bot instances active while you switch tabs, trade manually, or browse other sections.
              </li>
              <li>
                <strong className="text-slate-200">Deposit ($5 - $1,000) & Withdraw:</strong> Deposit easily with Visa/Mastercard debit cards or Mobile Money (Airtel Money & MTN MoMo).
              </li>
              <li>
                <strong className="text-slate-200">Supported Currencies:</strong> USD, Nigeria (NGN), South Africa (ZAR), Malawi (MWK), Zambia (ZMW), Zimbabwe (ZiG).
              </li>
              <li>
                <strong className="text-slate-200">Restore Demo:</strong> Practice freely with $10,000 demo funds and reset anytime in Settings.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono-numbers">
            Reach Trader Manual • v3.4
          </span>
          <button
            type="button"
            onClick={exportUserGuidePDF}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
          >
            <FileDown className="w-4 h-4" />
            <span>Download Offline PDF Copy</span>
          </button>
        </div>
      </div>
    </div>
  );
};
