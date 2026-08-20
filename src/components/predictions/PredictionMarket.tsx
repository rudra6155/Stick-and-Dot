"use client";

import React from "react";
import { PredictionEvent } from "@/utils/sportsData";
import { Users, Clock, Zap, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useBetting } from "@/context/BettingContext";

interface PredictionMarketProps {
  event: PredictionEvent;
}

export default function PredictionMarket({ event }: PredictionMarketProps) {
  const { openBetSlip } = useBetting();
  const isLive = event.title.includes('[LIVE');

  const getCategoryStyles = () => {
    switch(event.category) {
      case 'Sports': return { badge: 'text-blue-400 bg-blue-500/10 border-blue-500/20', glow: 'group-hover:shadow-blue-500/5', accent: 'blue' };
      case 'Startup': return { badge: 'text-purple-400 bg-purple-500/10 border-purple-500/20', glow: 'group-hover:shadow-purple-500/5', accent: 'purple' };
      case 'Crypto': return { badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20', glow: 'group-hover:shadow-amber-500/5', accent: 'amber' };
      case 'Equities': return { badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', glow: 'group-hover:shadow-emerald-500/5', accent: 'emerald' };
      default: return { badge: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20', glow: '', accent: 'zinc' };
    }
  };

  const styles = getCategoryStyles();

  // Clean title for display
  const displayTitle = event.title;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-zinc-900/80 border border-zinc-800/50 rounded-2xl p-5 hover:border-zinc-700/50 transition-all group relative overflow-hidden flex flex-col ${styles.glow} hover:shadow-lg`}
    >
      {/* Top: Category + Status */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-[0.12em] border ${styles.badge}`}>
            {event.category}
          </span>
          {isLive && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
              </span>
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-zinc-600 text-[10px] font-mono">
          <Clock className="w-3 h-3" />
          {event.status}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-[15px] font-bold text-white tracking-tight mb-5 leading-snug flex-1 break-words">
        {displayTitle}
      </h3>

      {/* Odds Buttons */}
      <div className={`grid gap-2.5 mb-4 ${event.outcomes.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {event.outcomes.map((outcome, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === event.outcomes.length - 1;
          const fillClass = isFirst ? 'bg-emerald-500/10' : isLast ? 'bg-blue-500/10' : 'bg-amber-500/10';
          // Clamp so a malformed/derived probability can never blow out the button's bounds.
          const clampedPct = Math.min(100, Math.max(0, outcome.probability));
          return (
            <button
              key={idx}
              disabled={event.status !== 'Open'}
              onClick={() => openBetSlip({ eventId: event.id, eventTitle: event.title, outcome })}
              aria-label={`Bet on ${outcome.label} at ${outcome.odds.toFixed(2)}x odds`}
              className="relative w-full rounded-xl overflow-hidden cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group/btn transition-all hover:scale-[1.02] active:scale-[0.98] min-w-0"
            >
              {/* Background fill showing probability */}
              <div className="absolute inset-0 bg-zinc-800/30" />
              <div
                className={`absolute left-0 top-0 bottom-0 transition-all duration-700 ease-out ${fillClass}`}
                style={{ width: `${clampedPct}%` }}
              />

              {/* Content */}
              <div className="relative z-10 flex items-center justify-between gap-1.5 px-3.5 py-3 border border-zinc-800/50 rounded-xl group-hover/btn:border-zinc-700 transition-colors">
                <div className="flex flex-col items-start min-w-0">
                  <span className="font-bold text-xs text-zinc-300 group-hover/btn:text-white transition-colors leading-tight truncate max-w-full">{outcome.label}</span>
                  <span className="text-[10px] text-zinc-600 font-mono">{clampedPct}%</span>
                </div>
                <span className="font-black text-emerald-400 text-sm font-mono shrink-0">
                  {outcome.odds.toFixed(2)}x
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-3 border-t border-zinc-800/30">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-600">
          <Users className="w-3 h-3" />
          Vol: ${(event.poolSize || 0).toLocaleString()}
        </div>
        <div className="text-[10px] font-mono text-zinc-600">
          {event.resolutionDate}
        </div>
      </div>
    </motion.div>
  );
}
