"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Trophy, TrendingUp, TrendingDown, Target } from "lucide-react";

interface BettorProfileCardProps {
  name: string;
  rank: string;
  winRate: number;
  roi: number;
  totalBets: number;
  overallRating: number;
}

// Compact profile chip for the command bar — expands into a small popover on click.
// Deliberately not a full trading-card layout; the founder flagged that as too heavy.
export default function BettorProfileCard({ name, rank, winRate, roi, totalBets, overallRating }: BettorProfileCardProps) {
  const [open, setOpen] = useState(false);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  const closeRef = useRef(() => setOpen(false));
  useEffect(() => {
    closeRef.current = () => setOpen(false);
  });

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeRef.current();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="View trader profile"
        className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors"
      >
        <span className="w-6 h-6 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-zinc-700 flex items-center justify-center text-[10px] font-black text-zinc-400">
          {initial}
        </span>
        <span className="hidden sm:flex flex-col items-start leading-none gap-0.5">
          <span className="text-xs font-bold text-white">{name}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400/80">{rank}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-2 z-50 w-72 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="w-11 h-11 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-zinc-700 flex items-center justify-center text-sm font-black text-zinc-300">
                  {initial}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-black text-white truncate">{name}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">{rank}</div>
                </div>
                <div className="ml-auto text-right shrink-0">
                  <div className="text-xl font-black text-white font-mono leading-none">
                    {totalBets > 0 ? overallRating : "—"}
                  </div>
                  <div className="text-[8px] font-bold uppercase tracking-widest text-zinc-600">Rating</div>
                </div>
              </div>

              <div className="h-px w-full bg-zinc-800 mb-4" />

              <div className="grid grid-cols-3 gap-3">
                <Stat icon={<Trophy className="w-3.5 h-3.5 text-zinc-500" />} label="Win Rate" value={`${winRate}%`} />
                <Stat
                  icon={
                    roi >= 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                    )
                  }
                  label="ROI"
                  value={`${roi > 0 ? "+" : ""}${roi}%`}
                  valueClass={roi > 0 ? "text-emerald-400" : roi < 0 ? "text-rose-400" : "text-white"}
                />
                <Stat icon={<Target className="w-3.5 h-3.5 text-zinc-500" />} label="Bets" value={totalBets.toString()} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ icon, label, value, valueClass }: { icon: React.ReactNode; label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {icon}
        <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-600">{label}</span>
      </div>
      <span className={`text-sm font-black font-mono ${valueClass || "text-white"}`}>{value}</span>
    </div>
  );
}
