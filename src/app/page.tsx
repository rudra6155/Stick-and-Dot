"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Search, ChevronDown, Activity, Filter, Settings2, Check } from "lucide-react";
import MagneticElement from "@/components/MagneticElement";
import { fetchAllAssets } from "./actions";

// Generate sparkline path
const generatePath = (data: number[], width: number, height: number) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = height * 0.15;
  const usableHeight = height - padding * 2;
  
  return data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = padding + usableHeight - ((val - min) / range) * usableHeight;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
};

const Sparkline = ({ data, isUp, width = 100, height = 40 }: { data: number[], isUp: boolean, width?: number, height?: number }) => {
  const color = isUp ? "#10b981" : "#f43f5e"; // emerald-500 or rose-500
  const path = generatePath(data, width, height);
  const filterId = `glow-${isUp ? 'up' : 'down'}`;

  return (
    <div style={{ width, height }} className="relative opacity-70 group-hover:opacity-100 transition-opacity duration-500">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Glow effect path */}
        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          filter={`url(#${filterId})`}
          className="opacity-40"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.4 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
        />
        
        {/* Main sharp path */}
        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
        />
      </svg>
    </div>
  );
};

const AVAILABLE_METRICS = [
  { id: "volume", label: "24h Volume" },
  { id: "marketCap", label: "Market Cap" },
  { id: "high52Week", label: "52w High" },
  { id: "low52Week", label: "52w Low" },
  { id: "peRatio", label: "P/E Ratio" },
  { id: "dividendYield", label: "Div Yield" },
  { id: "ma50Day", label: "50-day MA" },
  { id: "ma200Day", label: "200-day MA" },
  { id: "beta", label: "Beta" }
];

