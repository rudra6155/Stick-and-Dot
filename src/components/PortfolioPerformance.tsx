"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import { TrendingUp, TrendingDown, Activity, Shield, Zap, Target } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

type PerformanceProps = {
  picks: any[];
  assets: Record<string, any>;
  totalValue: number;
};

export default function PortfolioPerformance({ picks, assets, totalValue }: PerformanceProps) {
  const stripRef = useRef<HTMLDivElement>(null);

  // Calculate performance metrics
  const metrics = (() => {
    if (!picks || picks.length === 0) return null;

    let totalPnL = 0;
    let totalInvested = 0;
    let bestPick = { ticker: "—", pnl: -Infinity };
    let worstPick = { ticker: "—", pnl: Infinity };
    let totalBeta = 0;
    let betaCount = 0;
    const classSet = new Set<string>();

    picks.forEach((p) => {
      const asset = assets[p.ticker];
      if (!asset) return;

      const currentVal = (asset.price || 0) * Number(p.quantity);
      const investedVal = Number(p.amount);
      const pnl = currentVal - investedVal;
      totalPnL += pnl;
      totalInvested += investedVal;

      if (pnl > bestPick.pnl) bestPick = { ticker: p.ticker, pnl };
      if (pnl < worstPick.pnl) worstPick = { ticker: p.ticker, pnl };

      if (asset.beta && totalValue > 0) {
        totalBeta += asset.beta * (currentVal / totalValue);
        betaCount++;
      }

      classSet.add(p.asset_class || "Stock");
    });

    const pnlPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    return {
      totalPnL,
      pnlPct,
      bestPick: bestPick.ticker !== "—" ? bestPick : null,
      worstPick: worstPick.ticker !== "—" ? worstPick : null,
      portfolioBeta: betaCount > 0 ? totalBeta : null,
      diversification: classSet.size,
      assetCount: picks.length,
    };
  })();

  // GSAP entrance
  useGSAP(() => {
    if (!stripRef.current) return;
    const cards = stripRef.current.querySelectorAll(".perf-stat");
    gsap.fromTo(
      cards,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.08,
        ease: "back.out(1.2)",
        scrollTrigger: {
          trigger: stripRef.current,
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
      }
    );
  }, [metrics]);

  if (!metrics) return null;

  const isPositive = metrics.totalPnL >= 0;

  const stats = [
    {
      icon: isPositive ? TrendingUp : TrendingDown,
      label: "Total P&L",
      value: `${isPositive ? "+" : ""}$${Math.abs(metrics.totalPnL).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      sub: `${isPositive ? "+" : ""}${metrics.pnlPct.toFixed(2)}%`,
      color: isPositive ? "text-emerald-400" : "text-rose-400",
      glow: isPositive ? "rgba(16,185,129,0.15)" : "rgba(244,63,94,0.15)",
    },
    metrics.bestPick && {
      icon: Zap,
      label: "Best Performer",
      value: metrics.bestPick.ticker,
      sub: `+$${metrics.bestPick.pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      color: "text-emerald-400",
      glow: "rgba(16,185,129,0.1)",
    },
    metrics.worstPick && {
      icon: Activity,
      label: "Needs Attention",
      value: metrics.worstPick.ticker,
      sub: `$${metrics.worstPick.pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      color: "text-rose-400",
      glow: "rgba(244,63,94,0.1)",
    },
    metrics.portfolioBeta !== null && {
      icon: Shield,
      label: "Portfolio Beta",
      value: metrics.portfolioBeta.toFixed(2),
      sub: metrics.portfolioBeta > 1.2 ? "High Risk" : metrics.portfolioBeta < 0.8 ? "Conservative" : "Moderate",
      color: "text-blue-400",
      glow: "rgba(59,130,246,0.1)",
    },
    {
      icon: Target,
      label: "Diversification",
      value: `${metrics.diversification} Classes`,
      sub: `${metrics.assetCount} assets`,
      color: "text-violet-400",
      glow: "rgba(139,92,246,0.1)",
    },
  ].filter(Boolean);

  return (
    <div ref={stripRef} className="w-full overflow-x-auto hide-scrollbar">
      <div className="flex gap-3 min-w-max px-1 py-1">
        {stats.map((stat: any, i: number) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="perf-stat glass-card rounded-2xl px-5 py-4 flex items-center gap-3.5 min-w-[180px] relative overflow-hidden group hover:border-white/10 transition-all duration-300"
            >
              {/* Background glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 30% 50%, ${stat.glow}, transparent 70%)`,
                }}
              />

              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${stat.color} relative z-10`}
                style={{ background: stat.glow }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-0.5">
                  {stat.label}
                </p>
                <p className={`text-sm font-bold font-mono ${stat.color}`}>{stat.value}</p>
                {stat.sub && (
                  <p className="text-[10px] font-mono text-zinc-500 mt-0.5">{stat.sub}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
