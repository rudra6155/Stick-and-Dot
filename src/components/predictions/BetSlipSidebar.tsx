"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { X, Receipt, CheckCircle, TrendingUp, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBetting } from "@/context/BettingContext";

const QUICK_STAKES = [10, 50, 100, 500];
const CONFETTI_COLORS = ["#34d399", "#6ee7b7", "#fbbf24", "#ffffff"];

export default function BetSlipSidebar() {
  const { betSlip, closeBetSlip, placeBet, balance } = useBetting();
  const [stake, setStake] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const roundedBalance = Math.round(balance * 100) / 100;

  // closeBetSlip's identity changes on every BettingContext re-render (it isn't memoized),
  // so effects below read it through a ref instead of depending on it directly — otherwise
  // an unrelated balance/activeBets update could re-arm the auto-close timer and it would
  // never fire.
  const closeBetSlipRef = useRef(closeBetSlip);
  useEffect(() => {
    closeBetSlipRef.current = closeBetSlip;
  });

  // Reset the draft stake whenever a new outcome is selected, so a value typed for a
  // previous bet slip doesn't linger into the next one.
  useEffect(() => {
    setStake("");
    setStatus("idle");
    setErrorMessage("");
  }, [betSlip?.eventId, betSlip?.outcome?.label]);

  useEffect(() => {
    if (!betSlip) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeBetSlipRef.current();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [betSlip]);

  useEffect(() => {
    if (status !== "success") return;
    const timer = setTimeout(() => {
      closeBetSlipRef.current();
      setStatus("idle");
    }, 1600);
    return () => clearTimeout(timer);
  }, [status]);

  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Only accept a valid partial decimal (no negatives, at most 2 decimal places).
    if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) {
      setStake(val);
      setStatus("idle");
    }
  };

  const applyQuickStake = (amount: number) => {
    setStake(amount.toFixed(2));
    setStatus("idle");
  };

  const applyMax = () => {
    setStake(Math.max(0, roundedBalance).toFixed(2));
    setStatus("idle");
  };

  const numStake = Number(stake);
  const safeStake = stake.trim() !== "" && Number.isFinite(numStake) ? numStake : 0;
  const isValidStake = safeStake > 0 && safeStake <= roundedBalance;
  const potentialReturn = betSlip ? safeStake * betSlip.outcome.odds : 0;

  const handlePlaceBet = () => {
    if (!isValidStake) {
      setStatus("error");
      setErrorMessage(safeStake > roundedBalance ? "Insufficient balance." : "Enter a valid amount.");
      return;
    }
    const success = placeBet(Math.round(safeStake * 100) / 100);
    if (success) {
      setStatus("success");
    } else {
      setStatus("error");
      setErrorMessage("Unable to place bet. Please try again.");
    }
  };

  return (
    <AnimatePresence>
      {betSlip && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeBetSlip}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 z-[101] w-full max-w-md bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Bet slip"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
              <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                Bet Slip
              </h2>
              <button
                onClick={closeBetSlip}
                aria-label="Close bet slip"
                className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6">
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                <div className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 truncate">
                  {betSlip.eventTitle}
                </div>
                <div className="flex justify-between items-center gap-3">
                  <div className="text-lg font-black text-white truncate min-w-0">{betSlip.outcome.label}</div>
                  <div className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold text-sm border border-emerald-500/20 shrink-0">
                    {betSlip.outcome.odds.toFixed(2)}x
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="stake-input" className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    Stake Amount
                  </label>
                  <span className="text-[10px] font-mono text-zinc-600">
                    Balance: ${roundedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-lg">$</span>
                  <input
                    id="stake-input"
                    type="text"
                    inputMode="decimal"
                    value={stake}
                    onChange={handleStakeChange}
                    placeholder="0.00"
                    disabled={status === "success"}
                    className="w-full bg-black border border-zinc-800 rounded-xl py-4 pl-8 pr-4 text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono text-lg disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {QUICK_STAKES.map((amount) => {
                    const isDisabled = amount > roundedBalance || status === "success";
                    return (
                      <button
                        key={amount}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => applyQuickStake(amount)}
                        className="py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-[11px] font-bold text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-zinc-800 disabled:hover:text-zinc-300"
                      >
                        ${amount}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    disabled={roundedBalance <= 0 || status === "success"}
                    onClick={applyMax}
                    className="py-2 rounded-lg border border-zinc-800 bg-zinc-900 text-[11px] font-bold text-zinc-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Max
                  </button>
                </div>
              </div>

              {status === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-rose-400">{errorMessage}</p>
                </motion.div>
              )}

              {status === "success" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center gap-2 text-emerald-400 overflow-hidden"
                >
                  <Confetti />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <CheckCircle className="w-8 h-8" />
                  </motion.div>
                  <span className="font-black uppercase tracking-wider text-sm">Bet Locked!</span>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-widest text-zinc-400">Potential Return</span>
                <span className="text-2xl font-black text-emerald-400 font-mono flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 opacity-50" />
                  ${potentialReturn.toFixed(2)}
                </span>
              </div>

              <button
                onClick={handlePlaceBet}
                disabled={!isValidStake || status === "success"}
                className="w-full py-4 rounded-xl font-black uppercase tracking-wider text-sm bg-emerald-500 text-black hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.2)]"
              >
                Place Bet
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Confetti() {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        angle: (Math.PI * 2 * i) / 18 + Math.random() * 0.4,
        distance: 60 + Math.random() * 60,
        size: 4 + Math.random() * 4,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: Math.random() * 360,
        delay: Math.random() * 0.15,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }}
          animate={{
            opacity: 0,
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            scale: 0.4,
            rotate: p.rotate,
          }}
          transition={{ duration: 1, ease: "easeOut", delay: p.delay }}
          style={{ width: p.size, height: p.size, background: p.color, position: "absolute", borderRadius: 2 }}
        />
      ))}
    </div>
  );
}
