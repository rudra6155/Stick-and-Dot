import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireEnv } from '@/lib/supabase';

const supabase = createClient(
  requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY')
);

// Upper bound on how many tickers a single request may process — an
// unbounded ticker list would fan out into an equally unbounded number of
// concurrent DB queries below (one per ticker for price history).
const MAX_TICKERS = 100;

const SCENARIO_IMPACTS: Record<string, Record<string, number>> = {
  recession_fear:    { Stock: -0.25, Crypto: -0.45, ETF: -0.15, REIT: -0.20, Bond: 0.08, Commodity: -0.10, "Indian Stock": -0.22, International: -0.20, Forex: 0.10, Index: -0.20 },
  inflation_high:    { Stock: -0.05, Crypto: -0.15, ETF: -0.05, REIT: 0.10, Bond: -0.12, Commodity: 0.25, "Indian Stock": -0.05, International: -0.08, Forex: 0.10, Index: -0.10 },
  rate_hike:         { Stock: -0.12, Crypto: -0.30, ETF: -0.10, REIT: -0.18, Bond: -0.08, Commodity: 0.05, "Indian Stock": -0.15, International: -0.12, Forex: 0.20, Index: -0.15 },
  ai_boom:           { Stock: 0.30, Crypto: 0.25, ETF: 0.20, REIT: 0.05, Bond: -0.02, Commodity: 0.00, "Indian Stock": 0.15, International: 0.18, Forex: 0.00, Index: 0.10 },
  us_china_tension:  { Stock: -0.08, Crypto: -0.10, ETF: -0.05, REIT: -0.05, Bond: 0.05, Commodity: 0.15, "Indian Stock": 0.05, International: -0.15, Forex: 0.15, Index: -0.10 },
  india_growth:      { Stock: 0.05, Crypto: 0.10, ETF: 0.08, REIT: 0.05, Bond: 0.02, Commodity: 0.05, "Indian Stock": 0.35, International: 0.05, Forex: 0.05, Index: 0.05 },
};

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const { tickers } = body;
  if (
    !Array.isArray(tickers) ||
    tickers.length === 0 ||
    !tickers.every((t: unknown) => typeof t === 'string' && t.trim() !== '')
  ) {
    return NextResponse.json({ error: 'tickers must be a non-empty array of strings' }, { status: 400 });
  }
  if (tickers.length > MAX_TICKERS) {
    return NextResponse.json({ error: `Too many tickers requested (max ${MAX_TICKERS})` }, { status: 400 });
  }

  // Fetch asset snapshots
  const { data: assets, error: assetsError } = await supabase
    .from('asset_snapshots')
    .select('*')
    .in('ticker', tickers);

  if (assetsError) {
    console.error('api/portfolio: asset_snapshots query error:', assetsError);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  if (!assets || assets.length === 0) return NextResponse.json({ error: 'No assets found' }, { status: 404 });

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

  // Use allSettled (not Promise.all) so one rejected query doesn't take down
  // the whole endpoint, and inspect each result's `error` field too, since
  // the Supabase client resolves with { data: null, error } on query
  // failures rather than rejecting the promise.
  const historySettled = await Promise.allSettled(historyPromises);
  const failedTickers: string[] = [];
  const history: any[] = [];
  historySettled.forEach((settled, i) => {
    const ticker = tickers[i];
    if (settled.status === 'rejected') {
      console.error(`api/portfolio: price_history query rejected for ${ticker}:`, settled.reason);
      failedTickers.push(ticker);
      return;
    }
    const { data, error } = settled.value;
    if (error) {
      console.error(`api/portfolio: price_history query error for ${ticker}:`, error);
      failedTickers.push(ticker);
      return;
    }
    if (data) history.push(...data);
  });

  // Compute 6M return per asset
  const tickerHistory: Record<string, any[]> = {};
  history.reverse().forEach((row: any) => {
    if (!tickerHistory[row.ticker]) tickerHistory[row.ticker] = [];
    tickerHistory[row.ticker].push(row);
  });

  const weight = 1 / assets.length;

  const assetDetails = assets.map((a: any) => {
    const hist = tickerHistory[a.ticker] || [];
    const first = hist[0]?.close;
    const return_6m = hist.length >= 2
      ? ((first != null && first !== 0) ? ((hist[hist.length - 1].close - first) / first) * 100 : 0)
      : 0;
    return { ...a, weight, return_6m: parseFloat(return_6m.toFixed(2)) };
  });

  // Portfolio metrics
  const portfolio_return = assetDetails.reduce((s: number, a: any) => s + a.return_6m * weight, 0);
  const avg_beta = assetDetails.reduce((s: number, a: any) => s + (a.beta || 1) * weight, 0);
  const avg_dividend = assetDetails.reduce((s: number, a: any) => s + (a.dividend_yield || 0) * weight, 0);
  const peAssets = assetDetails.filter((a: any) => a.pe_ratio > 0);
  const avg_pe = peAssets.length > 0
    ? peAssets.reduce((s: number, a: any) => s + a.pe_ratio, 0) / peAssets.length
    : 0;

  // Diversification score
  const classes = new Set(assetDetails.map((a: any) => a.asset_class));
  const sectors = new Set(assetDetails.map((a: any) => a.sector).filter(Boolean));
  const diversification_score = Math.min(Math.round((classes.size * 15) + (sectors.size * 5)), 100);

  // Stress tests
  const stress_tests = Object.entries(SCENARIO_IMPACTS).map(([scenario, impacts]) => {
    const scenario_return = assetDetails.reduce((s: number, a: any) => {
      const impact = impacts[a.asset_class] !== undefined ? impacts[a.asset_class] : -0.1;
      return s + impact * weight * 100;
    }, 0);
    const labels: Record<string, string> = {
      recession_fear: "📉 Recession Fear",
      inflation_high: "📈 High Inflation",
      rate_hike: "🏦 Rate Hike",
      ai_boom: "🤖 AI Boom",
      us_china_tension: "🇺🇸🇨🇳 US-China Tensions",
      india_growth: "🇮🇳 India Growth",
    };
    return {
      scenario,
      label: labels[scenario],
      portfolio_impact: parseFloat(scenario_return.toFixed(1)),
    };
  });

  return NextResponse.json({
    assets: assetDetails,
    summary: {
      portfolio_return: parseFloat(portfolio_return.toFixed(2)),
      avg_beta: parseFloat(avg_beta.toFixed(2)),
      avg_dividend_yield: parseFloat((avg_dividend * 100).toFixed(2)),
      avg_pe: parseFloat(avg_pe.toFixed(1)),
      diversification_score,
      asset_count: assets.length,
      class_count: classes.size,
    },
    stress_tests,
    // Tickers whose price-history lookup failed — their return_6m/history
    // falls back to 0 rather than being silently excluded from the response.
    ...(failedTickers.length > 0 ? { failed_tickers: failedTickers } : {}),
  });
}
