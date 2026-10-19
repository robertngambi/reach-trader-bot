import React, { useState, useMemo, useRef } from 'react';
import { Candle, ChartType, MarketAsset } from '../../types/trading';
import { useTrading } from '../../context/TradingContext';
import { formatCurrency } from '../../utils/currencies';
import {
  CandlestickChart,
  LineChart as LineChartIcon,
  Crosshair,
  TrendingUp,
  TrendingDown,
  Layers,
  Activity,
  Zap,
  Cloud,
} from 'lucide-react';

interface TradingChartProps {
  market: MarketAsset;
  candles: Candle[];
  livePrice: number;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  market,
  candles,
  livePrice,
}) => {
  const {
    currency,
    showIndicatorsAndPOC,
    toggleIndicatorsAndPOC,
    activeTrades,
    isStayTradeEnabled,
    toggleStayTrade,
  } = useTrading();

  const [chartType, setChartType] = useState<ChartType>('candle');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate scales and boundaries
  const { minPrice, maxPrice, priceRange, pocLevel, bullishSupport, bearishResistance } = useMemo(() => {
    if (!candles || candles.length === 0) {
      return {
        minPrice: livePrice * 0.99,
        maxPrice: livePrice * 1.01,
        priceRange: livePrice * 0.02,
        pocLevel: livePrice,
        bullishSupport: livePrice * 0.992,
        bearishResistance: livePrice * 1.008,
      };
    }

    let min = Infinity;
    let max = -Infinity;

    candles.forEach(c => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    });

    if (livePrice < min) min = livePrice;
    if (livePrice > max) max = livePrice;

    // Add padding to chart
    const padding = (max - min) * 0.12 || min * 0.01;
    const effectiveMin = min - padding;
    const effectiveMax = max + padding;
    const range = effectiveMax - effectiveMin || 1;

    // Point of Control (POC): Weighted average of highest volume candle
    let maxVol = -1;
    let poc = candles[0].close;
    candles.forEach(c => {
      if (c.volume > maxVol) {
        maxVol = c.volume;
        poc = (c.high + c.low + c.close) / 3;
      }
    });

    const sup = market.bullishZone ? (market.bullishZone[0] + market.bullishZone[1]) / 2 : effectiveMin + range * 0.25;
    const res = market.bearishZone ? (market.bearishZone[0] + market.bearishZone[1]) / 2 : effectiveMin + range * 0.75;

    return {
      minPrice: effectiveMin,
      maxPrice: effectiveMax,
      priceRange: range,
      pocLevel: market.pocPrice || poc,
      bullishSupport: sup,
      bearishResistance: res,
    };
  }, [candles, livePrice, market]);

  // Dimension helpers (SVG coordinates: 0 to 800 width, 0 to 400 height)
  const svgWidth = 800;
  const svgHeight = 400;
  const chartHeight = 350; // reserve bottom for volume/time
  const chartPaddingLeft = 20;
  const chartPaddingRight = 85;

  const getX = (index: number, total: number) => {
    const usableWidth = svgWidth - chartPaddingLeft - chartPaddingRight;
    const step = usableWidth / Math.max(total - 1, 1);
    return chartPaddingLeft + index * step;
  };

  const getY = (price: number) => {
    const ratio = (price - minPrice) / priceRange;
    return chartHeight - ratio * chartHeight + 15;
  };

  // Convert candles to Line path
  const linePoints = useMemo(() => {
    if (candles.length === 0) return '';
    return candles
      .map((c, i) => `${getX(i, candles.length)},${getY(c.close)}`)
      .join(' ');
  }, [candles, minPrice, priceRange]);

  const lineAreaPath = useMemo(() => {
    if (candles.length === 0) return '';
    const points = candles.map((c, i) => `${getX(i, candles.length)},${getY(c.close)}`).join(' L ');
    const firstX = getX(0, candles.length);
    const lastX = getX(candles.length - 1, candles.length);
    return `M ${firstX},${chartHeight + 15} L ${points} L ${lastX},${chartHeight + 15} Z`;
  }, [candles, minPrice, priceRange]);

  const currentPriceY = getY(livePrice);
  const pocY = getY(pocLevel);
  const supY = getY(bullishSupport);
  const resY = getY(bearishResistance);

  // Active trades on this market
  const marketTrades = activeTrades.filter(t => t.assetId === market.id);

  return (
    <div className="relative w-full rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden backdrop-blur-sm">
      {/* Chart Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-base sm:text-lg text-slate-100 tracking-tight">
              {market.name}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-medium">
              {market.category}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 font-mono-numbers text-xs">
            <span className="text-slate-400">Live:</span>
            <span className="font-bold text-slate-100">{livePrice.toFixed(market.id === 'forex-eurusd' ? 4 : 2)}</span>
            <span
              className={`flex items-center font-semibold text-xs ${
                market.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {market.change24h >= 0 ? '+' : ''}
              {market.change24h}%
            </span>
          </div>
        </div>

        {/* Buttons together on top margin of graph */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Chart Type Toggle Button */}
          <button
            type="button"
            onClick={() => setChartType(prev => (prev === 'candle' ? 'line' : 'candle'))}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Toggle between Candle and Line graph"
          >
            {chartType === 'candle' ? (
              <>
                <LineChartIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>Line</span>
              </>
            ) : (
              <>
                <CandlestickChart className="w-3.5 h-3.5 text-emerald-400" />
                <span>Candle</span>
              </>
            )}
          </button>

          {/* Indicators & POC Overlay Button */}
          <button
            type="button"
            onClick={toggleIndicatorsAndPOC}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-sm active:scale-95 ${
              showIndicatorsAndPOC
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400'
            }`}
            title="Show Point of Control (POC), Support & Resistance zones"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>{showIndicatorsAndPOC ? 'Indicators: ON' : 'Show Indicators'}</span>
          </button>
        </div>
      </div>

      {/* SVG Chart Display */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[16/9] sm:aspect-[21/9] min-h-[300px] select-none cursor-crosshair bg-gradient-to-b from-slate-950/80 to-slate-900/60"
        onMouseLeave={() => setHoveredIndex(null)}
        onMouseMove={e => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const relX = (e.clientX - rect.left) / rect.width;
          const index = Math.round(relX * (candles.length - 1));
          if (index >= 0 && index < candles.length) {
            setHoveredIndex(index);
          }
        }}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Linear gradient for line chart area */}
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>

            {/* Bullish support zone pattern */}
            <linearGradient id="bullishZoneGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.06" />
            </linearGradient>

            {/* Bearish resistance zone pattern */}
            <linearGradient id="bearishZoneGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.06" />
            </linearGradient>
          </defs>

          {/* Grid lines horizontal */}
          {[0.2, 0.4, 0.6, 0.8].map(ratio => {
            const y = chartHeight * ratio + 15;
            const priceVal = maxPrice - ratio * priceRange;
            return (
              <g key={ratio}>
                <line
                  x1={chartPaddingLeft}
                  y1={y}
                  x2={svgWidth - chartPaddingRight}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="0.8"
                  strokeDasharray="4 4"
                  opacity="0.4"
                />
                <text
                  x={svgWidth - chartPaddingRight + 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                >
                  {priceVal.toFixed(market.id === 'forex-eurusd' ? 4 : 2)}
                </text>
              </g>
            );
          })}

          {/* INDICATORS & POC OVERLAY */}
          {showIndicatorsAndPOC && (
            <>
              {/* Bearish Resistance (Sell Zone) Shaded Region */}
              <rect
                x={chartPaddingLeft}
                y={Math.max(15, resY - 20)}
                width={svgWidth - chartPaddingLeft - chartPaddingRight}
                height={32}
                fill="url(#bearishZoneGrad)"
                stroke="#f43f5e"
                strokeWidth="0.8"
                strokeDasharray="2 2"
                opacity="0.85"
              />
              <text
                x={chartPaddingLeft + 8}
                y={Math.max(28, resY - 6)}
                fill="#fb7185"
                fontSize="9"
                fontWeight="bold"
                letterSpacing="0.05em"
              >
                ▼ BEARISH RESISTANCE / OPTIMAL SELL ZONE
              </text>

              {/* Bullish Support (Buy Zone) Shaded Region */}
              <rect
                x={chartPaddingLeft}
                y={Math.min(chartHeight - 30, supY - 12)}
                width={svgWidth - chartPaddingLeft - chartPaddingRight}
                height={32}
                fill="url(#bullishZoneGrad)"
                stroke="#10b981"
                strokeWidth="0.8"
                strokeDasharray="2 2"
                opacity="0.85"
              />
              <text
                x={chartPaddingLeft + 8}
                y={Math.min(chartHeight - 6, supY + 12)}
                fill="#34d399"
                fontSize="9"
                fontWeight="bold"
                letterSpacing="0.05em"
              >
                ▲ BULLISH SUPPORT / OPTIMAL BUY (DEMAND) ZONE
              </text>

              {/* Point of Control (POC) Golden Line */}
              <line
                x1={chartPaddingLeft}
                y1={pocY}
                x2={svgWidth - chartPaddingRight}
                y2={pocY}
                stroke="#f59e0b"
                strokeWidth="1.8"
                strokeDasharray="6 3"
              />
              <g transform={`translate(${svgWidth - chartPaddingRight + 4}, ${pocY - 8})`}>
                <rect width="68" height="16" rx="3" fill="#f59e0b" />
                <text x="34" y="11" fill="#0f172a" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                  POC {pocLevel.toFixed(market.id === 'forex-eurusd' ? 3 : 1)}
                </text>
              </g>
            </>
          )}

          {/* CANDLESTICK MODE */}
          {chartType === 'candle' &&
            candles.map((candle, idx) => {
              const x = getX(idx, candles.length);
              const openY = getY(candle.open);
              const closeY = getY(candle.close);
              const highY = getY(candle.high);
              const lowY = getY(candle.low);
              const isBullish = candle.close >= candle.open;
              const candleColor = isBullish ? '#10b981' : '#f43f5e';
              const bodyY = Math.min(openY, closeY);
              const bodyHeight = Math.max(Math.abs(closeY - openY), 2);
              const candleWidth = Math.max((svgWidth - chartPaddingLeft - chartPaddingRight) / candles.length * 0.65, 3.5);

              return (
                <g key={candle.time}>
                  {/* High - Low Wick */}
                  <line
                    x1={x}
                    y1={highY}
                    x2={x}
                    y2={lowY}
                    stroke={candleColor}
                    strokeWidth="1.2"
                  />
                  {/* Real Body */}
                  <rect
                    x={x - candleWidth / 2}
                    y={bodyY}
                    width={candleWidth}
                    height={bodyHeight}
                    fill={candleColor}
                    rx="1"
                  />

                  {/* Volume Bar at the bottom */}
                  <rect
                    x={x - candleWidth / 2}
                    y={chartHeight + 15 - (candle.volume / 100) * 25}
                    width={candleWidth}
                    height={(candle.volume / 100) * 25}
                    fill={candleColor}
                    opacity="0.3"
                  />
                </g>
              );
            })}

          {/* LINE MODE */}
          {chartType === 'line' && (
            <>
              {/* Gradient Area Fill */}
              <path d={lineAreaPath} fill="url(#areaGradient)" />
              {/* Glowing Line */}
              <polyline
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={linePoints}
              />
            </>
          )}

          {/* Active Trade Entry Markers on Chart */}
          {marketTrades.map(trade => {
            const entryY = getY(trade.entryPrice);
            const isBuy = trade.type === 'BUY';
            return (
              <g key={trade.id}>
                {/* Horizontal Entry Line */}
                <line
                  x1={chartPaddingLeft}
                  y1={entryY}
                  x2={svgWidth - chartPaddingRight}
                  y2={entryY}
                  stroke={isBuy ? '#10b981' : '#f43f5e'}
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.75"
                />
                {/* Order Badge */}
                <g transform={`translate(${chartPaddingLeft + 8}, ${entryY - 10})`}>
                  <rect
                    width="62"
                    height="18"
                    rx="4"
                    fill={isBuy ? '#059669' : '#e11d48'}
                  />
                  <text
                    x="31"
                    y="12"
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {trade.type} (${trade.stakeUSD})
                  </text>
                </g>
              </g>
            );
          })}

          {/* Current Live Price Tracker Line */}
          <line
            x1={chartPaddingLeft}
            y1={currentPriceY}
            x2={svgWidth - chartPaddingRight}
            y2={currentPriceY}
            stroke="#38bdf8"
            strokeWidth="1.2"
            strokeDasharray="2 2"
          />

          {/* Current Live Price Right Badge */}
          <g transform={`translate(${svgWidth - chartPaddingRight + 4}, ${currentPriceY - 10})`}>
            <rect
              width="74"
              height="20"
              rx="4"
              fill="#0284c7"
            />
            <text
              x="37"
              y="14"
              fill="#ffffff"
              fontSize="10"
              fontWeight="bold"
              fontFamily="JetBrains Mono"
              textAnchor="middle"
            >
              {livePrice.toFixed(market.id === 'forex-eurusd' ? 4 : 2)}
            </text>
          </g>

          {/* Hover Crosshair */}
          {hoveredIndex !== null && candles[hoveredIndex] && (
            <g>
              <line
                x1={getX(hoveredIndex, candles.length)}
                y1={15}
                x2={getX(hoveredIndex, candles.length)}
                y2={chartHeight + 15}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.8"
              />
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIndex !== null && candles[hoveredIndex] && (
          <div className="absolute top-3 left-4 bg-slate-900/95 border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs font-mono-numbers text-slate-200 shadow-xl pointer-events-none flex items-center gap-3 backdrop-blur-md">
            <div>
              <span className="text-slate-400">O: </span>
              <span className="font-semibold text-slate-100">{candles[hoveredIndex].open.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400">H: </span>
              <span className="font-semibold text-emerald-400">{candles[hoveredIndex].high.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400">L: </span>
              <span className="font-semibold text-rose-400">{candles[hoveredIndex].low.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400">C: </span>
              <span className="font-semibold text-slate-100">{candles[hoveredIndex].close.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400">Vol: </span>
              <span className="text-cyan-400 font-semibold">{candles[hoveredIndex].volume}</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart Footer Indicator Guide */}
      <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/60 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 font-mono-numbers">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
            <span>Bullish Zone (BUY)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span>
            <span>Bearish Zone (SELL)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-amber-400"></span>
            <span>POC Level</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-500">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Real-time Feed</span>
        </div>
      </div>
    </div>
  );
};
