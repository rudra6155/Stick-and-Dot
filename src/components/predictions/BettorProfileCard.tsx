"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Target, TrendingUp, TrendingDown, Swords, Star } from "lucide-react";

interface BettorProfileCardProps {
  name: string;
  rank: string; // e.g., "Grandmaster", "Oracle", "Novice"
  winRate: number; // percentage
  roi: number; // percentage
  totalBets: number;
  overallRating: number; // e.g., 94 like FIFA
  avatarUrl?: string;
}

export default function BettorProfileCard({
  name,
  rank,
  winRate,
  roi,
  totalBets,
  overallRating,
}: BettorProfileCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Calculate rotation (-15 to 15 degrees)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateXValue = ((y - centerY) / centerY) * -15;
    const rotateYValue = ((x - centerX) / centerX) * 15;

    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
    
    // Glare position percentage
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePosition({ x: 50, y: 50 });
  };

  // Determine card base theme based on rating
  const getCardTheme = () => {
    if (overallRating >= 90) return {
      bg: "from-amber-400 via-yellow-200 to-amber-600 border-amber-300 shadow-amber-500/20",
      text: "from-amber-400 via-yellow-200 to-amber-600",
      star: "text-amber-400"
    };
    if (overallRating >= 80) return {
      bg: "from-zinc-300 via-white to-zinc-400 border-zinc-200 shadow-white/20",
      text: "from-zinc-300 via-white to-zinc-400",
      star: "text-zinc-300"
    };
    return {
      bg: "from-orange-400 via-orange-300 to-amber-600 border-orange-300 shadow-orange-500/20",
      text: "from-orange-400 via-orange-300 to-amber-600",
      star: "text-orange-400"
    };
  };

  const theme = getCardTheme();

  return (
    <motion.div
      className="[perspective:1000px] group cursor-pointer"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`relative w-[280px] h-[400px] rounded-3xl border bg-gradient-to-br ${theme.bg} shadow-2xl overflow-hidden transition-all duration-100 ease-out mx-auto`}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Dynamic Glare Effect */}
        <div 
          className="absolute inset-0 z-50 pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)`,
            mixBlendMode: "overlay"
          }}
        />

        {/* Inner Card Background (Darker inset) */}
        <div className="absolute inset-1 rounded-[22px] bg-black/90 m-[1px] flex flex-col p-4 overflow-hidden">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          
          {/* Top Section: Rating & Position */}
          <div className="flex justify-between items-start z-10 relative">
            <div className="flex flex-col items-center">
              <span className={`text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b ${theme.text}`}>
                {overallRating}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">OVR</span>
            </div>
            
            <div className="flex flex-col items-end">
              <div className="p-1.5 rounded-full bg-zinc-800/50 backdrop-blur-sm border border-zinc-700">
                <Star className={`w-4 h-4 ${theme.star}`} fill="currentColor" />
              </div>
            </div>
          </div>

          {/* Avatar Area */}
          <div className="flex-1 flex flex-col items-center justify-center relative z-10 mt-2 mb-2">
            <div className="w-24 h-24 rounded-full border-2 border-zinc-800 p-1 relative overflow-hidden bg-zinc-900 shadow-inner">
               <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black rounded-full flex items-center justify-center">
                 <UserAvatarIcon />
               </div>
            </div>
            <h2 className="mt-3 text-lg font-black tracking-tight text-white uppercase">{name}</h2>
            <span className={`text-[10px] font-bold uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r ${theme.text}`}>
              {rank}
            </span>
          </div>

          {/* Divider */}
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-700 to-transparent my-2 z-10 relative" />

          {/* Stats Grid (Like FIFA PAC, SHO, PAS, DRI, DEF, PHY) */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 z-10 relative mt-2 mb-1 px-1">
            <StatRow label="WIN" value={`${winRate}%`} icon={<Trophy className="w-3 h-3 text-zinc-400" />} />
            <StatRow label="ROI" value={`${roi > 0 ? '+' : ''}${roi}%`} icon={roi >= 0 ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-rose-400" />} />
            <StatRow label="VOL" value={totalBets.toString()} icon={<Target className="w-3 h-3 text-zinc-400" />} />
            <StatRow label="BTL" value={(totalBets * (winRate/100)).toFixed(0)} icon={<Swords className="w-3 h-3 text-zinc-400" />} />
          </div>

          {/* Bottom badge */}
          <div className="mt-auto flex justify-center z-10 relative">
             <div className="h-1 w-12 rounded-full bg-zinc-800"></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatRow({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</span>
      </div>
      <span className="text-sm font-black text-white">{value}</span>
    </div>
  );
}

function UserAvatarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-zinc-600">
      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
