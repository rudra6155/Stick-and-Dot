"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus, LayoutGrid, Activity, Rocket, Coins, Briefcase, TrendingUp,
  DollarSign, Eye, Target, Search, ChevronDown, Lock, BarChart3, ArrowRight,
  AlertTriangle, RefreshCw, Building2, MapPin,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BettorProfileCard from "@/components/predictions/BettorProfileCard";
import PredictionMarket from "@/components/predictions/PredictionMarket";
import CreatePredictionModal from "@/components/predictions/CreatePredictionModal";
import BetSlipSidebar from "@/components/predictions/BetSlipSidebar";
import { fetchLiveMarkets, PredictionEvent } from "@/utils/sportsData";
import { useBetting, ActiveBet } from "@/context/BettingContext";

interface StartupData {
  id: string;
  name: string;
  sector: string;
  region: string;
  valuation: number;
  lastRound: string;
  lastRoundAmount: number;
  leadVCs: string[];
  founded: number;
  ipoOutlook: string;
  ipoNotes: string;
  description: string;
  tags: string[];
  predictionEventId?: string;
}

const IPO_COLORS: Record<string, string> = {
  'Soon': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  '2026': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  '2027': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  '2028+': 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
  'Unknown': 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20',
  'Listed': 'text-sky-400 bg-sky-400/10 border-sky-400/20',
};

const REGION_COLORS: Record<string, string> = {
  'India': 'text-orange-400',
  'US': 'text-blue-400',
  'Europe': 'text-violet-400',
  'Global': 'text-emerald-400',
};

function formatValuation(val: number): string {
  if (val >= 100) return `$${val}B`;
  if (val >= 10) return `$${val}B`;
  return `$${val}B`;
}

function formatRoundAmount(amt: number): string {
  if (amt === 0) return 'Bootstrapped';
  if (amt >= 1000) return `$${(amt / 1000).toFixed(1)}B`;
  return `$${amt}M`;
}

