"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { AssetCard } from "@/components/AssetCard";

export default function MyPortfolioPage() {
  const [picks, setPicks] = useState<any[]>([]);
  const [assets, setAssets] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const supabase = createClient();

  const loadPortfolio = async () => {
    setLoading(true);
    setError("");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: userPicks, error: picksError } = await supabase
        .from('user_picks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (picksError) throw picksError;

      setPicks(userPicks || []);

      if (userPicks && userPicks.length > 0) {
        const tickers = userPicks.map(p => p.ticker);
        const { data: assetData, error: assetError } = await supabase
          .from('asset_snapshots')
          .select('*')
          .in('ticker', tickers);
          
        if (assetError) throw assetError;
        
        const assetMap: Record<string, any> = {};
        (assetData || []).forEach(row => {
          assetMap[row.ticker] = {
            ...row,
            symbol: row.ticker,
            name: row.short_name || row.ticker,
            assetClass: row.asset_class,
            price: row.price || 0,
            change: "0.00%",
            isUp: true,
            history: [],
            marketCap: row.market_cap || 0,
            peRatio: row.pe_ratio || 0,
            dividendYield: row.dividend_yield || 0,
          };
        });
        setAssets(assetMap);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load portfolio. Make sure user_picks table exists.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const handleRemove = async (id: string) => {
    try {
      await supabase.from('user_picks').delete().eq('id', id);
      loadPortfolio();
    } catch (e) {
      console.error(e);
    }
  };

  const totalValue = picks.reduce((acc, p) => acc + Number(p.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-emerald-400 font-mono text-sm tracking-widest uppercase animate-pulse">
          Loading Portfolio...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800 pb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">My Portfolio</h1>
          <p className="text-zinc-500 font-mono text-sm">
            {picks.length} assets tracked • Total invested: ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-rose-400 font-mono text-sm">
          {error}
        </div>
      )}

      {picks.length === 0 ? (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-16 text-center space-y-6">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto">
            <span className="text-3xl">📭</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Your portfolio is empty</h2>
            <p className="text-zinc-500 mt-2">Start exploring asset classes and pick some assets to track.</p>
          </div>
          <Link 
            href="/portfolio/explore" 
            className="inline-block px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl transition-colors"
          >
            Go Explore
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {picks.map((pick) => {
            const asset = assets[pick.ticker];
            if (!asset) return null;
            
            return (
              <div key={pick.id} className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col sm:flex-row relative group">
                <div className="flex-1 p-2">
                  <AssetCard asset={asset} selectedMetrics={["marketCap", "peRatio"]} index={0} hideHoverGlow />
                </div>
                <div className="p-6 bg-zinc-900/50 sm:w-64 flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-zinc-800">
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
                </div>
                
                {/* Delete button (shows on hover) */}
                <button 
                  onClick={() => handleRemove(pick.id)}
                  className="absolute top-4 right-4 p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                  title="Remove Pick"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
