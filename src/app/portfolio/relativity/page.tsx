"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ExternalLink, Plus, X, Search, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

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

interface RelatedAsset {
  ticker: string;
  name: string;
  asset_class: string;
  price: number;
  correlation: number;
}

// ── Color Helpers ───────────────────────────────────────
function corrColor(val: number): string {
  if (val >= 0.7) return "bg-emerald-500";
  if (val >= 0.4) return "bg-emerald-500/60";
  if (val >= 0.1) return "bg-emerald-500/30";
  if (val > -0.1) return "bg-zinc-800";
  if (val > -0.4) return "bg-rose-500/30";
  if (val > -0.7) return "bg-rose-500/60";
  return "bg-rose-500";
}

function corrTextColor(val: number): string {
  if (val >= 0.5) return "text-emerald-400";
  if (val > -0.5) return "text-zinc-400";
  return "text-rose-400";
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

  // ── Get matrix value ──────────────────────────────────
  const getCorr = (row: string, col: string): number => {
    const entry = matrixData.find(m => m.row === row && m.col === col);
    return entry?.value ?? 0;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight">Market Relativity</h1>
        <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">
          How markets move relative to each other
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex justify-center">
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-1 flex gap-1">
          {(["matrix", "compare"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-zinc-500 hover:text-white border border-transparent"
              }`}
            >
              {tab === "matrix" ? "Correlation Matrix" : "Custom Compare"}
            </button>
          ))}
        </div>
      </div>

      {/* ── Matrix Tab ─────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === "matrix" && (
          <motion.div
            key="matrix"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {matrixLoading ? (
              <div className="py-20 text-center">
                <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-zinc-500 font-mono text-sm animate-pulse">Computing correlations…</p>
              </div>
            ) : matrixError ? (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-rose-400 font-mono text-sm text-center">
                {matrixError}
              </div>
            ) : (
              <>
                {/* Heatmap */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 overflow-hidden">
                  <p className="text-xs font-mono text-emerald-500 uppercase tracking-widest mb-6">
                    Cross-Market Correlation Heatmap
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr>
                          <th className="p-2 text-left font-mono text-zinc-600 w-28"></th>
                          {matrixLabels.map(l => (
                            <th key={l.key} className="p-2 text-center font-mono text-zinc-400 whitespace-nowrap">
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-[10px] text-zinc-600">{l.ticker}</span>
                                <span>{l.label}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {matrixLabels.map(row => (
                          <tr key={row.key}>
                            <td className="p-2 font-mono text-zinc-400 whitespace-nowrap text-right pr-4">
                              <div className="flex flex-col items-end gap-0.5">
                                <span>{row.label}</span>
                                <span className="text-[10px] text-zinc-600">{row.ticker}</span>
                              </div>
                            </td>
                            {matrixLabels.map(col => {
                              const val = getCorr(row.key, col.key);
                              const isDiagonal = row.key === col.key;
                              return (
                                <td key={col.key} className="p-1.5">
                                  <div
                                    className={`relative w-full aspect-square rounded-lg flex items-center justify-center transition-all ${
                                      isDiagonal
                                        ? "bg-zinc-800/50"
                                        : corrColor(val)
                                    } ${!isDiagonal ? "hover:scale-110 hover:z-10 cursor-default" : ""}`}
                                    title={isDiagonal ? "Self" : `${row.label} ↔ ${col.label}: ${val.toFixed(2)}`}
                                  >
                                    <span className={`font-mono text-[11px] font-bold ${isDiagonal ? "text-zinc-600" : "text-white"}`}>
                                      {isDiagonal ? "1.0" : val.toFixed(2)}
                                    </span>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-zinc-800/50">
                    <span className="text-[10px] font-mono text-zinc-600">Inverse</span>
                    <div className="flex gap-0.5">
                      {[-1, -0.7, -0.4, -0.1, 0, 0.1, 0.4, 0.7, 1].map(v => (
                        <div key={v} className={`w-6 h-3 rounded-sm ${corrColor(v)}`} />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-600">Correlated</span>
                  </div>
                </div>

                {/* Insights */}
                {insights.length > 0 && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                    <p className="text-xs font-mono text-yellow-500 uppercase tracking-widest mb-4">
                      Key Insights
                    </p>
                    <div className="space-y-3">
                      {insights.map((insight, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-yellow-500 text-xs font-bold">{i + 1}</span>
                          </div>
                          <p className="text-sm text-zinc-300 leading-relaxed">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pair Details */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                  <p className="text-xs font-mono text-emerald-500 uppercase tracking-widest mb-4">
                    All Pairwise Correlations
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {matrixLabels.flatMap((row, i) =>
                      matrixLabels.slice(i + 1).map(col => {
                        const val = getCorr(row.key, col.key);
                        return (
                          <div
                            key={`${row.key}-${col.key}`}
                            className="bg-black/30 rounded-xl p-4 border border-zinc-800/50 flex items-center justify-between gap-3"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-white truncate">{row.label}</span>
                                <span className="text-zinc-600 text-xs">↔</span>
                                <span className="text-sm font-medium text-white truncate">{col.label}</span>
                              </div>
                              <span className={`text-[10px] font-mono uppercase tracking-widest ${corrTextColor(val)}`}>
                                {corrLabel(val)}
                              </span>
                            </div>
                            <div className={`text-lg font-mono font-bold ${corrTextColor(val)}`}>
                              {val > 0 ? "+" : ""}{val.toFixed(2)}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ── Compare Tab ────────────────────────────────── */}
        {activeTab === "compare" && (
          <motion.div
            key="compare"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Ticker Input */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
              <p className="text-xs font-mono text-emerald-500 uppercase tracking-widest mb-4">
                Compare Any Assets — Add 2 to 6 Tickers
              </p>

              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={tickerInput}
                    onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTicker()}
                    placeholder="Enter ticker (e.g. AAPL, BTC-USD, GC=F)"
                    className="w-full bg-black border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50 placeholder:text-zinc-600"
                  />
                </div>
                <button
                  onClick={handleAddTicker}
                  disabled={!tickerInput.trim() || compareTickers.length >= 6}
                  className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              {/* Selected Tickers */}
              {compareTickers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {compareTickers.map((t, i) => (
                    <div
                      key={t}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-mono"
                      style={{
                        backgroundColor: `${CHART_COLORS[i % CHART_COLORS.length]}15`,
                        borderColor: `${CHART_COLORS[i % CHART_COLORS.length]}40`,
                        color: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    >
                      {t}
                      <button onClick={() => handleRemoveTicker(t)} className="hover:opacity-70">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleCompare}
                disabled={compareTickers.length < 2 || compareLoading}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-bold rounded-xl text-sm transition-colors"
              >
                {compareLoading ? "Analyzing…" : "Compare Assets"}
              </button>
            </div>

            {/* Compare Error */}
            {compareError && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-rose-400 font-mono text-sm text-center">
                {compareError}
              </div>
            )}

            {/* Compare Results */}
            {compareData && (
              <div className="space-y-6">
                {/* Normalized Price Chart */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                  <p className="text-xs font-mono text-emerald-500 uppercase tracking-widest mb-2">
                    Normalized Price Performance
                  </p>
                  <p className="text-[10px] text-zinc-600 font-mono mb-6">
                    Percentage change from start date — shows how assets move relative to each other
                  </p>

                  <div className="relative h-64 md:h-80">
                    <NormalizedChart charts={compareData.charts} tickers={compareTickers} />
                  </div>

                  {/* Chart Legend */}
                  <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-zinc-800/50">
                    {compareTickers.map((t, i) => (
                      <div key={t} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className="text-xs font-mono text-zinc-400">
                          {t}
                          {compareData.assets[t] ? ` — ${compareData.assets[t].name}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pairwise Correlations */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
                  <p className="text-xs font-mono text-emerald-500 uppercase tracking-widest mb-4">
                    Pairwise Correlations
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {compareData.correlations.map(c => (
                      <div
                        key={`${c.tickerA}-${c.tickerB}`}
                        className="bg-black/30 rounded-xl p-4 border border-zinc-800/50 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-emerald-400 font-mono">{c.tickerA}</span>
                            <span className="text-zinc-600 text-xs">↔</span>
                            <span className="text-sm font-bold text-emerald-400 font-mono">{c.tickerB}</span>
                          </div>
                          <span className={`text-[10px] font-mono uppercase tracking-widest ${corrTextColor(c.value)}`}>
                            {corrLabel(c.value)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {c.value > 0.3 ? (
                            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                          ) : c.value < -0.3 ? (
                            <ArrowDownRight className="w-4 h-4 text-rose-400" />
                          ) : (
                            <Minus className="w-4 h-4 text-zinc-600" />
                          )}
                          <span className={`text-xl font-mono font-bold ${corrTextColor(c.value)}`}>
                            {c.value > 0 ? "+" : ""}{c.value.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Normalized SVG Chart Component ──────────────────────
function NormalizedChart({
  charts,
  tickers,
}: {
  charts: Record<string, ChartPoint[]>;
  tickers: string[];
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 300 });
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; values: { ticker: string; value: number }[] } | null>(null);

  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute bounds
  const allPoints = tickers.flatMap(t => (charts[t] || []).map(p => p.value));
  if (allPoints.length === 0) {
    return <div className="flex items-center justify-center h-full text-zinc-600 font-mono text-sm">No price history available for these tickers</div>;
  }

  const minVal = Math.min(...allPoints, 0);
  const maxVal = Math.max(...allPoints, 0);
  const range = maxVal - minVal || 1;
  const pad = 40;

  const allDates = [...new Set(tickers.flatMap(t => (charts[t] || []).map(p => p.date)))].sort();
  const dateToX = (date: string) => {
    const idx = allDates.indexOf(date);
    return pad + (idx / Math.max(allDates.length - 1, 1)) * (dimensions.width - pad * 2);
  };
  const valToY = (val: number) => {
    return pad + (1 - (val - minVal) / range) * (dimensions.height - pad * 2);
  };

  // Zero line
  const zeroY = valToY(0);

  return (
    <svg ref={svgRef} viewBox={`0 0 ${dimensions.width} ${dimensions.height}`} className="w-full h-full" preserveAspectRatio="none">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(frac => {
        const y = pad + frac * (dimensions.height - pad * 2);
        const label = (maxVal - frac * range).toFixed(1);
        return (
          <g key={frac}>
            <line x1={pad} y1={y} x2={dimensions.width - pad} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={pad - 8} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="10" fontFamily="monospace">
              {label}%
            </text>
          </g>
        );
      })}

      {/* Zero line */}
      <line x1={pad} y1={zeroY} x2={dimensions.width - pad} y2={zeroY} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />

      {/* Lines for each ticker */}
      {tickers.map((ticker, tIdx) => {
        const points = charts[ticker] || [];
        if (points.length < 2) return null;

        const pathPoints = points.map(p => `${dateToX(p.date)},${valToY(p.value)}`).join(" L ");
        const color = CHART_COLORS[tIdx % CHART_COLORS.length];

        return (
          <g key={ticker}>
            <path
              d={`M ${pathPoints}`}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        );
      })}
    </svg>
  );
}
