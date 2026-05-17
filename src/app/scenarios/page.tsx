"use client";

import { useState } from "react";

const SCENARIOS = [
  { key: "us_china_tension", title: "🇺🇸🇨🇳 US-China Tensions", desc: "US-China tensions rising — rotate to domestic US, gold, defense" },
  { key: "inflation_high", title: "📈 High Inflation", desc: "High inflation — commodities, REITs, dividend stocks outperform" },
  { key: "rate_hike", title: "🏦 Rate Hike Cycle", desc: "Rate hike cycle — financials gain, growth stocks drop" },
  { key: "recession_fear", title: "📉 Recession Fear", desc: "Recession fears — defensive sectors, bonds, gold" },
  { key: "ai_boom", title: "🤖 AI Boom", desc: "AI boom — semiconductors, cloud, data infrastructure" },
  { key: "india_growth", title: "🇮🇳 India Growth Story", desc: "India growth story — Indian equities, infrastructure, banking" },
];

export default function ScenariosPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeScenario, setActiveScenario] = useState<any>(null);

  const fetchScenario = async (scenario: any) => {
    setLoading(true);
    try {
      const res = await fetch("/api/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario_key: scenario.key }),
      });
      const data = await res.json();
      if (data.results) {
        setResults(data.results);
        setActiveScenario({ ...scenario, logic: data.logic });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 pt-24 font-sans mt-24">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Scenario Engine</h1>
          <p className="text-emerald-500/80 mt-2">Pick a macro scenario, get asset recommendations</p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SCENARIOS.map((s) => (
            <div 
              key={s.key} 
              onClick={() => fetchScenario(s)}
              className={`p-6 rounded-xl border cursor-pointer transition-all ${
                activeScenario?.key === s.key 
                  ? "bg-emerald-900/20 border-emerald-500/50 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]" 
                  : "bg-zinc-950 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900"
              }`}
            >
              <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
              <p className="text-sm text-zinc-400">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Results */}
        {activeScenario && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2">Recommendations for: {activeScenario.title}</h2>
              <div className="inline-block px-4 py-2 bg-emerald-950/30 border border-emerald-900/50 rounded-lg text-emerald-400 text-sm">
                <span className="font-semibold text-emerald-300">Why these assets?</span> {activeScenario.logic}
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-zinc-500 animate-pulse">Running scenario simulation...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((r, i) => (
                  <div key={r.ticker} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-zinc-500">#{i + 1}</span>
                        <span className="font-bold text-emerald-400">{r.ticker}</span>
                      </div>
                      <div className="text-xs text-zinc-400 truncate max-w-[150px]">{r.short_name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono">${(r.price || 0).toFixed(2)}</div>
                      <div className="text-xs text-zinc-500">{r.sector || r.asset_class}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
