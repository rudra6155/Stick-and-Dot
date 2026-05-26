import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    asset_class,
    sector,
    max_pe,
    min_dividend_yield,
    min_revenue_growth,
    max_beta,
    min_roe,
    min_market_cap,
  } = body;

  // Step 1 — get matching assets from snapshots
  let query = supabase
    .from('asset_snapshots')
    .select('ticker, short_name, asset_class, sector, price, beta, market_cap, pe_ratio, revenue_growth, dividend_yield, return_on_equity')
    .limit(20);

  if (asset_class) query = query.eq('asset_class', asset_class);
  if (sector) query = query.eq('sector', sector);
  if (max_pe) query = query.lte('pe_ratio', max_pe).gt('pe_ratio', 0);
  if (min_dividend_yield) query = query.gte('dividend_yield', min_dividend_yield);
  if (min_revenue_growth) query = query.gte('revenue_growth', min_revenue_growth);
  if (max_beta) query = query.lte('beta', max_beta);
  if (min_roe) query = query.gte('return_on_equity', min_roe);
  if (min_market_cap) query = query.gte('market_cap', min_market_cap);

  const { data: assets, error: assetError } = await query;
  if (assetError) return NextResponse.json({ error: assetError }, { status: 500 });
  if (!assets || assets.length === 0) return NextResponse.json({ results: [] });

  const tickers = assets.map((a: any) => a.ticker);

  // Step 2 — get 6 months of price history for matching tickers
  const { data: history, error: histError } = await supabase
    .from('price_history')
    .select('ticker, date, close')
    .in('ticker', tickers)
    .order('date', { ascending: true });

  if (histError) return NextResponse.json({ error: histError }, { status: 500 });

  // Step 3 — compute performance per ticker
  const tickerHistory: Record<string, Array<{ date: string; close: number }>> = {};
  (history || []).forEach((row: any) => {
    if (!tickerHistory[row.ticker]) tickerHistory[row.ticker] = [];
    tickerHistory[row.ticker].push({ date: row.date, close: row.close });
  });

  const results = assets.map((asset: any) => {
    const hist = tickerHistory[asset.ticker] || [];
    if (hist.length < 2) return { ...asset, return_pct: null, chart: [] };

    const first = hist[0].close;
    const last = hist[hist.length - 1].close;
    const return_pct = ((last - first) / first) * 100;

    // Sample 12 points for sparkline
    const step = Math.floor(hist.length / 12);
    const chart = hist
      .filter((_: any, i: number) => i % (step || 1) === 0)
      .slice(0, 12)
      .map((h: any) => ({ date: h.date, close: h.close }));

    // Monthly breakdown
    const monthly: Record<string, number> = {};
    hist.forEach((h: any) => {
      const month = h.date.substring(0, 7);
      monthly[month] = h.close;
    });
    const months = Object.keys(monthly).sort();
    const monthly_returns = months.slice(1).map((m, i) => ({
      month: m,
      return_pct: ((monthly[m] - monthly[months[i]]) / monthly[months[i]]) * 100,
    }));

    return {
      ...asset,
      return_pct: parseFloat(return_pct.toFixed(2)),
      start_price: parseFloat(first.toFixed(2)),
      end_price: parseFloat(last.toFixed(2)),
      chart,
      monthly_returns,
    };
  });

  // Sort by return_pct descending
  results.sort((a: any, b: any) => (b.return_pct || -999) - (a.return_pct || -999));

  return NextResponse.json({ results, total: results.length });
}
