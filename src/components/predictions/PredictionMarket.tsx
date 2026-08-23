"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Clock, Activity, Rocket, Coins, Briefcase } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PredictionEvent } from "@/utils/sportsData";
import { useBetting } from "@/context/BettingContext";

interface PredictionMarketProps {
  event: PredictionEvent;
  // false renders a read-only version (e.g. the live preview shown while creating a market) —
  // outcome buttons stop opening the bet slip and the card no longer reacts to hover.
  interactive?: boolean;
}

const CATEGORY_CONFIG: Record<PredictionEvent["category"], { icon: LucideIcon }> = {
  Sports: { icon: Activity },
  Startup: { icon: Rocket },
  Equities: { icon: Briefcase },
  Crypto: { icon: Coins },
};

function formatPool(size?: number): string {
  const value = Number.isFinite(size) ? Math.max(0, size as number) : 0;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(Math.min(100, Math.max(0, n)));
}

export default function PredictionMarket({ event, interactive = true }: PredictionMarketProps) {
  const { openBetSlip } = useBetting();
  const isLive = event.title.includes("[LIVE");
  const disabled = !interactive || event.status !== "Open";
  const CategoryIcon = CATEGORY_CONFIG[event.category]?.icon ?? Activity;

  const leadingIndex = event.outcomes.reduce(
    (best, outcome, i, arr) => (outcome.probability > arr[best].probability ? i : best),
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={interactive ? { y: -2 } : undefined}
      className={`relative flex flex-col rounded-2xl border bg-zinc-900/80 p-5 transition-colors ${
        interactive
          ? "border-zinc-800/50 hover:border-zinc-700/50 hover:shadow-lg hover:shadow-black/40"
          : "border-zinc-800/50"
      }`}
    >
      {/* Header: category + live badge, closed/resolved status */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-[0.12em] bg-zinc-800/60 border border-zinc-700/50 text-zinc-300">
            <CategoryIcon className="w-3 h-3" />
            {event.category}
          </span>
          {isLive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
              </span>
              Live
            </span>
          )}
        </div>
        {event.status !== "Open" && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 shrink-0">
            {event.status}
          </span>
        )}
      </div>

      {/* Title */}
      <div className="min-h-[2.75rem] mb-4">
        <h3 className="text-[15px] font-bold text-white tracking-tight leading-snug line-clamp-2 break-words">
          {event.title}
        </h3>
      </div>

      {/* Probability visualization — single source of truth for outcome split */}
      {event.outcomes.length > 0 && (
        <div className="mb-4">
          <div className="flex h-2 w-full rounded-full overflow-hidden bg-zinc-800/50 gap-[1px]">
            {event.outcomes.map((outcome, idx) => (
              <div
                key={idx}
                style={{ width: `${clampPct(outcome.probability)}%` }}
                className={
                  idx === leadingIndex
                    ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]"
                    : "bg-zinc-600"
                }
              />
            ))}
          </div>
          <div className="flex justify-between gap-2 mt-1.5">
            {event.outcomes.map((outcome, idx) => (
              <span
                key={idx}
                className={`text-[10px] font-mono truncate ${
                  idx === leadingIndex ? "text-emerald-400 font-bold" : "text-zinc-500"
                }`}
              >
                {outcome.label} {clampPct(outcome.probability)}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Outcome buttons */}
      <div className={`grid gap-2 mb-4 ${event.outcomes.length >= 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {event.outcomes.map((outcome, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              openBetSlip({ eventId: event.id, eventTitle: event.title, outcome });
            }}
            aria-label={`Bet on ${outcome.label} at ${outcome.odds.toFixed(2)}x odds`}
            className="flex items-center justify-between gap-1.5 px-3 py-3 rounded-xl border border-zinc-800/50 bg-zinc-800/20 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/[0.06] hover:shadow-[0_0_16px_rgba(16,185,129,0.12)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-zinc-800/50 disabled:hover:bg-zinc-800/20 disabled:hover:shadow-none min-w-0"
          >
            <span className="font-bold text-xs text-zinc-300 truncate">{outcome.label}</span>
            <span className="font-black text-emerald-400 text-sm font-mono shrink-0">
              {outcome.odds.toFixed(2)}x
            </span>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 mt-auto border-t border-zinc-800/30 text-[10px] font-mono text-zinc-600">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {formatPool(event.poolSize)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {event.resolutionDate}
        </span>
      </div>
    </motion.div>
  );
}
