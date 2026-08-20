"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, LayoutGrid, Flame, Briefcase, Coins, Activity, TrendingUp, Trophy, ArrowRight, Zap, BarChart3, Clock, DollarSign, Sparkles, ChevronRight, Target, Eye, Lock } from "lucide-react";
import BettorProfileCard from "@/components/predictions/BettorProfileCard";
import PredictionMarket from "@/components/predictions/PredictionMarket";
import CreatePredictionModal from "@/components/predictions/CreatePredictionModal";
import BetSlipSidebar from "@/components/predictions/BetSlipSidebar";
import { fetchLiveMarkets, PredictionEvent } from "@/utils/sportsData";
import { useBetting } from "@/context/BettingContext";
import { motion, AnimatePresence } from "framer-motion";

export default function PredictionsDashboard() {
  const [markets, setMarkets] = useState<PredictionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"All" | "Sports" | "Startup" | "Crypto" | "Equities">("All");
  const [showAllPositions, setShowAllPositions] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const { activeBets, balance, deductStake } = useBetting();

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchLiveMarkets();
        setMarkets(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load prediction markets", error);
        setMarkets([]);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCreatePrediction = (data: any): boolean => {
    const stake = Math.round(Number(data.amount) * 100) / 100;
    if (!(stake > 0)) return false;

    // Actually lock the creator's stake in escrow — creating a market funds its pool,
    // it isn't free.
    const success = deductStake(stake);
    if (!success) {
      setCreateError("Insufficient balance to fund this market.");
      return false;
    }
    setCreateError(null);

    const newEvent: PredictionEvent = {
      id: `evt-${Date.now()}`,
      title: data.title,
      category: data.category as any,
      status: "Open",
      resolutionDate: "TBD",
      // A brand new market has no trading history to price from, so it starts at a fair
      // 50/50 Yes/No split (2.0x odds each) — intentional, not a placeholder to wire up.
      outcomes: [
        { label: "Yes", odds: 2.0, probability: 50 },
        { label: "No", odds: 2.0, probability: 50 }
      ],
      poolSize: stake
    };
    setMarkets([newEvent, ...markets]);
    return true;
  };

  const filteredMarkets = useMemo(() => {
    if (activeTab === "All") return markets;
    return markets.filter(m => m.category === activeTab);
  }, [markets, activeTab]);

  // Compute stats
  const totalExposure = activeBets.reduce((acc, bet) => acc + bet.stake, 0);
  const totalPotentialReturn = activeBets.reduce((acc, bet) => acc + bet.potentialPayout, 0);
  const liveCount = markets.filter(m => m.title.includes('[LIVE')).length;
  // Only settled (Won/Lost) bets count toward historical win-rate stats — Pending bets
  // haven't resolved yet and shouldn't inflate the "battles" total.
  const settledBetsCount = activeBets.filter(bet => bet.status !== "Pending").length;

  // Category counts for badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: markets.length };
    markets.forEach(m => { counts[m.category] = (counts[m.category] || 0) + 1; });
    return counts;
  }, [markets]);

  return (
    <main className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Hero Banner */}
      <section className="relative w-full rounded-3xl overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/[0.07] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/[0.04] rounded-full blur-[100px]" />

        <div className="relative z-10 p-6 md:p-10 lg:p-12">
          {/* Top Bar */}
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Left Column: Profile Card */}
            <div className="lg:w-auto flex flex-col items-center lg:items-start gap-6">
              <div className="flex items-center gap-3">
                <h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-zinc-500">My Scorecard</h2>
                <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold tracking-[0.15em] uppercase flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  Live
                </div>
              </div>
              <div className="transform scale-[0.85] md:scale-100 origin-top">
                <BettorProfileCard
                  name="Rudra"
                  rank="Grandmaster"
                  winRate={72}
                  roi={145}
                  totalBets={1042 + settledBetsCount}
                  overallRating={94}
                />
              </div>
            </div>

            {/* Right Column: Dashboard Stats + Active Positions */}
            <div className="flex-1 flex flex-col justify-between min-w-0 gap-6">
              {/* Header */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white uppercase">Prediction Terminal</h1>
                </div>
                <p className="text-zinc-500 text-sm max-w-xl leading-relaxed">
                  Trade the probability of real-world outcomes across sports, startups, crypto, and equities. Live odds from multiple data oracles.
                </p>
              </div>

              {/* Wallet Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <WalletStat
                  icon={<DollarSign className="w-4 h-4" />}
                  label="Balance"
                  value={`$${balance.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`}
                  color="text-white"
                  iconColor="text-emerald-400"
                />
                <WalletStat
                  icon={<Target className="w-4 h-4" />}
                  label="Active Bets"
                  value={activeBets.length.toString()}
                  color="text-emerald-400"
                  iconColor="text-emerald-400"
                />
                <WalletStat
                  icon={<Eye className="w-4 h-4" />}
                  label="Exposure"
                  value={`$${totalExposure.toLocaleString()}`}
                  color="text-amber-400"
                  iconColor="text-amber-400"
                />
                <WalletStat
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Potential"
                  value={`+$${totalPotentialReturn.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`}
                  color="text-emerald-400"
                  iconColor="text-emerald-400"
                />
              </div>

              {/* Live Feed Summary */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-xs">
                  <BarChart3 className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-zinc-400 font-mono">{markets.length} Markets</span>
                </div>
                {liveCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                    </span>
                    <span className="text-rose-400 font-mono font-bold">{liveCount} Live</span>
                  </div>
                )}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-zinc-400 font-mono">Dual Oracle Feed</span>
                </div>
              </div>

              {/* Active Positions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-500">Recent Positions</h3>
                  {activeBets.length > 4 && (
                    <button
                      onClick={() => setShowAllPositions(prev => !prev)}
                      className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-[0.1em] flex items-center gap-1 transition-colors"
                    >
                      {showAllPositions ? "Show Less" : "View All"}
                      <ChevronRight className={`w-3 h-3 transition-transform ${showAllPositions ? "rotate-90" : ""}`} />
                    </button>
                  )}
                </div>

                {activeBets.length === 0 ? (
                  <div className="w-full rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50 p-5 flex items-center justify-center gap-3">
                    <Lock className="w-4 h-4 text-zinc-600" />
                    <span className="text-zinc-600 text-xs font-mono">No active positions. Place a bet below.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(showAllPositions ? activeBets : activeBets.slice(0, 4)).map(bet => (
                      <div key={bet.id} className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-3.5 flex justify-between items-center hover:border-zinc-700 transition-colors">
                        <div className="min-w-0">
                          <div className="text-[10px] font-mono text-zinc-600 mb-0.5 truncate max-w-[180px]">{bet.eventTitle}</div>
                          <div className="text-sm font-bold text-white truncate">
                            {bet.outcomeLabel}
                            <span className="text-emerald-400 text-xs ml-1.5 font-mono">{bet.oddsAtPlacement.toFixed(2)}x</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] font-mono text-zinc-500">${bet.stake}</div>
                          <div className="text-sm font-black text-emerald-400 font-mono">${bet.potentialPayout.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Markets Section */}
      <section>
        {/* Tab Bar + Create Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto hide-scrollbar pb-1 sm:pb-0">
            <TabButton icon={<LayoutGrid className="w-4 h-4" />} label="All" count={categoryCounts.All || 0} active={activeTab === "All"} onClick={() => setActiveTab("All")} />
            <TabButton icon={<Activity className="w-4 h-4" />} label="Sports" count={categoryCounts.Sports || 0} active={activeTab === "Sports"} onClick={() => setActiveTab("Sports")} />
            <TabButton icon={<Flame className="w-4 h-4" />} label="Startup" count={categoryCounts.Startup || 0} active={activeTab === "Startup"} onClick={() => setActiveTab("Startup")} />
            <TabButton icon={<Coins className="w-4 h-4" />} label="Crypto" count={categoryCounts.Crypto || 0} active={activeTab === "Crypto"} onClick={() => setActiveTab("Crypto")} />
            <TabButton icon={<Briefcase className="w-4 h-4" />} label="Equities" count={categoryCounts.Equities || 0} active={activeTab === "Equities"} onClick={() => setActiveTab("Equities")} />
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="shrink-0 px-5 py-3 rounded-xl bg-white text-black font-black uppercase tracking-wider text-xs hover:bg-zinc-200 transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Create Market
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-56 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {filteredMarkets.map((market) => (
                <PredictionMarket key={market.id} event={market} />
              ))}
              {filteredMarkets.length === 0 && (
                <div className="col-span-full py-24 text-center">
                  <div className="inline-flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                      <BarChart3 className="w-7 h-7 text-zinc-600" />
                    </div>
                    <p className="text-zinc-500 text-sm font-medium">No markets in this category yet.</p>
                    <button 
                      onClick={() => setIsModalOpen(true)}
                      className="text-emerald-400 text-xs font-bold uppercase tracking-wider hover:text-emerald-300 transition-colors flex items-center gap-1"
                    >
                      Create One <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      <CreatePredictionModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setCreateError(null); }}
        onSubmit={handleCreatePrediction}
        errorMessage={createError}
      />
      
      <BetSlipSidebar />
      
    </main>
  );
}

function WalletStat({ icon, label, value, color, iconColor }: { icon: React.ReactNode, label: string, value: string, color: string, iconColor: string }) {
  return (
    <div className="bg-zinc-950/80 border border-zinc-800/50 rounded-xl p-4 hover:border-zinc-700/50 transition-colors min-w-0">
      <div className="flex items-center gap-1.5 mb-2 min-w-0">
        <span className={iconColor}>{icon}</span>
        <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-zinc-500 truncate">{label}</span>
      </div>
      <div className={`text-xl font-black tracking-tight font-mono truncate ${color}`} title={value}>{value}</div>
    </div>
  );
}

function TabButton({ icon, label, count, active, onClick }: { icon: React.ReactNode, label: string, count: number, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase whitespace-nowrap transition-all ${
        active 
          ? "bg-white text-black" 
          : "bg-zinc-900/50 text-zinc-500 border border-zinc-800/50 hover:bg-zinc-800/50 hover:text-zinc-300"
      }`}
    >
      {icon}
      {label}
      <span className={`text-[10px] font-mono ${active ? 'text-black/50' : 'text-zinc-600'}`}>{count}</span>
    </button>
  );
}
