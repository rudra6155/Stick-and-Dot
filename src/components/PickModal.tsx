"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export function PickModal({ 
  isOpen, 
  onClose, 
  asset 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  asset: any;
}) {
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("");
  const [holdingPeriod, setHoldingPeriod] = useState("Long Term");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  if (!isOpen || !asset) return null;

  // Auto-calculate quantity if amount is entered, or vice versa
  const handleAmountChange = (val: string) => {
    setAmount(val);
    if (val && !isNaN(Number(val)) && asset.price) {
      setQuantity((Number(val) / asset.price).toFixed(6));
    } else if (!val) {
      setQuantity("");
    }
  };

  const handleQuantityChange = (val: string) => {
    setQuantity(val);
    if (val && !isNaN(Number(val)) && asset.price) {
      setAmount((Number(val) * asset.price).toFixed(2));
    } else if (!val) {
      setAmount("");
    }
  };

  const handlePick = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to pick an asset.");
      }

      const { error: dbError } = await supabase.from('user_picks').insert({
        user_id: user.id,
        ticker: asset.ticker,
        asset_class: asset.asset_class,
        amount: Number(amount),
        quantity: Number(quantity),
        holding_period: holdingPeriod
      });

      if (dbError) throw dbError;

      onClose();
      router.push('/portfolio'); // Redirect to portfolio after picking
    } catch (err: any) {
      setError(err.message || "Failed to save pick. Ensure user_picks table exists.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden relative">
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold">Pick {asset.ticker}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handlePick} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center bg-zinc-900 rounded-xl p-4">
            <div>
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Current Price</p>
              <p className="text-lg font-mono font-bold">${(asset.price || 0).toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Class</p>
              <p className="text-sm font-bold text-emerald-400">{asset.asset_class}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wider">Amount ($)</label>
              <input 
                type="number" 
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50"
                placeholder="1000.00"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wider">Quantity</label>
              <input 
                type="number" 
                step="any"
                min="0.000001"
                required
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50"
                placeholder="Shares / Coins"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5 uppercase tracking-wider">Holding Period</label>
              <select 
                value={holdingPeriod}
                onChange={(e) => setHoldingPeriod(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500/50 appearance-none"
              >
                <option value="Day Trade">Day Trade</option>
                <option value="Swing (Weeks)">Swing (Weeks)</option>
                <option value="Medium (Months)">Medium (Months)</option>
                <option value="Long Term">Long Term</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-4 rounded-xl transition-colors disabled:opacity-50 mt-4 text-lg"
          >
            {loading ? "Confirming..." : "Confirm Pick"}
          </button>
        </form>
      </div>
    </div>
  );
}
