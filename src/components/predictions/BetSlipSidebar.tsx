"use client";

import React, { useState } from "react";
import { X, Receipt, CheckCircle, TrendingUp, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBetting } from "@/context/BettingContext";

export default function BetSlipSidebar() {
  const { betSlip, closeBetSlip, placeBet, balance } = useBetting();
  const [stake, setStake] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStake(e.target.value);
    setStatus("idle");
  };

  const handlePlaceBet = () => {
    const numStake = Number(stake);
    if (isNaN(numStake) || numStake <= 0) {
      setStatus("error");
      setErrorMessage("Enter a valid amount.");
      return;
    }
    // Round both sides to cents before comparing — raw floating point values (e.g.
    // 10.1 + 0.2 !== 10.3) can otherwise block a user from staking their exact balance.
    const roundedStake = Math.round(numStake * 100) / 100;
    const roundedBalance = Math.round(balance * 100) / 100;
    if (roundedStake > roundedBalance) {
      setStatus("error");
      setErrorMessage("Insufficient balance.");
      return;
    }

    const success = placeBet(roundedStake);
    if (success) {
      setStatus("success");
      setStake("");
      setTimeout(() => {
        setStatus("idle");
      }, 2000);
    }
  };

  const potentialReturn = betSlip ? (Number(stake) * betSlip.outcome.odds).toFixed(2) : "0.00";

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
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              
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
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Stake Amount ($)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">$</span>
                  <input 
                    type="number"
                    value={stake}
                    onChange={handleStakeChange}
                    placeholder="0.00"
                    className="w-full bg-black border border-zinc-800 rounded-xl py-4 pl-8 pr-4 text-white placeholder-zinc-700 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono text-lg"
                  />
                </div>
                
                <div className="flex justify-between text-xs font-mono text-zinc-500 pt-2">
                  <span>Available Balance:</span>
                  <span className="text-white">${balance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
              </div>

              {status === "error" && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-rose-400">{errorMessage}</p>
                </div>
              )}

              {status === "success" && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center gap-2 text-emerald-400"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-bold">Bet Locked!</span>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-widest text-zinc-400">Potential Return</span>
                <span className="text-2xl font-black text-emerald-400 font-mono flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 opacity-50" />
                  ${potentialReturn}
                </span>
              </div>
              
              <button 
                onClick={handlePlaceBet}
                disabled={!stake || Number(stake) <= 0 || status === "success"}
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
