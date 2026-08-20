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

// Only these asset classes carry a meaningful "sector" — clearing it when the class changes
// away from these prevents a stale sector (e.g. from a preset) from silently zeroing results.
const SECTOR_CAPABLE_CLASSES = ["Stock", "Indian Stock", "International"];

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
      if (data.error) {
        setError(data.error);
        setResults([]);
      } else {
        setResults(data.results || []);
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      setError("Failed to run backtest");
      setResults([]);
    }
    setLoading(false);
    setRan(true);
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setActivePreset(preset.label);
    setFilters(preset.filters);
    runBacktest(preset.filters);
  };

  const validResults = results.filter((r) => r.return_pct != null);

  // Geometric mean (compounded) return across the basket, rather than a naive arithmetic mean —
  // e.g. [+50%, -50%] arithmetic-averages to 0% but compounds to a real loss of ~13.4%.
  const avg = validResults.length
    ? (
        (validResults.reduce((prod, r) => prod * (1 + r.return_pct / 100), 1) ** (1 / validResults.length) - 1) *
        100
      ).toFixed(2)
    : null;
  const best = validResults.length ? validResults[0] : null;
  const worst = validResults.length ? validResults[validResults.length - 1] : null;

  // --- Risk metrics built from each asset's monthly_returns series (from /api/backtest) ---
  // Equal-weight the basket's assets into a single portfolio monthly-return series, then
  // derive Sharpe Ratio, Annualized Volatility, and Max Drawdown from that series.
  const monthlyReturnsByMonth: Record<string, number[]> = {};
  validResults.forEach((r) => {
    (r.monthly_returns || []).forEach((m: any) => {
      if (m.return_pct == null) return;
      if (!monthlyReturnsByMonth[m.month]) monthlyReturnsByMonth[m.month] = [];
      monthlyReturnsByMonth[m.month].push(m.return_pct);
    });
  });
  const sortedMonths = Object.keys(monthlyReturnsByMonth).sort();
  const portfolioMonthlyReturns = sortedMonths.map(
    (m) => monthlyReturnsByMonth[m].reduce((s, v) => s + v, 0) / monthlyReturnsByMonth[m].length
  );

  let sharpeRatio: number | null = null;
  let annualizedVolatility: number | null = null;
  let maxDrawdown: number | null = null;

  if (portfolioMonthlyReturns.length > 1) {
    const n = portfolioMonthlyReturns.length;
    const meanReturn = portfolioMonthlyReturns.reduce((s, v) => s + v, 0) / n;
    const variance = portfolioMonthlyReturns.reduce((s, v) => s + (v - meanReturn) ** 2, 0) / n;
    const stdDev = Math.sqrt(variance);
    const riskFreeRateMonthly = 0; // no risk-free rate source exists elsewhere in this codebase

    sharpeRatio = stdDev !== 0 ? (meanReturn - riskFreeRateMonthly) / stdDev : null;
    annualizedVolatility = stdDev * Math.sqrt(12); // monthly series annualized

    let cumulative = 1;
    let peak = 1;
    let maxDD = 0;
    portfolioMonthlyReturns.forEach((r) => {
      cumulative *= 1 + r / 100;
      if (cumulative > peak) peak = cumulative;
      const drawdown = (peak - cumulative) / peak;
      if (drawdown > maxDD) maxDD = drawdown;
    });
    maxDrawdown = maxDD * 100;
  }

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
                className={`p-4 rounded-2xl border text-left transition-all ${activePreset === p.label
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="space-y-2">
              <label htmlFor="assetClass" className="text-xs text-zinc-400">Asset Class</label>
              <select
                id="assetClass"
                value={filters.asset_class || "All"}
                onChange={e => {
                  const newClass = e.target.value !== "All" ? e.target.value : undefined;
                  setFilters((f: any) => {
                    const next = { ...f, asset_class: newClass };
                    // Sector only makes sense for sector-capable classes — drop a stale
                    // preset-driven sector rather than silently zeroing out results.
                    if (!newClass || !SECTOR_CAPABLE_CLASSES.includes(newClass)) {
                      delete next.sector;
                    }
                    return next;
                  });
                }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100"
              >
                {["All", "Stock", "ETF", "REIT", "Crypto", "Commodity", "Bond", "Indian Stock", "International", "Forex", "Index"].map(a => (
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
                {["All Sectors", "Technology", "Healthcare", "Financial Services", "Energy", "Industrials", "Consumer Cyclical", "Consumer Defensive", "Basic Materials", "Real Estate", "Utilities", "Communication Services"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="minMarketCap" className="text-xs text-zinc-400">Min Market Cap ($B)</label>
              <input id="minMarketCap" type="number" placeholder="e.g. 10"
                value={filters.min_market_cap != null ? filters.min_market_cap / 1e9 : ""}
                onChange={e => setFilters((f: any) => ({ ...f, min_market_cap: e.target.value ? Number(e.target.value) * 1e9 : undefined }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100 placeholder:text-zinc-600" />
            </div>
            <div className="space-y-2">
              <label htmlFor="maxPe" className="text-xs text-zinc-400">Max P/E</label>
              <input id="maxPe" type="number" placeholder="e.g. 20"
                value={filters.max_pe ?? ""}
                onChange={e => setFilters((f: any) => ({ ...f, max_pe: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100 placeholder:text-zinc-600" />
            </div>
            <div className="space-y-2">
              <label htmlFor="minRevGrowth" className="text-xs text-zinc-400">Min Rev Growth (%)</label>
              <input id="minRevGrowth" type="number" placeholder="e.g. 15"
                value={filters.min_revenue_growth != null ? filters.min_revenue_growth * 100 : ""}
                onChange={e => setFilters((f: any) => ({ ...f, min_revenue_growth: e.target.value ? Number(e.target.value) / 100 : undefined }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100 placeholder:text-zinc-600" />
            </div>
            <div className="space-y-2">
              <label htmlFor="maxBeta" className="text-xs text-zinc-400">Max Beta</label>
              <input id="maxBeta" type="number" placeholder="e.g. 1.0"
                value={filters.max_beta ?? ""}
                onChange={e => setFilters((f: any) => ({ ...f, max_beta: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100 placeholder:text-zinc-600" />
            </div>
            <div className="space-y-2">
              <label htmlFor="minDivYield" className="text-xs text-zinc-400">Min Div Yield (%)</label>
              <input id="minDivYield" type="number" placeholder="e.g. 3"
                value={filters.min_dividend_yield != null ? filters.min_dividend_yield * 100 : ""}
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
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-center">
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Avg Return (6M, Compounded)</p>
                {avg !== null ? (
                  <p className={`text-3xl font-black font-mono ${Number(avg) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {Number(avg) >= 0 ? '+' : ''}{avg}%
                  </p>
                ) : (
                  <p className="text-3xl font-black font-mono text-zinc-600">N/A</p>
                )}
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-center">
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Best Performer</p>
                {best ? (
                  <>
                    <p className="text-3xl font-black font-mono text-emerald-400">{best.ticker}</p>
                    <p className="text-sm text-zinc-500 mt-1">+{best.return_pct}%</p>
                  </>
                ) : (
                  <p className="text-3xl font-black font-mono text-zinc-600">N/A</p>
                )}
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-center">
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Worst Performer</p>
                {worst ? (
                  <>
                    <p className="text-3xl font-black font-mono text-rose-400">{worst.ticker}</p>
                    <p className="text-sm text-zinc-500 mt-1">{worst.return_pct}%</p>
                  </>
                ) : (
                  <p className="text-3xl font-black font-mono text-zinc-600">N/A</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-center">
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Sharpe Ratio (Monthly, rf≈0)</p>
                <p className={`text-3xl font-black font-mono ${
                  sharpeRatio === null ? 'text-zinc-600' : sharpeRatio >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {sharpeRatio !== null ? sharpeRatio.toFixed(2) : 'N/A'}
                </p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-center">
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Annualized Volatility</p>
                <p className={`text-3xl font-black font-mono ${annualizedVolatility !== null ? 'text-yellow-400' : 'text-zinc-600'}`}>
                  {annualizedVolatility !== null ? `${annualizedVolatility.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-center">
                <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-2">Max Drawdown</p>
                <p className={`text-3xl font-black font-mono ${maxDrawdown !== null ? 'text-rose-400' : 'text-zinc-600'}`}>
                  {maxDrawdown !== null ? (maxDrawdown > 0 ? `-${maxDrawdown.toFixed(1)}%` : '0.0%') : 'N/A'}
                </p>
              </div>
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
                        <td className={`p-4 text-right font-mono font-bold ${r.return_pct === null ? 'text-zinc-600' :
                            r.return_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                          {r.return_pct === null ? '—' : `${r.return_pct >= 0 ? '+' : ''}${r.return_pct}%`}
                        </td>
                        <td className={`p-4 text-right font-mono text-xs ${!r.beta ? 'text-zinc-600' :
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
