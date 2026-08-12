"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ChevronDown, ChevronUp, ExternalLink, Plus, Check, AlertTriangle, X } from "lucide-react";

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

          {/* Expand Arrow / View Details Button */}
          <div className="shrink-0 mt-2 flex items-center">
            <span className="text-xs font-mono text-emerald-500 uppercase tracking-widest hidden sm:inline-block mr-2 group-hover:text-emerald-400 transition-colors">
              Analyze
            </span>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
              <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
            </div>
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

      {/* Expanded Modal */}
      <AnimatePresence>
        {expanded && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpanded(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl max-h-full overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-2xl shadow-[0_0_80px_-20px_rgba(16,185,129,0.3)] custom-scrollbar"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider ${conf.bg} ${conf.text} border ${conf.border}`}>
                    <span className={`w-2 h-2 rounded-full ${conf.dot}`} />
                    {scenario.confidence} Match
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">
                    {categoryLabels[scenario.category] || scenario.category}
                  </span>
                </div>
                <button
                  onClick={() => setExpanded(false)}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <div className="p-6 md:p-8 space-y-8">
                {/* Header & Impact Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  <div>
                    <h2 className="text-3xl font-black text-white mb-4 tracking-tight">
                      {scenario.emoji} {scenario.title}
                    </h2>
                    <p className="text-lg text-zinc-400 leading-relaxed mb-6">
                      {scenario.summary}
                    </p>
                    <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-800/50">
                      <p className="text-xs font-mono text-emerald-500 uppercase tracking-widest mb-3">Impact Analysis</p>
                      <p className="text-sm text-zinc-300 leading-relaxed mb-4">{scenario.impact_analysis}</p>
                      <p className="text-xs text-zinc-500 font-mono flex items-start gap-2">
                        <span className="shrink-0 font-bold">SOURCE:</span> 
                        <span className="italic">{scenario.news_headline}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-zinc-900/30 rounded-xl p-5 border border-emerald-500/20">
                        <p className="text-xs font-mono text-emerald-500 uppercase tracking-widest mb-1">Projected Return</p>
                        <p className="text-3xl font-black text-emerald-400">+{scenario.projected_return_pct}%</p>
                        <p className="text-sm font-mono text-emerald-500/70 mt-1">{scenario.projected_return_1k}</p>
                      </div>
                      <div className="bg-zinc-900/30 rounded-xl p-5 border border-zinc-800/50">
                        <p className="text-xs font-mono text-violet-500 uppercase tracking-widest mb-3">Target Asset Classes</p>
                        <div className="flex flex-wrap gap-2">
                          {scenario.watch_asset_classes.map((cls) => (
                            <Link
                              key={cls}
                              href={`/portfolio/explore/${encodeURIComponent(cls)}`}
                              className="px-3 py-1.5 bg-violet-500/10 text-violet-300 text-xs font-medium rounded-full border border-violet-500/20 hover:bg-violet-500/20 transition-colors"
                            >
                              {cls}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-zinc-900/30 rounded-xl p-5 border border-zinc-800/50">
                      <p className="text-xs font-mono text-yellow-500 uppercase tracking-widest mb-4">Top 5 Tickers to Watch</p>
                      <div className="space-y-3">
                        {scenario.top_5_tickers.map((t) => (
                          <Link
                            key={t.ticker}
                            href={`/portfolio/explore/${encodeURIComponent(t.asset_class || 'Stock')}/${encodeURIComponent(t.ticker)}`}
                            className="flex items-start gap-4 group hover:bg-zinc-800/30 p-2 -mx-2 rounded-lg transition-colors"
                          >
                            <span className="text-sm font-mono font-bold text-emerald-400 group-hover:text-emerald-300 w-16 shrink-0">{t.ticker}</span>
                            <span className="text-xs text-zinc-400 leading-relaxed group-hover:text-zinc-300">{t.reason}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-zinc-800/50" />

                {/* Preset Portfolio & Add Action */}
                <div>
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Preset Portfolio</h3>
                      <p className="text-sm text-zinc-500">
                        A dynamically generated, balanced portfolio tailored to capitalize on this specific scenario.
                      </p>
                    </div>

                    {/* Add Preset Action Box */}
                    <div className="shrink-0 bg-zinc-900/80 rounded-xl p-4 border border-emerald-500/30 flex items-center gap-4">
                      {applied ? (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-sm text-emerald-400 font-bold">{applied.added} assets added</p>
                            <p className="text-[10px] text-zinc-500 font-mono">${applied.total_invested.toLocaleString()} invested</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-mono">$</span>
                            <input
                              type="number"
                              value={investAmount}
                              onChange={(e) => setInvestAmount(Math.max(1, Number(e.target.value)))}
                              className="w-32 bg-black border border-zinc-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                              min={1}
                              max={1000000}
                              aria-label="Investment amount"
                            />
                          </div>
                          <button
                            onClick={handleApplyPreset}
                            disabled={applying}
                            className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-black font-bold rounded-lg text-sm transition-colors"
                          >
                            {applying ? "Adding..." : "Add Preset"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {applyError && (
                    <p className="text-rose-400 text-xs font-mono mb-4 text-right">{applyError}</p>
                  )}

                  {/* Wide Table */}
                  <div className="bg-black rounded-xl border border-zinc-800/50 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-zinc-900/50 border-b border-zinc-800">
                          <tr>
                            <th className="p-4 text-left font-mono text-[10px] text-zinc-500 uppercase">Asset</th>
                            <th className="p-4 text-left font-mono text-[10px] text-zinc-500 uppercase">Reason for Inclusion</th>
                            <th className="p-4 text-right font-mono text-[10px] text-zinc-500 uppercase">Current Price</th>
                            <th className="p-4 text-right font-mono text-[10px] text-zinc-500 uppercase whitespace-nowrap">Portfolio Weight</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/30">
                          {scenario.preset_portfolio.map((asset) => (
                            <tr key={asset.ticker} className="hover:bg-zinc-900/30 transition-colors">
                              <td className="p-4">
                                <Link
                                  href={`/portfolio/explore/${encodeURIComponent(asset.asset_class)}/${encodeURIComponent(asset.ticker)}`}
                                  className="flex flex-col group"
                                >
                                  <span className="font-bold text-emerald-400 group-hover:text-emerald-300 font-mono transition-colors flex items-center gap-1.5">
                                    {asset.ticker} <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </span>
                                  <span className="text-xs text-zinc-500 mt-0.5 line-clamp-1 max-w-[150px]">{asset.name}</span>
                                </Link>
                              </td>
                              <td className="p-4 text-zinc-400 text-sm max-w-[400px] leading-relaxed">
                                {asset.reason}
                              </td>
                              <td className="p-4 text-right font-mono text-zinc-300 whitespace-nowrap">
                                ${(asset.price || 0).toFixed(2)}
                              </td>
                              <td className="p-4 text-right">
                                <span className="font-mono text-white bg-white/10 px-2.5 py-1 rounded-md text-xs border border-white/5">
                                  {(asset.weight * 100).toFixed(0)}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <p className="text-center text-[10px] text-zinc-600 mt-6 font-mono uppercase tracking-widest">
                    <AlertTriangle className="w-3 h-3 inline mr-1 -mt-0.5" />
                    Not financial advice. Perform independent research before investing.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
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
