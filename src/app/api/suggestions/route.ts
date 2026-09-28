export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://riszdsmtfijmwsylbmcf.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_79YfL9h7Vu_1jItiD7js4A_N95hySYI'
);

function deduplicateTickers(rows: any[] | null | undefined, maxCount: number = 5): any[] {
  const seen = new Set<string>();
  const unique: any[] = [];
  for (const r of rows || []) {
    if (!r || !r.ticker || seen.has(r.ticker)) continue;
    seen.add(r.ticker);
    unique.push(r);
    if (unique.length >= maxCount) break;
  }
  return unique;
}

export async function GET() {
  try {
    // 1. Top Performers (High revenue growth, high momentum, reasonable price)
    const { data: topPerformersRaw } = await supabase
      .from('asset_snapshots')
      .select('*')
      .gt('price', 5)
      .lt('revenue_growth', 20)
      .gt('revenue_growth', 0.1)
      .order('revenue_growth', { ascending: false, nullsFirst: false })
      .limit(25);

    // 2. Safe Bets (Large cap, high dividend, low beta)
    const { data: safeBetsRaw } = await supabase
      .from('asset_snapshots')
      .select('*')
      .gte('dividend_yield', 0.02)
      .lte('beta', 1.0)
      .order('market_cap', { ascending: false, nullsFirst: false })
      .limit(25);

    // 3. Discounted (Low P/E, high ROE)
    const { data: discountedRaw } = await supabase
      .from('asset_snapshots')
      .select('*')
      .gte('pe_ratio', 1)
      .lte('pe_ratio', 15)
      .order('return_on_equity', { ascending: false, nullsFirst: false })
      .limit(25);

    // 4. Trending Crypto
    const { data: trendingCryptoRaw } = await supabase
      .from('asset_snapshots')
      .select('*')
      .in('asset_class', ['Crypto', 'Cryptocurrency'])
      .order('market_cap', { ascending: false, nullsFirst: false })
      .limit(25);

    return NextResponse.json({
      topPerformers: deduplicateTickers(topPerformersRaw, 5),
      safeBets: deduplicateTickers(safeBetsRaw, 5),
      discounted: deduplicateTickers(discountedRaw, 5),
      trendingCrypto: deduplicateTickers(trendingCryptoRaw, 5)
    });

  } catch (error: any) {
    console.error('Suggestions API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
