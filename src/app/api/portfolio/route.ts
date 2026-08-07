import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  if (!tickers || tickers.length === 0) return NextResponse.json({ error: 'No tickers provided' }, { status: 400 });

  // Fetch asset snapshots
  const { data: assets } = await supabase
    .from('asset_snapshots')
    .select('*')
    .in('ticker', tickers);

  if (!assets || assets.length === 0) return NextResponse.json({ error: 'No assets found' }, { status: 404 });

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data: history } = await supabase
    .from('price_history')
    .select('ticker, date, close')
    .in('ticker', tickers)
    // Remove .gte filter because DB data is stale
    .order('date', { ascending: true })
    .limit(30000);

  // Compute 6M return per asset
  const tickerHistory: Record<string, any[]> = {};
  (history || []).forEach((row: any) => {
    if (!tickerHistory[row.ticker]) tickerHistory[row.ticker] = [];
    tickerHistory[row.ticker].push(row);
  });

  const weight = 1 / assets.length;

  const assetDetails = assets.map((a: any) => {
    const hist = tickerHistory[a.ticker] || [];
    const return_6m = hist.length >= 2
      ? (hist[0].close !== 0 ? ((hist[hist.length - 1].close - hist[0].close) / hist[0].close) * 100 : 0)
      : 0;
    return { ...a, weight, return_6m: parseFloat(return_6m.toFixed(2)) };
  });

  // Portfolio metrics
  const portfolio_return = assetDetails.reduce((s: number, a: any) => s + a.return_6m * weight, 0);
  const avg_beta = assetDetails.reduce((s: number, a: any) => s + (a.beta || 1) * weight, 0);
  const avg_dividend = assetDetails.reduce((s: number, a: any) => s + (a.dividend_yield || 0) * weight, 0);
  const avg_pe = assetDetails.filter((a: any) => a.pe_ratio > 0).reduce((s: number, a: any, _, arr) => s + a.pe_ratio / arr.length, 0);

  // Diversification score
  const classes = new Set(assetDetails.map((a: any) => a.asset_class));
  const sectors = new Set(assetDetails.map((a: any) => a.sector).filter(Boolean));
  const diversification_score = Math.min(Math.round((classes.size * 15) + (sectors.size * 5)), 100);

  // Stress tests
  const stress_tests = Object.entries(SCENARIO_IMPACTS).map(([scenario, impacts]) => {
    const scenario_return = assetDetails.reduce((s: number, a: any) => {
      const impact = impacts[a.asset_class] || -0.1;
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
  });
}
