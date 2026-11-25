import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseServiceKey } from '@/lib/supabase-config';
import {
  normalizeAssetClass,
  normalizeDividendYieldPct,
  deduplicateAssetRows,
} from '@/lib/asset-utils';

const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseServiceKey()
);

const SELECT_COLS = 'id, ticker, short_name, price, asset_class, sector, market_cap, pe_ratio, revenue_growth, dividend_yield, dividend_rate, beta, return_on_equity, profit_margins, high_52_week, low_52_week';

function normalizeSuggestionRows(rows: any[] | null | undefined, maxCount: number = 5): any[] {
  return deduplicateAssetRows(rows, maxCount).map((r) => ({
    ...r,
    asset_class: normalizeAssetClass(r.asset_class),
    dividend_yield: normalizeDividendYieldPct(r.dividend_yield, r.dividend_rate, r.price),
  }));
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
        .not('ticker', 'like', 'BOND-%')
        .not('ticker', 'like', 'REIT-%')
        .not('ticker', 'like', 'COMM-%')
        .gt('price', 5)
        .lt('revenue_growth', 5.0)
        .gt('revenue_growth', 0.1)
        .gte('market_cap', 500_000_000)
        .order('revenue_growth', { ascending: false, nullsFirst: false })
        .limit(25),

      // 2. Safe Bets (Large cap, >=2% dividend yield, low beta)
      supabase
        .from('asset_snapshots')
        .select(SELECT_COLS)
        .not('ticker', 'like', 'BOND-%')
        .not('ticker', 'like', 'REIT-%')
        .not('ticker', 'like', 'COMM-%')
        .gte('dividend_yield', 2)
        .lte('dividend_yield', 25)
        .lte('beta', 1.0)
        .gte('market_cap', 1_000_000_000)
        .order('market_cap', { ascending: false, nullsFirst: false })
        .limit(25),

      // 3. Discounted (Low P/E, high ROE, large cap)
      supabase
        .from('asset_snapshots')
        .select(SELECT_COLS)
        .not('ticker', 'like', 'BOND-%')
        .not('ticker', 'like', 'REIT-%')
        .not('ticker', 'like', 'COMM-%')
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
        topPerformers: normalizeSuggestionRows(topPerformersRaw, 5),
        safeBets: normalizeSuggestionRows(safeBetsRaw, 5),
        discounted: normalizeSuggestionRows(discountedRaw, 5),
        trendingCrypto: normalizeSuggestionRows(trendingCryptoRaw, 5)
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
