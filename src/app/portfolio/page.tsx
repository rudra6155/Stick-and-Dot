"use client";
import { useState } from "react";

const SUGGESTED = [
  { label: "🛡️ Conservative", tickers: ["BND", "TLT", "GLD", "VNQ", "VTI"] },
  { label: "🚀 Aggressive Growth", tickers: ["NVDA", "TSLA", "BTC-USD", "PLTR", "CRWD"] },
  { label: "💵 Income Portfolio", tickers: ["O", "MAIN", "T", "VZ", "KO"] },
  { label: "🇮🇳 India Focus", tickers: ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS"] },
  { label: "🤖 AI & Tech", tickers: ["NVDA", "MSFT", "GOOGL", "AMD", "TSM"] },
];

export default function PortfolioPage() {
  const [input, setInput] = useState("");
  const [tickers, setTickers] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchAssets = async (query: string) => {
    if (query.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch("/api/screener", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 8, sort_by: "market_cap", search: query })
      });
      const data = await res.json();
      const filtered = (data.results || []).filter((r: any) =>
        r.ticker.toLowerCase().includes(query.toLowerCase()) ||
        (r.short_name || '').toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } catch (e) {
      console.error(e);
    }
  };

  const addTicker = (tickerVal?: string) => {
    const t = (tickerVal || input).toUpperCase().trim();
    if (t && !tickers.includes(t) && tickers.length < 15) {
      setTickers(prev => [...prev, t]);
      setInput("");
      setSearchResults([]);
      setShowSuggestions(false);
    }
  };

  const removeTicker = (t: string) => setTickers(prev => prev.filter(x => x !== t));

  const loadSuggested = (suggested: typeof SUGGESTED[0]) => {
    setTickers(suggested.tickers);
    setResult(null);
  };

  const analyze = async () => {
    if (tickers.length < 2) { setError("Add at least 2 assets"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tickers }),
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setResult(data);
    } catch { setError("Failed to analyze portfolio"); }
    setLoading(false);
  };

  return (
    <div className="bg-black text-white font-sans">
      <div className="pt-24 max-w-6xl mx-auto px-4 md:px-8 py-12 space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-5xl font-black tracking-tight">Portfolio Builder</h1>
          <p className="text-emerald-400 mt-2 font-mono text-sm uppercase tracking-widest">
            Build a portfolio, backtest 6 months, stress test against macro scenarios
          </p>
        </div>

        {/* Suggested portfolios */}
        <div>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Start with a template</p>
          <div className="flex flex-wrap gap-3">
            {SUGGESTED.map(s => (
              <button key={s.label} onClick={() => loadSuggested(s)}
                className="px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-300 hover:border-emerald-500/30 hover:text-emerald-400 transition-colors">
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ticker input */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Build your portfolio (max 15 assets)</p>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  searchAssets(e.target.value);
                  setShowSuggestions(true);
                }}
                onKeyDown={e => e.key === "Enter" && addTicker()}
                onFocus={() => {
                  if (input.trim().length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Type ticker and press Enter — AAPL, BTC-USD, RELIANCE.NS..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 font-mono text-sm"
              />
              {showSuggestions && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 mt-1.5 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-zinc-800/80">
                  {searchResults.map(r => (
                    <button
                      key={r.ticker}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                      }}
                      onClick={() => addTicker(r.ticker)}
                      className="w-full text-left px-4 py-3 hover:bg-zinc-800/80 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-emerald-400">{r.ticker}</span>
                        <span className="text-sm text-zinc-300 truncate max-w-[220px]">{r.short_name || r.ticker}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                        <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{r.asset_class}</span>
                        {r.price && <span>${r.price.toFixed(2)}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => addTicker()}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-mono transition-colors">
              Add
            </button>
          </div>
          {tickers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tickers.map(t => (
                <span key={t} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm font-mono text-emerald-400">
                  {t}
                  <button onClick={() => removeTicker(t)} className="text-emerald-600 hover:text-rose-400 transition-colors">×</button>
                </span>
              ))}
            </div>
          )}
          {error && <p className="text-rose-400 text-sm font-mono">{error}</p>}
          <button onClick={analyze} disabled={tickers.length < 2}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold rounded-xl transition-colors">
            {loading ? "Analyzing..." : `Analyze ${tickers.length} Asset Portfolio`}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-8">

            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: "6M Return", value: `${result.summary.portfolio_return >= 0 ? '+' : ''}${result.summary.portfolio_return}%`, color: result.summary.portfolio_return >= 0 ? "text-emerald-400" : "text-rose-400" },
                { label: "Avg Beta", value: result.summary.avg_beta.toFixed(2), color: result.summary.avg_beta < 1 ? "text-emerald-400" : result.summary.avg_beta < 1.5 ? "text-yellow-400" : "text-rose-400" },
                { label: "Avg Div Yield", value: `${result.summary.avg_dividend_yield}%`, color: "text-zinc-200" },
                { label: "Avg P/E", value: result.summary.avg_pe > 0 ? result.summary.avg_pe.toFixed(1) : "—", color: "text-zinc-200" },
                { label: "Diversification", value: `${result.summary.diversification_score}/100`, color: result.summary.diversification_score > 60 ? "text-emerald-400" : "text-yellow-400" },
                { label: "Asset Classes", value: result.summary.class_count, color: "text-zinc-200" },
              ].map(s => (
                <div key={s.label} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 text-center">
                  <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">{s.label}</p>
                  <p className={`text-2xl font-black font-mono ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Asset table */}
            <div>
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Holdings</p>
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-900/50 border-b border-zinc-800">
                    <tr>
                      {["Ticker", "Name", "Class", "Price", "6M Return", "Beta", "Div Yield", "Rev Growth"].map(h => (
                        <th key={h} className="p-4 font-mono text-xs text-zinc-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {result.assets.map((a: any) => (
                      <tr key={a.ticker} className="hover:bg-zinc-900/30 transition-colors">
                        <td className="p-4 font-bold font-mono text-emerald-400">{a.ticker}</td>
                        <td className="p-4 text-zinc-300 truncate max-w-[160px]">{a.short_name || a.ticker}</td>
                        <td className="p-4 text-zinc-500 text-xs">{a.asset_class}</td>
                        <td className="p-4 font-mono">${(a.price || 0).toFixed(2)}</td>
                        <td className={`p-4 font-mono font-bold ${a.return_6m >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {a.return_6m >= 0 ? '+' : ''}{a.return_6m}%
                        </td>
                        <td className={`p-4 font-mono text-xs ${!a.beta ? 'text-zinc-600' : a.beta < 1 ? 'text-emerald-400' : a.beta < 1.5 ? 'text-yellow-400' : 'text-rose-400'}`}>
                          {a.beta ? a.beta.toFixed(2) : '—'}
                        </td>
                        <td className="p-4 font-mono text-xs text-zinc-400">{a.dividend_yield ? `${(a.dividend_yield * 100).toFixed(1)}%` : '—'}</td>
                        <td className="p-4 font-mono text-xs text-emerald-400">{a.revenue_growth ? `${(a.revenue_growth * 100).toFixed(1)}%` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
            </div>

            {/* Stress tests */}
            <div>
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Stress Test — How does your portfolio perform in each scenario?</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {result.stress_tests.map((s: any) => (
                  <div key={s.scenario} className={`bg-zinc-950 border rounded-2xl p-5 ${s.portfolio_impact >= 0 ? 'border-emerald-800/30' : 'border-rose-800/30'}`}>
                    <p className="text-sm font-semibold mb-3">{s.label}</p>
                    <p className={`text-3xl font-black font-mono ${s.portfolio_impact >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {s.portfolio_impact >= 0 ? '+' : ''}{s.portfolio_impact}%
                    </p>
                    <p className="text-xs text-zinc-600 mt-1 font-mono">estimated portfolio impact</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
