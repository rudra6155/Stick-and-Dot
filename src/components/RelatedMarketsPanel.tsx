"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ExternalLink, ArrowUpRight, ArrowDownRight, Layers } from "lucide-react";
import { motion } from "framer-motion";

interface RelatedAsset {
  ticker: string;
  name: string;
  asset_class: string;
  price: number;
  correlation: number;
}

function corrTextColor(val: number): string {
  if (val >= 0.5) return "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]";
  if (val > -0.5) return "text-zinc-400";
  return "text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]";
}

function corrBgColor(val: number): string {
  if (val >= 0.5) return "bg-emerald-500/10 border-emerald-500/20 group-hover:border-emerald-400/50 group-hover:bg-emerald-500/20";
  if (val > -0.5) return "bg-zinc-800/30 border-zinc-700/30 group-hover:border-zinc-500/50 group-hover:bg-zinc-700/50";
  return "bg-rose-500/10 border-rose-500/20 group-hover:border-rose-400/50 group-hover:bg-rose-500/20";
}

export default function RelatedMarketsPanel({ ticker }: { ticker: string }) {
  const [correlated, setCorrelated] = useState<RelatedAsset[]>([]);
  const [inversely, setInversely] = useState<RelatedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/correlation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "asset", ticker }),
        });
        const data = await res.json();
        if (!active) return;

        if (data.error) {
          setError(data.error);
          return;
        }

        setCorrelated(data.correlated || []);
        setInversely(data.inversely_correlated || []);
      } catch {
        if (active) setError("Failed to load related markets");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [ticker]);

  if (loading) {
    return (
      <div className="bg-zinc-950/50 backdrop-blur-3xl border border-zinc-800/50 rounded-3xl p-8 relative overflow-hidden h-64 flex flex-col items-center justify-center shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Layers className="w-24 h-24 text-emerald-500" />
        </div>
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
        <p className="text-emerald-400 font-mono text-xs uppercase tracking-widest animate-pulse">
          Computing inter-market vectors…
        </p>
      </div>
    );
  }

  if (error || (correlated.length === 0 && inversely.length === 0)) {
    return null; // Silently hide if no data available
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0 }
  };

  return (
    <div className="bg-zinc-950/50 backdrop-blur-3xl border border-zinc-800/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
      {/* Ambient background glows based on data */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-rose-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-bold mb-1">Algorithmic Pairs</h3>
          <p className="text-xs font-mono text-zinc-500">
            Assets exhibiting strong historical correlation vectors
          </p>
        </div>
        <Link
          href="/portfolio/relativity"
          className="flex items-center gap-2 px-4 py-2 bg-black/40 hover:bg-zinc-800/80 border border-zinc-800 rounded-full text-xs font-mono text-zinc-400 hover:text-white transition-all shadow-inner"
        >
          View Matrix <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Positively Correlated */}
        {correlated.length > 0 && (
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Moves Together</span>
            </div>
            <div className="space-y-3">
              {correlated.map(a => (
                <motion.div key={a.ticker} variants={itemVariants}>
                  <Link
                    href={`/portfolio/explore/${encodeURIComponent(a.asset_class)}/${encodeURIComponent(a.ticker)}`}
                    className={`group flex items-center justify-between p-4 rounded-2xl border transition-all shadow-sm ${corrBgColor(a.correlation)}`}
                  >
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="text-base font-black font-mono tracking-tighter text-zinc-200 group-hover:text-white transition-colors">{a.ticker}</span>
                      <span className="text-xs text-zinc-500 truncate mt-0.5">{a.name}</span>
                    </div>
                    <span className={`text-lg font-mono font-black shrink-0 transition-all group-hover:scale-110 ${corrTextColor(a.correlation)}`}>
                      +{a.correlation.toFixed(2)}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Inversely Correlated */}
        {inversely.length > 0 && (
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                <ArrowDownRight className="w-4 h-4 text-rose-400" />
              </div>
              <span className="text-sm font-bold text-rose-400 uppercase tracking-widest">Moves Opposite (Hedge)</span>
            </div>
            <div className="space-y-3">
              {inversely.map(a => (
                <motion.div key={a.ticker} variants={itemVariants}>
                  <Link
                    href={`/portfolio/explore/${encodeURIComponent(a.asset_class)}/${encodeURIComponent(a.ticker)}`}
                    className={`group flex items-center justify-between p-4 rounded-2xl border transition-all shadow-sm ${corrBgColor(a.correlation)}`}
                  >
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="text-base font-black font-mono tracking-tighter text-zinc-200 group-hover:text-white transition-colors">{a.ticker}</span>
                      <span className="text-xs text-zinc-500 truncate mt-0.5">{a.name}</span>
                    </div>
                    <span className={`text-lg font-mono font-black shrink-0 transition-all group-hover:scale-110 ${corrTextColor(a.correlation)}`}>
                      {a.correlation.toFixed(2)}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
