import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";

export const revalidate = 0; // Dynamic rendering for latest data

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>;
}) {
  const { window = "daily" } = await searchParams;
  const supabase = await createClient();
  let error: string | null = null;

  // Determine time threshold
  const now = new Date();
  let threshold = new Date();
  
  if (window === "weekly") {
    threshold.setDate(now.getDate() - 7);
  } else if (window === "monthly") {
    threshold.setDate(now.getDate() - 30);
  } else {
    // Default: Daily
    threshold.setDate(now.getDate() - 1);
  }

  const thresholdIso = threshold.toISOString();

  // 1. Fetch picks within the time window
  const { data: picks, error: picksError } = await supabase
    .from('leaderboard_picks')
    .select('*')
    .gte('created_at', thresholdIso)
    .not('picked_at_price', 'is', null)
    .gt('picked_at_price', 0);

  if (picksError) {
    console.error("Error fetching leaderboard picks:", picksError);
    error = picksError.message || 'Something went wrong';
  }

  const validPicks = picks || [];

  // 2. Extract unique tickers to fetch current prices
  const tickers = Array.from(new Set(validPicks.map(p => p.ticker)));
  let currentPrices: Record<string, number> = {};

  if (tickers.length > 0) {
    const { data: assets, error: assetsError } = await supabase
      .from('asset_snapshots')
      .select('ticker, price')
      .in('ticker', tickers);
      
    if (assetsError) {
      console.error("Error fetching assets:", assetsError);
      error = assetsError.message || 'Something went wrong';
    } else if (assets) {
      assets.forEach(a => {
        currentPrices[a.ticker] = a.price;
      });
    }
  }

  // 3. Compute ROI per user
  const userStats: Record<string, { username: string, totalRoi: number, picksCount: number }> = {};

  validPicks.forEach(pick => {
    const currentPrice = currentPrices[pick.ticker];
    if (currentPrice !== undefined && currentPrice !== 0 && pick.picked_at_price) {
      const roi = ((currentPrice - pick.picked_at_price) / pick.picked_at_price) * 100;
      
      if (!userStats[pick.user_id]) {
        userStats[pick.user_id] = { username: pick.username || 'Anonymous', totalRoi: 0, picksCount: 0 };
      }
      
      userStats[pick.user_id].totalRoi += roi;
      userStats[pick.user_id].picksCount += 1;
    }
  });

  // 4. Rank users
  const rankedUsers = Object.values(userStats)
    .map(stat => ({
      username: stat.username,
      picksCount: stat.picksCount,
      avgRoi: stat.totalRoi / stat.picksCount
    }))
    .sort((a, b) => b.avgRoi - a.avgRoi);

  // Helper for tabs
  const TabLink = ({ id, label }: { id: string, label: string }) => {
    const isActive = window === id;
    return (
      <Link
        href={`/portfolio/leaderboard?window=${id}`}
        className={`px-6 py-2 rounded-full font-medium transition-all text-sm ${
          isActive 
            ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]" 
            : "bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-800 pb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Top Investors
          </h1>
          <p className="text-zinc-500 font-mono text-sm">
            Ranked by average ROI percentage across all active picks.
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex items-center gap-2 p-1 bg-zinc-950/50 border border-zinc-800 rounded-full">
          <TabLink id="daily" label="Daily" />
          <TabLink id="weekly" label="Weekly" />
          <TabLink id="monthly" label="Monthly" />
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        {error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="text-red-400 font-mono text-sm">{error || "Something went wrong loading this."}</div>
            <a href={`/portfolio/leaderboard?window=${window}`} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md text-sm text-white">Try again</a>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="grid grid-cols-12 gap-4 px-4 md:px-8 py-4 border-b border-zinc-800 bg-zinc-900/20 text-xs font-mono text-zinc-500 uppercase tracking-widest">
          <div className="col-span-2 sm:col-span-1">Rank</div>
          <div className="col-span-5 sm:col-span-7">Investor</div>
          <div className="col-span-2 text-right hidden sm:block">Picks</div>
          <div className="col-span-5 sm:col-span-2 text-right">Avg ROI</div>
        </div>

        <div className="divide-y divide-zinc-800/50">
          {rankedUsers.length === 0 ? (
            <div className="p-16 text-center text-zinc-500 flex flex-col items-center">
              <Trophy className="w-12 h-12 text-zinc-800 mb-4" />
              <p>No active picks in this time window.</p>
            </div>
          ) : (
            rankedUsers.map((user, idx) => {
              const isPositive = user.avgRoi >= 0;
              return (
                <div 
                  key={user.username + idx} 
                  className={`grid grid-cols-12 gap-4 px-4 md:px-8 py-6 items-center transition-colors hover:bg-zinc-900/30 ${
                    idx === 0 ? "bg-emerald-500/5" : ""
                  }`}
                >
                  <div className="col-span-2 sm:col-span-1 font-mono text-xl font-black text-zinc-500">
                    #{idx + 1}
                  </div>
                  <div className="col-span-5 sm:col-span-7 font-medium flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      idx === 0 ? 'bg-yellow-500 text-black' :
                      idx === 1 ? 'bg-zinc-300 text-black' :
                      idx === 2 ? 'bg-amber-700 text-white' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    {user.username}
                  </div>
                  <div className="col-span-2 text-right text-sm text-zinc-400 hidden sm:block">
                    {user.picksCount}
                  </div>
                  <div className={`col-span-5 sm:col-span-2 text-right font-mono font-bold flex items-center justify-end gap-2 ${
                    isPositive ? "text-emerald-400" : "text-rose-400"
                  }`}>
                    {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {isPositive ? '+' : ''}{user.avgRoi.toFixed(2)}%
                  </div>
                </div>
              );
            })
          )}
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
