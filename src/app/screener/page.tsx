"use client";
import { useState, useEffect } from "react";

const PRACTICAL_FILTERS = [
  {
    id: "earn_more",
    label: "💰 What can I earn?",
    desc: "High growth assets",
    filters: { sort_by: "revenue_growth", sort_dir: "desc", min_revenue_growth: 0.1 }
  },
  {
    id: "lose_less",
    label: "🛡️ What can I lose?",
    desc: "Low risk, low volatility",
    filters: { sort_by: "beta", sort_dir: "asc", max_beta: 0.8 }
  },
  {
    id: "easy_exit",
    label: "🚪 How easily can I exit?",
    desc: "High liquidity assets",
    filters: { sort_by: "market_cap", sort_dir: "desc" }
  },
  {
    id: "income",
    label: "💵 Passive income",
    desc: "High dividend yield",
    filters: { sort_by: "dividend_yield", sort_dir: "desc", min_dividend_yield: 0.02 }
  },
  {
    id: "undervalued",
    label: "🔍 Undervalued",
    desc: "Low P/E, high growth",
    filters: { sort_by: "earnings_growth", sort_dir: "desc", max_pe: 20 }
  },
  {
    id: "best_fintech",
    label: "📱 Best Fintech",
    desc: "Top financial services by growth",
    filters: { asset_class: "Stock", sector: "Financial Services", sort_by: "revenue_growth", sort_dir: "desc" }
  },
];

const SORT_OPTIONS = [
  { value: "revenue_growth", label: "Revenue Growth" },
  { value: "earnings_growth", label: "Earnings Growth" },
  { value: "pe_ratio", label: "P/E Ratio" },
  { value: "dividend_yield", label: "Dividend Yield" },
  { value: "market_cap", label: "Market Cap" },
  { value: "return_on_equity", label: "ROE" },
  { value: "profit_margins", label: "Profit Margins" },
  { value: "beta", label: "Beta (Risk)" },
  { value: "free_cashflow", label: "Free Cash Flow" },
  { value: "investment_score", label: "Investment Score" },
];

const formatMetric = (val: any, key: string) => {
  if (val === null || val === undefined) return "—";
  if (["revenue_growth", "earnings_growth", "profit_margins", "dividend_yield", "return_on_equity"].includes(key)) {
    return (val * 100).toFixed(1) + "%";
  }
  if (key === "market_cap") return val > 1e12 ? `$${(val/1e12).toFixed(1)}T` : val > 1e9 ? `$${(val/1e9).toFixed(1)}B` : `$${(val/1e6).toFixed(0)}M`;
  if (key === "free_cashflow") return val > 1e9 ? `$${(val/1e9).toFixed(1)}B` : `$${(val/1e6).toFixed(0)}M`;
  if (typeof val === "number") return val.toFixed(2);
  return val;
};

