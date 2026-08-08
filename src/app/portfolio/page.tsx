"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Crosshair, ChevronDown, Sparkles, ArrowRight, Vault } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { fetchAssetsByTickers } from "@/app/actions";
import { PickItem } from "@/components/PickItem";
import VaultHeader from "@/components/VaultHeader";
import PortfolioPerformance from "@/components/PortfolioPerformance";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import ScrollTrigger from "gsap/dist/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

/* ─── Empty State Component ─────────────────────── */
function EmptyVault() {
  const vaultRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!vaultRef.current) return;

    // Title entrance
    const title = vaultRef.current.querySelector(".vault-title");
    const subtitle = vaultRef.current.querySelector(".vault-subtitle");
    const cta = vaultRef.current.querySelector(".vault-cta");
    const icon = vaultRef.current.querySelector(".vault-icon");

    const tl = gsap.timeline({ delay: 0.3 });

    if (icon) {
      tl.fromTo(icon, { scale: 0, rotate: -180 }, { scale: 1, rotate: 0, duration: 1.2, ease: "elastic.out(1, 0.5)" }, 0);
    }
    if (title) {
      tl.fromTo(title, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }, 0.5);
    }
    if (subtitle) {
      tl.fromTo(subtitle, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }, 0.7);
    }
    if (cta) {
      tl.fromTo(cta, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }, 0.9);
    }
  }, { scope: vaultRef });

  // Floating particles (deterministic positions)
  const particles = Array.from({ length: 20 }, (_, i) => {
    const golden = 0.618033988749895;
    return {
      left: `${((i * golden * 100) % 100).toFixed(1)}%`,
      top: `${((i * golden * 61.8 + 20) % 100).toFixed(1)}%`,
      size: 1 + (i % 3),
      delay: i * 0.2,
    };
  });

  return (
    <div ref={vaultRef} className="relative min-h-[70vh] flex items-center justify-center">
      {/* Background particles */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-emerald-500/20"
            style={{ left: p.left, top: p.top, width: p.size, height: p.size }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 4 + (i % 3),
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 glass-card rounded-[2rem] p-12 md:p-16 text-center space-y-8 max-w-lg mx-4 noise overflow-hidden">
        {/* Gradient top edge */}
        <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

        {/* Vault Icon */}
        <div className="vault-icon mx-auto w-24 h-24 rounded-3xl glass flex items-center justify-center vault-door relative">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-transparent" />
          <Sparkles className="w-10 h-10 text-emerald-400 relative z-10" />
        </div>

        <div className="space-y-3">
          <h2 className="vault-title text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            The Vault Awaits
          </h2>
          <p className="vault-subtitle text-zinc-500 text-sm leading-relaxed max-w-sm mx-auto">
            Your portfolio is empty. Explore global markets, discover assets across every class, and start building your investment vault.
          </p>
        </div>

        <Link
          href="/portfolio/explore"
          className="vault-cta inline-flex items-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl transition-all duration-300 btn-glow group"
        >
          <span>Start Exploring</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* Bottom accent */}
        <div className="absolute bottom-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      </div>
    </div>
  );
}

