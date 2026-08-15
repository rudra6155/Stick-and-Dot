"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Search, Plus, X, ArrowUpRight, ArrowDownRight, Minus, MousePointer2 } from "lucide-react";

// ── Types ───────────────────────────────────────────────
interface MatrixEntry {
  row: string;
  col: string;
  rowLabel: string;
  colLabel: string;
  value: number;
}

interface LabelInfo {
  key: string;
  label: string;
  ticker: string;
  dataPoints: number;
}

interface CompareAsset {
  name: string;
  asset_class: string;
  price: number;
}

interface CorrelationPair {
  tickerA: string;
  tickerB: string;
  value: number;
}

interface ChartPoint {
  date: string;
  value: number;
}

// ── Color Helpers ───────────────────────────────────────
function corrColor(val: number): string {
  if (val >= 0.7) return "bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] border-emerald-400";
  if (val >= 0.4) return "bg-emerald-500/50 text-emerald-100 border-emerald-500/50";
  if (val >= 0.1) return "bg-emerald-500/20 text-emerald-200 border-emerald-500/20";
  if (val > -0.1) return "bg-zinc-800/50 text-zinc-400 border-zinc-700";
  if (val > -0.4) return "bg-rose-500/20 text-rose-200 border-rose-500/20";
  if (val > -0.7) return "bg-rose-500/50 text-rose-100 border-rose-500/50";
  return "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)] border-rose-400";
}

function corrTextColor(val: number): string {
  if (val >= 0.5) return "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]";
  if (val > -0.5) return "text-zinc-400";
  return "text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]";
}

function corrLabel(val: number): string {
  if (val >= 0.7) return "Strong Positive";
  if (val >= 0.4) return "Moderate Positive";
  if (val >= 0.1) return "Weak Positive";
  if (val > -0.1) return "No Correlation";
  if (val > -0.4) return "Weak Inverse";
  if (val > -0.7) return "Moderate Inverse";
  return "Strong Inverse";
}

const CHART_COLORS = [
  "#34d399", // emerald
  "#a78bfa", // violet
  "#f59e0b", // amber
  "#f43f5e", // rose
  "#38bdf8", // sky
  "#fb923c", // orange
];

