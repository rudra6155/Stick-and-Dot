import { useState, useEffect } from "react";
import { Trash2, ChevronDown } from "lucide-react";
import { AssetCard } from "@/components/AssetCard";
import { AssetRiskPanel } from "@/components/AssetRiskPanel";
import { AssetBacktestPanel } from "@/components/AssetBacktestPanel";
import { AVAILABLE_METRICS, getMetric } from "@/components/AssetCard";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import { useRef } from "react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export function PickItem({ 
  pick, 
  asset, 
  onRemove,
  onHover,
  onLeave
}: { 
  pick: any, 
  asset: any, 
  onRemove: (id: string) => void,
  onHover?: (val: number) => void,
  onLeave?: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [riskResult, setRiskResult] = useState<any>(null);
  const [backtestResult, setBacktestResult] = useState<any>(null);
  const [loadingExtras, setLoadingExtras] = useState(false);
  
  const itemRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLSpanElement>(null);
  const pickAmount = Number(pick.amount);

  useGSAP(() => {
    if (!itemRef.current) return;
    
    // Phase 4: Scroll-Driven Asset Reveal
    gsap.fromTo(
      itemRef.current,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: itemRef.current,
          start: "top 90%",
          end: "top 60%",
          toggleActions: "play none none reverse",
        }
      }
    );

    // Phase 4: Value counts up from 0 synced to scroll
    if (amountRef.current) {
      const counter = { val: 0 };
      gsap.to(counter, {
        val: pickAmount,
        scrollTrigger: {
          trigger: itemRef.current,
          start: "top 90%",
          end: "center center",
          scrub: true,
        },
        onUpdate: () => {
          if (amountRef.current) {
            amountRef.current.innerText = counter.val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          }
        }
      });
    }
  }, [pickAmount]);

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
    <div 
      ref={itemRef}
      className={`bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col relative group transition-all duration-500 will-change-transform ${isExpanded ? 'col-span-1 lg:col-span-2' : ''}`}
      onMouseEnter={() => onHover && onHover(pickAmount)}
      onMouseLeave={() => onLeave && onLeave()}
    >
      {/* Top Summary Row */}
      <div className="flex flex-col sm:flex-row cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex-1 p-2 pointer-events-none sm:pointer-events-auto">
          <AssetCard asset={asset} selectedMetrics={["marketCap", "peRatio"]} index={0} hideHoverGlow />
        </div>
        
        <div className="p-6 bg-zinc-900/50 sm:w-64 flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-zinc-800 relative group/details">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-wider">Amount</p>
              <p className="font-mono font-bold text-lg">$<span ref={amountRef}>0.00</span></p>
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
