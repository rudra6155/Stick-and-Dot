import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseServiceKey } from '@/lib/supabase-config';

const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseServiceKey()
);

const SELECT_COLS = 'id, ticker, short_name, price, asset_class, sector, market_cap, pe_ratio, revenue_growth, dividend_yield, beta, return_on_equity, profit_margins, high_52_week, low_52_week';

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
    // Run all 4 category queries in parallel with selected columns to reduce latency from 15s to <1s
    const [
      { data: topPerformersRaw, error: err1 },
      { data: safeBetsRaw, error: err2 },
      { data: discountedRaw, error: err3 },
      { data: trendingCryptoRaw, error: err4 }
    ] = await Promise.all([
      // 1. Top Performers (High revenue growth, reasonable price, non-microcap)
      supabase
        .from('asset_snapshots')
        .select(SELECT_COLS)
        .gt('price', 5)
        .lt('revenue_growth', 5.0)
        .gt('revenue_growth', 0.1)
        .gte('market_cap', 500_000_000)
        .order('revenue_growth', { ascending: false, nullsFirst: false })
        .limit(25),

      // 2. Safe Bets (Large cap, good dividend, low beta)
      supabase
        .from('asset_snapshots')
        .select(SELECT_COLS)
        .gte('dividend_yield', 0.02)
        .lt('dividend_yield', 0.25)
        .lte('beta', 1.0)
        .gte('market_cap', 1_000_000_000)
        .order('market_cap', { ascending: false, nullsFirst: false })
        .limit(25),

      // 3. Discounted (Low P/E, high ROE, large cap)
      supabase
        .from('asset_snapshots')
        .select(SELECT_COLS)
        .gte('pe_ratio', 1)
        .lte('pe_ratio', 15)
        .gte('market_cap', 500_000_000)
        .order('return_on_equity', { ascending: false, nullsFirst: false })
        .limit(25),

      // 4. Trending Crypto
      supabase
        .from('asset_snapshots')
        .select(SELECT_COLS)
        .in('asset_class', ['Crypto', 'Cryptocurrency'])
        .gt('market_cap', 0)
        .order('market_cap', { ascending: false, nullsFirst: false })
        .limit(25)
    ]);

    const errors = [err1, err2, err3, err4].filter(Boolean);
    if (errors.length > 0) {
      console.warn('Some suggestions queries had errors:', errors);
    }

    return NextResponse.json(
      {
        topPerformers: deduplicateTickers(topPerformersRaw, 5),
        safeBets: deduplicateTickers(safeBetsRaw, 5),
        discounted: deduplicateTickers(discountedRaw, 5),
        trendingCrypto: deduplicateTickers(trendingCryptoRaw, 5)
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800'
        }
      }
    );
  } catch (error: any) {
    console.error('Suggestions API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
