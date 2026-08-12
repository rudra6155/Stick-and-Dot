"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronDown, ChevronUp, ExternalLink, Plus, Check, AlertTriangle } from "lucide-react";

interface PresetAsset {
  ticker: string;
  name: string;
  asset_class: string;
  weight: number;
  reason: string;
  price: number;
  market_cap?: number;
  sector?: string;
}

interface TopTicker {
  ticker: string;
  name: string;
  reason: string;
  asset_class?: string;
  price?: number;
}

interface DynamicScenario {
  id: string;
  title: string;
  emoji: string;
  summary: string;
  impact_analysis: string;
  news_headline: string;
  category: string;
  preset_portfolio: PresetAsset[];
  top_5_tickers: TopTicker[];
  watch_asset_classes: string[];
  projected_return_pct: number;
  projected_return_1k: string;
  confidence: string;
  created_at: string;
}

const confidenceStyles: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  High: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-500" },
  Moderate: { bg: "bg-yellow-500/10", text: "text-yellow-400", border: "border-yellow-500/30", dot: "bg-yellow-500" },
  Speculative: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30", dot: "bg-orange-500" },
};

const categoryLabels: Record<string, string> = {
  geopolitical: "Geopolitical",
  technology: "Technology",
  monetary_policy: "Monetary Policy",
  earnings: "Earnings",
  commodities: "Commodities",
  macro: "Macro",
};

function formatMktCap(val: number | undefined): string {
  if (!val) return "—";
  if (val >= 1e12) return `$${(val / 1e12).toFixed(1)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(0)}M`;
  return `$${val.toFixed(0)}`;
}

