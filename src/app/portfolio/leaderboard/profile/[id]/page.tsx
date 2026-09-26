import { createClient } from "@/utils/supabase/server";
import { ArrowLeft, User as UserIcon, Brain, TrendingUp } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch user picks
  const { data: picks, error } = await supabase
    .from('user_picks')
    .select('*')
    .eq('user_id', id);

  if (error || !picks || picks.length === 0) {
    return notFound();
  }

  const username = picks[0].username || "Anonymous";

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
    <div className="pt-24 max-w-5xl mx-auto px-4 md:px-8 py-12">
      <Link href="/portfolio/leaderboard" className="text-zinc-500 hover:text-white flex items-center gap-2 mb-8 font-mono text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Leaderboard
      </Link>

      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 mb-8 flex flex-col md:flex-row items-center gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none"></div>
        <div className="w-24 h-24 rounded-full bg-zinc-800 flex flex-shrink-0 items-center justify-center border border-zinc-700">
          <UserIcon className="w-10 h-10 text-zinc-500" />
        </div>
        <div className="flex-1 text-center md:text-left z-10">
          <h1 className="text-4xl font-black text-white">{username}</h1>
          <p className="text-emerald-400 font-mono mt-2">Elite Investor Profile</p>
        </div>
        <div className="z-10 flex gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
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
        {picks.map((pick, i) => (
          <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
            <div className="font-bold text-white text-lg">{pick.ticker}</div>
            <div className="text-xs text-zinc-500 font-mono">{pick.asset_class}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
