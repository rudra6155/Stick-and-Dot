"use client";

import { useRef, useState, useMemo } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

import { formatAssetClassBadge } from "@/lib/asset-utils";

const CLASS_COLORS: Record<string, string> = {
  Crypto: "#8b5cf6",
  "Stocks · US": "#06b6d4",
  "Stocks · Indian": "#f97316",
  "Stocks · Intl": "#a855f7",
  Stocks: "#06b6d4",
  "US Stock": "#06b6d4",
  ETF: "#3b82f6",
  REIT: "#f59e0b",
  Commodity: "#eab308",
  Bond: "#64748b",
  "Indian Stock": "#f97316",
  International: "#a855f7",
  Forex: "#ec4899",
  Index: "#6366f1",
  Gold: "#eab308",
};

type Segment = {
  assetClass: string;
  value: number;
  percentage: number;
  color: string;
  startAngle: number;
  endAngle: number;
};

type PortfolioRingProps = {
  picks: any[];
  totalValue: number;
  hoveredClass?: string | null;
  onSegmentHover?: (assetClass: string | null) => void;
};

export default function PortfolioRing({
  picks,
  totalValue,
  hoveredClass,
  onSegmentHover,
}: PortfolioRingProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  // Build segments from picks normalized by total allocated amount so percentages sum to 100%
  const segments: (Segment & { displayPct: number })[] = useMemo(() => {
    if (!picks || picks.length === 0) return [];

    const classMap: Record<string, number> = {};
    picks.forEach((p) => {
      const cls = formatAssetClassBadge(p.asset_class, p.ticker);
      classMap[cls] = (classMap[cls] || 0) + Math.max(0, Number(p.amount) || 0);
    });

    const entries = Object.entries(classMap)
      .filter(([, val]) => val > 0)
      .sort((a, b) => b[1] - a[1]);
    const totalAllocated = entries.reduce((sum, [, val]) => sum + val, 0);
    if (totalAllocated <= 0) return [];

    // Largest Remainder Method so displayed integer percentages always sum cleanly to 100%
    const rawPcts = entries.map(([, val]) => (val / totalAllocated) * 100);
    const floored = rawPcts.map((p) => Math.floor(p));
    let remainder = 100 - floored.reduce((s, n) => s + n, 0);
    rawPcts
      .map((p, idx) => ({ idx, frac: p - floored[idx] }))
      .sort((a, b) => b.frac - a.frac)
      .slice(0, remainder)
      .forEach(({ idx }) => {
        floored[idx] += 1;
      });

    let currentAngle = -90; // Start from top

    return entries.map(([assetClass, value], idx) => {
      const percentage = value / totalAllocated;
      const sweepAngle = percentage * 360;
      const seg = {
        assetClass,
        value,
        percentage,
        displayPct: floored[idx],
        color: CLASS_COLORS[assetClass] || "#71717a",
        startAngle: currentAngle,
        endAngle: currentAngle + sweepAngle,
      };
      currentAngle += sweepAngle;
      return seg;
    });
  }, [picks]);

  // GSAP entrance animation
  useGSAP(
    () => {
      if (!svgRef.current || segments.length === 0) return;

      const paths = svgRef.current.querySelectorAll(".ring-segment");
      const circ = 2 * Math.PI * 45;
      gsap.fromTo(
        paths,
        {
          strokeDashoffset: (i: number) => {
            const seg = segments[i];
            return seg ? seg.percentage * circ : circ;
          },
        },
        {
          strokeDashoffset: 0,
          duration: 1.2,
          stagger: 0.08,
          ease: "power3.out",
          delay: 0.2,
        }
      );

      // Animate the center text
      const centerText = svgRef.current.querySelector(".center-value");
      if (centerText) {
        gsap.fromTo(
          centerText,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.8, delay: 0.5, ease: "back.out(1.5)" }
        );
      }
    },
    { scope: svgRef, dependencies: [segments] }
  );

  // Polar to cartesian helper
  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  // Create arc path for a segment
  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    // Clamp to prevent full circle issues
    const sweep = Math.min(endAngle - startAngle, 359.999);
    const end = startAngle + sweep;
    const start = polarToCartesian(cx, cy, r, end);
    const finish = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = sweep > 180 ? 1 : 0;

    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${finish.x} ${finish.y}`;
  };

  const radius = 45;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * radius; // ~283

  const effectiveHovered = hoveredClass || activeSegment;

  if (segments.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <svg viewBox="0 0 120 120" className="w-full h-full max-w-[200px] max-h-[200px]">
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="8"
          />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-zinc-600 text-[8px]"
            style={{ fontFamily: "monospace" }}
          >
            EMPTY
          </text>
        </svg>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center gap-4">
      <svg
        ref={svgRef}
        viewBox="0 0 120 120"
        className="w-full h-full max-w-[220px] max-h-[220px] drop-shadow-lg"
      >
        {/* Background ring */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth="10"
        />

        {/* Segments */}
        {segments.map((seg, i) => {
          const isHovered = effectiveHovered === seg.assetClass;
          const dashLength = seg.percentage * circumference;

          // Calculate rotation to position segment correctly
          let offset = -90;
          for (let j = 0; j < i; j++) {
            offset += segments[j].percentage * 360;
          }

          return (
            <circle
              key={seg.assetClass}
              className="ring-segment"
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={isHovered ? 12 : 8}
              strokeDasharray={`${dashLength} ${circumference}`}
              strokeDashoffset={dashLength} // Animated to 0 by GSAP
              strokeLinecap={segments.length === 1 ? "round" : "butt"}
              transform={`rotate(${offset} ${cx} ${cy})`}
              style={{
                transition: "stroke-width 0.3s ease, filter 0.3s ease, opacity 0.3s ease",
                filter: isHovered
                  ? `drop-shadow(0 0 8px ${seg.color})`
                  : "none",
                opacity: effectiveHovered && !isHovered ? 0.3 : 1,
                cursor: "pointer",
              }}
              onMouseEnter={() => {
                setActiveSegment(seg.assetClass);
                onSegmentHover?.(seg.assetClass);
              }}
              onMouseLeave={() => {
                setActiveSegment(null);
                onSegmentHover?.(null);
              }}
            />
          );
        })}

        {/* Center text */}
        <g className="center-value" style={{ opacity: 0 }}>
          <text
            x={cx}
            y={cy - 6}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-white text-[10px] font-bold"
            style={{ fontFamily: "var(--font-geist-mono), monospace" }}
          >
            ${totalValue >= 1000 ? `${(totalValue / 1000).toFixed(1)}K` : totalValue.toFixed(0)}
          </text>
          <text
            x={cx}
            y={cy + 8}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-zinc-500 text-[5px]"
            style={{ fontFamily: "var(--font-geist-mono), monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}
          >
            TOTAL
          </text>
        </g>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 max-w-[280px]">
        {segments.map((seg) => (
          <div
            key={seg.assetClass}
            className="flex items-center gap-1.5 cursor-pointer transition-opacity duration-300"
            style={{
              opacity: effectiveHovered && effectiveHovered !== seg.assetClass ? 0.3 : 1,
            }}
            onMouseEnter={() => {
              setActiveSegment(seg.assetClass);
              onSegmentHover?.(seg.assetClass);
            }}
            onMouseLeave={() => {
              setActiveSegment(null);
              onSegmentHover?.(null);
            }}
          >
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: seg.color, boxShadow: `0 0 6px ${seg.color}40` }}
            />
            <span className="text-[10px] font-mono text-zinc-400">
              {seg.assetClass} <span className="text-zinc-500">{seg.displayPct}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
