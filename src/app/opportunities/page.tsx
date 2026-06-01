"use client";
import { useState, useEffect } from "react";

const TYPE_FILTERS = [
  { id: "all", label: "All Opportunities" },
  { id: "dip_buy", label: "📉 Dip Buys" },
  { id: "momentum", label: "🚀 Momentum" },
  { id: "income", label: "💵 Income" },
  { id: "undervalued", label: "🔍 Undervalued" },
  { id: "analyst_upside", label: "🎯 Analyst Picks" },
];

const COLOR_MAP: Record<string, string> = {
  emerald: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  blue: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  amber: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  violet: "bg-violet-500/10 border-violet-500/30 text-violet-400",
  cyan: "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
};

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, useStateFilter] = useState("all");
  const [search, setSearch] = useState("");

  const setActiveFilter = useStateFilter; // mapped due to previous error if existing

  useEffect(() => {
    fetch("/api/opportunities")
      .then(r => r.json())
      .then(d => { setOpportunities(d.opportunities || []); setLoading(false); });
  }, []);

  const filtered = opportunities.filter(o => {
    const matchesType = activeFilter === "all" || o.type === activeFilter;
    const matchesSearch = search === "" ||
      o.ticker.toLowerCase().includes(search.toLowerCase()) ||
      (o.short_name || "").toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="bg-black text-white font-sans">
      <div className="pt-24 max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-5xl font-black tracking-tight">Opportunity Feed</h1>
          <p className="text-emerald-400 mt-2 font-mono text-sm uppercase tracking-widest">
            Real-time signals from 866 assets — dips, momentum, income, value
          </p>
        </div>

        {/* Stats bar */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {TYPE_FILTERS.slice(1).map(f => {
              const count = opportunities.filter(o => o.type === f.id).length;
              return (
                <div key={f.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black font-mono">{count}</p>
                  <p className="text-xs text-zinc-500 mt-1">{f.label}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Filters + Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2 flex-wrap">
            {TYPE_FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                  activeFilter === f.id
                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
                    : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search ticker or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 font-mono md:w-64"
          />
        </div>

        {/* Results count */}
        <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
          {loading ? "Scanning 866 assets..." : `${filtered.length} opportunities found`}
        </p>

        {/* Cards grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 animate-pulse h-40" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((o, i) => (
              <div key={`${o.ticker}-${o.type}-${i}`} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-600 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className={`inline-block px-2 py-1 rounded-lg text-xs font-mono border mb-2 ${COLOR_MAP[o.color]}`}>
                      {o.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-lg font-mono text-emerald-400">{o.ticker}</span>
                      <span className="text-xs text-zinc-500">{o.asset_class}</span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate max-w-[180px]">{o.short_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold">${(o.price || 0).toFixed(2)}</p>
                    <p className="text-xs text-zinc-500">{o.sector || "—"}</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 mb-4">{o.desc}</p>
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-800">
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase font-mono">Rev Growth</p>
                    <p className="text-xs font-mono text-emerald-400">{o.revenue_growth ? `${(o.revenue_growth * 100).toFixed(1)}%` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase font-mono">Div Yield</p>
                    <p className="text-xs font-mono text-zinc-300">{o.dividend_yield ? `${(o.dividend_yield * 100).toFixed(1)}%` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-600 uppercase font-mono">Market Cap</p>
                    <p className="text-xs font-mono text-zinc-300">{o.market_cap > 1e9 ? `$${(o.market_cap / 1e9).toFixed(1)}B` : "—"}</p>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-20 text-center text-zinc-500">
                No opportunities match this filter right now.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
