export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl, getSupabaseServiceKey } from '@/lib/supabase-config';

const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseServiceKey()
);

function scoreAsset(r: any) {
  const assetClass = r.asset_class || 'Stock';

  // --- 1. SPECIAL CASE: INDEX BENCHMARKS ---
  if (assetClass === 'Index' || r.ticker?.startsWith('^')) {
    const total = 84;
    return {
      total_score: total,
      grade: 'A-',
      breakdown: { earn_score: 20, lose_score: 22, exit_score: 24, value_score: 18 },
      earn_label: 'Benchmark Return',
      lose_label: 'Low Unsystematic Risk',
      exit_label: 'Institutional Liquidity',
      value_label: 'Market Aggregate',
      risks: [
        'Exposed to systemic macroeconomic cycles and central bank monetary tightening',
        'Market-cap weighting creates concentration in top mega-cap constituents',
        'No direct single-stock upside alpha (tracks weighted beta average)'
      ],
      opportunities: [
        'Complete elimination of single-company bankruptcy or fraud risk',
        'Institutional-grade benchmark representing broad economic expansion',
        'Highest structural liquidity with deep global derivative coverage'
      ]
    };
  }

  // --- 2. SPECIAL CASE: COMMODITIES ---
  if (assetClass === 'Commodity') {
    const total = 74;
    return {
      total_score: total,
      grade: 'B',
      breakdown: { earn_score: 18, lose_score: 16, exit_score: 20, value_score: 20 },
      earn_label: 'Cyclical / Spot Drift',
      lose_label: 'Moderate Volatility',
      exit_label: 'Global Market Liquidity',
      value_label: 'Tangible Asset Value',
      risks: [
        'Exposed to supply shocks, geopolitical embargoes, and physical storage dynamics',
        'Generates zero operational cash flow or corporate dividends',
        'Contango / backwardation roll yield decay in derivative contracts'
      ],
      opportunities: [
        'Historically effective hedge against fiat inflation and currency debasement',
        'Low structural correlation to standard corporate equity cycles',
        'Essential industrial or monetary reserve demand'
      ]
    };
  }

  // --- 3. SPECIAL CASE: FOREX ---
  if (assetClass === 'Forex') {
    const total = 78;
    return {
      total_score: total,
      grade: 'B+',
      breakdown: { earn_score: 15, lose_score: 22, exit_score: 25, value_score: 16 },
      earn_label: 'Interest Differential (Carry)',
      lose_label: 'Sovereign Macro Risk',
      exit_label: 'Deepest Global Liquidity',
      value_label: 'Purchasing Power Parity',
      risks: [
        'Subject to central bank monetary policy shifts and unexpected rate decisions',
        'Exposed to sovereign geopolitical events and foreign exchange controls',
        'Leverage risks in standard retail currency positions'
      ],
      opportunities: [
        'Highest daily turnover ($7.5T/day) of any asset class in the world',
        'Zero single-corporation failure or accounting fraud exposure',
        'Clear macro expression of relative sovereign economic performance'
      ]
    };
  }

  // --- 4. SPECIAL CASE: BONDS & FIXED INCOME ---
  if (assetClass === 'Bond') {
    const total = 82;
    return {
      total_score: total,
      grade: 'A-',
      breakdown: { earn_score: 18, lose_score: 24, exit_score: 20, value_score: 20 },
      earn_label: 'Contractual Yield',
      lose_label: 'Low Capital Risk',
      exit_label: 'Institutional Liquidity',
      value_label: 'Fixed Income Value',
      risks: [
        'Interest rate duration risk — bond prices fall when interest rates rise',
        'Inflation risk eroding real purchasing power of fixed coupon payments',
        'Credit spread widening during severe market distress'
      ],
      opportunities: [
        'Seniority in capital structure with contractual coupon income priority',
        'Lower historical drawdown and volatility compared to equities',
        'Defensive flight-to-safety asset during market recessions'
      ]
    };
  }

  // --- 5. CORPORATE EQUITIES & ETFS (Default Fundamental Model) ---
  const rev = Math.min((r.revenue_growth || 0) * 100, 15);
  const eps = Math.min((r.earnings_growth || 0) * 100, 10);
  const earn_score = Math.round(rev + eps);

  // LOSE score (0-25): low beta = safer
  const beta = r.beta || 1;
  const lose_score = Math.round(Math.max(0, 25 - beta * 12));

  // EXIT score (0-25): market cap liquidity
  const cap = r.market_cap || 0;
  const exit_score = cap > 1e12 ? 25 : cap > 1e11 ? 20 : cap > 1e10 ? 15 : cap > 1e9 ? 10 : 5;

  // VALUE score (0-25): P/E, profit margins, ROE
  const pe_score = r.pe_ratio && r.pe_ratio > 0 && r.pe_ratio < 15 ? 10 : r.pe_ratio && r.pe_ratio > 0 && r.pe_ratio < 25 ? 7 : r.pe_ratio && r.pe_ratio > 0 && r.pe_ratio < 40 ? 4 : 0;
  const margin_score = r.profit_margins > 0.2 ? 8 : r.profit_margins > 0.1 ? 5 : r.profit_margins > 0 ? 2 : 0;
  const roe_score = r.return_on_equity > 0.2 ? 7 : r.return_on_equity > 0.1 ? 4 : 2;
  const value_score = Math.min(pe_score + margin_score + roe_score, 25);

  const total = earn_score + lose_score + exit_score + value_score;
  const grade = total >= 80 ? 'A' : total >= 65 ? 'B' : total >= 50 ? 'C' : total >= 35 ? 'D' : 'F';

  const risks = [];
  if (beta > 1.5) risks.push('High volatility — price swings significantly with market');
  if (r.pe_ratio > 40) risks.push('Expensive valuation — high P/E means limited margin of safety');
  if (r.total_debt > r.total_revenue && r.total_revenue > 0) risks.push('High debt load relative to annual revenue');
  if (r.profit_margins != null && r.profit_margins < 0) risks.push('Negative profit margins — company is operating at a loss');
  if (r.revenue_growth != null && r.revenue_growth < 0) risks.push('Declining revenue — business momentum is contracting');
  if (r.free_cashflow != null && r.free_cashflow < 0) risks.push('Negative free cash flow — net operational cash burn');
  if (cap > 0 && cap < 1e9) risks.push('Small cap profile — lower liquidity, higher bid-ask spreads');

  const opportunities = [];
  if (r.revenue_growth > 0.2) opportunities.push(`Strong top-line revenue growth at ${(r.revenue_growth * 100).toFixed(1)}%`);
  if (r.dividend_yield > 0.03) opportunities.push(`Attractive dividend cash yield of ${(r.dividend_yield * 100).toFixed(1)}%`);
  if (r.return_on_equity > 0.2) opportunities.push(`High ROE of ${(r.return_on_equity * 100).toFixed(1)}% — efficient management capital allocation`);
  if (r.pe_ratio && r.pe_ratio > 0 && r.pe_ratio < 15 && r.revenue_growth > 0.05) opportunities.push('Potentially undervalued relative to ongoing business growth');
  if (r.recommendation_mean && r.recommendation_mean < 2) opportunities.push('Strong institutional analyst consensus — overweight / buy rating');
  if (r.target_mean_price && r.price && r.target_mean_price > r.price * 1.15) opportunities.push(`Wall Street consensus price target ${((r.target_mean_price / r.price - 1) * 100).toFixed(0)}% above current market price`);

  return {
    total_score: total,
    grade,
    breakdown: { earn_score, lose_score, exit_score, value_score },
    earn_label: earn_score >= 18 ? 'High Growth' : earn_score >= 10 ? 'Moderate Growth' : 'Low Growth',
    lose_label: lose_score >= 20 ? 'Low Risk' : lose_score >= 12 ? 'Medium Risk' : 'High Risk',
    exit_label: exit_score >= 20 ? 'Very Liquid' : exit_score >= 15 ? 'Liquid' : exit_score >= 10 ? 'Moderate' : 'Illiquid',
    value_label: value_score >= 20 ? 'Strong Value' : value_score >= 12 ? 'Fair Value' : 'Expensive',
    risks,
    opportunities,
  };
}

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const { ticker } = body;
  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 });

  if (typeof ticker !== 'string' || !ticker.trim()) {
      return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 });
  }

  const escapedTicker = ticker.trim().replace(/[%_]/g, '\\$&');

  const { data, error } = await supabase
    .from('asset_snapshots')
    .select('*')
    .ilike('ticker', escapedTicker)
    .limit(1)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

  const score = scoreAsset(data);

  return NextResponse.json({ asset: data, score });
}
