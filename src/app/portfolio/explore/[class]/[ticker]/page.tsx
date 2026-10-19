"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AssetRiskPanel } from "@/components/AssetRiskPanel";
import { AssetBacktestPanel } from "@/components/AssetBacktestPanel";
import { PickModal } from "@/components/PickModal";
import { createClient } from "@/utils/supabase/client";
import RelatedMarketsPanel from "@/components/RelatedMarketsPanel";

export default function AssetDetailPage({ params }: { params: Promise<{ class: string, ticker: string }> }) {
  const { class: encodedClass, ticker: encodedTicker } = use(params);
  let assetClass = encodedClass;
  let ticker = encodedTicker;
  try {
    assetClass = decodeURIComponent(encodedClass);
    ticker = decodeURIComponent(encodedTicker);
  } catch (e) {}

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
          .eq('asset_class', assetClass)
          .single();

        if (assetErr) throw new Error("Asset not found");

        // Overlay live price if available
        try {
          const liveRes = await fetch('/api/live-prices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tickers: [ticker] }),
          });
          const liveJson = await liveRes.json();
          if (liveJson?.data?.[ticker]) {
            const q = liveJson.data[ticker];
            assetData.price = q.price ?? assetData.price;
            assetData.market_cap = q.marketCap ?? assetData.market_cap;
            assetData.change = q.change ?? assetData.change;
            assetData.isUp = q.isUp ?? assetData.isUp;
            assetData.isLive = true;
            assetData.quoteTime = q.quoteTime;
          }
        } catch (e) {
          console.warn("Live quote fetch failed on detail page, using snapshot:", e);
        }

        if (active) setAsset(assetData);

        // 2. Fetch Risk Score
        try {
          const riskRes = await fetch("/api/risk-score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticker }),
          });
          const riskData = await riskRes.json();
          if (active) {
            if (!riskData.error) {
              setRiskResult(riskData);
            } else {
              setRiskResult({ hasError: true });
            }
          }
        } catch (err) {
          if (active) setRiskResult({ hasError: true });
        }

        // 3. Fetch Backtest (single ticker)
        try {
          const btRes = await fetch("/api/backtest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tickers: [ticker] }),
          });
          const btData = await btRes.json();
          if (active) {
            if (!btData.error && btData.results && btData.results.length > 0) {
              setBacktestResult(btData.results[0]);
            } else {
              setBacktestResult({ hasError: true });
            }
          }
        } catch (err) {
          if (active) setBacktestResult({ hasError: true });
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

        {/* Asset Live Header Summary */}
        {asset && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                    {asset.short_name || asset.ticker}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 font-bold">
                    {asset.ticker}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 font-bold uppercase">
                    {asset.asset_class}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 mt-1">{asset.sector || asset.long_business_summary?.slice(0, 80) || "Global Asset"}</p>
              </div>

              <div className="text-left sm:text-right">
                <div className="flex items-baseline sm:justify-end gap-3">
                  <span className="text-3xl sm:text-4xl font-mono font-bold text-white">
                    ${Number(asset.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {asset.change && (
                    <span className={`text-sm font-mono font-bold ${asset.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {asset.isUp ? '▲' : '▼'} {asset.change}
                    </span>
                  )}
                </div>
                <div className="flex items-center sm:justify-end gap-1.5 mt-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${asset.isLive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    {asset.isLive ? "LIVE QUOTE" : asset.fetched_at ? `SNAPSHOT AS OF ${new Date(asset.fetched_at).toLocaleDateString()}` : "SNAPSHOT"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-zinc-900">
              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Market Cap</p>
                <p className="text-sm font-mono font-bold text-zinc-200 mt-0.5">
                  {asset.market_cap 
                    ? asset.market_cap > 1e12 
                      ? `${(asset.market_cap / 1e12).toFixed(2)}T` 
                      : asset.market_cap > 1e9 
                        ? `${(asset.market_cap / 1e9).toFixed(2)}B` 
                        : `${(asset.market_cap / 1e6).toFixed(1)}M` 
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">P/E Ratio</p>
                <p className="text-sm font-mono font-bold text-zinc-200 mt-0.5">
                  {asset.pe_ratio ? asset.pe_ratio.toFixed(2) : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">52W Range</p>
                <p className="text-sm font-mono font-bold text-zinc-200 mt-0.5">
                  {asset.low_52_week && asset.high_52_week ? `${asset.low_52_week.toFixed(1)} - ${asset.high_52_week.toFixed(1)}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Beta</p>
                <p className="text-sm font-mono font-bold text-zinc-200 mt-0.5">
                  {asset.beta ? asset.beta.toFixed(2) : "—"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Panels */}
        <div className="space-y-12">
          {/* Risk Panel */}
          <div>
            <h2 className="text-xl font-bold mb-6">AI Risk Analysis</h2>
            {riskResult ? (
              riskResult.hasError ? (
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-12 flex justify-center text-rose-400 text-sm">
                  Failed to load risk analysis
                </div>
              ) : (
                <AssetRiskPanel result={riskResult} />
              )
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
              backtestResult.hasError ? (
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-12 flex justify-center text-rose-400 text-sm">
                  Failed to load backtest
                </div>
              ) : (
                <AssetBacktestPanel result={backtestResult} />
              )
            ) : (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-12 flex justify-center">
                <span className="text-zinc-500 font-mono text-sm uppercase tracking-widest animate-pulse">
                  Simulating...
                </span>
              </div>
            )}
          </div>

          {/* Related Markets */}
          <div>
            <h2 className="text-xl font-bold mb-6">Related Markets</h2>
            <RelatedMarketsPanel ticker={ticker} />
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
