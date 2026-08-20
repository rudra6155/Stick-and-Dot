"use client";
import { useState, useRef } from "react";

const GRADE_COLORS: Record<string, string> = {
  A: "text-emerald-400", B: "text-blue-400",
  C: "text-yellow-400", D: "text-orange-400", F: "text-rose-400",
  default: "text-zinc-400"
};

const GRADE_BG: Record<string, string> = {
  A: "bg-emerald-500/10 border-emerald-500/30",
  B: "bg-blue-500/10 border-blue-500/30",
  C: "bg-yellow-500/10 border-yellow-500/30",
  D: "bg-orange-500/10 border-orange-500/30",
  F: "bg-rose-500/10 border-rose-500/30",
  default: "bg-zinc-500/10 border-zinc-500/30"
};

const formatMarketCap = (cap: number | null | undefined) => {
  if (cap == null || cap <= 0) return "—";
  if (cap > 1e12) return `$${(cap / 1e12).toFixed(1)}T`;
  if (cap > 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
  if (cap > 1e6) return `$${(cap / 1e6).toFixed(1)}M`;
  return `$${(cap / 1e3).toFixed(1)}K`;
};

const POPULAR = ["AAPL", "NVDA", "TSLA", "BTC-USD", "RELIANCE.NS", "QQQ", "GC=F", "AMZN"];

export default function RiskScorePage() {
  const [ticker, setTicker] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const searchAssets = async (query: string) => {
    if (query.trim().length < 1) {
      setSearchResults([]);
      return;
    }
    try {
      setError("");
      const res = await fetch("/api/screener", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 8, sort_by: "market_cap", search: query })
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const filtered = (data.results || []).filter((r: any) =>
        r.ticker.toLowerCase().includes(query.toLowerCase()) ||
        (r.short_name || '').toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filtered);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Something went wrong');
    }
  };

  const analyze = async (t?: string) => {
    const query = (t || ticker).toUpperCase().trim();
    if (!query) return;
    setTicker(query);
    setShowSuggestions(false);
    setLoading(true);
    setError("");
    setResult(null);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch("/api/risk-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: query }),
        signal: abortControllerRef.current.signal,
      });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else { setResult(data); }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-black text-white font-sans">
      <div className="pt-24 max-w-4xl mx-auto px-4 md:px-8 py-12 space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-5xl font-black tracking-tight">AI Risk Scorer</h1>
          <p className="text-emerald-400 mt-2 font-mono text-sm uppercase tracking-widest">
            Deep analysis on any asset — what you can earn, lose, and risk
          </p>
        </div>

        {/* Search */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={ticker}
              aria-label="Search ticker"
              onChange={(e) => {
                setTicker(e.target.value);
                searchAssets(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={e => e.key === "Enter" && analyze()}
              onFocus={() => {
                if (ticker.trim().length > 0) setShowSuggestions(true);
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Enter ticker — AAPL, BTC-USD, RELIANCE.NS..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 font-mono text-sm"
            />
            {showSuggestions && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1.5 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-zinc-800/80">
                {searchResults.map(r => (
                  <button
                    key={r.ticker}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setTicker(r.ticker);
                      analyze(r.ticker);
                    }}
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
          <button
            onClick={() => analyze()}
            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl transition-colors"
          >
            {loading ? "..." : "Analyze"}
          </button>
        </div>

        {/* Popular tickers */}
        <div className="flex flex-wrap gap-2">
          {POPULAR.map(t => (
            <button
              key={t}
              onClick={() => { setTicker(t); analyze(t); }}
              className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-400 hover:border-emerald-500/30 hover:text-emerald-400 transition-colors"
            >
              {t}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="text-red-400 font-mono text-sm">{error || "Something went wrong loading this."}</div>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md text-sm text-white">Try again</button>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">

            {/* Asset header + grade */}
            <div className={`border rounded-2xl p-8 flex items-center justify-between ${GRADE_BG[result.score.grade] ?? GRADE_BG.default}`}>
              <div>
                <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-1">{result.asset.asset_class} · {result.asset.sector || "—"}</p>
                <h2 className="text-3xl font-black">{result.asset.ticker}</h2>
                <p className="text-zinc-400 mt-1">{result.asset.short_name}</p>
                <p className="text-2xl font-mono font-bold mt-2">{result.asset.price != null ? `$${result.asset.price.toFixed(2)}` : "—"}</p>
              </div>
              <div className="text-center">
                <div className={`text-8xl font-black ${GRADE_COLORS[result.score.grade] ?? GRADE_COLORS.default}`}>
                  {result.score.grade}
                </div>
                <div className="text-zinc-500 font-mono text-xs mt-1">{result.score.total_score}/100</div>
              </div>
            </div>

            {/* Score breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "💰 What can I earn?", score: result.score.breakdown.earn_score, max: 25, tag: result.score.earn_label, color: "emerald" },
                { label: "🛡️ What can I lose?", score: result.score.breakdown.lose_score, max: 25, tag: result.score.lose_label, color: "blue" },
                { label: "🚪 How easily exit?", score: result.score.breakdown.exit_score, max: 25, tag: result.score.exit_label, color: "purple" },
                { label: "📊 Is it good value?", score: result.score.breakdown.value_score, max: 25, tag: result.score.value_label, color: "amber" },
              ].map(item => (
                <div key={item.label} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
                  <p className="text-xs text-zinc-500 mb-3 leading-tight">{item.label}</p>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-2xl font-black font-mono">{item.score}</span>
                    <span className="text-xs text-zinc-600 font-mono">/{item.max}</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${item.max ? Math.min(100, Math.max(0, (item.score / item.max) * 100)) : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-zinc-400">{item.tag}</span>
                </div>
              ))}
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Market Cap", value: formatMarketCap(result.asset.market_cap) },
                { label: "P/E Ratio", value: result.asset.pe_ratio != null ? result.asset.pe_ratio.toFixed(1) : "—" },
                { label: "Revenue Growth", value: result.asset.revenue_growth != null ? `${(result.asset.revenue_growth*100).toFixed(1)}%` : "—" },
                { label: "Beta", value: result.asset.beta != null ? result.asset.beta.toFixed(2) : "—" },
                { label: "Dividend Yield", value: result.asset.dividend_yield != null ? `${(result.asset.dividend_yield*100).toFixed(1)}%` : "—" },
                { label: "Profit Margin", value: result.asset.profit_margins != null ? `${(result.asset.profit_margins*100).toFixed(1)}%` : "—" },
                { label: "ROE", value: result.asset.return_on_equity != null ? `${(result.asset.return_on_equity*100).toFixed(1)}%` : "—" },
                { label: "Analyst Target", value: result.asset.target_mean_price != null ? `$${result.asset.target_mean_price.toFixed(2)}` : "—" },
              ].map(m => (
                <div key={m.label} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                  <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider mb-1">{m.label}</p>
                  <p className="text-lg font-mono font-bold">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Risks + Opportunities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.score.risks.length > 0 && (
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6">
                  <p className="font-mono text-xs text-rose-400 uppercase tracking-widest mb-4">⚠️ Risk Factors</p>
                  <ul className="space-y-2">
                    {result.score.risks.map((r: string, i: number) => (
                      <li key={i} className="text-sm text-zinc-400 flex gap-2">
                        <span className="text-rose-500 shrink-0">·</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.score.opportunities.length > 0 && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
                  <p className="font-mono text-xs text-emerald-400 uppercase tracking-widest mb-4">✅ Opportunities</p>
                  <ul className="space-y-2">
                    {result.score.opportunities.map((o: string, i: number) => (
                      <li key={i} className="text-sm text-zinc-400 flex gap-2">
                        <span className="text-emerald-500 shrink-0">·</span>{o}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
