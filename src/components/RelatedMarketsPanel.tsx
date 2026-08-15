"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ExternalLink, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface RelatedAsset {
  ticker: string;
  name: string;
  asset_class: string;
  price: number;
  correlation: number;
}

function corrTextColor(val: number): string {
  if (val >= 0.5) return "text-emerald-400";
  if (val > -0.5) return "text-zinc-400";
  return "text-rose-400";
}

function corrBgColor(val: number): string {
  if (val >= 0.5) return "bg-emerald-500/10 border-emerald-500/20";
  if (val > -0.5) return "bg-zinc-800/30 border-zinc-700/30";
  return "bg-rose-500/10 border-rose-500/20";
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
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8">
        <p className="text-xs font-mono text-emerald-500 uppercase tracking-widest mb-4">Related Markets</p>
        <div className="py-8 text-center text-zinc-500 font-mono text-sm animate-pulse">
          Computing correlations…
        </div>
      </div>
    );
  }

  if (error || (correlated.length === 0 && inversely.length === 0)) {
    return null; // Silently hide if no data available
  }

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8">
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs font-mono text-emerald-500 uppercase tracking-widest">Related Markets</p>
        <Link
          href="/portfolio/relativity"
          className="text-xs font-mono text-zinc-500 hover:text-emerald-400 transition-colors flex items-center gap-1"
        >
          Full Matrix <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Positively Correlated */}
        {correlated.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">Moves Together</span>
            </div>
            <div className="space-y-2">
              {correlated.map(a => (
                <Link
                  key={a.ticker}
                  href={`/portfolio/explore/${encodeURIComponent(a.asset_class)}/${encodeURIComponent(a.ticker)}`}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors hover:bg-zinc-800/20 ${corrBgColor(a.correlation)}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-mono font-bold text-emerald-400">{a.ticker}</span>
                    <span className="text-xs text-zinc-500 truncate">{a.name}</span>
                  </div>
                  <span className={`text-sm font-mono font-bold shrink-0 ${corrTextColor(a.correlation)}`}>
                    +{a.correlation.toFixed(2)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Inversely Correlated */}
        {inversely.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ArrowDownRight className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-medium text-rose-400">Moves Opposite (Hedges)</span>
            </div>
            <div className="space-y-2">
              {inversely.map(a => (
                <Link
                  key={a.ticker}
                  href={`/portfolio/explore/${encodeURIComponent(a.asset_class)}/${encodeURIComponent(a.ticker)}`}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors hover:bg-zinc-800/20 ${corrBgColor(a.correlation)}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-mono font-bold text-rose-400">{a.ticker}</span>
                    <span className="text-xs text-zinc-500 truncate">{a.name}</span>
                  </div>
                  <span className={`text-sm font-mono font-bold shrink-0 ${corrTextColor(a.correlation)}`}>
                    {a.correlation.toFixed(2)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
