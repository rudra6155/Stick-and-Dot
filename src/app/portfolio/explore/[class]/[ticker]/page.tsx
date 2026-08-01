"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AssetRiskPanel } from "@/components/AssetRiskPanel";
import { AssetBacktestPanel } from "@/components/AssetBacktestPanel";
import { PickModal } from "@/components/PickModal";
import { createClient } from "@/utils/supabase/client";

export default function AssetDetailPage({ params }: { params: Promise<{ class: string, ticker: string }> }) {
  const { class: encodedClass, ticker: encodedTicker } = use(params);
  const assetClass = decodeURIComponent(encodedClass);
  const ticker = decodeURIComponent(encodedTicker);

  const [asset, setAsset] = useState<any>(null);
  const [riskResult, setRiskResult] = useState<any>(null);
  const [backtestResult, setBacktestResult] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPickModalOpen, setIsPickModalOpen] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        // 1. Fetch raw asset first (to show header quickly)
        const { data: assetData, error: assetErr } = await supabase
          .from('asset_snapshots')
          .select('*')
          .eq('ticker', ticker)
          .single();

        if (assetErr) throw new Error("Asset not found");
        if (active) setAsset(assetData);

        // 2. Fetch Risk Score
        const riskRes = await fetch("/api/risk-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticker }),
        });
        const riskData = await riskRes.json();
        if (active && !riskData.error) {
          setRiskResult(riskData);
        }

        // 3. Fetch Backtest (single ticker)
        const btRes = await fetch("/api/backtest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tickers: [ticker] }),
        });
        const btData = await btRes.json();
        if (active && !btData.error && btData.results && btData.results.length > 0) {
          setBacktestResult(btData.results[0]);
        }

      } catch (err: any) {
        if (active) setError(err.message || "Failed to load asset data.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();
    return () => { active = false; };
  }, [ticker, supabase]);

  if (loading && !asset) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-emerald-400 font-mono text-sm tracking-widest uppercase animate-pulse">
          Analyzing {ticker}...
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
        <div className="text-rose-400 font-mono text-sm">{error || "Asset not found"}</div>
        <Link href={`/portfolio/explore/${encodeURIComponent(assetClass)}`} className="text-emerald-400 hover:underline">
          Go back to {assetClass}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans pt-24 pb-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Top Nav */}
        <div className="flex items-center justify-between">
          <Link href={`/portfolio/explore/${encodeURIComponent(assetClass)}`} className="flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to {assetClass}
          </Link>
          
          <button 
            onClick={() => setIsPickModalOpen(true)}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full transition-colors flex items-center gap-2"
          >
            <span className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center text-xs">P</span>
            Pick Asset
          </button>
        </div>

        {/* Dynamic Panels */}
        <div className="space-y-12">
          {/* Risk Panel */}
          <div>
            <h2 className="text-xl font-bold mb-6">AI Risk Analysis</h2>
            {riskResult ? (
              <AssetRiskPanel result={riskResult} />
            ) : (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-12 flex justify-center">
                <span className="text-zinc-500 font-mono text-sm uppercase tracking-widest animate-pulse">
                  Scoring...
                </span>
              </div>
            )}
          </div>

          {/* Backtest Panel */}
          <div>
            <h2 className="text-xl font-bold mb-6">Historical Backtest</h2>
            {backtestResult ? (
              <AssetBacktestPanel result={backtestResult} />
            ) : (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-12 flex justify-center">
                <span className="text-zinc-500 font-mono text-sm uppercase tracking-widest animate-pulse">
                  Simulating...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <PickModal 
        isOpen={isPickModalOpen} 
        onClose={() => setIsPickModalOpen(false)} 
        asset={asset} 
      />
    </div>
  );
}
