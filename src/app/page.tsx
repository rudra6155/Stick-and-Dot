"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

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

export default function SuperFinanceHub() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Track cursor for the Godly hover effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const assetGroups = [
    {
      title: "Cryptocurrency",
      assets: [
        { name: "Bitcoin", symbol: "BTC", price: "74,654.00", change: "+1.2%", isUp: true, volume: "40.3B", cap: "1.49T", history: [71000, 70500, 72000, 71800, 73500, 74000, 74654] },
        { name: "Ethereum", symbol: "ETH", price: "2,338.27", change: "-0.5%", isUp: false, volume: "17.6B", cap: "282.1B", history: [2400, 2450, 2420, 2390, 2350, 2340, 2338.27] },
      ]
    },
    {
      title: "Commodities",
      assets: [
        { name: "Gold", symbol: "GC=F", price: "4,564.30", change: "+0.1%", isUp: true, volume: "97.5K", cap: "-", history: [4500, 4520, 4510, 4540, 4530, 4550, 4564.30] },
      ]
    },
    {
      title: "ETFs",
      assets: [
        { name: "S&P 500 ETF", symbol: "SPY", price: "709.82", change: "+0.8%", isUp: true, volume: "15.7M", cap: "-", history: [700, 698, 702, 701, 705, 708, 709.82] },
        { name: "Invesco QQQ", symbol: "QQQ", price: "658.60", change: "+1.1%", isUp: true, volume: "14.8M", cap: "-", history: [640, 642, 648, 645, 650, 655, 658.60] },
      ]
    },
    {
      title: "Real Estate (REITs)",
      assets: [
        { name: "Vanguard Real Estate", symbol: "VNQ", price: "95.12", change: "-0.2%", isUp: false, volume: "1.29M", cap: "-", history: [97, 96.5, 96, 95.8, 95.5, 95.3, 95.12] },
        { name: "Schwab US REIT", symbol: "SCHH", price: "23.11", change: "-0.1%", isUp: false, volume: "3.61M", cap: "-", history: [23.5, 23.4, 23.6, 23.3, 23.2, 23.15, 23.11] },
      ]
    }
  ];

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden font-sans selection:bg-emerald-500/30">
      
      {/* Dynamic Cursor Spotlight */}
      <div
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.04), transparent 40%)`,
        }}
      />

      {/* Floating Money/Data Particles */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-20 pointer-events-none">
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
      <div className="relative z-10 max-w-6xl mx-auto p-8 pt-24 pb-32">
        
        {/* Header Section */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-bold tracking-tighter bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent"
            >
              Super Finance Hub
            </motion.h1>
            <p className="text-zinc-500 mt-2 font-mono text-sm tracking-widest uppercase">Aggregated Market Terminal</p>
          </div>
          
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full backdrop-blur-md transition-all active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-400 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
            <span className="text-sm font-medium">Sync Data</span>
          </button>
        </div>

        {/* Asset Groups Layout */}
        <div className="space-y-16">
          {assetGroups.map((group, groupIndex) => (
            <div key={group.title}>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: groupIndex * 0.1 }}
                className="mb-6 border-b border-white/10 pb-4"
              >
                <h2 className="text-2xl font-semibold tracking-tight text-white/90">{group.title}</h2>
              </motion.div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {group.assets.map((asset, index) => (
                  <motion.div
                    key={asset.symbol}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (groupIndex * 0.1) + (index * 0.1) }}
                    className="group relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 overflow-hidden hover:border-white/20 transition-all duration-500 hover:-translate-y-1"
                  >
                    {/* Asset Header */}
                    <div className="flex justify-between items-center mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center font-bold text-xl">
                          {asset.symbol[0]}
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold tracking-tight">{asset.name}</h2>
                          <p className="text-zinc-500 text-sm font-mono">{asset.symbol}/USD</p>
                        </div>
                      </div>
                      
                      {/* Live Pulse Indicator */}
                      <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                        <div className={`w-2 h-2 rounded-full ${asset.isUp ? "bg-emerald-500 shadow-[0_0_10px_#10b981]" : "bg-rose-500 shadow-[0_0_10px_#f43f5e]"} animate-pulse`} />
                        <span className="text-xs font-mono text-zinc-400">LIVE</span>
                      </div>
                    </div>

                    {/* Price & Metrics */}
                    <div>
                      <div className="flex justify-between items-end mb-6">
                        <div className="flex items-end gap-4">
                          <span className="text-5xl font-mono tracking-tight">${asset.price}</span>
                          <span className={`flex items-center gap-1 font-mono text-lg mb-1 ${asset.isUp ? "text-emerald-400" : "text-rose-400"}`}>
                            {asset.isUp ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                            {asset.change}
                          </span>
                        </div>
                        
                        {/* 7-Day Sparkline Chart */}
                        <Sparkline data={asset.history} isUp={asset.isUp} />
                      </div>
                      
                      {/* Sub-data grid */}
                      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                        <div>
                          <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-1">24h Volume</p>
                          <p className="font-mono text-zinc-300">{asset.volume === "-" ? "-" : `$${asset.volume}`}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-1">Market Cap</p>
                          <p className="font-mono text-zinc-300">{asset.cap === "-" ? "-" : `$${asset.cap}`}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
      </div>
    </div>
  );
}
