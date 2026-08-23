"use client";

import React, { useState } from "react";
import { X, Target, Save, Lock, AlertCircle, Activity, Rocket, Coins, Briefcase } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBetting } from "@/context/BettingContext";
import PredictionMarket from "./PredictionMarket";
import { PredictionEvent } from "@/utils/sportsData";

interface CreatePredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Returning `false` (e.g. insufficient balance) keeps the modal open so the error is visible
  // instead of silently closing as if the market had been created.
  onSubmit: (data: { title: string; category: PredictionEvent["category"]; amount: number }) => boolean | void;
  errorMessage?: string | null;
}

const CATEGORIES: { value: PredictionEvent["category"]; label: string; icon: LucideIcon }[] = [
  { value: "Sports", label: "Sports", icon: Activity },
  { value: "Startup", label: "Startup", icon: Rocket },
  { value: "Crypto", label: "Crypto", icon: Coins },
  { value: "Equities", label: "Equities", icon: Briefcase },
];

export default function CreatePredictionModal({ isOpen, onClose, onSubmit, errorMessage }: CreatePredictionModalProps) {
  const { balance } = useBetting();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<PredictionEvent["category"]>("Sports");
  const [amount, setAmount] = useState("");

  if (!isOpen) return null;

  const numAmount = Number(amount);
  const roundedBalance = Math.round(balance * 100) / 100;
  const amountEntered = amount.trim() !== "" && Number.isFinite(numAmount) && numAmount > 0;
  const exceedsBalance = amountEntered && numAmount > roundedBalance;
  const isAmountValid = amountEntered && !exceedsBalance;
  const isTitleValid = title.trim().length > 0;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "" || /^\d*\.?\d{0,2}$/.test(val)) setAmount(val);
  };

  // A brand new market has no trading history to price from, so the preview always starts
  // at a fair 50/50 Yes/No split — matching exactly what handleCreatePrediction generates.
  const previewEvent: PredictionEvent = {
    id: "preview",
    title: title.trim() || "Your prediction title will appear here",
    category,
    status: "Open",
    resolutionDate: "TBD",
    outcomes: [
      { label: "Yes", odds: 2.0, probability: 50 },
      { label: "No", odds: 2.0, probability: 50 },
    ],
    poolSize: amountEntered ? Math.round(numAmount * 100) / 100 : 0,
  };

  const handleSubmit = () => {
    if (!isTitleValid || !isAmountValid) return;
    const roundedAmount = Math.round(numAmount * 100) / 100;
    const result = onSubmit({ title: title.trim(), category, amount: roundedAmount });
    if (result !== false) {
      setTitle("");
      setAmount("");
      setCategory("Sports");
      onClose();
    }
  };

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
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="Create prediction market"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-sm">
            <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              Create Market
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label htmlFor="prediction-title" className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Prediction / Hypothesis
              </label>
              <textarea
                id="prediction-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. LeBron scores 30+, or SpaceX IPO happens in 2026..."
                maxLength={200}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all resize-none min-h-[100px]"
              />
              <div className="text-right text-[10px] font-mono text-zinc-600">{title.length}/200</div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Category</label>
              <div className="grid grid-cols-4 gap-2">
                {CATEGORIES.map(({ value, label, icon: Icon }) => {
                  const active = category === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCategory(value)}
                      aria-pressed={active}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${
                        active
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                          : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="prediction-amount" className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                  Initial Pool Stake
                </label>
                <span className="text-[10px] font-mono text-zinc-600">
                  Balance: ${roundedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">$</span>
                <input
                  id="prediction-amount"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 pl-8 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono"
                />
              </div>
              {exceedsBalance && <p className="text-[11px] font-medium text-rose-400">Exceeds available balance.</p>}
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Live Preview</span>
              <PredictionMarket event={previewEvent} interactive={false} />
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-start gap-3">
              <Lock className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                <strong className="font-bold">Trustless Resolution:</strong> Your prediction will be resolved
                automatically using market data and API oracles. Your stake is locked in escrow.
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
          <div className="sticky bottom-0 p-6 border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-sm flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isTitleValid || !isAmountValid}
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
