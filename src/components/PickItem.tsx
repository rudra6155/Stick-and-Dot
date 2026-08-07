"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Trash2, ChevronDown, ExternalLink } from "lucide-react";
import { AssetCard } from "@/components/AssetCard";
import { AssetRiskPanel } from "@/components/AssetRiskPanel";
import { AssetBacktestPanel } from "@/components/AssetBacktestPanel";
import { AVAILABLE_METRICS, getMetric } from "@/components/AssetCard";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import dynamic from "next/dynamic";

const Sparkline = dynamic(() => import("@/components/Sparkline"), { ssr: false });

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const CLASS_COLORS: Record<string, { bg: string; text: string; glow: string; border: string }> = {
  Crypto: { bg: "rgba(139,92,246,0.08)", text: "text-violet-400", glow: "rgba(139,92,246,0.3)", border: "border-violet-500/20" },
  Stock: { bg: "rgba(6,182,212,0.08)", text: "text-cyan-400", glow: "rgba(6,182,212,0.3)", border: "border-cyan-500/20" },
  ETF: { bg: "rgba(59,130,246,0.08)", text: "text-blue-400", glow: "rgba(59,130,246,0.3)", border: "border-blue-500/20" },
  REIT: { bg: "rgba(245,158,11,0.08)", text: "text-amber-400", glow: "rgba(245,158,11,0.3)", border: "border-amber-500/20" },
  Commodity: { bg: "rgba(234,179,8,0.08)", text: "text-yellow-400", glow: "rgba(234,179,8,0.3)", border: "border-yellow-500/20" },
  Bond: { bg: "rgba(100,116,139,0.08)", text: "text-slate-400", glow: "rgba(100,116,139,0.3)", border: "border-slate-500/20" },
  "Indian Stock": { bg: "rgba(249,115,22,0.08)", text: "text-orange-400", glow: "rgba(249,115,22,0.3)", border: "border-orange-500/20" },
  International: { bg: "rgba(168,85,247,0.08)", text: "text-purple-400", glow: "rgba(168,85,247,0.3)", border: "border-purple-500/20" },
};

const getClassStyle = (cls: string) => CLASS_COLORS[cls] || CLASS_COLORS["Stock"];

