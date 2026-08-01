import { useState, useEffect } from "react";
import { Trash2, ChevronDown } from "lucide-react";
import { AssetCard } from "@/components/AssetCard";
import { AssetRiskPanel } from "@/components/AssetRiskPanel";
import { AssetBacktestPanel } from "@/components/AssetBacktestPanel";
import { AVAILABLE_METRICS, getMetric } from "@/components/AssetCard";

export function PickItem({ pick, asset, onRemove }: { pick: any, asset: any, onRemove: (id: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [riskResult, setRiskResult] = useState<any>(null);
  const [backtestResult, setBacktestResult] = useState<any>(null);
  const [loadingExtras, setLoadingExtras] = useState(false);

  useEffect(() => {
    if (isExpanded && (!riskResult || !backtestResult)) {
      setLoadingExtras(true);
      let active = true;

      const fetchExtras = async () => {
        try {
          const [riskRes, btRes] = await Promise.all([
            fetch("/api/risk-score", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ticker: asset.symbol }),
            }),
            fetch("/api/backtest", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tickers: [asset.symbol] }),
            })
          ]);

          const riskData = await riskRes.json();
          const btData = await btRes.json();

          if (active) {
            if (!riskData.error) setRiskResult(riskData);
            if (!btData.error) setBacktestResult(btData);
            setLoadingExtras(false);
          }
        } catch (e) {
          if (active) setLoadingExtras(false);
        }
      };

      fetchExtras();
      return () => { active = false; };
    }
  }, [isExpanded, asset.symbol, riskResult, backtestResult]);

  return (
    <div className={`bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col relative group transition-all duration-500 ${isExpanded ? 'col-span-1 lg:col-span-2' : ''}`}>
      {/* Top Summary Row */}
      <div className="flex flex-col sm:flex-row cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex-1 p-2 pointer-events-none sm:pointer-events-auto">
          <AssetCard asset={asset} selectedMetrics={["marketCap", "peRatio"]} index={0} hideHoverGlow />
        </div>
        
        <div className="p-6 bg-zinc-900/50 sm:w-64 flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-zinc-800 relative group/details">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Amount</p>
              <p className="font-mono font-bold text-lg">${Number(pick.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Quantity</p>
              <p className="font-mono font-bold">{Number(pick.quantity).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Strategy</p>
              <p className="text-sm">{pick.holding_period}</p>
            </div>
          </div>

          <div className="absolute right-4 bottom-4 text-zinc-500 bg-zinc-800/50 p-2 rounded-full transition-transform duration-300 group-hover/details:bg-zinc-700">
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <div className={`transition-all duration-500 overflow-hidden ${isExpanded ? 'max-h-[3000px] opacity-100 border-t border-zinc-800' : 'max-h-0 opacity-0'}`}>
        <div className="p-6 space-y-8 bg-black/20">
          
          {/* Full Metrics Grid */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-emerald-400 mb-4 font-mono">Full Metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {AVAILABLE_METRICS.map(metric => (
                <div key={metric.id} className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-3">
                  <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mb-1">{metric.label}</p>
                  <p className="font-mono text-sm text-zinc-300 font-medium truncate">{getMetric(metric.id, asset)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Panels */}
          {loadingExtras && (!riskResult || !backtestResult) ? (
            <div className="flex justify-center py-12">
              <div className="text-emerald-500 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Deep Analysis...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {riskResult ? (
                <AssetRiskPanel result={riskResult} />
              ) : (
                <div className="p-6 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 flex items-center justify-center text-zinc-500 font-mono text-xs">Risk analysis unavailable</div>
              )}
              
              {backtestResult ? (
                <AssetBacktestPanel result={backtestResult} />
              ) : (
                <div className="p-6 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 flex items-center justify-center text-zinc-500 font-mono text-xs">Backtest unavailable</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete button (shows on hover of the entire component) */}
      <button 
        onClick={(e) => { e.stopPropagation(); onRemove(pick.id); }}
        className="absolute top-4 right-4 p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
        title="Remove Pick"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