export default function ScreenerPage() {
  const [assetClass, setAssetClass] = useState("All");
  const [sector, setSector] = useState("All Sectors");
  const [sortBy, setSortBy] = useState("revenue_growth");
  const [sortDir, setSortDir] = useState("desc");
  const [minMarketCap, setMinMarketCap] = useState("");
  const [maxPe, setMaxPe] = useState("");
  const [minDiv, setMinDiv] = useState("");
  const [minRevGrowth, setMinRevGrowth] = useState("");
  const [maxBeta, setMaxBeta] = useState("");
  const [minRoe, setMinRoe] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const buildFilters = () => ({
    asset_class: assetClass !== "All" ? assetClass : undefined,
    sector: sector !== "All Sectors" ? sector : undefined,
    sort_by: sortBy,
    sort_dir: sortDir,
    min_market_cap: minMarketCap ? Number(minMarketCap) * 1e9 : undefined,
    max_pe: maxPe ? Number(maxPe) : undefined,
    min_dividend_yield: minDiv ? Number(minDiv) / 100 : undefined,
    min_revenue_growth: minRevGrowth ? Number(minRevGrowth) / 100 : undefined,
    max_beta: maxBeta ? Number(maxBeta) : undefined,
    min_roe: minRoe ? Number(minRoe) / 100 : undefined,
  });

  const fetchResults = async (overrideFilters?: any) => {
    setLoading(true);
    try {
      const res = await fetch("/api/screener", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overrideFilters || buildFilters()),
      });
      const data = await res.json();
      if (data.results) setResults(data.results);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchResults(); }, []);

  const applyPreset = (preset: typeof PRACTICAL_FILTERS[0]) => {
    setActivePreset(preset.id);
    const f = preset.filters as any;
    setAssetClass(f.asset_class || "All");
    setSector(f.sector || "All Sectors");
    setSortBy(f.sort_by || "revenue_growth");
    setSortDir(f.sort_dir || "desc");
    setMinMarketCap("");
    setMaxPe(f.max_pe !== undefined ? String(f.max_pe) : "");
    setMinDiv(f.min_dividend_yield !== undefined ? String(f.min_dividend_yield * 100) : "");
    setMinRevGrowth(f.min_revenue_growth !== undefined ? String(f.min_revenue_growth * 100) : "");
    setMaxBeta(f.max_beta !== undefined ? String(f.max_beta) : "");
    fetchResults(f);
  };

  return (
    <div className="bg-black text-white font-sans">
      <div className="pt-24 max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-5xl font-black tracking-tight">Smart Screener</h1>
          <p className="text-emerald-400 mt-2 font-mono text-sm uppercase tracking-widest">Filter 1000+ assets by any metric</p>
        </div>

        {/* Practical Investment Filters */}
        <div>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Quick filters — what matters to you?</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {PRACTICAL_FILTERS.map(p => (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  activePreset === p.id
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

        {/* Advanced Filters */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-6">Advanced filters</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Asset Class</label>
              <select value={assetClass} onChange={e => setAssetClass(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100">
                {["All","Stock","ETF","REIT","Crypto","Commodity","Bond","Indian Stock","International"].map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Sector</label>
              <select value={sector} onChange={e => setSector(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100">
                {["All Sectors","Technology","Healthcare","Financial Services","Energy","Industrials","Consumer Cyclical","Consumer Defensive","Basic Materials","Real Estate","Utilities","Communication Services"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Sort By</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Direction</label>
              <select value={sortDir} onChange={e => setSortDir(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100">
                <option value="desc">Best First</option>
                <option value="asc">Lowest First</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Min Market Cap ($B)</label>
              <input type="number" value={minMarketCap} onChange={e => setMinMarketCap(e.target.value)}
                placeholder="e.g. 1"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100 placeholder:text-zinc-600" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Max P/E</label>
              <input type="number" value={maxPe} onChange={e => setMaxPe(e.target.value)}
                placeholder="e.g. 25"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100 placeholder:text-zinc-600" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Min Div Yield (%)</label>
              <input type="number" value={minDiv} onChange={e => setMinDiv(e.target.value)}
                placeholder="e.g. 3"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100 placeholder:text-zinc-600" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Min Rev Growth (%)</label>
              <input type="number" value={minRevGrowth} onChange={e => setMinRevGrowth(e.target.value)}
                placeholder="e.g. 10"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100 placeholder:text-zinc-600" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Max Beta (Risk)</label>
              <input type="number" value={maxBeta} onChange={e => setMaxBeta(e.target.value)}
                placeholder="e.g. 1.2"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100 placeholder:text-zinc-600" />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-zinc-400">Min ROE (%)</label>
              <input type="number" value={minRoe} onChange={e => setMinRoe(e.target.value)}
                placeholder="e.g. 15"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm text-zinc-100 placeholder:text-zinc-600" />
            </div>
            <div className="space-y-2 flex items-end col-span-2">
              <button onClick={() => { setActivePreset(null); fetchResults(); }}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl p-2.5 text-sm transition-colors">
                {loading ? "Screening..." : "Screen"}
              </button>
            </div>
          </div>
        </div>

        {/* Results count */}
        {results.length > 0 && (
          <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
            {results.length} assets matched
          </p>
        )}

        {/* Results Table */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="p-4 font-mono text-xs uppercase tracking-wider">Rank</th>
                <th className="p-4 font-mono text-xs uppercase tracking-wider">Ticker</th>
                <th className="p-4 font-mono text-xs uppercase tracking-wider">Name</th>
                <th className="p-4 font-mono text-xs uppercase tracking-wider">Class / Sector</th>
                <th className="p-4 font-mono text-xs uppercase tracking-wider text-right">Price</th>
                <th className="p-4 font-mono text-xs uppercase tracking-wider text-right">
                  {SORT_OPTIONS.find(o => o.value === sortBy)?.label || sortBy}
                </th>
                <th className="p-4 font-mono text-xs uppercase tracking-wider text-right">💰 Earn</th>
                <th className="p-4 font-mono text-xs uppercase tracking-wider text-right">🛡️ Risk</th>
                <th className="p-4 font-mono text-xs uppercase tracking-wider text-right">🚪 Exit</th>
                <th className="p-4 font-mono text-xs uppercase tracking-wider text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-zinc-500 font-mono animate-pulse">
                    Screening assets...
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
                    <td className="p-4 text-zinc-500 font-mono">#{i + 1}</td>
                    <td className="p-4 font-bold text-emerald-400 font-mono">{r.ticker}</td>
                    <td className="p-4 text-zinc-300 truncate max-w-[180px]">{r.short_name || r.ticker}</td>
                    <td className="p-4 text-zinc-500 text-xs">
                      <span className="text-zinc-400">{r.asset_class}</span>
                      {r.sector && <span className="text-zinc-700 mx-1">·</span>}
                      {r.sector && <span>{r.sector}</span>}
                    </td>
                    <td className="p-4 text-right font-mono">${(r.price || 0).toFixed(2)}</td>
                    <td className="p-4 text-right font-mono text-emerald-400">
                      {formatMetric(r[sortBy], sortBy)}
                    </td>
                    <td className="p-4 text-right font-mono text-xs text-zinc-400">{r.what_can_earn}</td>
                    <td className={`p-4 text-right font-mono text-xs ${
                      r.beta < 1 ? 'text-emerald-400' : r.beta < 1.5 ? 'text-yellow-400' : 'text-rose-400'
                    }`}>{r.what_can_lose}</td>
                    <td className={`p-4 text-right font-mono text-xs ${
                      r.how_easy_exit === 'Very Easy' ? 'text-emerald-400' :
                      r.how_easy_exit === 'Easy' ? 'text-blue-400' :
                      r.how_easy_exit === 'Moderate' ? 'text-yellow-400' : 'text-rose-400'
                    }`}>{r.how_easy_exit}</td>
                    <td className="p-4 text-right">
                      <span className={`px-2 py-1 rounded-lg font-mono text-xs font-bold ${
                        r.investment_score > 60 ? 'bg-emerald-500/20 text-emerald-400' :
                        r.investment_score > 40 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {r.investment_score}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