/* ─── Main Portfolio Page ────────────────────────── */
export default function MyPortfolioPage() {
  const [picks, setPicks] = useState<any[]>([]);
  const [assets, setAssets] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showScenarioDropdown, setShowScenarioDropdown] = useState(false);
  const [alignmentData, setAlignmentData] = useState<any>(null);
  const [aligningScenario, setAligningScenario] = useState("");
  const [hoveredPickValue, setHoveredPickValue] = useState<number>(0);
  const [hoveredPickClass, setHoveredPickClass] = useState<string | null>(null);
  const [ringHoveredClass, setRingHoveredClass] = useState<string | null>(null);

  const alignmentRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const scenarios = [
    { id: "us_china_tension", label: "US-China Tensions", icon: "🌏" },
    { id: "inflation_high", label: "High Inflation", icon: "📈" },
    { id: "rate_hike", label: "Rate Hike Cycle", icon: "🏦" },
    { id: "recession_fear", label: "Recession Fears", icon: "📉" },
    { id: "ai_boom", label: "AI Boom", icon: "🤖" },
    { id: "india_growth", label: "India Growth Story", icon: "🇮🇳" },
  ];

  const supabase = createClient();

  const loadPortfolio = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: userPicks, error: picksError } = await supabase
        .from("user_picks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (picksError) throw picksError;

      setPicks(userPicks || []);

      if (userPicks && userPicks.length > 0) {
        const tickers = userPicks.map((p) => p.ticker);
        const assetList = await fetchAssetsByTickers(tickers);

        const assetMap: Record<string, any> = {};
        assetList.forEach((asset) => {
          assetMap[asset.symbol] = asset;
        });
        setAssets(assetMap);
      }
    } catch (err: any) {
      setError(
        err.message || "Failed to load portfolio. Make sure user_picks table exists."
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadPortfolio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowScenarioDropdown(false);
      }
    };
    if (showScenarioDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showScenarioDropdown]);

  const handleRemove = async (id: string) => {
    const removedPick = picks.find((p) => p.id === id);

    // Optimistic removal
    setPicks((prev) => prev.filter((p) => p.id !== id));

    try {
      const { error: deleteError } = await supabase.from("user_picks").delete().eq("id", id);
      if (deleteError) throw deleteError;
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to remove pick. Please try again.");
      if (removedPick) {
        setPicks((prev) =>
          [...prev, removedPick].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        );
      }
    }
  };

  const handleAlign = async (scenarioId: string) => {
    setAligningScenario(scenarioId);
    setShowScenarioDropdown(false);
    setAlignmentData(null);
    setError("");
    try {
      const userHoldings = Array.from(new Set(picks.map((p) => p.asset_class)));
      const res = await fetch("/api/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario_key: scenarioId, user_holdings: userHoldings }),
      });
      const data = await res.json();
      if (data.alignment) {
        setAlignmentData(data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setAligningScenario("");
    }
  };

  // GSAP entrance for alignment chips
  useGSAP(
    () => {
      if (alignmentData && alignmentRef.current) {
        const chips = alignmentRef.current.querySelectorAll(".scenario-chip");
        gsap.fromTo(
          chips,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.4,
            stagger: 0.05,
            ease: "back.out(1.5)",
          }
        );
      }
    },
    { dependencies: [alignmentData] }
  );

  const validPicks = picks.filter((p) => assets[p.ticker]);
  const totalValue = validPicks.reduce((acc, p) => acc + (assets[p.ticker]?.price || 0) * Number(p.quantity), 0);

  // Determine effective highlight class (from ring hover or card hover)
  const effectiveHighlightClass = ringHoveredClass || hoveredPickClass;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-emerald-400 font-mono text-xs tracking-[0.2em] uppercase">
          Opening Vault…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32">
      {/* ─── Vault Header ─────────────────────── */}
      <div className="relative" ref={dropdownRef}>
        <VaultHeader
          totalValue={totalValue}
          picksCount={validPicks.length}
          picks={validPicks}
          hoveredValue={hoveredPickValue}
          hoveredClass={effectiveHighlightClass}
          onAlignClick={() => setShowScenarioDropdown(!showScenarioDropdown)}
          onRingHover={(cls) => setRingHoveredClass(cls)}
          isAligning={!!aligningScenario}
          hasPicks={validPicks.length > 0}
        />

        {/* Scenario Dropdown */}
        <AnimatePresence>
          {showScenarioDropdown && validPicks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-4 top-full mt-2 w-72 glass-strong rounded-2xl shadow-2xl z-50 overflow-hidden noise"
            >
              <div className="p-2">
                <p className="px-3 py-2 text-[10px] font-mono text-zinc-500 uppercase tracking-[0.15em]">
                  Align portfolio with scenario
                </p>
                {scenarios.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleAlign(s.id)}
                    className="w-full text-left px-3 py-3 hover:bg-white/5 transition-colors text-sm font-medium rounded-xl flex items-center gap-3 group"
                  >
                    <span className="text-lg">{s.icon}</span>
                    <span className="text-zinc-300 group-hover:text-white transition-colors">
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Performance Strip ────────────────── */}
      {validPicks.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 md:px-0">
          <PortfolioPerformance picks={validPicks} assets={assets} totalValue={totalValue} />
        </div>
      )}

      {/* ─── Scenario Alignment Results ───────── */}
      <AnimatePresence>
        {alignmentData && alignmentData.alignment && (
          <motion.div
            ref={alignmentRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto px-4 md:px-0"
          >
            <div className="glass-card rounded-3xl p-8 noise relative overflow-hidden">
              {/* Top accent */}
              <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Crosshair className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {scenarios.find((s) => s.id === alignmentData.scenario)?.label}
                  </h3>
                  <p className="text-zinc-500 text-xs mt-0.5 font-mono">
                    {alignmentData.logic}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                {/* Well Aligned */}
                <div className="glass rounded-2xl p-5 border border-emerald-500/10">
                  <h4 className="text-emerald-400 font-mono text-[10px] tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Well Aligned
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {alignmentData.alignment.wellAligned.length === 0 && (
                      <span className="text-zinc-600 text-xs font-mono">None</span>
                    )}
                    {alignmentData.alignment.wellAligned.map((c: string) => (
                      <span
                        key={c}
                        className="scenario-chip px-3 py-1.5 bg-emerald-500/10 text-emerald-300 text-xs font-medium rounded-full border border-emerald-500/20"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Consider Adding */}
                <div className="glass rounded-2xl p-5 border border-yellow-500/10">
                  <h4 className="text-yellow-400 font-mono text-[10px] tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                    Consider Adding
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {alignmentData.alignment.considerAdding.length === 0 && (
                      <span className="text-zinc-600 text-xs font-mono">None</span>
                    )}
                    {alignmentData.alignment.considerAdding.map((c: string) => (
                      <Link
                        key={c}
                        href={`/portfolio/explore/${encodeURIComponent(c)}`}
                        className="scenario-chip px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-300 text-xs font-medium rounded-full border border-yellow-500/20 transition-colors cursor-pointer"
                      >
                        + {c}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Consider Reducing */}
                <div className="glass rounded-2xl p-5 border border-rose-500/10">
                  <h4 className="text-rose-400 font-mono text-[10px] tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Consider Reducing
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {alignmentData.alignment.considerReducing.length === 0 && (
                      <span className="text-zinc-600 text-xs font-mono">None</span>
                    )}
                    {alignmentData.alignment.considerReducing.map((c: string) => (
                      <span
                        key={c}
                        className="scenario-chip px-3 py-1.5 bg-rose-500/10 text-rose-300 text-xs font-medium rounded-full border border-rose-500/20"
                      >
                        − {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Error ────────────────────────────── */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 md:px-0">
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="text-red-400 font-mono text-sm">{error || "Something went wrong loading this."}</div>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md text-sm text-white">Try again</button>
          </div>
        </div>
      )}

      {/* ─── Picks Grid or Empty State ────────── */}
      {validPicks.length === 0 ? (
        <EmptyVault />
      ) : (
        <div className="max-w-7xl mx-auto px-4 md:px-0">
          {/* Section header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-5 bg-emerald-500 rounded-full" />
            <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em]">
              Your Assets
            </h2>
            <div className="flex-1 h-[1px] bg-white/5" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {validPicks.map((pick) => {
              const asset = assets[pick.ticker];
              if (!asset) return null;

              return (
                <PickItem
                  key={pick.id}
                  pick={pick}
                  asset={asset}
                  onRemove={handleRemove}
                  onHover={(val, cls) => {
                    setHoveredPickValue(val);
                    setHoveredPickClass(cls);
                  }}
                  onLeave={() => {
                    setHoveredPickValue(0);
                    setHoveredPickClass(null);
                  }}
                  highlightClass={ringHoveredClass}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
