"use client";

import { useState, useEffect } from "react";

export default function ScreenerPage() {
  const [assetClass, setAssetClass] = useState("All");
  const [sector, setSector] = useState("All Sectors");
  const [sortBy, setSortBy] = useState("revenue_growth");
  const [sortDir, setSortDir] = useState("desc");
  const [minMarketCap, setMinMarketCap] = useState("");
  const [maxPe, setMaxPe] = useState("");
  const [minDiv, setMinDiv] = useState("");

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/screener", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asset_class: assetClass !== "All" ? assetClass : undefined,
          sector: sector !== "All Sectors" ? sector : undefined,
          sort_by: sortBy,
          sort_dir: sortDir,
          min_market_cap: minMarketCap ? Number(minMarketCap) * 1e9 : undefined,
          max_pe: maxPe ? Number(maxPe) : undefined,
          min_dividend_yield: minDiv ? Number(minDiv) / 100 : undefined,
        }),
      });
      const data = await res.json();
      if (data.results) setResults(data.results);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePreset = (preset: string) => {
    if (preset === "fintech") {
      setAssetClass("Stock");
      setSector("Financial Services");
      setSortBy("revenue_growth");
      setSortDir("desc");
      setMinMarketCap("");
      setMaxPe("");
      setMinDiv("");
    } else if (preset === "dividend") {
      setAssetClass("All");
      setSector("All Sectors");
      setSortBy("dividend_yield");
      setSortDir("desc");
      setMinMarketCap("");
      setMaxPe("");
      setMinDiv("3");
    } else if (preset === "undervalued") {
      setAssetClass("All");
      setSector("All Sectors");
      setSortBy("earnings_growth");
      setSortDir("desc");
      setMinMarketCap("");
      setMaxPe("20");
      setMinDiv("");
    }
    // Will need to click screen or add effect, we will just call fetch immediately after state updates 
    // by letting user click Screen for now, or just wrapping state updates and fetching.
    setTimeout(fetchResults, 0); 
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 pt-24 font-sans mt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Smart Screener</h1>
          <p className="text-emerald-500/80 mt-2">Filter 1000+ assets by any metric</p>
        </div>

        {/* Presets */}
        <div className="flex gap-4 mb-4">
          <button 
            onClick={() => handlePreset("fintech")}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm hover:border-emerald-500/50 transition-colors"
          >
            Best Fintech last 4 months
          </button>
          <button 
            onClick={() => handlePreset("dividend")}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm hover:border-emerald-500/50 transition-colors"
          >
            High Dividend Stocks
          </button>
          <button 
            onClick={() => handlePreset("undervalued")}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm hover:border-emerald-500/50 transition-colors"
          >
            Undervalued Growth
          </button>
        </div>

        {/* Filters Panel */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Asset Class</label>
            <select 
              value={assetClass} onChange={(e) => setAssetClass(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-zinc-100"
            >
              {["All", "Stock", "ETF", "REIT", "Crypto", "Commodity", "Bond", "Indian Stock", "International"].map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Sector</label>
            <select 
              value={sector} onChange={(e) => setSector(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-zinc-100"
            >
              {["All Sectors", "Technology", "Healthcare", "Financial Services", "Energy", "Industrials", "Consumer Cyclical", "Basic Materials"].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Sort By</label>
            <select 
              value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-zinc-100"
            >
              <option value="revenue_growth">Revenue Growth</option>
              <option value="earnings_growth">Earnings Growth</option>
              <option value="pe_ratio">P/E Ratio</option>
              <option value="dividend_yield">Dividend Yield</option>
              <option value="market_cap">Market Cap</option>
              <option value="return_on_equity">ROE</option>
              <option value="profit_margins">Profit Margins</option>
              <option value="beta">Beta</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Sort Direction</label>
            <select 
              value={sortDir} onChange={(e) => setSortDir(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-zinc-100"
            >
              <option value="desc">Best First (Desc)</option>
              <option value="asc">Worst First (Asc)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Min Market Cap ($B)</label>
            <input 
              type="number" value={minMarketCap} onChange={(e) => setMinMarketCap(e.target.value)}
              placeholder="e.g. 1"
              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-zinc-100 placeholder:text-zinc-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Max P/E</label>
            <input 
              type="number" value={maxPe} onChange={(e) => setMaxPe(e.target.value)}
              placeholder="e.g. 25"
              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-zinc-100 placeholder:text-zinc-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Min Dividend Yield (%)</label>
            <input 
              type="number" value={minDiv} onChange={(e) => setMinDiv(e.target.value)}
              placeholder="e.g. 3"
              className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-sm text-zinc-100 placeholder:text-zinc-600"
            />
          </div>

          <div className="space-y-2 flex items-end">
            <button 
              onClick={fetchResults}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded p-2 text-sm transition-colors"
            >
              {loading ? "Screening..." : "Screen"}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="p-4 font-medium">Rank</th>
                <th className="p-4 font-medium">Ticker</th>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Class / Sector</th>
                <th className="p-4 font-medium text-right">Price</th>
                <th className="p-4 font-medium text-right">Selected Metric</th>
                <th className="p-4 font-medium text-right">Market Cap</th>
                <th className="p-4 font-medium text-right">P/E</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {results.map((r, i) => (
                <tr key={r.ticker} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="p-4 text-zinc-500">#{i + 1}</td>
                  <td className="p-4 font-medium text-emerald-400">{r.ticker}</td>
                  <td className="p-4 text-zinc-300 truncate max-w-[200px]">{r.short_name}</td>
                  <td className="p-4 text-zinc-500">
                    {r.asset_class} <span className="text-zinc-700 mx-1">•</span> {r.sector || "-"}
                  </td>
                  <td className="p-4 text-right font-mono">${(r.price || 0).toFixed(2)}</td>
                  <td className="p-4 text-right font-mono text-emerald-400/90">
                    {r[sortBy] !== undefined && r[sortBy] !== null 
                      ? (typeof r[sortBy] === 'number' ? r[sortBy].toLocaleString(undefined, { maximumFractionDigits: 2 }) : r[sortBy]) 
                      : "-"}
                  </td>
                  <td className="p-4 text-right font-mono text-zinc-400">
                    {r.market_cap ? `$${(r.market_cap / 1e9).toFixed(1)}B` : "-"}
                  </td>
                  <td className="p-4 text-right font-mono text-zinc-400">
                    {r.pe_ratio ? r.pe_ratio.toFixed(1) : "-"}
                  </td>
                </tr>
              ))}
              {results.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-500">
                    No results found for these criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
