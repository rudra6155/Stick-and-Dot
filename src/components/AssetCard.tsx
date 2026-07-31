import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useCountUp } from "@/hooks/useCountUp";

const Sparkline = dynamic(() => import("@/components/Sparkline"), { ssr: false });

import { useCursor } from "@/components/CustomCursor";

const classIcons: Record<string, string> = {
  Crypto: "◈",
  Stock: "▸",
  ETF: "◎",
  REIT: "▣",
  Commodity: "◆",
  Bond: "≡",
  "Indian Stock": "₹",
  International: "⊕"
};

const classColors: Record<string, string> = {
  Crypto: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  Stock: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  ETF: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  REIT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Commodity: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Bond: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  "Indian Stock": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  International: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Gold: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
};

const AVAILABLE_METRICS = [
  { id: "volume",        label: "Volume" },
  { id: "avgVolume",     label: "Avg Volume" },
  { id: "marketCap",     label: "Market Cap" },
  { id: "peRatio",       label: "P/E Ratio" },
  { id: "forwardPe",     label: "Fwd P/E" },
  { id: "priceToBook",   label: "P/B Ratio" },
  { id: "priceToSales",  label: "P/S Ratio" },
  { id: "evToEbitda",    label: "EV/EBITDA" },
  { id: "dividendYield", label: "Div Yield" },
  { id: "earningsGrowth",label: "EPS Growth" },
  { id: "revenueGrowth", label: "Rev Growth" },
  { id: "profitMargins", label: "Net Margin" },
  { id: "high52Week",    label: "52W High" },
  { id: "low52Week",     label: "52W Low" },
  { id: "ma50Day",       label: "50D MA" },
  { id: "ma200Day",      label: "200D MA" },
  { id: "beta",          label: "Beta" },
  { id: "dayHigh",       label: "Day High" },
  { id: "dayLow",        label: "Day Low" },
  { id: "sector",        label: "Sector" },
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

const AnimatedPrice = ({ price }: { price: number }) => {
  const displayPrice = useCountUp(price, 800);
  return <>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(displayPrice)}</>;
};

