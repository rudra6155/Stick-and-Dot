"use client";
import { useState, useEffect, useRef } from "react";

const TOPICS = [
  { label: "All", value: "finance" },
  { label: "Crypto", value: "crypto" },
  { label: "Stocks", value: "stocks" },
  { label: "Gold", value: "gold" },
  { label: "Oil", value: "oil" },
  { label: "Bonds", value: "bonds" },
  { label: "India", value: "india" },
  { label: "Technology", value: "technology" },
];

const CLASS_COLORS: Record<string, string> = {
  Crypto: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Stock: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  Commodity: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  Bond: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Indian Stock": "bg-orange-500/15 text-orange-400 border-orange-500/30",
  REIT: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  ETF: "bg-pink-500/15 text-pink-400 border-pink-500/30",
};

function timeAgo(dateStr: string) {
  const time = new Date(dateStr).getTime();
  if (!dateStr || isNaN(time)) return "—";
  const diff = Date.now() - time;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NewsPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState("finance");
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchNews = async (topic: string) => {
    setLoading(true);
    setError(null);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
        signal: abortControllerRef.current.signal,
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (data.articles) setArticles(data.articles);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error(e);
        setError(e.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews("finance");
  }, []);

  const handleTopic = (value: string) => {
    setActiveTopic(value);
    fetchNews(value);
  };

  return (
    <div className="bg-black text-white font-sans">
      <div className="pt-24 max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-5xl font-black tracking-tight">Market News</h1>
          <p className="text-emerald-400 mt-2 font-mono text-sm uppercase tracking-widest">
            Stay aligned with world events
          </p>
        </div>

        {/* Topic Filter Buttons */}
        <div className="flex flex-wrap gap-3">
          {TOPICS.map((t) => (
            <button
              key={t.value}
              onClick={() => handleTopic(t.value)}
              className={`px-5 py-2 rounded-full text-sm font-medium border transition-all ${
                activeTopic === t.value
                  ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-400"
                  : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        {error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="text-red-400 font-mono text-sm">{error || "Something went wrong loading this."}</div>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md text-sm text-white">Try again</button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-3 animate-pulse"
              >
                <div className="h-4 bg-zinc-800 rounded w-3/4" />
                <div className="h-3 bg-zinc-800 rounded w-1/3" />
                <div className="h-3 bg-zinc-800 rounded w-full" />
                <div className="h-3 bg-zinc-800 rounded w-5/6" />
                <div className="flex gap-2 pt-2">
                  <div className="h-5 bg-zinc-800 rounded-full w-16" />
                  <div className="h-5 bg-zinc-800 rounded-full w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center text-zinc-500 py-24 font-mono">
            No articles found. Try a different topic.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.map((article, i) => (
              <div
                key={i}
                className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-3 hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  {/* Sentiment + Title */}
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1.5 flex-shrink-0 w-2.5 h-2.5 rounded-full ${
                        article.sentiment === "positive"
                          ? "bg-emerald-400"
                          : article.sentiment === "negative"
                          ? "bg-rose-400"
                          : "bg-zinc-500"
                      }`}
                    />
                    <h2 className="text-white font-bold text-base leading-snug line-clamp-2">
                      {article.title}
                    </h2>
                  </div>

                  {/* Source + Time */}
                  <div className="flex items-center gap-2 text-xs text-zinc-500 pl-5">
                    <span>{article.source?.name || "Unknown"}</span>
                    <span>·</span>
                    <span>{timeAgo(article.publishedAt)}</span>
                  </div>

                  {/* Description */}
                  {article.description && (
                    <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2 pl-5">
                      {article.description}
                    </p>
                  )}
                </div>

                {/* Footer: tags + read more */}
                <div className="flex items-center justify-between pt-2 pl-5">
                  <div className="flex flex-wrap gap-1.5">
                    {article.related_classes?.length > 0 ? (
                      article.related_classes.map((cls: string) => (
                        <span
                          key={cls}
                          className={`text-xs px-2.5 py-0.5 rounded-full border font-mono ${
                            CLASS_COLORS[cls] || "bg-zinc-800/50 text-zinc-400 border-zinc-700"
                          }`}
                        >
                          {cls}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs px-2.5 py-0.5 rounded-full border bg-zinc-800/50 text-zinc-500 border-zinc-700 font-mono">
                        General
                      </span>
                    )}
                  </div>

                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-mono transition-colors flex-shrink-0 ml-4"
                  >
                    Read more →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
