import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function scoreAsset(r: any) {
  // EARN score (0-25): revenue growth + earnings growth
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
  if (r.total_debt > r.total_revenue) risks.push('High debt load relative to revenue');
  if (r.profit_margins < 0) risks.push('Negative profit margins — company is losing money');
  if (r.revenue_growth < 0) risks.push('Declining revenue — business may be shrinking');
  if (r.free_cashflow < 0) risks.push('Negative free cash flow — burning through cash');
  if (r.market_cap < 1e9) risks.push('Small cap — lower liquidity, harder to exit quickly');

  const opportunities = [];
  if (r.revenue_growth > 0.2) opportunities.push(`Strong revenue growth at ${(r.revenue_growth * 100).toFixed(1)}%`);
  if (r.dividend_yield > 0.03) opportunities.push(`Attractive dividend yield of ${(r.dividend_yield * 100).toFixed(1)}%`);
  if (r.return_on_equity > 0.2) opportunities.push(`High ROE of ${(r.return_on_equity * 100).toFixed(1)}% — efficient use of capital`);
  if (r.pe_ratio && r.pe_ratio > 0 && r.pe_ratio < 15 && r.revenue_growth > 0.05) opportunities.push('Potentially undervalued with solid growth');
  if (r.recommendation_mean && r.recommendation_mean < 2) opportunities.push('Strong analyst consensus — buy rating');
  if (r.target_mean_price && r.price && r.target_mean_price > r.price * 1.15) opportunities.push(`Analyst price target ${((r.target_mean_price / r.price - 1) * 100).toFixed(0)}% above current price`);

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

  const { data, error } = await supabase
    .from('asset_snapshots')
    .select('*')
    .ilike('ticker', ticker.trim())
    .limit(1)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

  const score = scoreAsset(data);

  return NextResponse.json({ asset: data, score });
}
