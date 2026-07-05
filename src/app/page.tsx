"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Search, ChevronDown, Filter, Settings2, Check } from "lucide-react";
import { fetchAssetsPaginated, fetchAssetClassCounts, fetchTickerTapeAssets, type Asset } from "./actions";
import dynamic from 'next/dynamic';
import { useCountUp } from "@/hooks/useCountUp";
import { AssetCard } from "@/components/AssetCard";

const DollarParticles = dynamic(() => import('@/components/DollarParticles'), { ssr: false });
const HeroParticles = dynamic(() => import('@/components/HeroParticles'), { ssr: false });
const StatsSection = dynamic(() => import('@/components/StatsSection'), { ssr: false });

const AVAILABLE_METRICS = [
  { id: "volume",         label: "Volume" },
  { id: "avgVolume",      label: "Avg Volume" },
  { id: "marketCap",      label: "Market Cap" },
  { id: "peRatio",        label: "P/E Ratio" },
  { id: "forwardPe",      label: "Fwd P/E" },
  { id: "priceToBook",    label: "P/B Ratio" },
  { id: "priceToSales",   label: "P/S Ratio" },
  { id: "evToEbitda",     label: "EV/EBITDA" },
  { id: "dividendYield",  label: "Div Yield" },
  { id: "earningsGrowth", label: "EPS Growth" },
  { id: "revenueGrowth",  label: "Rev Growth" },
  { id: "profitMargins",  label: "Net Margin" },
  { id: "high52Week",     label: "52W High" },
  { id: "low52Week",      label: "52W Low" },
  { id: "ma50Day",        label: "50D MA" },
  { id: "ma200Day",       label: "200D MA" },
  { id: "beta",           label: "Beta" },
  { id: "dayHigh",        label: "Day High" },
  { id: "dayLow",         label: "Day Low" },
  { id: "sector",         label: "Sector" },
  { id: "previousClose",           label: "Prev Close" },
  { id: "enterpriseValue",         label: "Ent Value" },
  { id: "pegRatio",                label: "PEG Ratio" },
  { id: "dividendRate",            label: "Div Rate" },
  { id: "payoutRatio",             label: "Payout Ratio" },
  { id: "grossMargins",            label: "Gross Margin" },
  { id: "operatingMargins",        label: "Op Margin" },
  { id: "returnOnEquity",          label: "ROE" },
  { id: "returnOnAssets",          label: "ROA" },
  { id: "totalRevenue",            label: "Revenue" },
  { id: "ebitda",                  label: "EBITDA" },
  { id: "totalDebt",               label: "Total Debt" },
  { id: "freeCashflow",            label: "Free CF" },
  { id: "allTimeHigh",             label: "All Time High" },
  { id: "allTimeLow",              label: "All Time Low" },
  { id: "sharesOutstanding",       label: "Shares Out" },
  { id: "heldPercentInsiders",     label: "Insider %" },
  { id: "heldPercentInstitutions", label: "Institution %" },
  { id: "recommendationMean",      label: "Analyst Score" },
  { id: "targetMeanPrice",         label: "Price Target" },
  { id: "trailingEps",             label: "EPS" },
  { id: "forwardEps",              label: "Fwd EPS" },
  { id: "currency",                label: "Currency" },
];

const AnimatedText = ({ text, delayOffset = 0 }: { text: string; delayOffset?: number }) => (
  <div className="flex flex-wrap justify-center">
    {text.split('').map((char, i) => (
      <motion.span
        key={i}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: delayOffset + i * 0.03 }}
      >
        {char === ' ' ? '\u00A0' : char}
      </motion.span>
    ))}
  </div>
);

const AnimatedStat = ({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) => {
  const displayValue = useCountUp(value, 1500);
  return (
    <div className="flex flex-col items-center">
      <div className="text-4xl md:text-5xl font-mono text-emerald-400 font-bold tracking-tighter">
        {Math.floor(displayValue)}{suffix}
      </div>
      <div className="text-zinc-500 font-mono text-xs uppercase tracking-widest mt-2">{label}</div>
    </div>
  );
};

const TickerTape = ({ assets }: { assets: Asset[] }) => {
  const tapeAssets = assets.slice(0, 30);
  if (tapeAssets.length === 0) return null;
  return (
    <div className="w-full overflow-hidden bg-black/40 border-b border-white/5 py-2 relative z-50 backdrop-blur-md">
      <div className="animate-ticker whitespace-nowrap flex items-center font-mono text-xs tracking-wider text-zinc-400">
        {[...tapeAssets, ...tapeAssets].map((asset, i) => (
          <div key={i} className="inline-flex items-center gap-2 mx-6">
            <span className="text-white font-bold">{asset.symbol}</span>
            <span>${asset.price?.toFixed(2) || '0.00'}</span>
            <span className={asset.isUp ? "text-emerald-500" : "text-rose-500"}>
              {asset.isUp ? '▲' : '▼'}{asset.change.replace('-', '')}
            </span>
            <span className="text-zinc-700 mx-2">·</span>
          </div>
        ))}
      </div>
    </div>
  );
};

function LiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString('en-US', { hour12: false }));
    update();
    const int = setInterval(update, 1000);
    return () => clearInterval(int);
  }, []);
  return <div>{time} UTC</div>;
}

