export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseServiceKey } from '@/lib/supabase-config';

const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseServiceKey()
);

// Upper bound on how many tickers a single request may process
const MAX_TICKERS = 40;

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
    .order('market_cap', { ascending: false, nullsFirst: false })
    .limit(MAX_TICKERS);

  const validTargetTickers = Array.isArray(targetTickers)
    ? targetTickers.filter((t: unknown): t is string => typeof t === 'string' && t.trim() !== '')
    : [];

  if (validTargetTickers.length > MAX_TICKERS) {
    return NextResponse.json({ error: `Too many tickers requested (max ${MAX_TICKERS})` }, { status: 400 });
  }

  if (validTargetTickers.length > 0) {
    query = query.in('ticker', validTargetTickers);
  } else {
    if (asset_class) {
      if (asset_class === 'Stock') {
        query = query.in('asset_class', ['US Stock', 'Stock', 'Equity']);
      } else {
        query = query.eq('asset_class', asset_class);
      }
    }
    if (sector) query = query.eq('sector', sector);
    if (max_pe !== undefined && Number.isFinite(Number(max_pe))) query = query.lte('pe_ratio', Number(max_pe)).gt('pe_ratio', 0);
    if (min_dividend_yield !== undefined && Number.isFinite(Number(min_dividend_yield))) query = query.gte('dividend_yield', Number(min_dividend_yield));
    if (min_revenue_growth !== undefined && Number.isFinite(Number(min_revenue_growth))) query = query.gte('revenue_growth', Number(min_revenue_growth));
    if (max_beta !== undefined && Number.isFinite(Number(max_beta))) query = query.lte('beta', Number(max_beta));
    if (min_roe !== undefined && Number.isFinite(Number(min_roe))) query = query.gte('return_on_equity', Number(min_roe));
    if (min_market_cap !== undefined && Number.isFinite(Number(min_market_cap))) query = query.gte('market_cap', Number(min_market_cap));
  }

  const { data: rawAssets, error: assetError } = await query;
  if (assetError) {
    console.error('api/backtest: asset_snapshots query error:', assetError);
    return NextResponse.json({ error: 'Internal server error: ' + assetError.message }, { status: 500 });
  }
  if (!rawAssets || rawAssets.length === 0) return NextResponse.json({ results: [] });

  // Deduplicate by ticker
  const seenTickers = new Set<string>();
  const assets: any[] = [];
  for (const a of rawAssets) {
    if (!seenTickers.has(a.ticker)) {
      seenTickers.add(a.ticker);
      assets.push(a);
    }
  }

  const tickers = assets.map((a: any) => a.ticker);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];

  // Fetch history for filtered tickers within the 6-month window
  const { data: allHistory, error: histError } = await supabase
    .from('price_history')
    .select('ticker, date, close')
    .in('ticker', tickers)
    .gte('date', sixMonthsAgoStr)
    .order('date', { ascending: false });

  if (histError) {
    console.error(`api/backtest: price_history batch query error:`, histError);
    // Continue with empty history instead of crashing the endpoint
  }

  // Group the flat results by ticker and sort oldest-first
  const tickerHistory: Record<string, Array<{ date: string; close: number }>> = {};
  tickers.forEach((t: string) => tickerHistory[t] = []);
  
  (allHistory || []).forEach(row => {
    if (tickerHistory[row.ticker]) {
      tickerHistory[row.ticker].push(row);
    }
  });
  
  // The DB query returned newest-first (descending). We need oldest-first for sparklines.
  Object.keys(tickerHistory).forEach(t => {
    tickerHistory[t].reverse();
    if (tickerHistory[t].length > 200) {
      tickerHistory[t] = tickerHistory[t].slice(-200);
    }
  });

  const results = assets.map((asset: any) => {
    const hist = tickerHistory[asset.ticker] || [];
    if (hist.length < 2) return { ...asset, return_pct: null, chart: [] };

    const first = hist[0].close;
    const last = hist[hist.length - 1].close;
    let return_pct = 0;
    if (first != null && first > 0 && last != null) {
      return_pct = ((last - first) / first) * 100;
    }
    if (!Number.isFinite(return_pct)) return_pct = 0;

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
      const mReturn = (prevClose != null && prevClose > 0) ? ((monthly[m] - prevClose) / prevClose) * 100 : 0;
      return {
        month: m,
        return_pct: Number.isFinite(mReturn) ? parseFloat(mReturn.toFixed(2)) : 0,
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

  // Sort by return_pct descending
  results.sort((a: any, b: any) => (b.return_pct ?? -999) - (a.return_pct ?? -999));

  return NextResponse.json({ results, total: results.length });
}
