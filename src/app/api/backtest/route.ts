import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireEnv } from '@/lib/supabase';

const supabase = createClient(
  requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY')
);

// Upper bound on how many tickers a single request may process — each
// ticker fans out into its own concurrent price_history query below.
const MAX_TICKERS = 200;

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const {
    asset_class,
    sector,
    max_pe,
    min_dividend_yield,
    min_revenue_growth,
    max_beta,
    min_roe,
    min_market_cap,
    tickers: targetTickers,
  } = body;

  if (targetTickers !== undefined && !Array.isArray(targetTickers)) {
    return NextResponse.json({ error: 'tickers must be an array of strings' }, { status: 400 });
  }

  // Step 1 — get matching assets from snapshots
  let query = supabase
    .from('asset_snapshots')
    .select('ticker, short_name, asset_class, sector, price, beta, market_cap, pe_ratio, revenue_growth, dividend_yield, return_on_equity')
    .limit(200);

  const validTargetTickers = Array.isArray(targetTickers)
    ? targetTickers.filter((t: unknown): t is string => typeof t === 'string' && t.trim() !== '')
    : [];

  if (validTargetTickers.length > MAX_TICKERS) {
    return NextResponse.json({ error: `Too many tickers requested (max ${MAX_TICKERS})` }, { status: 400 });
  }

  if (validTargetTickers.length > 0) {
    query = query.in('ticker', validTargetTickers);
  } else {
    if (asset_class) query = query.eq('asset_class', asset_class);
    if (sector) query = query.eq('sector', sector);
    if (max_pe !== undefined) query = query.lte('pe_ratio', max_pe).gt('pe_ratio', 0);
    if (min_dividend_yield !== undefined) query = query.gte('dividend_yield', min_dividend_yield);
    if (min_revenue_growth !== undefined) query = query.gte('revenue_growth', min_revenue_growth);
    if (max_beta !== undefined) query = query.lte('beta', max_beta);
    if (min_roe !== undefined) query = query.gte('return_on_equity', min_roe);
    if (min_market_cap !== undefined) query = query.gte('market_cap', min_market_cap);
  }

  const { data: assets, error: assetError } = await query;
  if (assetError) return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  if (!assets || assets.length === 0) return NextResponse.json({ results: [] });

  const tickers = assets.map((a: any) => a.ticker);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const historyPromises = tickers.map((ticker: string) =>
    supabase
      .from('price_history')
      .select('ticker, date, close')
      .eq('ticker', ticker)
      .order('date', { ascending: false })
      .limit(200)
  );

  // Use allSettled (not Promise.all) so one rejected/errored query only
  // drops that ticker's history instead of crashing the whole endpoint.
  const historySettled = await Promise.allSettled(historyPromises);
  const history: any[] = [];
  historySettled.forEach((settled, i) => {
    const ticker = tickers[i];
    if (settled.status === 'rejected') {
      console.error(`api/backtest: price_history query rejected for ${ticker}:`, settled.reason);
      return;
    }
    const { data, error } = settled.value;
    if (error) {
      console.error(`api/backtest: price_history query error for ${ticker}:`, error);
      return;
    }
    if (data) history.push(...data);
  });

  // Step 3 — compute performance per ticker
  const tickerHistory: Record<string, Array<{ date: string; close: number }>> = {};
  history.reverse().forEach((row: any) => {
    if (!tickerHistory[row.ticker]) tickerHistory[row.ticker] = [];
    tickerHistory[row.ticker].push({ date: row.date, close: row.close });
  });

  const results = assets.map((asset: any) => {
    const hist = tickerHistory[asset.ticker] || [];
    if (hist.length < 2) return { ...asset, return_pct: null, chart: [] };

    const first = hist[0].close;
    const last = hist[hist.length - 1].close;
    const return_pct = (first != null && first !== 0) ? ((last - first) / first) * 100 : 0;

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
    const monthly_returns = months.slice(1).map((m, i) => {
      const prevClose = monthly[months[i]];
      return {
        month: m,
        return_pct: (prevClose != null && prevClose !== 0) ? ((monthly[m] - prevClose) / prevClose) * 100 : 0,
      };
    });

    return {
      ...asset,
      return_pct: parseFloat(return_pct.toFixed(2)),
      start_price: parseFloat((first ?? 0).toFixed(2)),
      end_price: parseFloat((last ?? 0).toFixed(2)),
      chart,
      monthly_returns,
    };
  });

  // Sort by return_pct descending. Use ?? (not ||) so a legitimate 0% return
  // isn't treated the same as "missing data" and sorted to the bottom.
  results.sort((a: any, b: any) => (b.return_pct ?? -999) - (a.return_pct ?? -999));

  return NextResponse.json({ results, total: results.length });
}
