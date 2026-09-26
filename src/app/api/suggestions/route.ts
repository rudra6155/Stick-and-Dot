import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 1. Top Performers (High revenue growth, high momentum)
    const { data: topPerformers } = await supabase
      .from('asset_snapshots')
      .select('*')
      .order('revenue_growth', { ascending: false, nullsFirst: false })
      .limit(5);

    // 2. Safe Bets (Large cap, high dividend, low beta)
    const { data: safeBets } = await supabase
      .from('asset_snapshots')
      .select('*')
      .gte('dividend_yield', 0.02)
      .lte('beta', 1.0)
      .order('market_cap', { ascending: false, nullsFirst: false })
      .limit(5);

    // 3. Discounted (Low P/E, high ROE)
    const { data: discounted } = await supabase
      .from('asset_snapshots')
      .select('*')
      .gte('pe_ratio', 1)
      .lte('pe_ratio', 15)
      .order('return_on_equity', { ascending: false, nullsFirst: false })
      .limit(5);

    // 4. Trending Crypto
    const { data: trendingCrypto } = await supabase
      .from('asset_snapshots')
      .select('*')
      .in('asset_class', ['Crypto', 'Cryptocurrency'])
      .order('market_cap', { ascending: false, nullsFirst: false })
      .limit(5);

    return NextResponse.json({
      topPerformers: topPerformers || [],
      safeBets: safeBets || [],
      discounted: discounted || [],
      trendingCrypto: trendingCrypto || []
    });

  } catch (error: any) {
    console.error('Suggestions API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