function AssetCardComponent({ asset, index, selectedMetrics, formatNumber: propFormatNumber }: any) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { setCursorState } = useCursor();

  const formatNumber = propFormatNumber || ((num: number | undefined) => {
    if (!num || num === 0) return "—";
    if (num >= 1e12) return "$" + (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9)  return "$" + (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6)  return "$" + (num / 1e6).toFixed(2) + "M";
    if (num >= 1e3)  return "$" + (num / 1e3).toFixed(2) + "K";
    return "$" + num.toFixed(2);
  });

  const getMetric = (id: string) => {
    switch(id) {
      case "volume": return formatNumber(asset.volume);
      case "avgVolume": return formatNumber(asset.avg_volume);
      case "marketCap": return formatNumber(asset.marketCap);
      case "peRatio": return asset.peRatio ? asset.peRatio.toFixed(2) : "—";
      case "forwardPe": return asset.forward_pe ? asset.forward_pe.toFixed(2) : "—";
      case "priceToBook": return asset.price_to_book ? asset.price_to_book.toFixed(2) : "—";
      case "priceToSales": return asset.price_to_sales ? asset.price_to_sales.toFixed(2) : "—";
      case "evToEbitda": return asset.ev_to_ebitda ? asset.ev_to_ebitda.toFixed(2) : "—";
      case "dividendYield": return asset.dividendYield ? (asset.dividendYield * 100).toFixed(2) + "%" : "—";
      case "earningsGrowth": return asset.earnings_growth ? (asset.earnings_growth * 100).toFixed(2) + "%" : "—";
      case "revenueGrowth": return asset.revenue_growth ? (asset.revenue_growth * 100).toFixed(2) + "%" : "—";
      case "profitMargins": return asset.profit_margins ? (asset.profit_margins * 100).toFixed(2) + "%" : "—";
      case "high52Week": return asset.high52Week ? "$" + asset.high52Week.toFixed(2) : "—";
      case "low52Week": return asset.low52Week ? "$" + asset.low52Week.toFixed(2) : "—";
      case "ma50Day": return asset.ma50Day ? "$" + asset.ma50Day.toFixed(2) : "—";
      case "ma200Day": return asset.ma200Day ? "$" + asset.ma200Day.toFixed(2) : "—";
      case "beta": return asset.beta ? asset.beta.toFixed(2) : "—";
      case "dayHigh": return asset.dayHigh ? "$" + asset.dayHigh.toFixed(2) : "—";
      case "dayLow": return asset.dayLow ? "$" + asset.dayLow.toFixed(2) : "—";
      case "sector": return asset.sector || "—";
      case "previousClose": return asset.previousClose ? "$" + asset.previousClose.toFixed(2) : "—";
      case "enterpriseValue": return formatNumber(asset.enterpriseValue);
      case "pegRatio": return asset.pegRatio ? asset.pegRatio.toFixed(2) : "—";
      case "dividendRate": return asset.dividendRate ? "$" + asset.dividendRate.toFixed(2) : "—";
      case "payoutRatio": return asset.payoutRatio ? (asset.payoutRatio * 100).toFixed(2) + "%" : "—";
      case "grossMargins": return asset.grossMargins ? (asset.grossMargins * 100).toFixed(2) + "%" : "—";
      case "operatingMargins": return asset.operatingMargins ? (asset.operatingMargins * 100).toFixed(2) + "%" : "—";
      case "returnOnEquity": return asset.returnOnEquity ? (asset.returnOnEquity * 100).toFixed(2) + "%" : "—";
      case "returnOnAssets": return asset.returnOnAssets ? (asset.returnOnAssets * 100).toFixed(2) + "%" : "—";
      case "totalRevenue": return formatNumber(asset.totalRevenue);
      case "ebitda": return formatNumber(asset.ebitda);
      case "totalDebt": return formatNumber(asset.totalDebt);
      case "freeCashflow": return formatNumber(asset.freeCashflow);
      case "allTimeHigh": return asset.allTimeHigh ? "$" + asset.allTimeHigh.toFixed(2) : "—";
      case "allTimeLow": return asset.allTimeLow ? "$" + asset.allTimeLow.toFixed(2) : "—";
      case "sharesOutstanding": return formatNumber(asset.sharesOutstanding);
      case "heldPercentInsiders": return asset.heldPercentInsiders ? (asset.heldPercentInsiders * 100).toFixed(2) + "%" : "—";
      case "heldPercentInstitutions": return asset.heldPercentInstitutions ? (asset.heldPercentInstitutions * 100).toFixed(2) + "%" : "—";
      case "recommendationMean": return asset.recommendationMean ? asset.recommendationMean.toFixed(2) : "—";
      case "targetMeanPrice": return asset.targetMeanPrice ? "$" + asset.targetMeanPrice.toFixed(2) : "—";
      case "trailingEps": return asset.trailingEps ? "$" + asset.trailingEps.toFixed(2) : "—";
      case "forwardEps": return asset.forwardEps ? "$" + asset.forwardEps.toFixed(2) : "—";
      case "currency": return asset.currency || "—";
      default: return "—";
    }
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onMouseMove={(e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseEnter={() => {
        setIsHovered(true);
        setCursorState(asset.isUp ? 'profit' : 'loss');
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        setCursorState('default');
      }}
      className="group relative bg-zinc-950/90 md:bg-white/[0.04] md:backdrop-blur-md border border-white/10 rounded-3xl p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-[0_20px_60px_rgba(16,185,129,0.08)] will-change-transform"
    >
      <div 
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle 200px at ${mousePosition.x}px ${mousePosition.y}px, rgba(16, 185, 129, 0.08), transparent)`
        }}
      />
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-lg text-white group-hover:scale-110 transition-transform duration-500">
            {classIcons[asset.assetClass] || "◈"}
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white/90 truncate max-w-[140px]">{asset.name}</h2>
            <div className="text-zinc-500 text-xs font-mono">{asset.symbol}/USD</div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono uppercase tracking-wider ${classColors[asset.assetClass] || classColors["Stock"]}`}>
            {asset.assetClass}
          </span>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${asset.isUp ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-rose-500 shadow-[0_0_8px_#f43f5e]"} animate-pulse`} />
            <span className="text-[9px] font-mono text-zinc-500 uppercase">Live</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end mb-6 relative z-10">
        <div className="flex flex-col gap-1">
          <span className="text-3xl font-light font-mono tracking-tighter text-white">
            <AnimatedPrice price={asset.price} />
          </span>
          <span className={`flex items-center gap-1 font-mono text-xs font-bold ${asset.isUp ? "text-emerald-400" : "text-rose-400"}`}>
            {asset.isUp ? '▲' : '▼'} {asset.change.replace('-','')}
          </span>
        </div>
        
        <div className="absolute right-0 bottom-2 pointer-events-none transition-opacity duration-300 opacity-60 group-hover:opacity-100">
          <Sparkline data={asset.history} isUp={asset.isUp} width={100} height={35} />
        </div>
      </div>

      {selectedMetrics.length > 0 && (
        <div className={`grid grid-cols-2 gap-y-4 gap-x-2 pt-4 border-t border-white/5 relative z-10`}>
          {selectedMetrics.map((metricId: string) => {
            const metric = AVAILABLE_METRICS.find(m => m.id === metricId);
            if (!metric) return null;
            return (
              <div key={metricId} className="flex flex-col">
                <p className="text-zinc-600 text-[9px] font-mono uppercase tracking-widest mb-1">{metric.label}</p>
                <p className="font-mono text-xs text-zinc-300 font-medium truncate">{getMetric(metricId)}</p>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export const AssetCard = React.memo(AssetCardComponent);
