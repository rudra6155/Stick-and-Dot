"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RefreshCw, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

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

  const assets = [
    { name: "Bitcoin", symbol: "BTC", price: "74,550.00", change: "+5.2%", isUp: true, volume: "39.9B", cap: "1.49T" },
    { name: "Ethereum", symbol: "ETH", price: "2,335.34", change: "-1.1%", isUp: false, volume: "17.4B", cap: "281.8B" },
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
      <div className="relative z-10 max-w-6xl mx-auto p-8 pt-24">
        
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

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assets.map((asset, index) => (
            <motion.div
              key={asset.symbol}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
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
                <div className="flex items-end gap-4 mb-6">
                  <span className="text-5xl font-mono tracking-tight">${asset.price}</span>
                  <span className={`flex items-center gap-1 font-mono text-lg mb-1 ${asset.isUp ? "text-emerald-400" : "text-rose-400"}`}>
                    {asset.isUp ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    {asset.change}
                  </span>
                </div>
                
                {/* Sub-data grid */}
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                  <div>
                    <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-1">24h Volume</p>
                    <p className="font-mono text-zinc-300">${asset.volume}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-1">Market Cap</p>
                    <p className="font-mono text-zinc-300">${asset.cap}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
      </div>
    </div>
  );
}
