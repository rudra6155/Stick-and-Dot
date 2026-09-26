"use client";
import { useState, useEffect, useRef } from "react";
import { AssetCard } from "@/components/AssetCard";

export default function SuggestionsPage() {
  const [data, setData] = useState<{
    topPerformers: any[];
    safeBets: any[];
    discounted: any[];
    trendingCrypto: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
      
      try {
        const res = await fetch("/api/suggestions", {
          signal: abortControllerRef.current.signal
        });
        if (!res.ok) throw new Error("Failed to load suggestions");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    return () => { abortControllerRef.current?.abort(); };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12 text-zinc-500 font-mono">
        Analyzing markets and finding the best picks for you...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center py-12 text-zinc-500 font-mono">
        Error: {error}
      </div>
    );
  }

  const renderSection = (title: string, subtitle: string, emoji: string, items: any[], themeClass: string) => {
    if (!items || items.length === 0) return null;
    return (
      <section className="mb-16">
        <div className="mb-6">
          <h2 className={`text-3xl font-black flex items-center gap-3 ${themeClass}`}>
            <span>{emoji}</span> {title}
          </h2>
          <p className="text-zinc-400 mt-2 font-mono text-sm uppercase tracking-widest">{subtitle}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {items.map((asset) => (
            <AssetCard key={asset.id || asset.ticker} asset={{
              id: asset.id || asset.ticker,
              symbol: asset.ticker,
              name: asset.short_name,
              price: asset.price,
              change: "—", // Simplified for suggestions
              isUp: true,
              assetClass: asset.asset_class,
            } as any} />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="w-full animation-fade-in">
      <div className="mb-8">
        <p className="text-emerald-400 font-mono text-sm uppercase tracking-widest">
          Curated market picks simplified into one tap.
        </p>
      </div>

      {renderSection(
        "Top Performers", 
        "Fastest growing assets with high momentum right now.", 
        "🚀", 
        data?.topPerformers || [], 
        "text-emerald-400"
      )}

      {renderSection(
        "Safe & Steady", 
        "Low risk, high dividend assets for a stable portfolio.", 
        "🛡️", 
        data?.safeBets || [], 
        "text-blue-400"
      )}

      {renderSection(
        "Undervalued Deals", 
        "High quality assets currently trading at a discount.", 
        "🏷️", 
        data?.discounted || [], 
        "text-purple-400"
      )}

      {renderSection(
        "Trending Crypto", 
        "Cryptocurrencies making the biggest moves today.", 
        "⚡", 
        data?.trendingCrypto || [], 
        "text-yellow-400"
      )}
    </div>
  );
}
