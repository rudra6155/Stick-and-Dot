"use client";

import React, { useState } from "react";
import { X, Target, Save, Lock, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CreatePredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Returning `false` (e.g. insufficient balance) keeps the modal open so the error is visible
  // instead of silently closing as if the market had been created.
  onSubmit: (data: any) => boolean | void;
  errorMessage?: string | null;
}

export default function CreatePredictionModal({ isOpen, onClose, onSubmit, errorMessage }: CreatePredictionModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Sports");
  const [amount, setAmount] = useState("");

  if (!isOpen) return null;

  const numAmount = Number(amount);
  // Reject empty/non-numeric/negative/zero stakes — a bare `!amount` check lets "-100" through
  // since it's a non-empty string.
  const isAmountValid = amount.trim() !== "" && Number.isFinite(numAmount) && numAmount > 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-950/50">
            <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              Define New Bet
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Prediction / Hypothesis</label>
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. LeBron scores 30+, or SpaceX IPO happens in 2026..."
                maxLength={200}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-white focus:outline-none focus:border-emerald-500/50 appearance-none"
                >
                  <option value="Sports">Sports</option>
                  <option value="Startup">Startup / VC</option>
                  <option value="Equities">Equities</option>
                  <option value="Crypto">Crypto</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Initial Stake ($)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-start gap-3">
              <Lock className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                <strong className="font-bold">Trustless Resolution:</strong> Your prediction will be resolved automatically using market data and API oracles. Your stake is locked in escrow.
              </p>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-rose-400">{errorMessage}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-zinc-800 bg-zinc-950/50 flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!title.trim() || !isAmountValid) return;
                // Clamp/round the stake to cents so fractional-cent stakes never propagate into payouts.
                const roundedAmount = Math.round(numAmount * 100) / 100;
                const result = onSubmit({ title: title.trim(), category, amount: roundedAmount });
                if (result !== false) {
                  onClose();
                }
              }}
              disabled={!title.trim() || !isAmountValid}
              className="px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs bg-emerald-500 text-black hover:bg-emerald-400 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Lock Prediction
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
