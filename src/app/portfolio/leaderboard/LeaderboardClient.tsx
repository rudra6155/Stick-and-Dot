"use client";

import { useState, useEffect } from "react";
import { useBetting } from "@/context/BettingContext";
import { Trophy, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface LeaderboardClientProps {
  hasAllAssetClasses: boolean;
  missingClasses: string[];
}

export function LeaderboardClient({ hasAllAssetClasses, missingClasses }: LeaderboardClientProps) {
  const { activeBets } = useBetting();
  const [showPopup, setShowPopup] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Check if they have bets in at least 3 categories (Sports, Startup, Crypto, etc)
    const betCategories = new Set(activeBets.map(b => b.category));
    const hasEnoughBets = betCategories.size >= 2; // Simplified requirement for now

    if (!hasAllAssetClasses || !hasEnoughBets) {
      setShowPopup(true);
    }
  }, [hasAllAssetClasses, activeBets]);

  if (!isClient) return null;
  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-emerald-500/30 p-8 rounded-2xl max-w-xl w-full shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
        
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-emerald-500/10 rounded-full">
            <Trophy className="w-12 h-12 text-emerald-400" />
          </div>
        </div>

        <h2 className="text-3xl font-black text-center text-white mb-4">
          Unlock the Leaderboard
        </h2>
        
        <p className="text-zinc-400 text-center mb-8">
          To enter the global leaderboard and see where you rank, you must build a truly diversified portfolio. 
          You need picks across multiple asset classes and active scenarios.
        </p>

        <div className="space-y-4 mb-8">
          <div className={`p-4 rounded-xl border ${hasAllAssetClasses ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-rose-500/30 bg-rose-500/10'}`}>
            <div className="flex items-center gap-3">
              <AlertCircle className={`w-5 h-5 ${hasAllAssetClasses ? 'text-emerald-400' : 'text-rose-400'}`} />
              <div>
                <h3 className={`font-bold ${hasAllAssetClasses ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {hasAllAssetClasses ? 'Diversified Picks: Complete' : 'Diversified Picks: Incomplete'}
                </h3>
                {!hasAllAssetClasses && (
                  <p className="text-sm text-zinc-400 mt-1">
                    Missing classes: {missingClasses.slice(0, 3).join(", ")} {missingClasses.length > 3 && `+${missingClasses.length - 3} more`}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${activeBets.length >= 2 ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-rose-500/30 bg-rose-500/10'}`}>
            <div className="flex items-center gap-3">
              <AlertCircle className={`w-5 h-5 ${activeBets.length >= 2 ? 'text-emerald-400' : 'text-rose-400'}`} />
              <div>
                <h3 className={`font-bold ${activeBets.length >= 2 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {activeBets.length >= 2 ? 'Active Scenarios: Complete' : 'Active Scenarios: Incomplete'}
                </h3>
                {activeBets.length < 2 && (
                  <p className="text-sm text-zinc-400 mt-1">
                    You need active bets in at least 2 different scenario categories.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Link href="/portfolio/explore" className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-sm uppercase tracking-widest rounded-lg transition-colors">
            Pick Assets
          </Link>
          <Link href="/portfolio/predictions" className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono text-sm uppercase tracking-widest rounded-lg transition-colors">
            Create Scenarios <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
