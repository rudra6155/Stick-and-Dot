"use client";
import { useState } from "react";

const SCENARIOS = [
  { key: "us_china_tension", title: "🇺🇸🇨🇳 US-China Tensions", desc: "Rotate to domestic US, gold, defense" },
  { key: "inflation_high", title: "📈 High Inflation", desc: "Commodities, REITs, dividend stocks" },
  { key: "rate_hike", title: "🏦 Rate Hike Cycle", desc: "Financials gain, growth stocks drop" },
  { key: "recession_fear", title: "📉 Recession Fear", desc: "Defensive sectors, bonds, gold" },
  { key: "ai_boom", title: "🤖 AI Boom", desc: "Semiconductors, cloud, data infrastructure" },
  { key: "india_growth", title: "🇮🇳 India Growth Story", desc: "Indian equities, infrastructure, banking" },
];

const formatVal = (val: any, key: string) => {
  if (val === null || val === undefined || val === 0) return "—";
  if (["revenue_growth","earnings_growth","profit_margins","dividend_yield","return_on_equity"].includes(key))
    return (val * 100).toFixed(1) + "%";
  if (key === "market_cap") return val > 1e12 ? `$${(val/1e12).toFixed(1)}T` : `$${(val/1e9).toFixed(1)}B`;
  return typeof val === "number" ? val.toFixed(2) : val;
};

export default function ScenariosPage() {
  const [groups, setGroups] = useState<Array<{ label: string; assets: any[] }>>([]);
  const [loading, setLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState<any>(null);
  const [logic, setLogic] = useState("");

  const fetchScenario = async (scenario: typeof SCENARIOS[0]) => {
    setLoading(true);
    setActiveScenario(scenario);
    setGroups([]);
    try {
      const res = await fetch("/api/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario_key: scenario.key }),
      });
      const data = await res.json();
      if (data.groups) setGroups(data.groups);
      if (data.logic) setLogic(data.logic);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="bg-black text-white font-sans">
      <div className="pt-24 max-w-6xl mx-auto px-4 md:px-8 py-12 space-y-12">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-black tracking-tight">Scenario Engine</h1>
          <p className="text-emerald-400 mt-2 font-mono text-sm uppercase tracking-widest">Pick a macro scenario, get asset recommendations</p>
        </div>

        {/* Scenario Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SCENARIOS.map(s => (
            <button
              key={s.key}
              onClick={() => fetchScenario(s)}
              className={`p-6 rounded-2xl border text-left transition-all ${
                activeScenario?.key === s.key
                  ? "bg-emerald-900/20 border-emerald-500/50 shadow-[0_0_40px_-10px_rgba(16,185,129,0.4)]"
                  : "bg-zinc-950 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/50"
              }`}
            >
              <h3 className="text-lg font-bold mb-1">{s.title}</h3>
              <p className="text-sm text-zinc-400">{s.desc}</p>
            </button>
          ))}
        </div>

        {/* Results */}
        {activeScenario && (
          <div className="space-y-8">
            {/* Logic explanation */}
            <div className="bg-zinc-950 border border-emerald-900/30 rounded-2xl p-6">
              <p className="text-xs font-mono text-emerald-500 uppercase tracking-widest mb-2">Why these assets?</p>
              <p className="text-zinc-300 leading-relaxed">{logic}</p>
            </div>

            {loading ? (
              <div className="py-12 text-center text-zinc-500 font-mono animate-pulse">
                Running scenario simulation...
              </div>
            ) : (
              groups.map(group => (
                <div key={group.label}>
                  <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-4">{group.label}</p>
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-zinc-900/50 border-b border-zinc-800">
                        <tr>
                          <th className="p-4 font-mono text-xs text-zinc-500 uppercase">#</th>
                          <th className="p-4 font-mono text-xs text-zinc-500 uppercase">Ticker</th>
                          <th className="p-4 font-mono text-xs text-zinc-500 uppercase">Name</th>
                          <th className="p-4 font-mono text-xs text-zinc-500 uppercase text-right">Price</th>
                          <th className="p-4 font-mono text-xs text-zinc-500 uppercase text-right">Rev Growth</th>
                          <th className="p-4 font-mono text-xs text-zinc-500 uppercase text-right">Div Yield</th>
                          <th className="p-4 font-mono text-xs text-zinc-500 uppercase text-right">Market Cap</th>
                          <th className="p-4 font-mono text-xs text-zinc-500 uppercase text-right">Beta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {group.assets.map((r, i) => (
                          <tr key={r.ticker} className="hover:bg-zinc-900/30 transition-colors">
                            <td className="p-4 text-zinc-600 font-mono">#{i+1}</td>
                            <td className="p-4 font-bold text-emerald-400 font-mono">{r.ticker}</td>
                            <td className="p-4 text-zinc-300 truncate max-w-[200px]">{r.short_name || r.ticker}</td>
                            <td className="p-4 text-right font-mono">${(r.price||0).toFixed(2)}</td>
                            <td className="p-4 text-right font-mono text-emerald-400">{formatVal(r.revenue_growth, "revenue_growth")}</td>
                            <td className="p-4 text-right font-mono text-zinc-400">{formatVal(r.dividend_yield, "dividend_yield")}</td>
                            <td className="p-4 text-right font-mono text-zinc-400">{formatVal(r.market_cap, "market_cap")}</td>
                            <td className={`p-4 text-right font-mono ${r.beta < 1 ? 'text-emerald-400' : r.beta < 1.5 ? 'text-yellow-400' : 'text-rose-400'}`}>
                              {r.beta ? r.beta.toFixed(2) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