// ── Matrix Grid Component ───────────────────────────────
function MatrixGrid({ labels, data }: { labels: LabelInfo[], data: MatrixEntry[] }) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredCol, setHoveredCol] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<{ x: number, y: number, text: string, val: number } | null>(null);

  const getCorr = (row: string, col: string): number => {
    if (row === col) return 1;
    const entry = data.find(m => m.row === row && m.col === col);
    return entry?.value ?? 0;
  };

  return (
    <div 
      className="relative w-full overflow-x-auto pb-10 hide-scrollbar"
      onMouseLeave={() => {
        setHoveredRow(null);
        setHoveredCol(null);
        setActiveTooltip(null);
      }}
    >
      <div className="min-w-max inline-block">
        <div className="flex">
          {/* Top-Left Empty Corner */}
          <div className="w-28 shrink-0" />
          {/* Column Headers */}
          {labels.map((col, i) => (
            <motion.div 
              key={`header-col-${col.key}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`w-12 h-20 flex flex-col items-center justify-end pb-2 shrink-0 transition-opacity duration-300 ${
                hoveredCol && hoveredCol !== col.key ? 'opacity-30' : 'opacity-100'
              }`}
            >
              <span className="text-[10px] text-zinc-500 font-mono -rotate-45 origin-bottom-left whitespace-nowrap mb-2">
                {col.label}
              </span>
              <span className="text-xs font-bold font-mono text-zinc-300">
                {col.ticker}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Rows */}
        {labels.map((row, rIdx) => (
          <div key={`row-${row.key}`} className="flex items-center gap-1 mb-1">
            {/* Row Header */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: rIdx * 0.05 }}
              className={`w-28 shrink-0 flex flex-col items-end pr-3 transition-opacity duration-300 ${
                hoveredRow && hoveredRow !== row.key ? 'opacity-30' : 'opacity-100'
              }`}
            >
              <span className="text-xs font-bold text-zinc-300 font-mono truncate w-full text-right">{row.ticker}</span>
              <span className="text-[10px] text-zinc-500 truncate w-full text-right">{row.label}</span>
            </motion.div>

            {/* Cells */}
            {labels.map((col, cIdx) => {
              const val = getCorr(row.key, col.key);
              const isDiagonal = row.key === col.key;
              const isHovered = hoveredRow === row.key || hoveredCol === col.key;
              const hasHover = hoveredRow !== null || hoveredCol !== null;
              const isDimmed = hasHover && !isHovered;

              return (
                <motion.div
                  key={`cell-${row.key}-${col.key}`}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (rIdx * 0.02) + (cIdx * 0.02), type: "spring", stiffness: 100 }}
                  onMouseEnter={(e) => {
                    setHoveredRow(row.key);
                    setHoveredCol(col.key);
                    const rect = e.currentTarget.getBoundingClientRect();
                    setActiveTooltip({
                      x: rect.left + rect.width / 2,
                      y: rect.top - 10,
                      text: isDiagonal ? 'Self' : `${row.label} ↔ ${col.label}`,
                      val
                    });
                  }}
                  className={`w-12 h-12 shrink-0 rounded-xl border flex items-center justify-center cursor-crosshair transition-all duration-300 ${
                    isDimmed ? 'opacity-10 scale-95 grayscale' : 'opacity-100 hover:scale-110 hover:z-20'
                  } ${isDiagonal ? 'bg-zinc-800/30 border-transparent' : corrColor(val)}`}
                >
                  <span className={`text-[11px] font-mono font-bold ${isDiagonal ? 'text-zinc-600' : ''}`}>
                    {isDiagonal ? '-' : val.toFixed(2)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Floating Tooltip for Matrix */}
      <AnimatePresence>
        {activeTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-full pb-2"
            style={{ left: activeTooltip.x, top: activeTooltip.y }}
          >
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 rounded-xl px-4 py-2 shadow-2xl flex flex-col items-center">
              <span className="text-xs font-medium text-zinc-300 mb-1">{activeTooltip.text}</span>
              <span className={`text-lg font-mono font-black ${corrTextColor(activeTooltip.val)}`}>
                {activeTooltip.val > 0 && activeTooltip.text !== 'Self' ? '+' : ''}
                {activeTooltip.text === 'Self' ? '1.00' : activeTooltip.val.toFixed(2)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Interactive SVG Chart Component ──────────────────────
function InteractiveChart({ charts, tickers }: { charts: Record<string, ChartPoint[]>, tickers: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 300 });
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [mouseX, setMouseX] = useState<number>(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const allDates = useMemo(() => {
    return [...new Set(tickers.flatMap(t => (charts[t] || []).map(p => p.date)))].sort();
  }, [tickers, charts]);

  const allPoints = tickers.flatMap(t => (charts[t] || []).map(p => p.value));
  if (allPoints.length === 0) {
    return <div className="flex items-center justify-center h-full text-zinc-600 font-mono text-sm">No price history available</div>;
  }

  const minVal = Math.min(...allPoints, 0);
  const maxVal = Math.max(...allPoints, 0);
  const range = maxVal - minVal || 1;
  const padX = 20;
  const padY = 40;
  const w = dimensions.width;
  const h = dimensions.height;

  const getX = (idx: number) => padX + (idx / Math.max(allDates.length - 1, 1)) * (w - padX * 2);
  const getY = (val: number) => padY + (1 - (val - minVal) / range) * (h - padY * 2);
  const zeroY = getY(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || allDates.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setMouseX(x);

    // Find closest index
    const usableW = w - padX * 2;
    const ratio = Math.max(0, Math.min(1, (x - padX) / usableW));
    const rawIdx = Math.round(ratio * (allDates.length - 1));
    const boundedIdx = Math.max(0, Math.min(allDates.length - 1, rawIdx));
    setHoverIndex(boundedIdx);
  };

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full cursor-crosshair touch-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverIndex(null)}
    >
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible pointer-events-none">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Y-Axis Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map(frac => {
          const y = padY + frac * (h - padY * 2);
          const label = (maxVal - frac * range).toFixed(1);
          return (
            <g key={frac}>
              <line x1={padX} y1={y} x2={w - padX} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={w - padX + 5} y={y + 4} textAnchor="start" fill="rgba(255,255,255,0.2)" fontSize="10" fontFamily="monospace">
                {label}%
              </text>
            </g>
          );
        })}

        {/* Zero Line */}
        <line x1={padX} y1={zeroY} x2={w - padX} y2={zeroY} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />

        {/* Paths */}
        {tickers.map((ticker, tIdx) => {
          const points = charts[ticker] || [];
          if (points.length < 2) return null;

          const pointMap = new Map(points.map(p => [p.date, p.value]));
          
          // Build smooth path
          let d = "";
          let isFirst = true;
          allDates.forEach((date, i) => {
            const val = pointMap.get(date);
            if (val === undefined) return;
            const px = getX(i);
            const py = getY(val);
            if (isFirst) {
              d += `M ${px},${py} `;
              isFirst = false;
            } else {
              d += `L ${px},${py} `;
            }
          });

          const color = CHART_COLORS[tIdx % CHART_COLORS.length];

          return (
            <g key={ticker}>
              <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                d={d}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
              />
            </g>
          );
        })}

        {/* Scrubber Line */}
        {hoverIndex !== null && (
          <g>
            <line 
              x1={getX(hoverIndex)} 
              y1={padY - 10} 
              x2={getX(hoverIndex)} 
              y2={h - padY + 10} 
              stroke="rgba(255,255,255,0.2)" 
              strokeWidth="1" 
              strokeDasharray="4 4"
            />
            {/* Draw dots at intersections */}
            {tickers.map((ticker, tIdx) => {
              const points = charts[ticker] || [];
              const pointMap = new Map(points.map(p => [p.date, p.value]));
              const val = pointMap.get(allDates[hoverIndex]);
              if (val === undefined) return null;
              
              const color = CHART_COLORS[tIdx % CHART_COLORS.length];
              return (
                <circle 
                  key={`dot-${ticker}`}
                  cx={getX(hoverIndex)} 
                  cy={getY(val)} 
                  r="5" 
                  fill={color} 
                  stroke="#000" 
                  strokeWidth="2" 
                />
              );
            })}
          </g>
        )}
      </svg>

      {/* Floating Interactive Tooltip */}
      {hoverIndex !== null && (
        <div 
          className="absolute z-10 pointer-events-none transform -translate-x-1/2 -translate-y-full pb-4"
          style={{ 
            left: getX(hoverIndex), 
            top: h / 2, // Center vertically or pin to mouseY
          }}
        >
          <div className="bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 shadow-2xl rounded-xl p-3 min-w-[140px]">
            <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-2 border-b border-zinc-800 pb-2">
              {new Date(allDates[hoverIndex]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="space-y-1.5">
              {tickers.map((ticker, tIdx) => {
                const points = charts[ticker] || [];
                const pointMap = new Map(points.map(p => [p.date, p.value]));
                const val = pointMap.get(allDates[hoverIndex]);
                if (val === undefined) return null;
                const color = CHART_COLORS[tIdx % CHART_COLORS.length];
                return (
                  <div key={ticker} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: color, boxShadow: `0 0 5px ${color}` }} />
                      <span className="text-xs font-mono font-medium text-zinc-300">{ticker}</span>
                    </div>
                    <span className="text-xs font-mono font-bold" style={{ color }}>
                      {val > 0 ? '+' : ''}{val.toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────
export default function RelativityPage() {
  const [activeTab, setActiveTab] = useState<"matrix" | "compare">("matrix");

  // Matrix state
  const [matrixLabels, setMatrixLabels] = useState<LabelInfo[]>([]);
  const [matrixData, setMatrixData] = useState<MatrixEntry[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [matrixLoading, setMatrixLoading] = useState(true);
  const [matrixError, setMatrixError] = useState("");

  // Compare state
  const [compareTickers, setCompareTickers] = useState<string[]>([]);
  const [tickerInput, setTickerInput] = useState("");
  const [compareData, setCompareData] = useState<{
    correlations: CorrelationPair[];
    charts: Record<string, ChartPoint[]>;
    assets: Record<string, CompareAsset>;
  } | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState("");

  // ── Fetch Matrix ──────────────────────────────────────
  useEffect(() => {
    async function loadMatrix() {
      setMatrixLoading(true);
      setMatrixError("");
      try {
        const res = await fetch("/api/correlation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "matrix" }),
        });
        const data = await res.json();
        if (data.error) {
          setMatrixError(data.error);
          return;
        }
        setMatrixLabels(data.labels || []);
        setMatrixData(data.matrix || []);
        setInsights(data.insights || []);
      } catch {
        setMatrixError("Failed to load correlation matrix");
      } finally {
        setMatrixLoading(false);
      }
    }
    loadMatrix();
  }, []);

  // ── Compare Tickers ───────────────────────────────────
  const handleAddTicker = useCallback(() => {
    const t = tickerInput.trim().toUpperCase();
    if (!t || compareTickers.includes(t) || compareTickers.length >= 6) return;
    setCompareTickers(prev => [...prev, t]);
    setTickerInput("");
  }, [tickerInput, compareTickers]);

  const handleRemoveTicker = (t: string) => {
    setCompareTickers(prev => prev.filter(x => x !== t));
    setCompareData(null);
  };

  const handleCompare = useCallback(async () => {
    if (compareTickers.length < 2) return;
    setCompareLoading(true);
    setCompareError("");
    setCompareData(null);
    try {
      const res = await fetch("/api/correlation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "compare", tickers: compareTickers }),
      });
      const data = await res.json();
      if (data.error) {
        setCompareError(data.error);
        return;
      }
      setCompareData(data);
    } catch {
      setCompareError("Failed to compare tickers");
    } finally {
      setCompareLoading(false);
    }
  }, [compareTickers]);

  return (
    <div className="space-y-12 relative">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="text-center space-y-4 pt-4">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500"
        >
          Market Relativity
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-zinc-500 font-mono text-sm uppercase tracking-widest"
        >
          Discover hidden connections across global markets
        </motion.p>
      </div>

      {/* Tab Switcher */}
      <div className="flex justify-center relative z-10">
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-full p-1.5 flex gap-2 shadow-2xl">
          {(["matrix", "compare"] as const).map(tab => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative px-8 py-3 rounded-full text-sm font-bold transition-colors"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabGlow"
                    className="absolute inset-0 bg-emerald-500/10 border border-emerald-500/20 rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className={`relative z-10 ${isActive ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "text-zinc-500 hover:text-zinc-300"}`}>
                  {tab === "matrix" ? "Cross-Market Matrix" : "Custom Scenarios"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Matrix Tab ─────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === "matrix" && (
          <motion.div
            key="matrix"
            initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
            transition={{ duration: 0.4 }}
            className="space-y-8 relative z-10"
          >
            {matrixLoading ? (
              <div className="py-32 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mb-6 shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                <p className="text-emerald-400 font-mono text-xs uppercase tracking-widest animate-pulse">Running Correlation Engine…</p>
              </div>
            ) : matrixError ? (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-8 text-rose-400 font-mono text-sm text-center backdrop-blur-xl">
                {matrixError}
              </div>
            ) : (
              <>
                {/* Heatmap Grid */}
                <div className="bg-zinc-950/50 backdrop-blur-3xl border border-zinc-800/50 rounded-3xl p-8 shadow-2xl overflow-hidden group">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-sm font-mono text-emerald-400 uppercase tracking-widest font-bold">
                        Global Asset Correlation Map
                      </p>
                      <p className="text-xs text-zinc-500 font-mono mt-1">Hover over any cell to track row/column relationships</p>
                    </div>
                    <div className="flex items-center gap-4 bg-black/40 rounded-full px-4 py-2 border border-zinc-800">
                      <span className="text-[10px] font-mono text-rose-400">Inverse (-1)</span>
                      <div className="w-24 h-1.5 rounded-full bg-gradient-to-r from-rose-500 via-zinc-800 to-emerald-500" />
                      <span className="text-[10px] font-mono text-emerald-400">Correlated (+1)</span>
                    </div>
                  </div>
                  
                  <MatrixGrid labels={matrixLabels} data={matrixData} />
                </div>

                {/* Insights Section */}
                {insights.length > 0 && (
                  <div className="bg-zinc-950/50 backdrop-blur-xl border border-zinc-800/50 rounded-3xl p-8 shadow-xl">
                    <p className="text-sm font-mono text-yellow-500 uppercase tracking-widest font-bold mb-6 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                      Algorithmic Insights
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {insights.map((insight, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + (i * 0.1) }}
                          className="bg-black/40 border border-yellow-500/10 rounded-2xl p-5 flex items-start gap-4 hover:bg-yellow-500/5 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                            <span className="text-yellow-500 text-xs font-black">{i + 1}</span>
                          </div>
                          <p className="text-sm text-zinc-300 leading-relaxed pt-1.5">{insight}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ── Compare Tab ────────────────────────────────── */}
        {activeTab === "compare" && (
          <motion.div
            key="compare"
            initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
            transition={{ duration: 0.4 }}
            className="space-y-8 relative z-10"
          >
            {/* Ticker Input */}
            <div className="bg-zinc-950/50 backdrop-blur-3xl border border-zinc-800/50 rounded-3xl p-8 shadow-2xl">
              <p className="text-sm font-mono text-emerald-400 uppercase tracking-widest font-bold mb-6">
                Custom Performance Scenarios
              </p>

              <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    type="text"
                    value={tickerInput}
                    onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTicker()}
                    placeholder="Enter ticker (e.g. AAPL, BTC-USD, GC=F)"
                    className="w-full bg-black/50 border border-zinc-700/50 rounded-2xl pl-12 pr-4 py-4 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50 focus:bg-zinc-900/80 transition-all placeholder:text-zinc-600 shadow-inner"
                  />
                </div>
                <button
                  onClick={handleAddTicker}
                  disabled={!tickerInput.trim() || compareTickers.length >= 6}
                  className="px-8 py-4 w-full md:w-auto bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Add Asset
                </button>
              </div>

              {/* Selected Tickers - Magnetic Chips */}
              {compareTickers.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-8">
                  <AnimatePresence>
                    {compareTickers.map((t, i) => {
                      const color = CHART_COLORS[i % CHART_COLORS.length];
                      return (
                        <motion.div
                          key={t}
                          initial={{ opacity: 0, scale: 0.8, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          whileHover={{ scale: 1.05 }}
                          className="flex items-center gap-2 px-4 py-2 rounded-full border shadow-lg backdrop-blur-md"
                          style={{
                            backgroundColor: `${color}15`,
                            borderColor: `${color}40`,
                            color: color,
                            boxShadow: `0 4px 12px ${color}15`
                          }}
                        >
                          <span className="font-mono font-bold text-sm">{t}</span>
                          <button 
                            onClick={() => handleRemoveTicker(t)} 
                            className="hover:bg-black/20 p-1 rounded-full transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}

              <button
                onClick={handleCompare}
                disabled={compareTickers.length < 2 || compareLoading}
                className="w-full px-6 py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:border-transparent border border-emerald-400 text-black font-black uppercase tracking-widest rounded-2xl text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] disabled:shadow-none"
              >
                {compareLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Running Simulation…
                  </span>
                ) : (
                  "Run Comparison"
                )}
              </button>
            </div>

            {/* Compare Error */}
            {compareError && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-rose-400 font-mono text-sm text-center backdrop-blur-xl">
                {compareError}
              </div>
            )}

            {/* Compare Results */}
            {compareData && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Normalized Price Chart */}
                <div className="bg-zinc-950/50 backdrop-blur-3xl border border-zinc-800/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none transition-opacity group-hover:opacity-40">
                    <MousePointer2 className="w-12 h-12 text-zinc-500 animate-bounce" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-1">Normalized Trajectory</h3>
                  <p className="text-xs text-zinc-500 font-mono mb-8">
                    Interactive path analysis — mouse over chart for exact daily figures
                  </p>

                  <div className="relative h-[400px] bg-black/20 rounded-2xl border border-zinc-800/50 shadow-inner">
                    <InteractiveChart charts={compareData.charts} tickers={compareTickers} />
                  </div>
                </div>

                {/* Pairwise Correlations Grid */}
                <div className="bg-zinc-950/50 backdrop-blur-3xl border border-zinc-800/50 rounded-3xl p-8 shadow-2xl">
                  <h3 className="text-xl font-bold mb-6">Relationship Matrix</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {compareData.correlations.map((c, i) => (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        key={`${c.tickerA}-${c.tickerB}`}
                        className="bg-black/40 rounded-2xl p-5 border border-zinc-800/50 flex flex-col justify-between group hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-black font-mono tracking-tighter text-zinc-300 group-hover:text-white transition-colors">{c.tickerA}</span>
                            <span className="text-zinc-600">×</span>
                            <span className="text-lg font-black font-mono tracking-tighter text-zinc-300 group-hover:text-white transition-colors">{c.tickerB}</span>
                          </div>
                          {c.value > 0.3 ? (
                            <ArrowUpRight className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                          ) : c.value < -0.3 ? (
                            <ArrowDownRight className="w-5 h-5 text-rose-400 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
                          ) : (
                            <Minus className="w-5 h-5 text-zinc-600" />
                          )}
                        </div>
                        <div className="flex items-end justify-between">
                          <span className={`text-[10px] font-mono uppercase tracking-widest ${corrTextColor(c.value)}`}>
                            {corrLabel(c.value)}
                          </span>
                          <span className={`text-2xl font-mono font-black ${corrTextColor(c.value)}`}>
                            {c.value > 0 ? "+" : ""}{c.value.toFixed(2)}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