export function PickItem({
  pick,
  asset,
  onRemove,
  onHover,
  onLeave,
  highlightClass,
}: {
  pick: any;
  asset: any;
  onRemove: (id: string) => void;
  onHover?: (val: number, cls: string) => void;
  onLeave?: () => void;
  highlightClass?: string | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [riskResult, setRiskResult] = useState<any>(null);
  const [backtestResult, setBacktestResult] = useState<any>(null);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const itemRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLSpanElement>(null);
  const pickAmount = Number(pick.amount);
  const pickClass = pick.asset_class || "Stock";
  const classStyle = getClassStyle(pickClass);

  // Dimming when ring segment is hovered and this card's class doesn't match
  const isDimmed = highlightClass !== null && highlightClass !== undefined && highlightClass !== pickClass;

  // GSAP Scroll-Driven entrance + value count-up
  useGSAP(() => {
    if (!itemRef.current) return;

    gsap.fromTo(
      itemRef.current,
      { y: 60, opacity: 0, scale: 0.96 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.9,
        ease: "power2.out",
        scrollTrigger: {
          trigger: itemRef.current,
          start: "top 92%",
          end: "top 60%",
          toggleActions: "play none none reverse",
        },
      }
    );

    // Value counts up synced to scroll
    if (amountRef.current) {
      const counter = { val: 0 };
      gsap.to(counter, {
        val: pickAmount,
        scrollTrigger: {
          trigger: itemRef.current,
          start: "top 90%",
          end: "center center",
          scrub: true,
        },
        onUpdate: () => {
          if (amountRef.current) {
            amountRef.current.innerText = counter.val.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
          }
        },
      });
    }
  }, [pickAmount]);

  // 3D Tilt Effect on mouse move
  const handleTiltMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!tiltRef.current || isExpanded) return;
      const rect = tiltRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -4;
      const rotateY = ((x - centerX) / centerX) * 4;

      tiltRef.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
    },
    [isExpanded]
  );

  const handleTiltLeave = useCallback(() => {
    if (!tiltRef.current) return;
    tiltRef.current.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  }, []);

  // Fetch expanded data
  useEffect(() => {
    if (isExpanded && (!riskResult || !backtestResult)) {
      setLoadingExtras(true);
      let active = true;

      const fetchExtras = async () => {
        try {
          const [riskRes, btRes] = await Promise.all([
            fetch("/api/risk-score", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ticker: asset.symbol }),
            }),
            fetch("/api/backtest", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ tickers: [asset.symbol] }),
            }),
          ]);

          const riskData = await riskRes.json();
          const btData = await btRes.json();

          if (active) {
            if (!riskData.error) setRiskResult(riskData);
            if (!btData.error) setBacktestResult(btData);
            setLoadingExtras(false);
          }
        } catch (e) {
          if (active) setLoadingExtras(false);
        }
      };

      fetchExtras();
      return () => { active = false; };
    }
  }, [isExpanded, asset.symbol, riskResult, backtestResult]);

  // Delete confirmation timer
  useEffect(() => {
    if (confirmDelete) {
      const timer = setTimeout(() => setConfirmDelete(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [confirmDelete]);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onRemove(pick.id);
    } else {
      setConfirmDelete(true);
    }
  };

  // P&L calculation
  const currentVal = (asset.price || 0) * Number(pick.quantity);
  const pnl = currentVal - pickAmount;
  const pnlPct = pickAmount > 0 ? (pnl / pickAmount) * 100 : 0;
  const isProfit = pnl >= 0;

  return (
    <div
      ref={itemRef}
      className={`relative group transition-all duration-500 ${
        isExpanded ? "col-span-1 lg:col-span-2" : ""
      } ${isDimmed ? "opacity-30 scale-[0.98]" : "opacity-100 scale-100"}`}
      onMouseEnter={() => onHover?.(pickAmount, pickClass)}
      onMouseLeave={() => {
        onLeave?.();
        handleTiltLeave();
      }}
      onMouseMove={handleTiltMove}
    >
      <div
        ref={tiltRef}
        className="glass-card rounded-3xl overflow-hidden relative noise"
        style={{
          transition: "transform 0.15s ease-out, box-shadow 0.3s ease",
          willChange: "transform",
        }}
      >
        {/* Top edge glow line */}
        <div
          className="absolute top-0 left-4 right-4 h-[1px] z-20"
          style={{
            background: `linear-gradient(90deg, transparent, ${classStyle.glow}, transparent)`,
          }}
        />

        {/* Summary Row */}
        <div
          className="flex flex-col sm:flex-row cursor-pointer relative z-10"
          onClick={() => {
            setIsExpanded(!isExpanded);
          }}
        >
          {/* Asset Info */}
          <div className="flex-1 p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Asset class icon with glow */}
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-bold ${classStyle.text} relative`}
                  style={{ background: classStyle.bg }}
                >
                  {asset.symbol?.charAt(0) || "?"}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ boxShadow: `0 0 20px ${classStyle.glow}` }}
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {asset.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono text-zinc-500">
                      {asset.symbol}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${classStyle.text} ${classStyle.border} border`}
                      style={{ background: classStyle.bg }}
                    >
                      {pickClass}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mini sparkline */}
              <div className="opacity-40 group-hover:opacity-80 transition-opacity duration-500 hidden sm:block w-20">
                <Sparkline
                  data={asset.history?.length > 0 ? asset.history : [0, 1, 0.5, 0.8, 0.3, 0.9, 0.7]}
                  isUp={isProfit}
                  height={28}
                />
              </div>
            </div>

            {/* Price & P&L */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-mono font-bold tracking-tight text-white">
                  ${(asset.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className={`flex items-center gap-1.5 mt-1 text-xs font-mono font-bold ${isProfit ? "text-emerald-400" : "text-rose-400"}`}>
                  <span>{isProfit ? "▲" : "▼"}</span>
                  <span>
                    {isProfit ? "+" : ""}
                    {pnlPct.toFixed(2)}%
                  </span>
                  <span className="text-zinc-600">
                    ({isProfit ? "+" : ""}${Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 2 })})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Investment Details */}
          <div className="p-5 sm:w-56 flex flex-col justify-center border-t sm:border-t-0 sm:border-l border-white/5 relative bg-white/[0.01]">
            <div className="space-y-3.5">
              <div>
                <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest mb-1">
                  Invested
                </p>
                <p className="font-mono font-bold text-base text-white">
                  $<span ref={amountRef}>0.00</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest mb-1">
                  Quantity
                </p>
                <p className="font-mono font-bold text-sm text-zinc-300">
                  {Number(pick.quantity).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest mb-1">
                  Strategy
                </p>
                <p className="text-xs text-zinc-400 font-medium">{pick.holding_period}</p>
              </div>
            </div>

            {/* Expand indicator */}
            <div className="absolute right-4 bottom-4 text-zinc-600 transition-all duration-300 group-hover:text-zinc-400">
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-500 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>
        </div>

        {/* Expanded Content with AnimatePresence */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              onAnimationComplete={() => ScrollTrigger.refresh()}
              className="overflow-hidden border-t border-white/5"
            >
              <div className="p-6 space-y-8 bg-black/20 relative z-10">
                {/* Full Metrics Grid */}
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 mb-4 font-mono flex items-center gap-2">
                    <div className="w-1 h-3 bg-emerald-500 rounded-full" />
                    Full Metrics
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {AVAILABLE_METRICS.map((metric) => (
                      <div
                        key={metric.id}
                        className="glass rounded-xl p-3 hover:bg-white/[0.03] transition-colors"
                      >
                        <p className="text-zinc-600 text-[9px] font-mono uppercase tracking-widest mb-1">
                          {metric.label}
                        </p>
                        <p className="font-mono text-xs text-zinc-300 font-medium truncate">
                          {getMetric(metric.id, asset)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Panels */}
                {loadingExtras && (!riskResult || !backtestResult) ? (
                  <div className="flex justify-center py-12">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-emerald-500 font-mono text-xs uppercase tracking-widest">
                        Loading Deep Analysis…
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {riskResult ? (
                      <AssetRiskPanel result={riskResult} />
                    ) : (
                      <div className="p-6 glass rounded-2xl flex items-center justify-center text-zinc-600 font-mono text-xs">
                        Risk analysis unavailable
                      </div>
                    )}
                    {backtestResult ? (
                      <AssetBacktestPanel result={backtestResult} />
                    ) : (
                      <div className="p-6 glass rounded-2xl flex items-center justify-center text-zinc-600 font-mono text-xs">
                        Backtest unavailable
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete button — with confirmation */}
        <button
          onClick={handleDeleteClick}
          className={`absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 ${
            confirmDelete
              ? "bg-rose-500 text-white opacity-100 scale-100"
              : "bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
          }`}
          title="Remove Pick"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {confirmDelete && <span className="text-xs font-mono font-bold">Confirm?</span>}
        </button>
      </div>
    </div>
  );
}
