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
    sort_by = 'revenue_growth',
    sort_dir = 'desc',
    min_market_cap,
    max_pe,
    min_dividend_yield,
    min_revenue_growth,
    min_profit_margins,
    max_beta,
    min_roe,
    limit = 500,
  } = body;

  let query = supabase
    .from('asset_snapshots')
    .select('*')
    .order(sort_by, { ascending: sort_dir === 'asc' })
    .limit(limit);

  if (asset_class) query = query.eq('asset_class', asset_class);
  if (sector) query = query.eq('sector', sector);
  if (min_market_cap) query = query.gte('market_cap', min_market_cap);
  if (max_pe) query = query.lte('pe_ratio', max_pe).gt('pe_ratio', 0);
  if (min_dividend_yield) query = query.gte('dividend_yield', min_dividend_yield);
  if (min_revenue_growth) query = query.gte('revenue_growth', min_revenue_growth);
  if (min_profit_margins) query = query.gte('profit_margins', min_profit_margins);
  if (max_beta) query = query.lte('beta', max_beta);
  if (min_roe) query = query.gte('return_on_equity', min_roe);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error }, { status: 500 });

  // Compute investment scores for each result
  const scored = (data || []).map((r: any) => {
    const earn_score = Math.min((r.revenue_growth || 0) * 100, 40);
    const lose_score = Math.max(40 - (r.beta || 1) * 20, 0);
    const exit_score = Math.min((r.market_cap || 0) / 1e11, 10);
    const value_score = r.pe_ratio && r.pe_ratio < 30 ? 10 : 0;
    const total_score = earn_score + lose_score + exit_score + value_score;
    return {
      ...r,
      investment_score: Math.round(total_score),
      what_can_earn: r.revenue_growth ? `${(r.revenue_growth * 100).toFixed(1)}% rev growth` : '—',
      what_can_lose: r.beta ? `Beta ${r.beta.toFixed(2)} (${r.beta < 1 ? 'Low' : r.beta < 1.5 ? 'Medium' : 'High'} risk)` : '—',
      how_easy_exit: r.market_cap > 1e11 ? 'Very Easy' : r.market_cap > 1e10 ? 'Easy' : r.market_cap > 1e9 ? 'Moderate' : 'Hard',
    };
  });

  return NextResponse.json({ results: scored });
}