export default function SuperFinanceHub() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeClass, setActiveClass] = useState("All");
  const [sortBy, setSortBy] = useState("Name");
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  // Metrics Toggle State
  const [isMetricsOpen, setIsMetricsOpen] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["volume", "marketCap", "peRatio"]);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchAllAssets();
      setAssets(data);
    } catch (error) {
      console.error("Failed to load assets", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === 0) return "-";
    if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
    return num.toFixed(2);
  };

  const formatPrice = (num: number | undefined) => {
    if (num === undefined || num === 0) return "-";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  };
  
  const formatPercentage = (num: number | undefined) => {
    if (num === undefined || num === 0) return "-";
    return (num * 100).toFixed(2) + "%";
  }
  
  const formatMetric = (id: string, asset: any) => {
    switch(id) {
      case "volume": return formatNumber(asset.volume);
      case "marketCap": return formatNumber(asset.marketCap);
      case "high52Week": return formatPrice(asset.high52Week);
      case "low52Week": return formatPrice(asset.low52Week);
      case "peRatio": return asset.peRatio ? asset.peRatio.toFixed(2) : "-";
      case "dividendYield": return formatPercentage(asset.dividendYield);
      case "ma50Day": return formatPrice(asset.ma50Day);
      case "ma200Day": return formatPrice(asset.ma200Day);
      case "beta": return asset.beta ? asset.beta.toFixed(2) : "-";
      default: return "-";
    }
  }

  const toggleMetric = (id: string) => {
    setSelectedMetrics(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  }

  // Compute Derived Data
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            asset.symbol.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = activeClass === "All" || 
                          (activeClass === "Gold" && asset.assetClass === "Commodity") ||
                          asset.assetClass === activeClass;
      return matchesSearch && matchesClass;
    }).sort((a, b) => {
      if (sortBy === "Market Cap") return (b.marketCap || 0) - (a.marketCap || 0);
      if (sortBy === "Highest Volume") return (b.volume || 0) - (a.volume || 0);
      if (sortBy === "Top Gainers") return parseFloat(b.change) - parseFloat(a.change);
      // Default to Name
      return a.name.localeCompare(b.name);
    });
  }, [assets, searchQuery, activeClass, sortBy]);

  const assetClasses = ["All", "Crypto", "Gold", "ETF", "REIT"];
  const sortOptions = ["Name", "Market Cap", "Highest Volume", "Top Gainers"];

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden font-sans selection:bg-emerald-500/30">

      {/* Floating Money/Data Particles */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-20 pointer-events-none fixed">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-emerald-500/20"
            initial={{ y: "100vh", x: Math.random() * 100 + "vw", scale: Math.random() * 0.5 + 0.5 }}
            animate={{ y: "-10vh" }}
            transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: "linear" }}
          >
            <DollarSign size={48} />
          </motion.div>
        ))}
      </div>

      {/* Main Dashboard Layout */}
      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 pt-12 md:pt-24 pb-32">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold tracking-tighter bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent"
            >
              Super Finance Hub
            </motion.h1>
            <p className="text-zinc-500 mt-2 font-mono text-sm tracking-widest uppercase flex items-center gap-2">
              <Activity size={14} className="text-emerald-500" /> Aggregated Market Terminal
            </p>
          </div>
          
          <MagneticElement>
            <button 
              onClick={loadData}
              className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full backdrop-blur-md transition-all active:scale-95 cursor-none group"
            >
              <RefreshCw className={`w-4 h-4 text-zinc-400 group-hover:text-white transition-colors ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
              <span className="text-sm font-medium">Sync Data</span>
            </button>
          </MagneticElement>
        </div>

        {/* Control Panel (The Driver's Seat) */}
        <div className="sticky top-4 z-50 mb-12 flex flex-col lg:flex-row gap-4 p-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl">
          
          {/* Search Bar */}
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-emerald-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search tickers, assets..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-mono text-sm"
            />
          </div>

          {/* Asset Class Toggles */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar items-center pb-1 lg:pb-0">
            {assetClasses.map(cls => (
              <button
                key={cls}
                onClick={() => setActiveClass(cls)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${activeClass === cls ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]" : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5"}`}
              >
                {cls}
              </button>
            ))}
          </div>

          {/* Display Metrics Dropdown */}
          <div className="relative min-w-[180px]">
            <button 
              onClick={() => { setIsMetricsOpen(!isMetricsOpen); setIsSortOpen(false); }}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-black/40 border border-white/5 hover:border-white/20 rounded-2xl transition-all"
            >
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">Metrics: <span className="text-white">{selectedMetrics.length}</span></span>
              </div>
              <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isMetricsOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {isMetricsOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full mt-2 right-0 w-64 bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 p-2 grid grid-cols-2 gap-1"
                >
                  {AVAILABLE_METRICS.map(metric => {
                    const isSelected = selectedMetrics.includes(metric.id);
                    return (
                      <button
                        key={metric.id}
                        onClick={() => toggleMetric(metric.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${isSelected ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-white/5 text-zinc-400"}`}
                      >
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${isSelected ? "border-emerald-500 bg-emerald-500/20" : "border-zinc-700"}`}>
                          {isSelected && <Check size={10} className="text-emerald-400" />}
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
          <div className="relative min-w-[180px]">
            <button 
              onClick={() => { setIsSortOpen(!isSortOpen); setIsMetricsOpen(false); }}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-black/40 border border-white/5 hover:border-white/20 rounded-2xl transition-all"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-medium text-zinc-300">Sort: <span className="text-white">{sortBy}</span></span>
              </div>
              <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isSortOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {isSortOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full mt-2 w-full bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
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

        {/* Asset Cards Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredAssets.map((asset, index) => (
              <motion.div
                layout
                key={asset.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                className="group relative bg-gradient-to-b from-white/[0.08] to-transparent backdrop-blur-3xl border border-white/10 rounded-[32px] p-6 overflow-hidden hover:border-white/30 hover:shadow-[0_0_40px_rgba(16,185,129,0.1)] transition-all duration-500 cursor-none"
              >
                {/* Asset Header */}
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border border-white/20 bg-black/50 shadow-inner flex items-center justify-center font-bold text-xl text-white group-hover:scale-110 transition-transform duration-500">
                      {asset.symbol[0]}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold tracking-tight text-white/90 group-hover:text-white transition-colors">{asset.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-400 uppercase tracking-wider">{asset.assetClass}</span>
                        <p className="text-zinc-500 text-xs font-mono">{asset.symbol}/USD</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Live Pulse Indicator */}
                  <div className="flex items-center gap-2 px-2.5 py-1 bg-black/40 rounded-full border border-white/5">
                    <div className={`w-1.5 h-1.5 rounded-full ${asset.isUp ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-rose-500 shadow-[0_0_8px_#f43f5e]"} animate-pulse`} />
                    <span className="text-[10px] font-mono text-zinc-400">LIVE</span>
                  </div>
                </div>

                {/* Price & Metrics */}
                <div>
                  <div className="flex justify-between items-end mb-6 relative">
                    <div className="flex flex-col gap-1 z-10">
                      <span className="text-4xl font-light font-mono tracking-tighter">{formatPrice(asset.price)}</span>
                      <span className={`flex items-center gap-1 font-mono text-sm font-medium ${asset.isUp ? "text-emerald-400" : "text-rose-400"}`}>
                        {asset.isUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {asset.change}
                      </span>
                    </div>
                    
                    {/* 7-Day Sparkline Chart */}
                    <div className="absolute right-0 bottom-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <Sparkline data={asset.history} isUp={asset.isUp} width={120} height={40} />
                    </div>
                  </div>
                  
                  {/* Sub-data grid (Dynamic) */}
                  {selectedMetrics.length > 0 && (
                    <motion.div layout className="grid grid-cols-2 gap-4 pt-5 border-t border-white/10">
                      <AnimatePresence>
                        {AVAILABLE_METRICS.filter(m => selectedMetrics.includes(m.id)).map(metric => (
                          <motion.div 
                            layout
                            key={metric.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.2 }}
                          >
                            <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mb-1">{metric.label}</p>
                            <p className="font-mono text-sm text-zinc-300">{formatMetric(metric.id, asset)}</p>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty State */}
          {filteredAssets.length === 0 && !isRefreshing && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-50">
              <Search className="w-12 h-12 text-zinc-500 mb-4" />
              <p className="text-xl font-medium text-white">No assets found</p>
              <p className="text-zinc-400 mt-2">Try adjusting your search or filters.</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* CSS for hide-scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
}

