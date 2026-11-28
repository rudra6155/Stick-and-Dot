"use client";

import { useState, useEffect } from "react";
import { useBetting } from "@/context/BettingContext";
import { Trophy, AlertCircle, ArrowRight, X } from "lucide-react";
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
    const hasEnoughBets = activeBets.length >= 2;

    if (!hasAllAssetClasses || !hasEnoughBets) {
      setShowPopup(true);
    }
  }, [hasAllAssetClasses, activeBets]);

  useEffect(() => {
    if (!showPopup) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowPopup(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPopup]);

  if (!isClient) return null;
  if (!showPopup) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setShowPopup(false);
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="unlock-leaderboard-title"
    >
      <div className="bg-zinc-950 border border-emerald-500/30 p-6 sm:p-8 rounded-2xl max-w-xl w-full shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>

        <button
          type="button"
          aria-label="Close modal"
          onClick={() => setShowPopup(false)}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-emerald-500/10 rounded-full">
            <Trophy className="w-12 h-12 text-emerald-400" />
          </div>
        </div>

        <h2 id="unlock-leaderboard-title" className="text-3xl font-black text-center text-white mb-4">
          Unlock the Leaderboard
        </h2>
        
        <p className="text-zinc-400 text-center mb-8">
          To enter the global leaderboard and see where you rank, you must build a truly diversified portfolio. 
          You need picks across multiple asset classes and active prediction bets.
        </p>

        <div className="space-y-4 mb-8">
          <div className={`p-4 rounded-xl border ${hasAllAssetClasses ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-rose-500/30 bg-rose-500/10'}`}>
            <div className="flex items-center gap-3">
              <AlertCircle className={`w-5 h-5 shrink-0 ${hasAllAssetClasses ? 'text-emerald-400' : 'text-rose-400'}`} />
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
              <AlertCircle className={`w-5 h-5 shrink-0 ${activeBets.length >= 2 ? 'text-emerald-400' : 'text-rose-400'}`} />
              <div>
                <h3 className={`font-bold ${activeBets.length >= 2 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {activeBets.length >= 2 ? 'Active Predictions: Complete' : 'Active Predictions: Incomplete'}
                </h3>
                {activeBets.length < 2 && (
                  <p className="text-sm text-zinc-400 mt-1">
                    You need active bets on at least 2 prediction markets.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/portfolio/explore" className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-sm uppercase tracking-widest rounded-lg transition-colors">
            Pick Assets
          </Link>
          <Link href="/portfolio/predictions" className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold font-mono text-sm uppercase tracking-widest rounded-lg transition-colors">
            Place Predictions <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setShowPopup(false)}
          className="mt-4 w-full text-center text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
        >
          Preview Leaderboard Anyway
        </button>
      </div>
    </div>
  );
}
