export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseServiceKey } from '@/lib/supabase-config';

const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseServiceKey()
);

const SORTABLE_COLUMNS = new Set([
  'ticker', 'price', 'market_cap', 'pe_ratio', 'forward_pe', 'price_to_book',
  'price_to_sales', 'ev_to_ebitda', 'dividend_yield', 'earnings_growth',
  'revenue_growth', 'profit_margins', 'high_52_week', 'low_52_week',
  'ma_50_day', 'ma_200_day', 'beta', 'volume', 'avg_volume',
  'return_on_equity', 'return_on_assets',
]);

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const search = typeof body.search === 'string' ? body.search : '';
  const parsedLimit = Number(body.limit);
  const limit = Math.min(Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 50, 500);
  const offset = Math.max(Number(body.offset) || 0, 0);

  const {
    asset_class,
    sector,
    sort_by: rawSortBy = 'revenue_growth',
    sort_dir = 'desc',
    min_market_cap,
    max_pe,
    min_dividend_yield,
    min_revenue_growth,
    min_profit_margins,
    max_beta,
    min_roe,
  } = body;

  const sort_by = SORTABLE_COLUMNS.has(rawSortBy) ? rawSortBy : 'revenue_growth';

  let query = supabase
    .from('asset_snapshots')
    .select('*', { count: 'exact' })
    .order(sort_by, { ascending: sort_dir === 'asc', nullsFirst: false })
    .order('ticker', { ascending: true })
    .range(offset, offset + limit - 1);

  if (search) {
    const q = search.trim().replace(/[%_]/g, '\\$&').replace(/[,()]/g, '');
    if (q) {
      query = query.or(`ticker.ilike.%${q}%,short_name.ilike.%${q}%`);
    }
  }

  if (asset_class) {
    if (asset_class === 'Stock') {
      query = query.in('asset_class', ['US Stock', 'Stock', 'Equity']);
    } else {
      query = query.eq('asset_class', asset_class);
    }
  }
  if (sector) query = query.eq('sector', sector);
  if (min_market_cap !== undefined && Number.isFinite(Number(min_market_cap))) query = query.gte('market_cap', Number(min_market_cap));
  if (max_pe !== undefined && Number.isFinite(Number(max_pe))) query = query.lte('pe_ratio', Number(max_pe)).gt('pe_ratio', 0);
  if (min_dividend_yield !== undefined && Number.isFinite(Number(min_dividend_yield))) query = query.gte('dividend_yield', Number(min_dividend_yield));
  if (min_revenue_growth !== undefined && Number.isFinite(Number(min_revenue_growth))) query = query.gte('revenue_growth', Number(min_revenue_growth));
  if (min_profit_margins !== undefined && Number.isFinite(Number(min_profit_margins))) query = query.gte('profit_margins', Number(min_profit_margins));
  if (max_beta !== undefined && Number.isFinite(Number(max_beta))) query = query.lte('beta', Number(max_beta));
  if (min_roe !== undefined && Number.isFinite(Number(min_roe))) query = query.gte('return_on_equity', Number(min_roe));

  const { data, error, count } = await query;
  if (error) {
    console.error('api/screener: asset_snapshots query error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + error.message }, { status: 500 });
  }

  // Deduplicate by ticker
  const seen = new Set<string>();
  const uniqueData: any[] = [];
  for (const r of data || []) {
    if (!r || !r.ticker || seen.has(r.ticker)) continue;
    seen.add(r.ticker);
    uniqueData.push(r);
  }

  // Compute investment scores for each result
  const scored = uniqueData.map((r: any) => {
    const earn_score = Math.min(Math.max((r.revenue_growth || 0) * 100, 0), 40);
    const lose_score = Math.max(40 - (r.beta || 1) * 20, 0);
    const exit_score = Math.min((r.market_cap || 0) / 1e11, 10);
    const value_score = r.pe_ratio && r.pe_ratio > 0 && r.pe_ratio < 30 ? 10 : 0;
    const total_score = earn_score + lose_score + exit_score + value_score;
    const growthDisplay = r.revenue_growth != null 
      ? r.revenue_growth > 5 
        ? '>500% rev growth' 
        : `${(r.revenue_growth * 100).toFixed(1)}% rev growth` 
      : '—';
    return {
      ...r,
      investment_score: Math.round(total_score),
      what_can_earn: growthDisplay,
      what_can_lose: r.beta ? `Beta ${r.beta.toFixed(2)} (${r.beta < 1 ? 'Low' : r.beta < 1.5 ? 'Medium' : 'High'} risk)` : '—',
      how_easy_exit: r.market_cap > 1e11 ? 'Very Easy' : r.market_cap > 1e10 ? 'Easy' : r.market_cap > 1e9 ? 'Moderate' : 'Hard',
    };
  });

  return NextResponse.json({ results: scored, total: count || 0, offset, limit });
}