export default function DynamicScenarioCard({ scenario, onPresetApplied }: { scenario: DynamicScenario; onPresetApplied?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [investAmount, setInvestAmount] = useState(1000);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState<{ added: number; skipped: number; total_invested: number } | null>(null);
  const [applyError, setApplyError] = useState("");

  const conf = confidenceStyles[scenario.confidence] || confidenceStyles.Moderate;
  const timeAgo = getTimeAgo(scenario.created_at);

  async function handleApplyPreset() {
    setApplying(true);
    setApplyError("");
    setApplied(null);

    try {
      const res = await fetch("/api/dynamic-scenarios/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario_id: scenario.id, total_amount: investAmount }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setApplyError(data.error || "Failed to apply preset");
        return;
      }

      setApplied(data);
      onPresetApplied?.();
    } catch {
      setApplyError("Network error. Please try again.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <motion.div
      layout
      className="relative bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden transition-all duration-300 hover:border-zinc-700"
    >
      {/* Collapsed Card */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-6 cursor-pointer"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Category + Confidence */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                {categoryLabels[scenario.category] || scenario.category}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider ${conf.bg} ${conf.text} border ${conf.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                {scenario.confidence}
              </span>
              <span className="text-[10px] text-zinc-600 font-mono">{timeAgo}</span>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-white mb-2">
              {scenario.emoji} {scenario.title}
            </h3>

            {/* Summary */}
            <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2">{scenario.summary}</p>
          </div>

          {/* Expand Arrow */}
          <div className="shrink-0 mt-2">
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-zinc-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-zinc-500" />
            )}
          </div>
        </div>

        {/* Quick stats row */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            +{scenario.projected_return_pct}% est.
          </span>
          <span className="text-xs font-mono text-zinc-500">
            {scenario.preset_portfolio.length} assets in preset
          </span>
          {scenario.watch_asset_classes.map((cls) => (
            <span key={cls} className="text-xs font-mono text-violet-400 bg-violet-500/10 px-2 py-1 rounded-lg border border-violet-500/20">
              {cls}
            </span>
          ))}
        </div>
      </button>

      {/* Expanded Detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-6 border-t border-zinc-800/50 pt-6">
              {/* Impact Analysis */}
              <div className="bg-zinc-900/50 rounded-xl p-5 border border-zinc-800/50">
                <p className="text-xs font-mono text-emerald-500 uppercase tracking-widest mb-2">Impact Analysis</p>
                <p className="text-sm text-zinc-300 leading-relaxed">{scenario.impact_analysis}</p>
                <p className="text-xs text-zinc-600 mt-3 font-mono">Source: {scenario.news_headline}</p>
              </div>

              {/* Preset Portfolio */}
              <div>
                <p className="text-xs font-mono text-emerald-500 uppercase tracking-widest mb-3">
                  Preset Portfolio — Click any asset for full analysis
                </p>
                <div className="bg-zinc-900/30 rounded-xl border border-zinc-800/50 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-900/50 border-b border-zinc-800">
                        <tr>
                          <th className="p-3 text-left font-mono text-[10px] text-zinc-500 uppercase">Ticker</th>
                          <th className="p-3 text-left font-mono text-[10px] text-zinc-500 uppercase">Name</th>
                          <th className="p-3 text-right font-mono text-[10px] text-zinc-500 uppercase">Price</th>
                          <th className="p-3 text-right font-mono text-[10px] text-zinc-500 uppercase">Weight</th>
                          <th className="p-3 text-left font-mono text-[10px] text-zinc-500 uppercase">Reason</th>
                          <th className="p-3 text-center font-mono text-[10px] text-zinc-500 uppercase">Analyze</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/30">
                        {scenario.preset_portfolio.map((asset) => (
                          <tr key={asset.ticker} className="hover:bg-zinc-800/20 transition-colors">
                            <td className="p-3">
                              <Link
                                href={`/portfolio/explore/${encodeURIComponent(asset.asset_class)}/${encodeURIComponent(asset.ticker)}`}
                                className="font-bold text-emerald-400 hover:text-emerald-300 font-mono transition-colors"
                              >
                                {asset.ticker}
                              </Link>
                            </td>
                            <td className="p-3 text-zinc-300 max-w-[160px] truncate">{asset.name}</td>
                            <td className="p-3 text-right font-mono text-zinc-400">${(asset.price || 0).toFixed(2)}</td>
                            <td className="p-3 text-right">
                              <span className="font-mono text-white bg-white/5 px-2 py-0.5 rounded text-xs">
                                {(asset.weight * 100).toFixed(0)}%
                              </span>
                            </td>
                            <td className="p-3 text-zinc-500 text-xs max-w-[250px]">{asset.reason}</td>
                            <td className="p-3 text-center">
                              <Link
                                href={`/portfolio/explore/${encodeURIComponent(asset.asset_class)}/${encodeURIComponent(asset.ticker)}`}
                                className="inline-flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Top 5 Tickers + Asset Classes Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top 5 */}
                <div className="bg-zinc-900/30 rounded-xl p-4 border border-zinc-800/50">
                  <p className="text-xs font-mono text-yellow-500 uppercase tracking-widest mb-3">Top 5 Tickers to Watch</p>
                  <div className="space-y-2">
                    {scenario.top_5_tickers.map((t) => (
                      <Link
                        key={t.ticker}
                        href={`/portfolio/explore/${encodeURIComponent(t.asset_class || 'Stock')}/${encodeURIComponent(t.ticker)}`}
                        className="flex items-center justify-between group hover:bg-zinc-800/30 p-2 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-bold text-emerald-400 group-hover:text-emerald-300">{t.ticker}</span>
                          <span className="text-xs text-zinc-500">{t.reason}</span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Watch Classes + Projected Return */}
                <div className="space-y-4">
                  <div className="bg-zinc-900/30 rounded-xl p-4 border border-zinc-800/50">
                    <p className="text-xs font-mono text-violet-500 uppercase tracking-widest mb-3">Asset Classes to Watch</p>
                    <div className="flex flex-wrap gap-2">
                      {scenario.watch_asset_classes.map((cls) => (
                        <Link
                          key={cls}
                          href={`/portfolio/explore/${encodeURIComponent(cls)}`}
                          className="px-3 py-1.5 bg-violet-500/10 text-violet-300 text-xs font-medium rounded-full border border-violet-500/20 hover:bg-violet-500/20 transition-colors"
                        >
                          {cls} →
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 rounded-xl p-4 border border-emerald-500/20">
                    <p className="text-xs font-mono text-emerald-500 uppercase tracking-widest mb-1">Projected Return</p>
                    <p className="text-lg font-bold text-emerald-400">{scenario.projected_return_1k}</p>
                    <p className="text-[10px] text-zinc-600 mt-1 font-mono">
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      Estimated. Not financial advice. Do your own research.
                    </p>
                  </div>
                </div>
              </div>

              {/* Add Preset Section */}
              <div className="bg-zinc-900/50 rounded-xl p-5 border border-emerald-500/20">
                {applied ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Check className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-emerald-400 font-bold">
                        {applied.added} assets added to your portfolio
                      </p>
                      <p className="text-xs text-zinc-500 font-mono">
                        ${applied.total_invested.toLocaleString()} invested
                        {applied.skipped > 0 && ` · ${applied.skipped} skipped (already in portfolio)`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white mb-1">Add This Preset to Your Portfolio</p>
                        <p className="text-xs text-zinc-500">
                          {scenario.preset_portfolio.length} assets will be added with weighted allocation. 
                          Click any ticker above to analyze it first.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">$</span>
                          <input
                            type="number"
                            value={investAmount}
                            onChange={(e) => setInvestAmount(Math.max(1, Number(e.target.value)))}
                            className="w-28 bg-zinc-900 border border-zinc-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500/50"
                            min={1}
                            max={1000000}
                            aria-label="Investment amount"
                          />
                        </div>
                        <button
                          onClick={handleApplyPreset}
                          disabled={applying}
                          className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:cursor-not-allowed text-black font-bold rounded-full text-sm transition-colors"
                        >
                          {applying ? (
                            <span className="animate-pulse">Adding...</span>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              Add Preset
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    {applyError && (
                      <p className="text-rose-400 text-xs font-mono mt-3">{applyError}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
