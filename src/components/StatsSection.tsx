"use client";
import React from 'react';
import { motion } from 'framer-motion';

export default function StatsSection({ assetClassCounts = {} }: { assetClassCounts?: Record<string, number> }) {
  return (
    <section className="relative z-10 py-32 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Panel 1 */}
      <div className="mb-24 flex flex-col items-center text-center">
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-3xl md:text-5xl font-light text-white/80 max-w-3xl leading-relaxed"
        >
          Most platforms filter your view.{" "}
          <span className="text-emerald-400 font-bold">We give you everything.</span>
        </motion.p>
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 }}
          className="w-32 h-[1px] bg-emerald-500/50 mt-8 origin-left"
        />
      </div>

      {/* Panel 2 — Asset Class Bar Chart */}
      <div className="mb-24">
        <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest mb-8 text-center">Asset Breakdown</p>
        <div className="flex flex-col gap-3 max-w-2xl mx-auto">
            { label: "Intl Stocks", count: assetClassCounts['International'] || 0, color: "bg-purple-500" },
            { label: "Crypto", count: assetClassCounts['Crypto'] || 0, color: "bg-violet-500" },
            { label: "US Stocks", count: assetClassCounts['Stock'] || 0, color: "bg-cyan-500" },
            { label: "India", count: assetClassCounts['Indian Stock'] || 0, color: "bg-orange-500" },
            { label: "ETFs", count: assetClassCounts['ETF'] || 0, color: "bg-blue-500" },
            { label: "Forex", count: assetClassCounts['Forex'] || 0, color: "bg-rose-500" },
            { label: "Commodities", count: assetClassCounts['Commodity'] || 0, color: "bg-yellow-500" },
            { label: "Indices", count: assetClassCounts['Index'] || 0, color: "bg-indigo-500" },
            { label: "REITs", count: assetClassCounts['REIT'] || 0, color: "bg-pink-500" },
            { label: "Bonds", count: assetClassCounts['Bond'] || 0, color: "bg-emerald-500" },
          ].map((item, i) => {
            const maxCount = Math.max(1, assetClassCounts['International'] || 1); // max bar based on biggest class
            return (
            <div key={item.label} className="flex items-center gap-4">
              <span className="font-mono text-xs text-zinc-500 w-24 text-right shrink-0">{item.label}</span>
              <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.max((item.count / maxCount) * 100, 1.5)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className={`h-full rounded-full ${item.color}`}
                />
              </div>
              <span className="font-mono text-xs text-zinc-400 w-8 shrink-0">{item.count}</span>
            </div>
          )})}
        </div>
      </div>

      {/* Panel 3 — Architecture */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2">
        {["Python Fetchers", "Supabase DB", "Next.js", "You"].map((node, i, arr) => (
          <React.Fragment key={node}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="px-4 py-2 border border-white/10 rounded-xl font-mono text-xs text-zinc-400 bg-white/5"
            >
              {node}
            </motion.div>
            {i < arr.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 + 0.1 }}
                className="text-zinc-600 font-mono text-lg hidden md:block"
              >
                →
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
