"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const breakdownData = [
  { class: "Stock", count: 50, color: "#10b981" },
  { class: "ETF", count: 40, color: "#3b82f6" },
  { class: "REIT", count: 25, color: "#f59e0b" },
  { class: "Commodity", count: 25, color: "#eab308" },
  { class: "Bond", count: 20, color: "#64748b" },
  { class: "Indian Stock", count: 25, color: "#f97316" },
  { class: "International", count: 25, color: "#a855f7" },
  { class: "Crypto", count: 25, color: "#8b5cf6" },
];

export default function StatsSection() {
  const scrollRef = useRef(null);

  // Simple sticky horizontal scroll implementation
  return (
    <div className="relative h-[300vh] bg-black">
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="flex w-[300vw] h-full relative" id="stats-horizontal-scroll">
          
          {/* Panel 1: The Vision */}
          <PanelOne />

          {/* Panel 2: Asset Class Breakdown */}
          <PanelTwo />

          {/* Panel 3: The Architecture */}
          <PanelThree />

        </div>
      </div>
    </div>
  );
}

function PanelOne() {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "-20%" });

  return (
    <div ref={ref} className="w-[100vw] h-full flex flex-col justify-center items-center px-10 border-r border-white/5 relative">
      <div className="max-w-4xl text-center z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-8"
        >
          Most platforms filter your view.
        </motion.h2>
        <motion.h2 
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="text-6xl md:text-8xl font-black tracking-tighter text-emerald-500"
        >
          We give you everything.
        </motion.h2>
      </div>
      
      <motion.div 
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 1.5, ease: "circOut", delay: 0.4 }}
        className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent origin-left -z-1"
      />
    </div>
  );
}

function PanelTwo() {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "-20%" });

  return (
    <div ref={ref} className="w-[100vw] h-full flex flex-col justify-center items-start px-10 md:px-32 border-r border-white/5 relative">
      <h3 className="text-3xl font-bold tracking-tight text-white/50 mb-12 font-mono uppercase">Asset Class Breakdown</h3>
      <div className="w-full max-w-2xl flex flex-col gap-4">
        {breakdownData.map((item, i) => (
          <div key={item.class} className="flex items-center gap-4">
            <div className="w-32 text-right font-mono text-sm text-white/70 uppercase">{item.class}</div>
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.1 * i }}
                className="h-full origin-left"
                style={{ backgroundColor: item.color, width: `${(item.count / 50) * 100}%` }}
              />
            </div>
            <div className="w-8 font-mono text-xs text-white/50">{item.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PanelThree() {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "-20%" });

  const nodes = [
    { label: "Python Fetchers", desc: "yfinance & CoinGecko" },
    { label: "SQLite DB", desc: "Local Persistent Storage" },
    { label: "JSON Build", desc: "export_to_json.py" },
    { label: "Next.js 15", desc: "App Router & Server Actions" },
    { label: "You", desc: "The Driver's Seat" }
  ];

  return (
    <div ref={ref} className="w-[100vw] h-full flex flex-col justify-center items-center px-10 relative">
      <h3 className="text-3xl font-bold tracking-tight text-white/50 mb-20 font-mono uppercase">The Architecture</h3>
      
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 w-full max-w-5xl">
        {nodes.map((node, i) => (
          <div key={node.label} className="flex flex-col md:flex-row items-center relative z-10 group">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5, delay: i * 0.2 }}
              className="w-40 h-24 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center p-4 backdrop-blur-md group-hover:bg-white/10 transition-colors"
            >
              <div className="font-bold text-white text-sm text-center mb-1">{node.label}</div>
              <div className="text-[10px] text-zinc-500 font-mono text-center">{node.desc}</div>
            </motion.div>
            
            {i < nodes.length - 1 && (
              <div className="h-8 w-[1px] md:w-8 md:h-[1px] my-2 md:my-0 relative overflow-hidden">
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={isInView ? { x: "100%" } : { x: "-100%" }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear", delay: i * 0.2 }}
                  className="absolute inset-0 bg-gradient-to-r md:bg-gradient-to-b from-transparent via-emerald-500 to-transparent"
                />
                <div className="absolute inset-0 border-l border-t md:border-l-0 md:border-t border-dashed border-white/20" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
