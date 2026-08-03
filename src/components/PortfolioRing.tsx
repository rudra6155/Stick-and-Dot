"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

const CLASS_COLORS: Record<string, string> = {
  Crypto: "#8b5cf6",
  Stock: "#06b6d4",
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

  // Build segments from picks
  const segments: Segment[] = useMemo(() => {
    if (!picks || picks.length === 0 || totalValue === 0) return [];

    const classMap: Record<string, number> = {};
    picks.forEach((p) => {
      const cls = p.asset_class || "Stock";
      classMap[cls] = (classMap[cls] || 0) + Number(p.amount);
    });

    const entries = Object.entries(classMap).sort((a, b) => b[1] - a[1]);
    let currentAngle = -90; // Start from top

    return entries.map(([assetClass, value]) => {
      const percentage = value / totalValue;
      const sweepAngle = percentage * 360;
      const seg: Segment = {
        assetClass,
        value,
        percentage,
        color: CLASS_COLORS[assetClass] || "#71717a",
        startAngle: currentAngle,
        endAngle: currentAngle + sweepAngle,
      };
      currentAngle += sweepAngle;
      return seg;
    });
  }, [picks, totalValue]);

  // GSAP entrance animation
  useGSAP(
    () => {
      if (!svgRef.current || segments.length === 0) return;

      const paths = svgRef.current.querySelectorAll(".ring-segment");
      gsap.fromTo(
        paths,
        { strokeDashoffset: 283 }, // circumference of r=45
        {
          strokeDashoffset: (i: number) => {
            const seg = segments[i];
            if (!seg) return 283;
            return 283 - seg.percentage * 283;
          },
          duration: 1.4,
          stagger: 0.08,
          ease: "power3.out",
          delay: 0.3,
        }
      );

      // Animate the center text
      const centerText = svgRef.current.querySelector(".center-value");
      if (centerText) {
        gsap.fromTo(
          centerText,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.8, delay: 0.6, ease: "back.out(1.5)" }
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
          const gap = circumference - dashLength;

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
              strokeDasharray={`${dashLength} ${gap}`}
              strokeDashoffset={circumference} // Will be animated by GSAP
              strokeLinecap="round"
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
              {seg.assetClass} <span className="text-zinc-600">{(seg.percentage * 100).toFixed(0)}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
