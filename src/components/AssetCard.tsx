"use client";
import React, { useRef } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useCountUp } from "@/hooks/useCountUp";
import { formatAssetClassBadge, getCurrencySymbol } from "@/lib/asset-utils";

const Sparkline = dynamic(() => import("@/components/Sparkline"), { ssr: false });

const classIcons: Record<string, string> = {
  Crypto: "◈",
  Stocks: "▸", Stock: "▸", "US Stock": "▸",
  ETF: "◎",
  REIT: "▣",
  Commodity: "◆",
  Bond: "≡",
  "Indian Stock": "₹",
  International: "⊕",
  Index: "◒",
  Forex: "¤"
};

const classColors: Record<string, string> = {
  Crypto: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  Stocks: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20", Stock: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20", "US Stock": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  ETF: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  REIT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Commodity: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Bond: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  "Indian Stock": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  International: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Index: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Forex: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Gold: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
};

export const AVAILABLE_METRICS = [
  { id: "marketCap",     label: "Market Cap" },
  { id: "peRatio",       label: "P/E Ratio" },
  { id: "forwardPe",     label: "Fwd P/E" },
  { id: "pegRatio",      label: "PEG Ratio" },
  { id: "priceToBook",   label: "P/B Ratio" },
  { id: "priceToSales",  label: "P/S Ratio" },
  { id: "evToEbitda",    label: "EV/EBITDA" },
  { id: "dividendYield", label: "Div Yield" },
  { id: "dividendRate",  label: "Div Rate" },
  { id: "payoutRatio",   label: "Payout Ratio" },
  { id: "earningsGrowth",label: "EPS Growth" },
  { id: "revenueGrowth", label: "Rev Growth" },
  { id: "profitMargins", label: "Net Margin" },
  { id: "grossMargins",  label: "Gross Margin" },
  { id: "operatingMargins", label: "Op Margin" },
  { id: "returnOnEquity",   label: "ROE" },
  { id: "returnOnAssets",   label: "ROA" },
  { id: "totalRevenue",  label: "Revenue" },
  { id: "ebitda",        label: "EBITDA" },
  { id: "totalDebt",     label: "Total Debt" },
  { id: "freeCashflow",  label: "Free CF" },
  { id: "high52Week",    label: "52W High" },
  { id: "low52Week",     label: "52W Low" },
  { id: "ma50Day",       label: "50D MA" },
  { id: "ma200Day",      label: "200D MA" },
  { id: "beta",          label: "Beta" },
  { id: "volume",        label: "Live Volume" },
  { id: "sector",        label: "Sector" },
  { id: "heldPercentInsiders",     label: "Insider %" },
  { id: "heldPercentInstitutions", label: "Institution %" },
  { id: "recommendationMean",      label: "Analyst Score" },
  { id: "targetMeanPrice",         label: "Price Target" },
  { id: "trailingEps",   label: "EPS" },
  { id: "forwardEps",    label: "Fwd EPS" },
  { id: "currency",      label: "Currency" },
];

const AnimatedPrice = ({ price, currency = 'USD', assetClass }: { price: number; currency?: string; assetClass?: string }) => {
  const displayPrice = useCountUp(price, 800);
  if (price == null || Number.isNaN(price)) return <>—</>;
  if (assetClass === 'Index') {
    return <>{new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(displayPrice || 0)}</>;
  }
  try {
    return <>{new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(displayPrice || 0)}</>;
  } catch {
    return <>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(displayPrice || 0)}</>;
  }
};

export const formatNumber = (num: number | undefined | null | string) => {
  if (num === null || num === undefined || num === "" || Number.isNaN(Number(num))) return "—";
  const val = Number(num);
  if (val === 0) return "—";
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (abs >= 1e12) return sign + "$" + (abs / 1e12).toFixed(2) + "T";
  if (abs >= 1e9)  return sign + "$" + (abs / 1e9).toFixed(2) + "B";
  if (abs >= 1e6)  return sign + "$" + (abs / 1e6).toFixed(2) + "M";
  if (abs >= 1e3)  return sign + "$" + (abs / 1e3).toFixed(2) + "K";
  return sign + "$" + abs.toFixed(2);
};

