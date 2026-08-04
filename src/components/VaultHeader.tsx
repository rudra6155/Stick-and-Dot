"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import { Crosshair, ChevronDown, Wallet, TrendingUp } from "lucide-react";
import PortfolioRing from "./PortfolioRing";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/* ─── Digit Roller Component ─────────────────────── */
function DigitRoller({ char, index }: { char: string; index: number }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const prevChar = useRef(char);
  const isDigit = /\d/.test(char);

  useEffect(() => {
    if (!innerRef.current || !isDigit) return;

    const digit = parseInt(char, 10);
    // Animate to the correct digit position
    gsap.to(innerRef.current, {
      y: -(digit * 1), // em units
      duration: 0.8 + index * 0.05,
      ease: "power3.out",
      delay: index * 0.04,
    });

    prevChar.current = char;
  }, [char, index, isDigit]);

  if (!isDigit) {
    // Static character (comma, period, etc.)
    return (
      <span className="inline-block opacity-40" style={{ animationDelay: `${index * 40}ms` }}>
        {char}
      </span>
    );
  }

  return (
    <span className="digit-roller">
      <div
        ref={innerRef}
        className="digit-roller-inner"
        style={{ transform: "translateY(-10em)" }} // Start from bottom (digit 10 doesn't exist, but that's the pre-animation state)
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
    </span>
  );
}

/* ─── Ambient Particles ──────────────────────────── */
function AmbientParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;
    const dots = containerRef.current.querySelectorAll(".ambient-dot");
    dots.forEach((dot, i) => {
      gsap.to(dot, {
        y: -40 - Math.random() * 30,
        x: (Math.random() - 0.5) * 60,
        opacity: 0,
        duration: 2 + Math.random() * 2,
        delay: Math.random() * 3,
        repeat: -1,
        ease: "power1.out",
      });
    });
  }, { scope: containerRef });

  // Use deterministic positions based on index, not Math.random() during render
  const positions = useMemo(() => {
    const golden = 0.618033988749895;
    return Array.from({ length: 12 }, (_, i) => ({
      left: `${((i * golden * 100) % 100).toFixed(1)}%`,
      top: `${((i * golden * 61.8) % 100).toFixed(1)}%`,
    }));
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {positions.map((pos, i) => (
        <div
          key={i}
          className="ambient-dot absolute w-1 h-1 rounded-full bg-emerald-400/40"
          style={{ left: pos.left, top: pos.top }}
        />
      ))}
    </div>
  );
}

/* ─── Main VaultHeader ───────────────────────────── */
type VaultHeaderProps = {
  totalValue: number;
  picksCount: number;
  picks: any[];
  hoveredValue?: number;
  hoveredClass?: string | null;
  onAlignClick: () => void;
  onRingHover?: (assetClass: string | null) => void;
  isAligning: boolean;
  hasPicks: boolean;
};

export default function VaultHeader({
  totalValue,
  picksCount,
  picks,
  hoveredValue = 0,
  hoveredClass = null,
  onAlignClick,
  onRingHover,
  isAligning,
  hasPicks,
}: VaultHeaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const formattedValue = totalValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const chars = formattedValue.split("");

  // Entrance animation
  useGSAP(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline({ delay: 0.2 });

    // Title slides in
    if (titleRef.current) {
      tl.fromTo(
        titleRef.current,
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
        0
      );
    }

    // Stats badges
    const badges = containerRef.current.querySelectorAll(".stat-badge");
    tl.fromTo(
      badges,
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, ease: "back.out(1.5)" },
      0.4
    );
  }, []);

  // Pulse of Value — glow reacts to hovered pick weight
  useGSAP(() => {
    if (hoveredValue > 0 && totalValue > 0 && glowRef.current) {
      const percent = hoveredValue / totalValue;
      const opacity = Math.min(0.08 + percent * 0.2, 0.3);

      gsap.to(glowRef.current, {
        opacity,
        scale: 1 + percent * 0.3,
        duration: 0.4,
        ease: "power2.out",
      });
    } else if (glowRef.current) {
      gsap.to(glowRef.current, {
        opacity: 0,
        scale: 1,
        duration: 0.6,
        ease: "power2.out",
      });
    }
  }, [hoveredValue, totalValue]);

  // Compute P&L indicator
  const pnlPositive = hoveredValue >= 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full z-40 py-8 px-4 md:px-0 overflow-hidden"
    >
      {/* Gradient Mesh Background */}
      <div className="absolute inset-0 gradient-mesh opacity-60 pointer-events-none" />
      
      {/* Glass panel */}
      <div className="relative glass-strong rounded-3xl p-6 md:p-8 max-w-7xl mx-auto noise overflow-hidden">
        {/* Glow Element */}
        <div
          ref={glowRef}
          className="absolute -inset-20 bg-emerald-500 rounded-full blur-[120px] pointer-events-none opacity-0"
          style={{ zIndex: 0 }}
        />

        <AmbientParticles />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          {/* Left: Value & Stats */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h1
              ref={titleRef}
              className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-widest mb-4"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-500" />
              Portfolio Vault
            </h1>

            {/* Value with Digit Roller */}
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-4xl md:text-6xl lg:text-7xl font-extralight text-zinc-500">
                $
              </span>
              <div className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white">
                {chars.map((char, i) => (
                  <DigitRoller key={`${i}-${char}`} char={char} index={i} />
                ))}
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="stat-badge flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-mono">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                <span className="text-zinc-400">
                  {picksCount} {picksCount === 1 ? "asset" : "assets"}
                </span>
              </div>

              {hoveredValue > 0 && totalValue > 0 && (
                <div className="stat-badge flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-mono animate-fade-up">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">
                    Hovering: {((hoveredValue / totalValue) * 100).toFixed(1)}%
                  </span>
                </div>
              )}

              {hasPicks && (
                <button
                  onClick={onAlignClick}
                  className="stat-badge flex items-center gap-2 px-4 py-1.5 rounded-full glass hover:bg-white/5 transition-all text-xs font-mono cursor-pointer group"
                >
                  <Crosshair className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-45 transition-transform duration-300" />
                  <span className="text-zinc-300 group-hover:text-white transition-colors">
                    {isAligning ? "Analyzing…" : "Scenario Align"}
                  </span>
                  <ChevronDown className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </button>
              )}
            </div>
          </div>

          {/* Right: Allocation Ring */}
          {hasPicks && (
            <div className="shrink-0 w-full lg:w-auto lg:max-w-[280px]">
              <PortfolioRing
                picks={picks}
                totalValue={totalValue}
                hoveredClass={hoveredClass}
                onSegmentHover={onRingHover}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
