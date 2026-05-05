import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const generatePath = (data: number[], width: number, height: number) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = height * 0.15;
  const usableHeight = height - padding * 2;
  
  return data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = padding + usableHeight - ((val - min) / range) * usableHeight;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
};

const generateAreaPath = (data: number[], width: number, height: number) => {
  const path = generatePath(data, width, height);
  return `${path} L ${width} ${height} L 0 ${height} Z`;
};

export default function Sparkline({ data, isUp, width = 100, height = 40 }: { data: number[], isUp: boolean, width?: number, height?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "0px" });

  const color = isUp ? "#10b981" : "#f43f5e"; // emerald-500 or rose-500
  // Handle case where range is 0 or data is missing
  const safeData = data && data.length > 0 ? data : [0,0,0,0,0,0,0];
  const path = generatePath(safeData, width, height);
  const areaPath = generateAreaPath(safeData, width, height);
  const filterId = `glow-${isUp ? 'up' : 'down'}-${Math.random().toString(36).substring(2,9)}`;

  return (
    <div ref={ref} style={{ width, height }} className="relative opacity-60 group-hover:opacity-100 transition-opacity duration-500">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id={`area-${filterId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Area Fill */}
        {isInView && (
          <motion.path
            d={areaPath}
            fill={`url(#area-${filterId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.2 }}
          />
        )}
        
        {/* Glow effect path */}
        {isInView && (
          <motion.path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="2"
            filter={`url(#${filterId})`}
            className="opacity-40"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.4 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          />
        )}
        
        {/* Main sharp path */}
        {isInView && (
          <motion.path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          />
        )}
      </svg>
    </div>
  );
}
