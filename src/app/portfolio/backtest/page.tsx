"use client";
import { useState, useRef } from "react";

const PRESETS = [
  { label: "📈 High Growth Stocks", desc: "Rev growth > 20%, any sector", filters: { min_revenue_growth: 0.2 } },
  { label: "🛡️ Low Risk Portfolio", desc: "Beta < 0.8, large cap", filters: { max_beta: 0.8, min_market_cap: 10e9 } },
  { label: "💵 Dividend Earners", desc: "Div yield > 3%", filters: { min_dividend_yield: 0.03 } },
  { label: "🔍 Undervalued", desc: "P/E < 15, rev growth > 10%", filters: { max_pe: 15, min_revenue_growth: 0.1 } },
  { label: "🇮🇳 India Play", desc: "Indian stocks only", filters: { asset_class: "Indian Stock" } },
  { label: "🤖 AI & Tech", desc: "Technology sector", filters: { asset_class: "Stock", sector: "Technology" } },
];

export default function BacktestPage() {
  const [filters, setFilters] = useState<any>({});
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [ran, setRan] = useState(false);
  const [error, setError] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const runBacktest = async (overrideFilters?: any) => {
    setLoading(true);
    setError("");
    const reqFilters = overrideFilters || filters;
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    try {
      const res = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqFilters),
        signal: abortControllerRef.current.signal,
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResults(data.results || []);
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      setError("Failed to run backtest");
    }
    setLoading(false);
    setRan(true);
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setActivePreset(preset.label);
    setFilters(preset.filters);
    runBacktest(preset.filters);
  };

  const avg = results.length
    ? (results.reduce((s, r) => s + (r.return_pct || 0), 0) / results.length).toFixed(2)
    : null;
  const best = results.length ? results[0] : null;
  const worst = results.length ? results[results.length - 1] : null;

  return (
    <div className="bg-black text-white font-sans">
      <div className="pt-24 max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-5xl font-black tracking-tight">Backtest</h1>
          <p className="text-emerald-400 mt-2 font-mono text-sm uppercase tracking-widest">
            See how assets matching your criteria performed over the last 6 months
          </p>
        </div>

        {/* Presets */}
        <div>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Quick backtests</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  activePreset === p.label
                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                    : "bg-zinc-950 border-zinc-800 hover:border-zinc-600 text-zinc-300"
                }`}
              >
                <div className="text-sm font-semibold leading-tight mb-1">{p.label}</div>
                <div className="text-xs text-zinc-500">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Filters */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-6">Custom filters</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="space-y-2">
              <label htmlFor="assetClass" className="text-xs text-zinc-400">Asset Class</label>
              <select
                id="assetClass"
                value={filters.asset_class || "All"}
                onChange={e => setFilters((f: any) => ({ ...f, asset_class: e.target.value !== "All" ? e.target.value : undefined }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100"
              >
                {["All","Stock","ETF","REIT","Crypto","Commodity","Bond","Indian Stock","International","Forex","Index"].map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="sector" className="text-xs text-zinc-400">Sector</label>
              <select
                id="sector"
                value={filters.sector || "All Sectors"}
                onChange={e => setFilters((f: any) => ({ ...f, sector: e.target.value !== "All Sectors" ? e.target.value : undefined }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100"
              >
                {["All Sectors","Technology","Healthcare","Financial Services","Energy","Industrials","Consumer Cyclical","Consumer Defensive","Basic Materials","Real Estate","Utilities","Communication Services"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="maxPe" className="text-xs text-zinc-400">Max P/E</label>
              <input id="maxPe" type="number" placeholder="e.g. 20"
                onChange={e => setFilters((f: any) => ({ ...f, max_pe: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100 placeholder:text-zinc-600" />
            </div>
            <div className="space-y-2">
              <label htmlFor="minRevGrowth" className="text-xs text-zinc-400">Min Rev Growth (%)</label>
              <input id="minRevGrowth" type="number" placeholder="e.g. 15"
                onChange={e => setFilters((f: any) => ({ ...f, min_revenue_growth: e.target.value ? Number(e.target.value) / 100 : undefined }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100 placeholder:text-zinc-600" />
            </div>
            <div className="space-y-2">
              <label htmlFor="maxBeta" className="text-xs text-zinc-400">Max Beta</label>
              <input id="maxBeta" type="number" placeholder="e.g. 1.0"
                onChange={e => setFilters((f: any) => ({ ...f, max_beta: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100 placeholder:text-zinc-600" />
            </div>
            <div className="space-y-2">
              <label htmlFor="minDivYield" className="text-xs text-zinc-400">Min Div Yield (%)</label>
              <input id="minDivYield" type="number" placeholder="e.g. 3"
                onChange={e => setFilters((f: any) => ({ ...f, min_dividend_yield: e.target.value ? Number(e.target.value) / 100 : undefined }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100 placeholder:text-zinc-600" />
            </div>
            <div className="space-y-2 flex items-end">
              <button
                onClick={() => { setActivePreset(null); runBacktest(); }}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl p-2.5 text-sm transition-colors"
              >
                {loading ? "Running..." : "Run Backtest"}
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-rose-400 font-mono text-sm text-center">
            {error}
          </div>
        )}

        {/* Summary Stats */}
        {ran && !loading && !error && results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-center">
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Avg Return (6M)</p>
              <p className={`text-3xl font-black font-mono ${Number(avg) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {Number(avg) >= 0 ? '+' : ''}{avg}%
              </p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-center">
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Best Performer</p>
              <p className="text-3xl font-black font-mono text-emerald-400">{best?.ticker}</p>
              <p className="text-sm text-zinc-500 mt-1">+{best?.return_pct}%</p>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-center">
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Worst Performer</p>
              <p className="text-3xl font-black font-mono text-rose-400">{worst?.ticker}</p>
              <p className="text-sm text-zinc-500 mt-1">{worst?.return_pct}%</p>
            </div>
          </div>
        )}

        {/* Results Table */}
        {ran && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-900/50 border-b border-zinc-800">
                <tr>
                  <th className="p-4 font-mono text-xs text-zinc-500 uppercase">#</th>
                  <th className="p-4 font-mono text-xs text-zinc-500 uppercase">Ticker</th>
                  <th className="p-4 font-mono text-xs text-zinc-500 uppercase">Name</th>
                  <th className="p-4 font-mono text-xs text-zinc-500 uppercase">Class</th>
                  <th className="p-4 font-mono text-xs text-zinc-500 uppercase text-right">Start Price</th>
                  <th className="p-4 font-mono text-xs text-zinc-500 uppercase text-right">End Price</th>
                  <th className="p-4 font-mono text-xs text-zinc-500 uppercase text-right">6M Return</th>
                  <th className="p-4 font-mono text-xs text-zinc-500 uppercase text-right">Beta</th>
                  <th className="p-4 font-mono text-xs text-zinc-500 uppercase text-right">Rev Growth</th>
                  <th className="p-4 font-mono text-xs text-zinc-500 uppercase text-right">P/E</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-zinc-500 font-mono animate-pulse">
                      Crunching 6 months of data...
                    </td>
                  </tr>
                ) : results.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-12 text-center text-zinc-500">
                      No assets match these criteria. Try relaxing the filters.
                    </td>
                  </tr>
                ) : (
                  results.map((r, i) => (
                    <tr key={r.ticker} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="p-4 text-zinc-600 font-mono">#{i + 1}</td>
                      <td className="p-4 font-bold text-emerald-400 font-mono">{r.ticker}</td>
                      <td className="p-4 text-zinc-300 truncate max-w-[160px]">{r.short_name || r.ticker}</td>
                      <td className="p-4 text-zinc-500 text-xs">{r.asset_class}</td>
                      <td className="p-4 text-right font-mono text-zinc-400">${r.start_price}</td>
                      <td className="p-4 text-right font-mono text-zinc-400">${r.end_price}</td>
                      <td className={`p-4 text-right font-mono font-bold ${
                        r.return_pct === null ? 'text-zinc-600' :
                        r.return_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {r.return_pct === null ? '—' : `${r.return_pct >= 0 ? '+' : ''}${r.return_pct}%`}
                      </td>
                      <td className={`p-4 text-right font-mono text-xs ${
                        !r.beta ? 'text-zinc-600' :
                        r.beta < 1 ? 'text-emerald-400' : r.beta < 1.5 ? 'text-yellow-400' : 'text-rose-400'
                      }`}>{r.beta ? r.beta.toFixed(2) : '—'}</td>
                      <td className="p-4 text-right font-mono text-xs text-zinc-400">
                        {r.revenue_growth ? `${(r.revenue_growth * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td className="p-4 text-right font-mono text-xs text-zinc-400">
                        {r.pe_ratio ? r.pe_ratio.toFixed(1) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
