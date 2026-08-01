"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import { Crosshair, ChevronDown } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

type VaultHeaderProps = {
  totalValue: number;
  picksCount: number;
  hoveredValue?: number;
  onAlignClick: () => void;
  isAligning: boolean;
  hasPicks: boolean;
};

export default function VaultHeader({
  totalValue,
  picksCount,
  hoveredValue = 0,
  onAlignClick,
  isAligning,
  hasPicks,
}: VaultHeaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  
  const formattedValue = totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const chars = formattedValue.split("");

  useGSAP(() => {
    // 1. Stagger digits on load
    if (valueRef.current) {
      const children = valueRef.current.children;
      gsap.fromTo(
        children,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.04, duration: 0.8, ease: "back.out(1.5)" }
      );
    }
  }, [totalValue]); // re-run stagger if total changes drastically

  useGSAP(() => {
    // 2. Pulse / shimmer effect on mount and value change
    if (particlesRef.current) {
      const particles = particlesRef.current.children;
      gsap.fromTo(
        particles,
        { scale: 0, opacity: 0.8 },
        {
          scale: 2,
          opacity: 0,
          duration: 1.5,
          stagger: 0.1,
          ease: "power2.out"
        }
      );
    }
  }, [totalValue]);

  useGSAP(() => {
    // Phase 4: Pinning the header
    if (containerRef.current) {
      const classesToAdd = ["backdrop-blur-xl", "bg-black/60", "border-b", "border-white/10"];
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        endTrigger: "body",
        end: "bottom bottom",
        onEnter: () => containerRef.current?.classList.add(...classesToAdd),
        onLeave: () => containerRef.current?.classList.remove(...classesToAdd),
        onEnterBack: () => containerRef.current?.classList.add(...classesToAdd),
        onLeaveBack: () => containerRef.current?.classList.remove(...classesToAdd)
      });
    }
  }, []);

  useGSAP(() => {
    // Phase 5: Pulse of Value
    if (hoveredValue > 0 && totalValue > 0 && glowRef.current) {
      const percent = hoveredValue / totalValue;
      // Scale glow based on percent weight
      const scale = 1 + percent * 0.5;
      const opacity = Math.min(0.1 + percent * 0.3, 0.4);
      
      gsap.to(glowRef.current, {
        scale,
        opacity,
        duration: 0.4,
        ease: "power2.out"
      });
    } else if (glowRef.current) {
      gsap.to(glowRef.current, {
        scale: 1,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out"
      });
    }
  }, [hoveredValue, totalValue]);

  return (
    <div ref={containerRef} className="w-full z-40 py-6 px-4 md:px-0 transition-colors duration-300">
      <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 max-w-7xl mx-auto">
        
        {/* Glow Element */}
        <div 
          ref={glowRef}
          className="absolute -inset-10 bg-emerald-500 rounded-full blur-[100px] pointer-events-none opacity-0 will-change-transform"
          style={{ zIndex: -1 }}
        />
        
        <div className="relative z-10">
          <h1 className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-2">My Portfolio Vault</h1>
          
          <div className="relative flex items-center">
            <span className="text-5xl md:text-7xl font-light text-zinc-400 mr-2">$</span>
            <div ref={valueRef} className="flex overflow-hidden pb-2 text-5xl md:text-7xl font-black tracking-tighter text-white">
              {chars.map((char, i) => (
                <span key={i} className="inline-block will-change-transform">
                  {char}
                </span>
              ))}
            </div>

            {/* Particle Shimmer */}
            <div ref={particlesRef} className="absolute inset-0 pointer-events-none overflow-visible">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-emerald-400 blur-sm"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`
                  }}
                />
              ))}
            </div>
          </div>
          
          <p className="text-zinc-500 font-mono text-xs mt-2">
            {picksCount} {picksCount === 1 ? 'asset' : 'assets'} tracked
            {hoveredValue > 0 && (
              <span className="text-emerald-400 ml-4 animate-in fade-in">
                (Hovering: {((hoveredValue / totalValue) * 100).toFixed(1)}%)
              </span>
            )}
          </p>
        </div>
        
        {hasPicks && (
          <div className="relative z-10">
            <button 
              onClick={onAlignClick}
              className="flex items-center gap-2 px-5 py-3 bg-zinc-900/80 hover:bg-zinc-800 backdrop-blur-md border border-zinc-700 rounded-xl font-medium transition-colors"
            >
              <Crosshair className="w-4 h-4 text-emerald-400" />
              {isAligning ? "Aligning..." : "Align with Scenario"}
              <ChevronDown className="w-4 h-4 text-zinc-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