export const formatCount = (num: number | undefined | null | string) => {
  if (num === null || num === undefined || num === "" || Number.isNaN(Number(num))) return "—";
  const val = Number(num);
  if (val <= 0) return "—";
  if (val >= 1e9) return (val / 1e9).toFixed(2) + "B";
  if (val >= 1e6) return (val / 1e6).toFixed(2) + "M";
  if (val >= 1e3) return (val / 1e3).toFixed(1) + "K";
  return val.toLocaleString("en-US");
};

export const getMetric = (id: string, asset: any, customFormatNumber?: any) => {
  const formatter = customFormatNumber || formatNumber;
  const sym = getCurrencySymbol(asset.currency || asset.symbol, asset.assetClass);
  switch(id) {
    case "volume": return formatCount(asset.volume);
    case "avgVolume": return formatCount(asset.avgVolume);
    case "marketCap": return formatter(asset.marketCap);
    case "peRatio": return asset.peRatio != null && asset.peRatio !== 0 ? asset.peRatio.toFixed(2) : "—";
    case "forwardPe": return asset.forwardPe != null && asset.forwardPe !== 0 ? asset.forwardPe.toFixed(2) : "—";
    case "priceToBook": return asset.priceToBook != null ? asset.priceToBook.toFixed(2) : "—";
    case "priceToSales": return asset.priceToSales != null ? asset.priceToSales.toFixed(2) : "—";
    case "evToEbitda": return asset.evToEbitda != null ? asset.evToEbitda.toFixed(2) : "—";
    case "dividendYield": return asset.dividendYield != null ? `${Number(asset.dividendYield).toFixed(2)}%` : "—";
    case "earningsGrowth": return asset.earningsGrowth != null ? (asset.earningsGrowth * 100).toFixed(2) + "%" : "—";
    case "revenueGrowth": return asset.revenueGrowth != null ? (asset.revenueGrowth * 100).toFixed(2) + "%" : "—";
    case "profitMargins": return asset.profitMargins != null ? (asset.profitMargins * 100).toFixed(2) + "%" : "—";
    case "high52Week": return asset.high52Week != null && asset.high52Week > 0 ? sym + asset.high52Week.toFixed(2) : "—";
    case "low52Week": return asset.low52Week != null && asset.low52Week > 0 ? sym + asset.low52Week.toFixed(2) : "—";
    case "ma50Day": return asset.ma50Day != null && asset.ma50Day > 0 ? sym + asset.ma50Day.toFixed(2) : "—";
    case "ma200Day": return asset.ma200Day != null && asset.ma200Day > 0 ? sym + asset.ma200Day.toFixed(2) : "—";
    case "beta": return asset.beta != null ? asset.beta.toFixed(2) : "—";
    case "dayHigh": return asset.dayHigh != null && asset.dayHigh > 0 ? sym + asset.dayHigh.toFixed(2) : "—";
    case "dayLow": return asset.dayLow != null && asset.dayLow > 0 ? sym + asset.dayLow.toFixed(2) : "—";
    case "sector": return asset.sector || "—";
    case "previousClose": return asset.previousClose != null && asset.previousClose > 0 ? sym + asset.previousClose.toFixed(2) : "—";
    case "enterpriseValue": return formatter(asset.enterpriseValue);
    case "pegRatio": return asset.pegRatio != null ? asset.pegRatio.toFixed(2) : "—";
    case "dividendRate": return asset.dividendRate != null ? sym + asset.dividendRate.toFixed(2) : "—";
    case "payoutRatio": return asset.payoutRatio != null ? (asset.payoutRatio * 100).toFixed(2) + "%" : "—";
    case "grossMargins": return asset.grossMargins != null ? (asset.grossMargins * 100).toFixed(2) + "%" : "—";
    case "operatingMargins": return asset.operatingMargins != null ? (asset.operatingMargins * 100).toFixed(2) + "%" : "—";
    case "returnOnEquity": return asset.returnOnEquity != null ? (asset.returnOnEquity * 100).toFixed(2) + "%" : "—";
    case "returnOnAssets": return asset.returnOnAssets != null ? (asset.returnOnAssets * 100).toFixed(2) + "%" : "—";
    case "totalRevenue": return formatter(asset.totalRevenue);
    case "ebitda": return formatter(asset.ebitda);
    case "totalDebt": return formatter(asset.totalDebt);
    case "freeCashflow": return formatter(asset.freeCashflow);
    case "allTimeHigh": return asset.allTimeHigh != null && asset.allTimeHigh > 0 ? sym + asset.allTimeHigh.toFixed(2) : "—";
    case "allTimeLow": return asset.allTimeLow != null && asset.allTimeLow > 0 ? sym + asset.allTimeLow.toFixed(2) : "—";
    case "sharesOutstanding": return formatCount(asset.sharesOutstanding);
    case "heldPercentInsiders": return asset.heldPercentInsiders != null ? (asset.heldPercentInsiders * 100).toFixed(2) + "%" : "—";
    case "heldPercentInstitutions": return asset.heldPercentInstitutions != null ? (asset.heldPercentInstitutions * 100).toFixed(2) + "%" : "—";
    case "recommendationMean": return asset.recommendationMean != null && asset.recommendationMean > 0 ? asset.recommendationMean.toFixed(2) : "—";
    case "targetMeanPrice": return asset.targetMeanPrice != null && asset.targetMeanPrice > 0 ? sym + asset.targetMeanPrice.toFixed(2) : "—";
    case "trailingEps": return asset.trailingEps != null ? sym + asset.trailingEps.toFixed(2) : "—";
    case "forwardEps": return asset.forwardEps != null ? sym + asset.forwardEps.toFixed(2) : "—";
    case "currency": return asset.assetClass === 'Index' ? "PTS" : (asset.currency || "USD");
    default: return "—";
  }
};

