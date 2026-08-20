"use client";

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

export function AssetRiskPanel({ result }: { result: any }) {
  if (!result || !result.score) return null;

  return (
    <div className="space-y-6">
      {/* Asset header + grade */}
      <div className={`border rounded-2xl p-8 flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-4 ${GRADE_BG[result.score.grade] ?? GRADE_BG.default}`}>
        <div>
          <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-1">{result.asset.asset_class} · {result.asset.sector || "—"}</p>
          <h2 className="text-3xl font-black">{result.asset.ticker}</h2>
          <p className="text-zinc-400 mt-1">{result.asset.short_name}</p>
          <p className="text-2xl font-mono font-bold mt-2">{result.asset.price != null ? `$${result.asset.price.toFixed(2)}` : "—"}</p>
        </div>
        <div className="text-left sm:text-center">
          <div className={`text-6xl md:text-8xl font-black ${GRADE_COLORS[result.score.grade] ?? GRADE_COLORS.default}`}>
            {result.score.grade}
          </div>
          <div className="text-zinc-500 font-mono text-xs mt-1">{result.score.total_score}/100</div>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "💰 What can I earn?", score: result.score.breakdown.earn_score, max: 25, tag: result.score.earn_label },
          { label: "🛡️ What can I lose?", score: result.score.breakdown.lose_score, max: 25, tag: result.score.lose_label },
          { label: "🚪 How easily exit?", score: result.score.breakdown.exit_score, max: 25, tag: result.score.exit_label },
          { label: "📊 Is it good value?", score: result.score.breakdown.value_score, max: 25, tag: result.score.value_label },
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
        {result.score.risks?.length > 0 && (
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6">
            <p className="font-mono text-xs text-rose-400 uppercase tracking-widest mb-4">⚠️ Risk Factors</p>
            <ul className="space-y-2">
              {result.score.risks.map((r: string, i: number) => (
                <li key={`${r}-${i}`} className="text-sm text-zinc-400 flex gap-2">
                  <span className="text-rose-500 shrink-0">·</span>{r}
                </li>
              ))}
            </ul>
          </div>
        )}
        {result.score.opportunities?.length > 0 && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
            <p className="font-mono text-xs text-emerald-400 uppercase tracking-widest mb-4">✅ Opportunities</p>
            <ul className="space-y-2">
              {result.score.opportunities.map((o: string, i: number) => (
                <li key={`${o}-${i}`} className="text-sm text-zinc-400 flex gap-2">
                  <span className="text-emerald-500 shrink-0">·</span>{o}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
