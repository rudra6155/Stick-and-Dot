"use client";

import Sparkline from "./Sparkline";

export function AssetBacktestPanel({ result }: { result: any }) {
  if (!result || !result.chart || result.chart.length === 0) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500">
        No price history available for backtest.
      </div>
    );
  }

  const isPositive = result.return_pct >= 0;
  const color = isPositive ? "#10b981" : "#f43f5e";
  const data = result.chart.map((c: any) => c.close);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-lg">6-Month Performance</h3>
          <p className="text-sm font-mono text-zinc-500 mt-1 uppercase tracking-widest">Historical Backtest</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-black font-mono ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
            {isPositive ? "+" : ""}{result.return_pct.toFixed(2)}%
          </p>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            ${result.start_price} → ${result.end_price}
          </p>
        </div>
      </div>

      <div className="h-40 w-full pt-4">
        <Sparkline data={data} isUp={isPositive} width={400} height={120} />
      </div>

      {result.monthly_returns && result.monthly_returns.length > 0 && (
        <div className="pt-4 border-t border-zinc-800">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4">Monthly Breakdown</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {result.monthly_returns.map((m: any) => (
              <div key={m.month} className="bg-zinc-900 rounded-lg p-2 text-center">
                <p className="text-[10px] text-zinc-500 mb-1">{m.month}</p>
                <p className={`text-xs font-bold font-mono ${m.return_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {m.return_pct >= 0 ? "+" : ""}{m.return_pct.toFixed(1)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
