import Link from "next/link";
import { fetchAssetClassCounts } from "@/app/actions";

export const metadata = {
  title: "Explore - Fin",
};

const classIcons: Record<string, string> = {
  Crypto: "◈",
  Stocks: "▸",
  Stock: "▸",
  "US Stock": "▸",
  ETF: "◎",
  REIT: "▣",
  Commodity: "◆",
  Bond: "≡",
  "Indian Stock": "₹",
  International: "⊕",
  Index: "◒",
  Forex: "¤",
};

export default async function ExplorePage() {
  const counts = await fetchAssetClassCounts();
  const assetClasses = ["Crypto", "ETF", "REIT", "Commodity", "Bond", "Forex", "Index"];

  return (
    <div className="bg-black text-white font-sans min-h-screen">
      <div className="pt-32 max-w-5xl mx-auto px-4 md:px-8 py-12 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Explore the Market</h1>
          <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">
            {counts["All"]?.toLocaleString() || "..."} Assets Available
          </p>
        </div>

        {/* My Portfolio Button */}
        <div className="flex justify-center">
          <Link 
            href="/portfolio" 
            className="group relative inline-flex items-center justify-center px-8 py-4 bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden transition-all hover:border-emerald-500/50 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
                P
              </span>
              <span className="text-xl font-bold">My Portfolio</span>
            </span>
          </Link>
        </div>

        {/* Asset Class Grid */}
        <div className="space-y-4">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-6 text-center">Browse by Asset Class</p>

          {/* Featured Unified Stocks Card with 3 Regional Sub-Classes */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <Link
              href="/portfolio/explore/Stocks"
              className="flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl text-zinc-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all shrink-0">
                {classIcons["Stocks"]}
              </div>
              <div>
                <h3 className="font-bold text-base text-zinc-200 group-hover:text-white transition-colors">Stocks</h3>
                <p className="text-xs font-mono text-zinc-500 mt-0.5">
                  {counts["Stocks"]?.toLocaleString() || 0} Global Equities
                </p>
              </div>
            </Link>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 lg:max-w-2xl">
              {[
                { key: "US", label: "US", badge: "🇺🇸", countKey: "Stocks:US" },
                { key: "Indian", label: "Indian", badge: "🇮🇳", countKey: "Stocks:Indian" },
                { key: "International", label: "International", badge: "🌍", countKey: "Stocks:International" },
              ].map((sub) => (
                <Link
                  key={sub.key}
                  href={`/portfolio/explore/Stocks?sub=${encodeURIComponent(sub.key)}`}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between hover:bg-zinc-900 hover:border-emerald-500/40 transition-colors group"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-zinc-300 group-hover:text-white">
                    <span>{sub.badge}</span>
                    <span>{sub.label}</span>
                  </span>
                  <span className="text-xs font-mono text-zinc-500 group-hover:text-emerald-400">
                    {counts[sub.countKey]?.toLocaleString() || 0}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {assetClasses.map(cls => (
              <Link 
                key={cls}
                href={`/portfolio/explore/${encodeURIComponent(cls)}`}
                className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:bg-zinc-900 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl text-zinc-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-all">
                  {classIcons[cls] || "◈"}
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-sm text-zinc-300 group-hover:text-white transition-colors">{cls}</h3>
                  <p className="text-xs font-mono text-zinc-500 mt-1">
                    {counts[cls]?.toLocaleString() || 0}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
