"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { fetchAssetsPaginated, fetchAssetClassCounts } from "@/app/actions";
import { createClient } from "@/utils/supabase/client";
import { Search, Filter, ArrowUp, ArrowDown, ArrowLeft } from "lucide-react";
import { AssetCard } from "@/components/AssetCard";

type Asset = any;

const sortOptions = ["Market Cap", "Price", "Volume", "P/E", "Div Yield", "52W High", "Beta"];

export default function AssetClassPage({ params }: { params: Promise<{ class: string }> }) {
  const { class: encodedClass } = use(params);
  let assetClass = encodedClass;
  try {
    assetClass = decodeURIComponent(encodedClass);
  } catch (e) {}
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("Market Cap");
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [liveCount, setLiveCount] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [requestName, setRequestName] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [requestStatus, setRequestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const supabase = createClient();
  
  // Basic metrics for all cards on this page
  const selectedMetrics = ["marketCap", "volume", "peRatio", "dividendYield"];

  useEffect(() => {
    fetchAssetClassCounts().catch(() => ({})).then(counts => {
      setLiveCount(counts[assetClass] || 0);
    });
  }, [assetClass]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setAssets([]);
    setOffset(0);
    setTotalCount(null);
  }, [debouncedSearchQuery, sortBy, sortDir, assetClass]);

  useEffect(() => {
    let active = true;
    const loadAssets = async () => {
      setLoading(true);
      setError(null);
      try {
        const { assets: newAssets, totalCount: newTotal } = await fetchAssetsPaginated({
          limit: 40,
          offset,
          searchQuery: debouncedSearchQuery,
          activeClass: assetClass,
          activeSector: "All Sectors",
          sortBy,
          sortDir
        });
        if (active) {
          setAssets(prev => {
            if (offset === 0) return newAssets;
            // Deduplicate to avoid React key errors if StrictMode double-fetches
            const existing = new Set(prev.map((a: any) => a.symbol));
            const distinctNew = newAssets.filter((a: any) => !existing.has(a.symbol));
            return [...prev, ...distinctNew];
          });
          setTotalCount(newTotal);
        }
      } catch (err: any) {
        console.error("Failed to load assets", err);
        if (active) setError(err.message || 'Something went wrong');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadAssets();
    return () => { active = false; };
  }, [offset, debouncedSearchQuery, sortBy, sortDir, assetClass]);

  const toggleSortDir = () => {
    setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    setOffset(0);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestName.trim()) return;
    
    setRequestStatus('loading');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRequestStatus('error');
        return;
      }
      
      const { error } = await supabase.from('asset_requests').insert({
        user_id: user.id,
        requested_name: requestName,
        note: requestNote
      });
      
      if (error) throw error;
      setRequestStatus('success');
      setRequestName("");
      setRequestNote("");
      setTimeout(() => setRequestStatus('idle'), 5000);
    } catch (err) {
      console.error(err);
      setRequestStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans pt-24 pb-20">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/portfolio/explore" className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">{assetClass}</h1>
              <p className="text-sm font-mono text-zinc-500 mt-1 uppercase tracking-widest">
                {liveCount !== null ? liveCount.toLocaleString() : "..."} Assets
              </p>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="relative z-50 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-zinc-950/50 p-4 border border-zinc-800/50 rounded-2xl backdrop-blur-xl">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              aria-label="Search in this class"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in this class..." 
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Sort Dropdown */}
            <div className="relative shrink-0">
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                aria-expanded={isSortOpen}
                aria-label="Toggle sort menu"
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm hover:bg-zinc-800 transition-colors"
              >
                <Filter className="w-4 h-4 text-zinc-400" />
                <span className="hidden sm:inline text-zinc-400">Sort by:</span>
                <span className="font-medium text-emerald-400">{sortBy}</span>
              </button>
              
              {isSortOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-20">
                  {sortOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => {
                        setSortBy(opt);
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                        sortBy === opt ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Asc/Desc Toggle */}
            <button
              onClick={toggleSortDir}
              aria-label={sortDir === 'desc' ? "Sort Ascending" : "Sort Descending"}
              className="flex items-center justify-center p-2 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors text-emerald-400 shrink-0"
              title={sortDir === 'desc' ? "Descending" : "Ascending"}
            >
              {sortDir === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Results Info */}
        <div className="text-xs font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Showing {assets.length} of {totalCount ?? "..."}
          </div>
          {debouncedSearchQuery && (
            <div className="px-2 py-1 bg-zinc-900 rounded-md border border-zinc-800">
              Filtered: "{debouncedSearchQuery}"
            </div>
          )}
        </div>

        {/* Grid */}
        {error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="text-red-400 font-mono text-sm">{error || "Something went wrong loading this."}</div>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md text-sm text-white">Try again</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {assets.map(asset => (
              <Link key={asset.symbol} href={`/portfolio/explore/${encodeURIComponent(assetClass)}/${encodeURIComponent(asset.symbol)}`}>
                <AssetCard asset={asset} selectedMetrics={selectedMetrics} index={0} />
              </Link>
            ))}
          </div>
        )}

        {/* Load More */}
        {totalCount !== null && assets.length < totalCount && (
          <div className="flex justify-center pt-8">
            <button
              onClick={() => setOffset(prev => prev + 40)}
              disabled={loading}
              className="group relative px-8 py-3 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden transition-all hover:border-emerald-500/30 hover:bg-zinc-800 disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10 text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                {loading ? "Loading..." : "Load More"}
                {!loading && <ArrowDown className="w-4 h-4 text-emerald-500 group-hover:translate-y-1 transition-transform" />}
              </span>
            </button>
          </div>
        )}

        {/* Missing Asset Request Form */}
        <div className="mt-20 border-t border-zinc-800 pt-12 max-w-xl">
          <h3 className="text-xl font-bold mb-2">Can't find an asset?</h3>
          <p className="text-sm text-zinc-500 mb-6">Request it and we'll review it for addition.</p>
          
          <form onSubmit={handleRequestSubmit} className="space-y-4">
            <div>
              <input 
                id="requestName"
                aria-label="Asset Name or Ticker"
                type="text" 
                placeholder="Asset Name or Ticker" 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                value={requestName}
                onChange={e => setRequestName(e.target.value)}
                required
              />
            </div>
            <div>
              <textarea 
                id="requestNote"
                aria-label="Optional notes"
                placeholder="Optional notes (e.g. why we should add it)" 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none h-24"
                value={requestNote}
                onChange={e => setRequestNote(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <button 
                type="submit" 
                disabled={requestStatus === 'loading' || !requestName.trim()}
                className="px-6 py-2.5 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {requestStatus === 'loading' ? 'Submitting...' : 'Submit Request'}
              </button>
              
              {requestStatus === 'success' && (
                <span className="text-emerald-400 text-sm font-medium animate-in fade-in">
                  Request submitted, we'll review it soon.
                </span>
              )}
              {requestStatus === 'error' && (
                <span className="text-rose-400 text-sm font-medium animate-in fade-in">
                  Error submitting request. Please ensure you are logged in.
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