export default function SuperFinanceHub() {
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tickerTapeAssets, setTickerTapeAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [activeClass, setActiveClass] = useState("All");
  const [activeSector, setActiveSector] = useState("All Sectors");
  const [sortBy, setSortBy] = useState("Market Cap");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    "marketCap", "volume", "peRatio", "dividendYield", "high52Week", "beta"
  ]);
  const [scanlineText, setScanlineText] = useState("");
  const placeholder = "Search tickers, assets...";
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [assetClassCounts, setAssetClassCounts] = useState<Record<string, number>>({});

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.95]);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setScanlineText(placeholder.substring(0, i));
      i++;
      if (i > placeholder.length) clearInterval(timer);
    }, 50);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const tape = await fetchTickerTapeAssets();
        setTickerTapeAssets(tape);
        const counts = await fetchAssetClassCounts();
        setAssetClassCounts(counts);
      } catch (e) {
        console.error("Failed to load metadata", e);
      }
    })();
  }, []);

  const fetchData = async (currentOffset: number, append: boolean) => {
    setIsRefreshing(true);
    try {
      const res = await fetchAssetsPaginated({
        limit: 40,
        offset: currentOffset,
        searchQuery: debouncedSearchQuery,
        activeClass,
        activeSector,
        sortBy
      });
      if (append) {
        setAssets(prev => [...prev, ...res.assets]);
      } else {
        setAssets(res.assets);
      }
      setTotalCount(res.totalCount);
    } catch (e) {
      console.error("Failed to load assets", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setOffset(0);
    fetchData(0, false);
  }, [debouncedSearchQuery, activeClass, activeSector, sortBy]);

  const handleLoadMore = () => {
    const nextOffset = offset + 40;
    setOffset(nextOffset);
    fetchData(nextOffset, true);
  };

  const formatNumber = (num: number | undefined) => {
    if (!num || num === 0) return "—";
    if (num >= 1e12) return "$" + (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9)  return "$" + (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6)  return "$" + (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3)  return "$" + (num / 1e3).toFixed(2) + "K";
    return "$" + num.toFixed(2);
  };

  const toggleMetric = (id: string) => {
    setSelectedMetrics(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const availableSectors = ["All Sectors", "Technology", "Healthcare", "Financial Services", "Energy", "Industrials", "Consumer Cyclical", "Consumer Defensive", "Basic Materials", "Real Estate", "Utilities", "Communication Services"];

  const visibleAssets = assets;

  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, [assets.length]);

  const assetClasses = ["All", "Crypto", "Stock", "ETF", "REIT", "Commodity", "Bond", "Indian Stock", "International", "Forex", "Index"];
  const sortOptions = ["Market Cap", "Price", "Volume", "P/E", "Div Yield", "52W High", "Beta"];

  return (
    <div className="relative min-h-screen bg-black text-white font-sans selection:bg-emerald-500/30">

      {/* Global Backgrounds */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-b from-[#000000] to-[#050508]" />
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {typeof window !== 'undefined' && window.innerWidth > 768 && <DollarParticles />}
      </div>

      {/* Ticker Tape */}
      <div className="fixed top-0 left-0 w-full z-50">
        <TickerTape assets={tickerTapeAssets} />
      </div>

      {/* Hero */}
      <motion.div
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative w-full h-screen flex flex-col items-center justify-center pt-32 z-10"
      >
        <HeroParticles />
        <div className="relative z-10 flex flex-col items-center pointer-events-none">
          <h1 className="text-5xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-none bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent text-center mb-6">
            <AnimatedText text="THE MARKET." />
            <AnimatedText text="UNFILTERED." delayOffset={0.3} />
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-zinc-400 font-mono text-sm tracking-widest uppercase mb-12 md:mb-20 text-center px-4"
          >
            You&apos;re in the driver&apos;s seat. 51,000+ assets. Zero opinions.
          </motion.p>
          <div className="flex flex-col md:flex-row gap-8 md:gap-24 opacity-80">
            <AnimatedStat value={51861} label="Assets" />
            <AnimatedStat value={9} label="Asset Classes" />
            <AnimatedStat value={20} label="Data Points" suffix="+" />
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 text-zinc-500 pointer-events-none"
        >
          <span className="font-mono text-[10px] tracking-widest uppercase">Scroll to explore</span>
          <div className="w-[1px] h-12 bg-white/10 relative overflow-hidden">
            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: "100%" }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="absolute inset-0 bg-emerald-500"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Stats Section */}
      <StatsSection />

      {/* Dashboard */}
      <div className="relative z-20 max-w-[1600px] mx-auto px-4 md:px-8 py-24 min-h-screen bg-black/50 backdrop-blur-3xl border-t border-white/5">

        {/* Control Bar */}
        <div className="sticky top-10 z-50 mb-12 flex flex-col gap-4 p-4 bg-[#0a0a0c]/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col lg:flex-row gap-4">

            {/* Search */}
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-emerald-400 transition-colors" />
              <input
                type="text"
                placeholder={scanlineText}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono text-sm"
              />
            </div>

            {/* Asset Class Tabs */}
            <div className="flex gap-2 overflow-x-auto hide-scrollbar items-center pb-1 lg:pb-0">
              {assetClasses.map(cls => (
                <button
                  key={cls}
                  onClick={() => { setActiveClass(cls); setActiveSector("All Sectors"); }}
                  className={`relative px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all snap-start ${activeClass === cls ? "text-black" : "text-zinc-400 hover:text-white"}`}
                >
                  {activeClass === cls && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white rounded-full shadow-[0_0_30px_rgba(255,255,255,0.25)]"
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                  )}
                  <span className="relative z-10">{cls} {assetClassCounts[cls] ? `(${assetClassCounts[cls].toLocaleString()})` : ''}</span>
                </button>
              ))}
            </div>

            {/* Metrics + Sort */}
            <div className="flex gap-2">
              {/* Metrics Dropdown */}
              <div className="relative min-w-[130px]">
                <button
                  onClick={() => { setIsMetricsOpen(!isMetricsOpen); setIsSortOpen(false); }}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white/5 border border-white/5 hover:border-white/20 rounded-2xl transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-300">Metrics</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isMetricsOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {isMetricsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full mt-2 right-0 w-72 bg-[#111] border border-white/10 rounded-2xl shadow-2xl z-50 p-2 grid grid-cols-3 gap-1"
                    >
                      {AVAILABLE_METRICS.map(metric => {
                        const isSelected = selectedMetrics.includes(metric.id);
                        return (
                          <button
                            key={metric.id}
                            onClick={() => toggleMetric(metric.id)}
                            className={`flex items-center gap-1.5 px-2 py-2 rounded-xl text-[11px] font-medium transition-colors ${isSelected ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-white/5 text-zinc-400"}`}
                          >
                            <div className={`w-3 h-3 rounded flex items-center justify-center shrink-0 border transition-colors ${isSelected ? "border-emerald-500 bg-emerald-500/20" : "border-zinc-700"}`}>
                              {isSelected && <Check size={8} className="text-emerald-400" />}
                            </div>
                            {metric.label}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sort Dropdown */}
              <div className="relative min-w-[130px]">
                <button
                  onClick={() => { setIsSortOpen(!isSortOpen); setIsMetricsOpen(false); }}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white/5 border border-white/5 hover:border-white/20 rounded-2xl transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-300">{sortBy}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isSortOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {isSortOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full mt-2 right-0 w-48 bg-[#111] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                      {sortOptions.map(opt => (
                        <button
                          key={opt}
                          onClick={() => { setSortBy(opt); setIsSortOpen(false); }}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors ${sortBy === opt ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Sector Row — only when Stock tab active */}
          {activeClass === "Stock" && (
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {availableSectors.map(sector => (
                <button
                  key={sector}
                  onClick={() => setActiveSector(sector)}
                  className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                    activeSector === sector
                      ? "bg-white text-black font-medium"
                      : "bg-white/5 text-zinc-400 hover:bg-white/10"
                  }`}
                >
                  {sector}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="mb-6 flex items-center gap-3">
          <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
            {totalCount} assets
          </span>
          {searchQuery && (
            <span className="font-mono text-xs text-emerald-500">
              matching &quot;{searchQuery}&quot;
            </span>
          )}
        </div>

        {/* Asset Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
          {assets.length === 0 && isRefreshing ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-mono text-zinc-500 uppercase tracking-widest text-sm">Loading Market Data...</p>
            </div>
          ) : (
            <>
              {visibleAssets.map((asset, index) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  index={index}
                  selectedMetrics={selectedMetrics}
                  formatNumber={formatNumber}
                />
              ))}
              {assets.length < totalCount && (
                <div className="col-span-full flex justify-center pt-8">
                  <button
                    onClick={handleLoadMore}
                    className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl font-mono text-sm text-zinc-400 hover:border-emerald-500/50 hover:text-emerald-400 transition-all"
                  >
                    Load more — showing {assets.length} of {totalCount}
                  </button>
                </div>
              )}
            </>
          )}
          {assets.length === 0 && !isRefreshing && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-center opacity-50">
              <Search className="w-16 h-16 text-zinc-600 mb-6" />
              <p className="text-2xl font-light text-white tracking-tight">No assets found</p>
              <p className="text-zinc-500 mt-2 font-mono text-sm">Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-20 bg-[#020202] border-t border-white/10 pt-1 pb-8 px-8">
        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent mb-8" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-zinc-600 uppercase tracking-widest">
          <div className="font-bold text-white/50">Super Finance Hub</div>
          <div>Sources: Yahoo Finance · NSE · CoinGecko</div>
          <LiveClock />
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-ticker { animation: ticker 40s linear infinite; }
      `}} />
    </div>
  );
}
