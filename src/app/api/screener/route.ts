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
    limit = 20,
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

  const { data, error } = await query;
  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ results: data });
}
