import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getSupabaseUrl, getSupabaseServiceKey } from "@/lib/supabase-config";
import { normalizeAssetClass } from "@/lib/asset-utils";
import { ArrowLeft, User as UserIcon, Brain, TrendingUp } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_REGEX.test(id)) {
    return notFound();
  }

  const adminClient = createAdminClient(getSupabaseUrl(), getSupabaseServiceKey());

  // Fetch user picks + public leaderboard username in parallel (bypasses RLS safely for read-only public profile)
  const [{ data: picks, error }, { data: lbPicks }] = await Promise.all([
    adminClient
      .from('user_picks')
      .select('ticker, asset_class, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
    adminClient
      .from('leaderboard_picks')
      .select('username')
      .eq('user_id', id)
      .limit(1),
  ]);

  if (error || !picks || picks.length === 0) {
    return notFound();
  }

  const rawUsername = lbPicks?.[0]?.username;
  const username = rawUsername ? String(rawUsername).split('@')[0] : `Investor-${id.slice(0, 6)}`;

  // Simple LLM prompt mock for strategy (Groq API is typically called via client/API, but since we are server-side, we can just fetch from Groq here if we have GROQ_API_KEY)
  const groqApiKey = process.env.GROQ_API_KEY;
  let strategyAnalysis = "This investor diversifies across multiple asset classes focusing on long-term growth.";
  
  if (groqApiKey) {
    try {
      const prompt = `Analyze this user's portfolio and provide a 3-sentence investment strategy summary. Emphasize their key takeaways. Portfolio: ${picks.map(p => p.ticker).join(", ")}`;
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 150
        })
      });
      const groqData = await groqRes.json();
      if (groqData.choices && groqData.choices[0]) {
        strategyAnalysis = groqData.choices[0].message.content;
      }
    } catch (e) {
      console.error("Groq API Error:", e);
    }
  }

  return (
    <div className="pb-16">
      <Link href="/portfolio/leaderboard" className="text-zinc-500 hover:text-white flex items-center gap-2 mb-6 font-mono text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Leaderboard
      </Link>

      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 mb-8 flex flex-col lg:flex-row items-center gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none"></div>
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-zinc-800 flex flex-shrink-0 items-center justify-center border border-zinc-700">
          <UserIcon className="w-9 h-9 text-zinc-500" />
        </div>
        <div className="flex-1 min-w-0 text-center lg:text-left z-10 w-full">
          <h1 className="text-2xl sm:text-3xl font-black text-white break-words">{username}</h1>
          <p className="text-emerald-400 font-mono mt-1.5 text-sm">Elite Investor Profile</p>
        </div>
        <div className="z-10 flex gap-4 shrink-0">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3 text-center whitespace-nowrap">
            <div className="text-zinc-500 font-mono text-xs uppercase mb-1">Total Picks</div>
            <div className="text-2xl font-bold text-white">{picks.length}</div>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <Brain className="w-6 h-6 text-purple-400" /> AI Strategy Analysis
      </h2>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-12 shadow-inner">
        <p className="text-zinc-300 leading-relaxed font-mono">
          {strategyAnalysis}
        </p>
      </div>

      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <TrendingUp className="w-6 h-6 text-emerald-400" /> Current Holdings
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {picks.map((pick, i) => {
          const navClass = normalizeAssetClass(pick.asset_class);
          return (
            <Link
              key={`${pick.ticker}-${i}`}
              href={`/portfolio/explore/${encodeURIComponent(navClass)}/${encodeURIComponent(pick.ticker)}`}
              className="bg-zinc-950 border border-zinc-800 hover:border-emerald-500/40 rounded-xl p-4 transition-colors block"
            >
              <div className="font-bold text-white text-lg">{pick.ticker}</div>
              <div className="text-xs text-zinc-500 font-mono">{navClass}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
