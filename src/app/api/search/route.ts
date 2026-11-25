export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseServiceKey } from '@/lib/supabase-config';
import {
  CANONICAL_SEARCH_ALIASES,
  normalizeAssetClass,
  pickCanonicalAssetRow,
  isSyntheticTicker,
} from '@/lib/asset-utils';

const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseServiceKey()
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawQuery = searchParams.get('q') || searchParams.get('search') || '';
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 8, 1), 20);

  return handleSearch(rawQuery, limit);
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // empty body fallback
  }

  const rawQuery = body.q || body.search || '';
  const limit = Math.min(Math.max(Number(body.limit) || 8, 1), 20);

  return handleSearch(rawQuery, limit);
}

async function handleSearch(rawQuery: string, limit: number) {
  const cleanQuery = rawQuery.trim();
  if (!cleanQuery) {
    return NextResponse.json({ query: '', results: [] });
  }

  const upperQuery = cleanQuery.toUpperCase();
  const sanitized = cleanQuery.replace(/[%_]/g, '\\$&').replace(/[,()]/g, '');

  try {
    // Check if query directly maps to an alias (e.g. MICROSOFT -> MSFT)
    const aliasTicker = CANONICAL_SEARCH_ALIASES[upperQuery];

    // Build main search query excluding synthetic seed rows
    let baseQuery = supabase
      .from('asset_snapshots')
      .select('ticker, short_name, asset_class, price, market_cap, sector')
      .not('ticker', 'like', 'BOND-%')
      .not('ticker', 'like', 'REIT-%')
      .not('ticker', 'like', 'COMM-%');

    if (aliasTicker) {
      baseQuery = baseQuery.or(`ticker.eq.${aliasTicker},ticker.ilike.%${sanitized}%,short_name.ilike.%${sanitized}%`);
    } else {
      baseQuery = baseQuery.or(`ticker.ilike.%${sanitized}%,short_name.ilike.%${sanitized}%`);
    }

    const { data, error } = await baseQuery
      .order('market_cap', { ascending: false, nullsFirst: false })
      .limit(limit + 8);

    if (error) {
      console.error('Asset search query error:', error);
      return NextResponse.json({ query: cleanQuery, results: [], error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ query: cleanQuery, results: [] });
    }

    // Deduplicate duplicate ticker rows first using canonical tie-breaker
    const grouped = new Map<string, any[]>();
    for (const row of data) {
      if (!row || !row.ticker || isSyntheticTicker(row.ticker)) continue;
      const arr = grouped.get(row.ticker);
      if (arr) arr.push(row);
      else grouped.set(row.ticker, [row]);
    }
    const dedupedRows = Array.from(grouped.values())
      .map(rows => pickCanonicalAssetRow(rows))
      .filter((r): r is any => r !== null);

    // Rank and sort results so the most relevant ticker comes first:
    // 1. Exact alias match (e.g. MSFT when typing MICROSOFT)
    // 2. Exact ticker match (e.g. AAPL when typing AAPL)
    // 3. Ticker starts with query
    // 4. Short name starts with query
    // 5. Prefer primary ticker without foreign suffix when tied, plus market cap
    const scored = dedupedRows.map((item: any) => {
      let score = 0;
      const t = item.ticker.toUpperCase();
      const n = (item.short_name || '').toUpperCase();

      if (aliasTicker && t === aliasTicker) score += 1000;
      if (t === upperQuery) score += 500;
      if (t.startsWith(upperQuery)) score += 200;
      if (n.startsWith(upperQuery)) score += 100;
      if (n.includes(upperQuery)) score += 50;
      if (!t.includes('.')) score += 15;

      if (item.market_cap && item.market_cap > 0) {
        score += Math.min(Math.log10(item.market_cap) * 2, 30);
      }

      return { item, score };
    });

    scored.sort((a: any, b: any) => b.score - a.score);

    const results = scored.slice(0, limit).map(({ item }) => ({
      ticker: item.ticker,
      short_name: item.short_name || item.ticker,
      asset_class: normalizeAssetClass(item.asset_class),
      price: item.price ? Number(item.price) : 0,
      market_cap: item.market_cap ? Number(item.market_cap) : null,
      sector: item.sector || null,
    }));

    return NextResponse.json(
      { query: cleanQuery, results },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (err: any) {
    console.error('handleSearch caught error:', err);
    return NextResponse.json({ query: cleanQuery, results: [], error: err.message }, { status: 500 });
  }
}