function StartupIntelHub({ markets = [], searchQuery = "" }: { markets?: PredictionEvent[]; searchQuery?: string }) {
  const [startups, setStartups] = React.useState<StartupData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [regionFilter, setRegionFilter] = React.useState<string>('All');
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const { openBetSlip } = useBetting();

  React.useEffect(() => {
    fetch('/api/startups')
      .then(r => r.json())
      .then(d => { setStartups(d.startups || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const regions = ['All', 'India', 'US', 'Europe', 'Global'];
  const filtered = React.useMemo(() => {
    let list = regionFilter === 'All' ? startups : startups.filter(s => s.region === regionFilter);
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.sector.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q)) ||
        s.leadVCs.some(vc => vc.toLowerCase().includes(q)) ||
        s.region.toLowerCase().includes(q)
      );
    }
    return list;
  }, [startups, regionFilter, searchQuery]);

  // Helper to find matching prediction market for each startup
  const getMarketForStartup = (s: StartupData): PredictionEvent | undefined => {
    if (s.predictionEventId) {
      const byId = markets.find(m => m.id === s.predictionEventId);
      if (byId) return byId;
    }
    return markets.find(m => m.title.toLowerCase().includes(s.name.toLowerCase()));
  };

  const handlePlaceBet = (market: PredictionEvent, outcome: PredictionEvent['outcomes'][0]) => {
    openBetSlip({
      eventId: market.id,
      eventTitle: market.title,
      outcome,
    });
  };

  if (loading) {
    return (
      <div className="mb-6 rounded-2xl border border-zinc-800/50 bg-zinc-950/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Building2 className="w-5 h-5 text-violet-400" />
          <span className="text-sm font-black uppercase tracking-widest text-white">Startup Intelligence Hub</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-zinc-900/60 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-violet-500/10 bg-zinc-950/50 backdrop-blur-xl p-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-white">Startup Intelligence Hub</p>
            <p className="text-xs text-zinc-500 font-mono">{filtered.length} unicorns · Real funding data · IPO outlook</p>
          </div>
        </div>
        {/* Region filter */}
        <div className="flex gap-1.5 overflow-x-auto">
          {regions.map(r => (
            <button
              key={r}
              onClick={() => setRegionFilter(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                regionFilter === r
                  ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                  : 'bg-zinc-800/80 text-zinc-500 hover:text-zinc-300 border border-zinc-700/50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-zinc-800/80 rounded-xl">
          <p className="text-zinc-500 text-xs font-mono">No startups match your search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((s, i) => {
          const market = getMarketForStartup(s);
          const isExpanded = expanded === s.id;

          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-zinc-800/50 bg-zinc-900/40 hover:bg-zinc-900/70 hover:border-zinc-700/60 transition-all cursor-pointer group flex flex-col justify-between"
              onClick={() => setExpanded(isExpanded ? null : s.id)}
            >
              <div className="p-4">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-black text-white text-sm group-hover:text-violet-300 transition-colors">{s.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{s.sector}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="text-lg font-black font-mono text-violet-400">{formatValuation(s.valuation)}</p>
                      <p className="text-[10px] text-zinc-600 font-mono">valuation</p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-600 transition-transform duration-200 ${
                        isExpanded ? "rotate-180 text-violet-400" : "group-hover:text-zinc-400"
                      }`}
                    />
                  </div>
                </div>

                {/* Funding row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-300">{s.lastRound}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-xs font-mono text-zinc-400">{formatRoundAmount(s.lastRoundAmount)}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${IPO_COLORS[s.ipoOutlook] || IPO_COLORS['Unknown']}`}>
                    IPO {s.ipoOutlook}
                  </span>
                </div>

                {/* VCs */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {s.leadVCs.slice(0, 3).map(vc => (
                    <span key={vc} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-800/80 text-zinc-400">{vc}</span>
                  ))}
                  {s.leadVCs.length > 3 && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-800/80 text-zinc-600">+{s.leadVCs.length - 3}</span>
                  )}
                </div>

                {/* Region + Direct Quick Bet Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-zinc-600" />
                    <span className={`text-xs font-bold ${REGION_COLORS[s.region] || 'text-zinc-400'}`}>{s.region}</span>
                    <span className="text-zinc-700 text-xs ml-1">· Est. {s.founded}</span>
                  </div>

                  {market && market.outcomes.length > 0 ? (
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {market.outcomes.slice(0, 2).map((outcome, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handlePlaceBet(market, outcome)}
                          className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 active:scale-95 ${
                            idx === 0
                              ? "bg-emerald-500/15 hover:bg-emerald-500 hover:text-black border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.12)]"
                              : "bg-zinc-800/80 hover:bg-zinc-700 hover:text-white border-zinc-700/60 text-zinc-400"
                          }`}
                          title={`Bet ${outcome.label} (${outcome.odds.toFixed(2)}x) on "${market.title}"`}
                        >
                          {idx === 0 && <TrendingUp className="w-3 h-3" />}
                          <span>{outcome.label}</span>
                          <span className="font-black">{outcome.odds.toFixed(2)}x</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-zinc-600 font-mono italic">No active odds</span>
                  )}
                </div>

                {/* Expanded company details & embedded prediction market */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-zinc-800/50 space-y-2.5">
                        <p className="text-xs text-zinc-300 leading-relaxed">{s.description}</p>
                        <p className="text-xs text-zinc-500 italic">Outlook: {s.ipoNotes}</p>
                        <div className="flex flex-wrap gap-1">
                          {s.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-500/5 border border-violet-500/10 text-violet-400">{tag}</span>
                          ))}
                        </div>

                        {/* Embedded Full Market View */}
                        {market && (
                          <div className="mt-3 p-3 rounded-xl bg-zinc-950/90 border border-violet-500/20 shadow-inner">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                                <span className="relative flex h-1.5 w-1.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                                </span>
                                Live Prediction Market
                              </span>
                              <span className="text-[10px] font-mono text-zinc-500">
                                Pool: ${(market.poolSize || 0).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-white mb-2.5 leading-snug">
                              {market.title}
                            </p>
                            <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                              {market.outcomes.map((outcome, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handlePlaceBet(market, outcome)}
                                  className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold flex items-center justify-between transition-all active:scale-95 ${
                                    idx === 0
                                      ? "bg-emerald-500/20 hover:bg-emerald-500 hover:text-black border-emerald-500/40 text-emerald-400 shadow-sm"
                                      : "bg-zinc-800 hover:bg-zinc-700 hover:text-white border-zinc-700 text-zinc-300"
                                  }`}
                                >
                                  <span className="flex items-center gap-1">
                                    {idx === 0 ? <TrendingUp className="w-3.5 h-3.5" /> : null}
                                    Bet {outcome.label}
                                  </span>
                                  <span className="font-black text-sm">{outcome.odds.toFixed(2)}x</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
      )}
    </div>
  );
}

type CategoryFilter = "All" | PredictionEvent["category"];
type SortKey = "pool" | "odds" | "closing";

const CATEGORY_TABS: { key: CategoryFilter; label: string; icon: LucideIcon }[] = [
  { key: "All", label: "All", icon: LayoutGrid },
  { key: "Sports", label: "Sports", icon: Activity },
  { key: "Startup", label: "Startup", icon: Rocket },
  { key: "Crypto", label: "Crypto", icon: Coins },
  { key: "Equities", label: "Equities", icon: Briefcase },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "pool", label: "Pool Size" },
  { key: "odds", label: "Best Odds" },
  { key: "closing", label: "Closing Soon" },
];

// resolutionDate is a free-form string from the backend ("Tonight", "Live Now", an ISO
// date, or a placeholder like "Q4 2026") — rank what we can parse, push the rest to the end
// rather than letting Date.parse's NaN silently corrupt the sort.
function closingRank(resolutionDate: string): number {
  const lower = resolutionDate.toLowerCase();
  if (lower.includes("live")) return -Infinity;
  if (lower === "tonight") return -1e12;
  const parsed = Date.parse(resolutionDate);
  return Number.isNaN(parsed) ? Infinity : parsed;
}

function bestOdds(event: PredictionEvent): number {
  return event.outcomes.reduce((max, o) => Math.max(max, o.odds), 0);
}

export default function PredictionsDashboard() {
  const [markets, setMarkets] = useState<PredictionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CategoryFilter>("All");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("pool");
  const [positionsExpanded, setPositionsExpanded] = useState(true);

  const { activeBets, balance, deductStake } = useBetting();

  const loadMarkets = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchLiveMarkets();
      if (data.length === 0) {
        setLoadError("Unable to reach the oracle feed. Showing no markets.");
      }
      setMarkets(data);
    } catch {
      setLoadError("Unable to reach the oracle feed. Check your connection and try again.");
      setMarkets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMarkets();
  }, [loadMarkets]);

  const handleCreatePrediction = (data: { title: string; category: PredictionEvent["category"]; amount: number }): boolean => {
    if (!(data.amount > 0)) return false;

    // Actually lock the creator's stake in escrow — creating a market funds its pool,
    // it isn't free.
    const success = deductStake(data.amount);
    if (!success) {
      setCreateError("Insufficient balance to fund this market.");
      return false;
    }
    setCreateError(null);

    const newEvent: PredictionEvent = {
      id: `evt-${Date.now()}`,
      title: data.title,
      category: data.category,
      status: "Open",
      resolutionDate: "TBD",
      // A brand new market has no trading history to price from, so it starts at a fair
      // 50/50 Yes/No split.
      outcomes: [
        { label: "Yes", odds: 2.0, probability: 50 },
        { label: "No", odds: 2.0, probability: 50 },
      ],
      poolSize: data.amount,
    };
    setMarkets((prev) => [newEvent, ...prev]);
    // Guarantee the new market is immediately visible regardless of the current filter/search.
    setActiveTab("All");
    setSearch("");
    return true;
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: markets.length };
    markets.forEach((m) => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });
    return counts;
  }, [markets]);

  const filteredMarkets = useMemo(() => {
    let result = activeTab === "All" ? markets : markets.filter((m) => m.category === activeTab);

    const query = search.trim().toLowerCase();
    if (query) result = result.filter((m) => m.title.toLowerCase().includes(query));

    result = [...result];
    if (sortKey === "pool") result.sort((a, b) => (b.poolSize || 0) - (a.poolSize || 0));
    else if (sortKey === "odds") result.sort((a, b) => bestOdds(b) - bestOdds(a));
    else result.sort((a, b) => closingRank(a.resolutionDate) - closingRank(b.resolutionDate));

    return result;
  }, [markets, activeTab, search, sortKey]);

  const totalExposure = activeBets.reduce((acc, bet) => acc + bet.stake, 0);
  const totalPotentialReturn = activeBets.reduce((acc, bet) => acc + bet.potentialPayout, 0);
  const liveCount = markets.filter((m) => m.title.includes("[LIVE")).length;

  // Derived, client-side "trader profile" stats — there's no backend user/stats endpoint,
  // so this reads straight off the bets the wallet already tracks.
  const settledBets = activeBets.filter((b) => b.status !== "Pending");
  const wonBets = activeBets.filter((b) => b.status === "Won");
  const winRate = settledBets.length ? Math.round((wonBets.length / settledBets.length) * 100) : 0;
  const settledStake = settledBets.reduce((acc, b) => acc + b.stake, 0);
  const settledReturn = wonBets.reduce((acc, b) => acc + b.potentialPayout, 0);
  const roi = settledStake > 0 ? Math.round(((settledReturn - settledStake) / settledStake) * 100) : 0;
  const overallRating =
    activeBets.length === 0 ? 0 : Math.max(1, Math.min(99, Math.round(50 + roi * 0.5 + (winRate - 50) * 0.3)));
  const rank =
    activeBets.length === 0
      ? "Unranked"
      : overallRating >= 90
      ? "Oracle"
      : overallRating >= 75
      ? "Shark"
      : overallRating >= 60
      ? "Analyst"
      : overallRating >= 40
      ? "Trader"
      : "Novice";

  return (
    <main className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Command Bar */}
      <section className="sticky top-24 z-30 rounded-2xl border border-zinc-800/60 bg-black/85 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <BettorProfileCard
            name="You"
            rank={rank}
            winRate={winRate}
            roi={roi}
            totalBets={activeBets.length}
            overallRating={overallRating}
          />

          <div className="hidden sm:block h-8 w-px bg-zinc-800 shrink-0" />

          <div className="flex-1 min-w-0 flex items-center gap-4 overflow-x-auto hide-scrollbar">
            <CommandStat
              icon={<DollarSign className="w-3.5 h-3.5" />}
              label="Balance"
              value={`$${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              valueClass="text-white"
            />
            <CommandStat
              icon={<Eye className="w-3.5 h-3.5" />}
              label="Exposure"
              value={`$${totalExposure.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              valueClass="text-amber-400"
            />
            <CommandStat
              icon={<TrendingUp className="w-3.5 h-3.5" />}
              label="Potential"
              value={`+$${totalPotentialReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              valueClass="text-emerald-400"
            />
            <CommandStat
              icon={<Target className="w-3.5 h-3.5" />}
              label="Active"
              value={activeBets.length.toString()}
              valueClass="text-white"
            />
            {liveCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs font-mono text-rose-400 shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
                {liveCount} Live
              </span>
            )}
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-black font-black uppercase tracking-wider text-[11px] hover:bg-zinc-200 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Create Market</span>
          </button>
        </div>
      </section>

      {/* Tabs + Search + Sort */}
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1 lg:pb-0">
          {CATEGORY_TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              aria-pressed={activeTab === key}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase whitespace-nowrap transition-all ${
                activeTab === key
                  ? "bg-white text-black"
                  : "bg-zinc-900/50 text-zinc-500 border border-zinc-800/50 hover:bg-zinc-800/50 hover:text-zinc-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className={`text-[10px] font-mono ${activeTab === key ? "text-black/50" : "text-zinc-600"}`}>
                {categoryCounts[key] || 0}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search markets..."
              aria-label="Search markets"
              className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
            />
          </div>
          <div className="relative shrink-0">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label="Sort markets"
              className="appearance-none bg-zinc-900/50 border border-zinc-800/50 rounded-xl py-2.5 pl-3 pr-8 text-xs font-bold uppercase tracking-wider text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-all cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Markets Grid — with Startup Intel Hub header for Startup tab */}
      <section>
        {/* Startup Intelligence Hub */}
        {activeTab === "Startup" && !loading && (
          <StartupIntelHub markets={markets} searchQuery={search} />
        )}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <MarketCardSkeleton key={i} />
            ))}
          </div>
        ) : loadError && markets.length === 0 ? (
          <div className="py-24 text-center">
            <div className="inline-flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-amber-500" />
              </div>
              <p className="text-zinc-400 text-sm font-medium max-w-sm">{loadError}</p>
              <button
                onClick={loadMarkets}
                className="text-emerald-400 text-xs font-bold uppercase tracking-wider hover:text-emerald-300 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </button>
            </div>
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
                    <p className="text-zinc-500 text-sm font-medium">
                      {search.trim() ? `No markets match "${search.trim()}".` : "No markets in this category yet."}
                    </p>
                    {search.trim() ? (
                      <button
                        onClick={() => setSearch("")}
                        className="text-emerald-400 text-xs font-bold uppercase tracking-wider hover:text-emerald-300 transition-colors"
                      >
                        Clear Search
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-emerald-400 text-xs font-bold uppercase tracking-wider hover:text-emerald-300 transition-colors flex items-center gap-1"
                      >
                        Create One <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      {/* Active Positions */}
      {activeBets.length > 0 && (
        <section className="pt-6 border-t border-zinc-800/50">
          <button
            onClick={() => setPositionsExpanded((v) => !v)}
            aria-expanded={positionsExpanded}
            className="flex items-center justify-between w-full mb-4 group"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-black tracking-tight text-white uppercase">My Active Positions</h2>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-transform ${
                positionsExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
            {positionsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {activeBets.map((bet) => (
                    <PositionCard key={bet.id} bet={bet} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      <CreatePredictionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCreateError(null);
        }}
        onSubmit={handleCreatePrediction}
        errorMessage={createError}
      />

      <BetSlipSidebar />
    </main>
  );
}

function CommandStat({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-zinc-600">{icon}</span>
      <div className="flex flex-col leading-none gap-0.5">
        <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-zinc-600">{label}</span>
        <span className={`text-sm font-black font-mono ${valueClass}`}>{value}</span>
      </div>
    </div>
  );
}

function PositionCard({ bet }: { bet: ActiveBet }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-colors">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 line-clamp-1">{bet.eventTitle}</span>
          <StatusBadge status={bet.status} />
        </div>
        <div className="text-lg font-black text-white flex justify-between items-center gap-2">
          <span className="truncate">{bet.outcomeLabel}</span>
          <span className="px-2 py-1 rounded bg-zinc-800 text-emerald-400 text-sm font-mono shrink-0">
            @{bet.oddsAtPlacement.toFixed(2)}x
          </span>
        </div>
      </div>
      <div className="flex justify-between items-end border-t border-zinc-800/50 pt-4">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Stake</div>
          <div className="text-sm font-mono text-zinc-300">${bet.stake.toFixed(2)}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">To Win</div>
          <div className="text-lg font-black text-emerald-400 font-mono">${bet.potentialPayout.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ActiveBet["status"] }) {
  const styles =
    status === "Won"
      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
      : status === "Lost"
      ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
      : "bg-amber-500/10 border-amber-500/20 text-amber-400";
  return (
    <span className={`shrink-0 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${styles}`}>
      {status}
    </span>
  );
}

function SkeletonBar({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded bg-zinc-800/50 ${className || ""}`}>
      <div className="absolute inset-0 shimmer" />
    </div>
  );
}

// Mirrors PredictionMarket's exact spacing/heights so the loading grid doesn't shift
// layout once the real cards swap in.
function MarketCardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/80 p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <SkeletonBar className="h-5 w-20 rounded-md" />
        <SkeletonBar className="h-4 w-10" />
      </div>
      <div className="min-h-[2.75rem] mb-4 space-y-2">
        <SkeletonBar className="h-3.5 w-full" />
        <SkeletonBar className="h-3.5 w-2/3" />
      </div>
      <div className="mb-4 space-y-1.5">
        <SkeletonBar className="h-2 w-full rounded-full" />
        <div className="flex justify-between">
          <SkeletonBar className="h-2.5 w-16" />
          <SkeletonBar className="h-2.5 w-16" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <SkeletonBar className="h-11 rounded-xl" />
        <SkeletonBar className="h-11 rounded-xl" />
      </div>
      <div className="flex justify-between pt-3 mt-auto border-t border-zinc-800/30">
        <SkeletonBar className="h-2.5 w-14" />
        <SkeletonBar className="h-2.5 w-14" />
      </div>
    </div>
  );
}