function AssetCardComponent({ asset, index, selectedMetrics, formatNumber: propFormatNumber, hideHoverGlow, liveData }: any) {
  const cardRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const displayPrice = liveData?.price ?? asset.price;
  const displayIsUp = liveData?.isUp ?? asset.isUp;
  const displayChange = liveData?.change ?? asset.change;
  const isLive = !!liveData;

  const displayAsset = {
    ...asset,
    price: displayPrice,
    marketCap: (asset.marketCap && asset.marketCap > 0) ? asset.marketCap : (liveData?.marketCap ?? asset.marketCap),
    volume: (asset.volume && asset.volume > 0) ? asset.volume : (liveData?.volume ?? asset.volume),
    high52Week: (asset.high52Week && asset.high52Week > 0) ? asset.high52Week : (liveData?.high52Week ?? asset.high52Week),
    low52Week: (asset.low52Week && asset.low52Week > 0) ? asset.low52Week : (liveData?.low52Week ?? asset.low52Week),
    ma50Day: (asset.ma50Day && asset.ma50Day > 0) ? asset.ma50Day : (liveData?.ma50Day ?? asset.ma50Day),
    ma200Day: (asset.ma200Day && asset.ma200Day > 0) ? asset.ma200Day : (liveData?.ma200Day ?? asset.ma200Day),
  };

  const getMetricLocal = (id: string) => getMetric(id, displayAsset, propFormatNumber || formatNumber);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onMouseMove={(e) => {
        if (!rectRef.current || !glowRef.current) return;
        const x = e.clientX - rectRef.current.left;
        const y = e.clientY - rectRef.current.top;
        glowRef.current.style.setProperty('--glow-x', `${x}px`);
        glowRef.current.style.setProperty('--glow-y', `${y}px`);
      }}
      onMouseEnter={() => {
        if (cardRef.current) {
          rectRef.current = cardRef.current.getBoundingClientRect();
        }
      }}
      className="group relative bg-zinc-950/90 md:bg-white/[0.04] md:backdrop-blur-md border border-white/10 rounded-3xl p-5 sm:p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-[0_20px_60px_rgba(16,185,129,0.08)] will-change-transform"
    >
      <div
        ref={glowRef}
        className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-300 [@media(hover:hover)]:group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle 200px at var(--glow-x, 50%) var(--glow-y, 50%), rgba(16, 185, 129, 0.08), transparent)`
        }}
      />
      <div className="flex justify-between items-start gap-2 mb-5 relative z-10">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-base text-white shrink-0 group-hover:scale-110 transition-transform duration-500">
            {classIcons[asset.assetClass] || "◈"}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold tracking-tight text-white/90 truncate">{asset.name}</h2>
            <div className="text-zinc-400 text-xs font-mono truncate">
              {asset.assetClass === 'Index'
                ? `${asset.symbol} · PTS`
                : `${asset.symbol}${asset.currency && asset.currency !== "USD" ? "/" + asset.currency : "/USD"}`}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium font-mono uppercase tracking-wider whitespace-nowrap ${
            classColors[
              (asset as any).subClass === 'Indian'
                ? 'Indian Stock'
                : (asset as any).subClass === 'International'
                  ? 'International'
                  : asset.assetClass
            ] || classColors["Stocks"]
          }`}>
            {formatAssetClassBadge(asset.assetClass, asset.symbol, (asset as any).subClass)}
          </span>
          <div className="flex items-center gap-1 whitespace-nowrap">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${displayIsUp ? "bg-emerald-500" : "bg-rose-500"} ${isLive ? "animate-pulse" : ""}`} />
            <span suppressHydrationWarning className={`text-[10px] font-medium font-mono uppercase ${isLive ? "text-emerald-500" : "text-zinc-500"}`}>
              {isLive 
                ? (liveData?.quoteTime ? `LIVE · ${new Date(liveData.quoteTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : "LIVE")
                : asset.assetClass === 'Bond' 
                  ? "DAILY NAV" 
                  : asset.assetClass === 'Index' 
                    ? "BENCHMARK" 
                    : asset.fetchedAt 
                      ? `As of ${new Date(asset.fetchedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` 
                      : "Snapshot"
              }
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-end gap-2 mb-5 relative z-10">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-2xl sm:text-3xl font-light font-mono tracking-tighter text-white truncate">
            <AnimatedPrice price={displayPrice} currency={asset.currency} assetClass={asset.assetClass} />
          </span>
          {displayChange && displayChange !== "—" ? (
            <span className={`flex items-center gap-1 font-mono text-xs font-bold ${displayIsUp ? "text-emerald-400" : "text-rose-400"}`}>
              {displayIsUp ? '▲' : '▼'} {displayChange.replace('-', '')}
            </span>
          ) : (
            <span className="font-mono text-[11px] font-medium text-zinc-500 uppercase tracking-wider truncate">
              {formatAssetClassBadge(asset.assetClass, asset.symbol, (asset as any).subClass)}
            </span>
          )}
        </div>

        <div className="shrink-0 w-[86px] h-[34px] pointer-events-none transition-opacity duration-300 opacity-60 group-hover:opacity-100">
          <Sparkline data={asset.history || []} isUp={displayIsUp} width={86} height={34} />
        </div>
      </div>

      {(selectedMetrics || []).length > 0 && (
        <div className={`grid grid-cols-2 gap-y-4 gap-x-2 pt-4 border-t border-white/5 relative z-10`}>
          {selectedMetrics.map((metricId: string) => {
            const metric = AVAILABLE_METRICS.find(m => m.id === metricId);
            if (!metric) return null;
            return (
              <div key={metricId} className="flex flex-col">
                <p className="text-zinc-400 text-[10px] font-medium font-mono uppercase tracking-widest mb-1">{metric.label}</p>
                <p className="font-mono text-xs text-zinc-300 font-medium truncate">{getMetricLocal(metricId)}</p>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export const AssetCard = React.memo(AssetCardComponent);
