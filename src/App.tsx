import React from 'react';
import { TradingProvider, useTrading } from './context/TradingContext';
import { Header } from './components/Header';
import { NavigationTabs } from './components/NavigationTabs';
import { ManualTrader } from './components/manual/ManualTrader';
import { BulkTrader } from './components/bulk/BulkTrader';
import { BotTrader } from './components/bot/BotTrader';
import { DepositModal } from './components/modals/DepositModal';
import { WithdrawModal } from './components/modals/WithdrawModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { UserGuideModal } from './components/modals/UserGuideModal';
import { AboutModal } from './components/modals/AboutModal';
import { LiveBrokerModal } from './components/modals/LiveBrokerModal';
import { DerivAuthModal } from './components/modals/DerivAuthModal';

import { RotateCcw, ChevronUp, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';

const TradingAppContent: React.FC = () => {
  const { activeTab, theme, isScreenRotated, toggleScreenRotation, isUserAuthenticated } = useTrading();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = React.useState(0);

  // Wheel handling for rotated container:
  // When rotated 90 degrees clockwise, a user's physical vertical mouse wheel (deltaY)
  // or trackpad gesture needs to scroll the rotated container's scrollTop.
  React.useEffect(() => {
    if (!isScreenRotated) return;

    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // In a 90deg rotated element, deltaY or deltaX may both represent user vertical gesture
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta !== 0) {
        container.scrollTop += delta;
        // Prevent outer window bounce/freeze
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
        container.scrollTop += 120;
        e.preventDefault();
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        container.scrollTop -= 120;
        e.preventDefault();
      } else if (e.key === 'Home') {
        container.scrollTop = 0;
        e.preventDefault();
      } else if (e.key === 'End') {
        container.scrollTop = container.scrollHeight;
        e.preventDefault();
      }
    };

    const handleScroll = () => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll > 0) {
        setScrollProgress(Math.round((container.scrollTop / maxScroll) * 100));
      } else {
        setScrollProgress(0);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      container.removeEventListener('scroll', handleScroll);
    };
  }, [isScreenRotated]);

  // Touch touchmove drag handler for rotated orientation on touch screens
  React.useEffect(() => {
    if (!isScreenRotated) return;
    const container = containerRef.current;
    if (!container) return;

    let touchStartY = 0;
    let touchStartX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // When rotated 90deg clockwise: moving finger physically left-right corresponds to the rotated element's Y-axis!
        // Moving finger X delta translates directly to rotated Y scroll
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        
        const deltaX = touchStartX - currentX;
        const deltaY = touchStartY - currentY;
        
        // Use the dominant gesture component
        const effectiveDelta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
        container.scrollTop += effectiveDelta * 1.2;
        
        touchStartX = currentX;
        touchStartY = currentY;
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isScreenRotated]);

  const scrollUp = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ top: -280, behavior: 'smooth' });
    }
  };

  const scrollDown = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ top: 280, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  if (!isUserAuthenticated) {
    return <DerivAuthModal />;
  }

  return (
    <div
      ref={containerRef}
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        isScreenRotated ? 'screen-rotated-container' : ''
      } ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}
    >
      {/* Floating Controls Bar when Rotated (allows scrolling up/down and unrotating effortlessly) */}
      {isScreenRotated && (
        <aside
          aria-label="Rotated Screen Navigation"
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-slate-900/95 border border-emerald-500/40 p-2 rounded-2xl shadow-2xl backdrop-blur-md text-slate-100"
        >
          {/* Scroll progress tag */}
          <div className="hidden sm:flex flex-col text-[10px] font-mono-numbers px-2 text-slate-400">
            <span>Scroll</span>
            <span className="font-bold text-emerald-400">{scrollProgress}%</span>
          </div>

          {/* Jump to top */}
          <button
            type="button"
            onClick={scrollToTop}
            title="Scroll to Top"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowUp className="w-4 h-4" />
          </button>

          {/* Step Scroll Up */}
          <button
            type="button"
            onClick={scrollUp}
            title="Scroll Up"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <ChevronUp className="w-4 h-4" />
            <span>Up</span>
          </button>

          {/* Step Scroll Down */}
          <button
            type="button"
            onClick={scrollDown}
            title="Scroll Down"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
            <span>Down</span>
          </button>

          {/* Jump to bottom */}
          <button
            type="button"
            onClick={scrollToBottom}
            title="Scroll to Bottom"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowDown className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-slate-700" />

          {/* Quick Unrotate Button */}
          <button
            type="button"
            onClick={toggleScreenRotation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
            title="Restore Normal Screen Display"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Unrotate</span>
          </button>
        </aside>
      )}

      {/* 1. Header with balances, account switch, deposit/withdraw */}
      <Header />

      {/* 2. Navigation Tabs (The 3 Trading Methods right beneath the header) */}
      <NavigationTabs />

      {/* 3. Main Trading Surface */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-20 overflow-x-hidden min-w-0">
        {activeTab === 'manual' && <ManualTrader />}
        {activeTab === 'bulk' && <BulkTrader />}
        {activeTab === 'bot' && <BotTrader />}
      </main>

      {/* Platform Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 py-4 px-4 text-center text-xs text-slate-500 font-mono-numbers">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Reach Trader • Algorithmic Trading Platform</span>
          <span>Practice Responsibly • Demo Balance Protected</span>
        </div>
      </footer>

      {/* Interactive Modals */}
      <DerivAuthModal />
      <DepositModal />
      <WithdrawModal />
      <SettingsModal />
      <UserGuideModal />
      <AboutModal />
      <LiveBrokerModal />
    </div>
  );
};

export default function App() {
  return (
    <TradingProvider>
      <TradingAppContent />
    </TradingProvider>
  );
}
