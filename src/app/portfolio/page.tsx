"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Crosshair, ChevronDown } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { PickItem } from "@/components/PickItem";
import VaultHeader from "@/components/VaultHeader";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollTrigger from "gsap/dist/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export default function MyPortfolioPage() {
  const [picks, setPicks] = useState<any[]>([]);
  const [assets, setAssets] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showScenarioDropdown, setShowScenarioDropdown] = useState(false);
  const [alignmentData, setAlignmentData] = useState<any>(null);
  const [aligningScenario, setAligningScenario] = useState("");
  const [hoveredPickValue, setHoveredPickValue] = useState<number>(0);
  
  // Ref for scenario chips
  const alignmentRef = useRef<HTMLDivElement>(null);
  
  const scenarios = [
    { id: "us_china_tension", label: "US-China Tensions" },
    { id: "inflation_high", label: "High Inflation" },
    { id: "rate_hike", label: "Rate Hike Cycle" },
    { id: "recession_fear", label: "Recession Fears" },
    { id: "ai_boom", label: "AI Boom" },
    { id: "india_growth", label: "India Growth Story" }
  ];
  
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

  const handleAlign = async (scenarioId: string) => {
    setAligningScenario(scenarioId);
    setShowScenarioDropdown(false);
    setAlignmentData(null);
    try {
      const userHoldings = Array.from(new Set(picks.map(p => p.asset_class)));
      const res = await fetch("/api/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario_key: scenarioId, user_holdings: userHoldings })
      });
      const data = await res.json();
      if (data.alignment) {
        setAlignmentData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAligningScenario("");
    }
  };

  useGSAP(() => {
    // Phase 6: GSAP stagger pattern for scenario chips
    if (alignmentData && alignmentRef.current) {
      const chips = alignmentRef.current.querySelectorAll('.scenario-chip');
      gsap.fromTo(chips,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: "back.out(1.5)" }
      );
    }
  }, [alignmentData]);

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
    <div className="space-y-12 pb-32">
      {/* Vault Header (Phase 3, 4, 5) */}
      <div className="sticky top-0 z-[100] bg-[#020202] pb-4">
        <VaultHeader 
          totalValue={totalValue}
          picksCount={picks.length}
          hoveredValue={hoveredPickValue}
          onAlignClick={() => setShowScenarioDropdown(!showScenarioDropdown)}
          isAligning={!!aligningScenario}
          hasPicks={picks.length > 0}
        />
        
        {/* Scenario Dropdown */}
        {showScenarioDropdown && picks.length > 0 && (
          <div className="absolute right-4 top-full mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden">
            {scenarios.map(s => (
              <button
                key={s.id}
                onClick={() => handleAlign(s.id)}
                className="w-full text-left px-4 py-3 hover:bg-zinc-800 transition-colors text-sm font-medium border-b border-zinc-800/50 last:border-0"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {alignmentData && alignmentData.alignment && (
        <div ref={alignmentRef} className="max-w-7xl mx-auto px-4 md:px-0 bg-emerald-950/20 border border-emerald-900/30 rounded-3xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Crosshair className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="text-xl font-bold">Alignment: {scenarios.find(s => s.id === alignmentData.scenario)?.label}</h3>
              <p className="text-zinc-400 text-sm mt-1">{alignmentData.logic}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900/50 rounded-2xl p-5 border border-emerald-500/20">
              <h4 className="text-emerald-400 font-mono text-sm tracking-widest uppercase mb-4">Well Aligned</h4>
              <div className="flex flex-wrap gap-2">
                {alignmentData.alignment.wellAligned.length === 0 && <span className="text-zinc-600 text-sm">None</span>}
                {alignmentData.alignment.wellAligned.map((c: string) => (
                  <span key={c} className="scenario-chip px-3 py-1 bg-emerald-500/10 text-emerald-300 text-xs font-medium rounded-full border border-emerald-500/20">{c}</span>
                ))}
              </div>
            </div>
            
            <div className="bg-zinc-900/50 rounded-2xl p-5 border border-yellow-500/20">
              <h4 className="text-yellow-400 font-mono text-sm tracking-widest uppercase mb-4">Consider Adding</h4>
              <div className="flex flex-wrap gap-2">
                {alignmentData.alignment.considerAdding.length === 0 && <span className="text-zinc-600 text-sm">None</span>}
                {alignmentData.alignment.considerAdding.map((c: string) => (
                  <Link key={c} href={`/portfolio/explore/${encodeURIComponent(c)}`} className="scenario-chip px-3 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 text-xs font-medium rounded-full border border-yellow-500/20 transition-colors cursor-pointer">
                    + {c}
                  </Link>
                ))}
              </div>
            </div>
            
            <div className="bg-zinc-900/50 rounded-2xl p-5 border border-rose-500/20">
              <h4 className="text-rose-400 font-mono text-sm tracking-widest uppercase mb-4">Consider Reducing</h4>
              <div className="flex flex-wrap gap-2">
                {alignmentData.alignment.considerReducing.length === 0 && <span className="text-zinc-600 text-sm">None</span>}
                {alignmentData.alignment.considerReducing.map((c: string) => (
                  <span key={c} className="scenario-chip px-3 py-1 bg-rose-500/10 text-rose-300 text-xs font-medium rounded-full border border-rose-500/20">- {c}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto px-4 md:px-0">
          {picks.map((pick) => {
            const asset = assets[pick.ticker];
            if (!asset) return null;
            
            return (
              <PickItem 
                key={pick.id} 
                pick={pick} 
                asset={asset} 
                onRemove={handleRemove} 
                onHover={(val) => setHoveredPickValue(val)}
                onLeave={() => setHoveredPickValue(0)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
