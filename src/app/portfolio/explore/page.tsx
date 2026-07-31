import Link from "next/link";
import { fetchAssetClassCounts } from "@/app/actions";

export const metadata = {
  title: "Explore - Fin",
};

const classIcons: Record<string, string> = {
  Crypto: "◈",
  Stock: "▸",
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
  const assetClasses = ["Stock", "Crypto", "ETF", "REIT", "Commodity", "Bond", "Indian Stock", "International", "Forex", "Index"];

  return (
    <div className="bg-black text-white font-sans min-h-screen">
      <div className="pt-32 max-w-5xl mx-auto px-4 md:px-8 py-12 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight">Explore the Market</h1>
          <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">
            {counts["All"]?.toLocaleString() || "51,000+"} Assets Available
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
        <div>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-6 text-center">Browse by Asset Class</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {assetClasses.map(cls => (
              <Link 
                key={cls}
                href={`/explore/${encodeURIComponent(cls)}`}
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
