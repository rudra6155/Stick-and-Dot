export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseServiceKey } from '@/lib/supabase-config';

const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseServiceKey()
);

// High-confidence aliases mapping company / common names to canonical market tickers
const CANONICAL_ALIASES: Record<string, string> = {
  'MICROSOFT': 'MSFT',
  'APPLE': 'AAPL',
  'GOOGLE': 'GOOGL',
  'ALPHABET': 'GOOGL',
  'AMAZON': 'AMZN',
  'NVIDIA': 'NVDA',
  'TESLA': 'TSLA',
  'META': 'META',
  'FACEBOOK': 'META',
  'NETFLIX': 'NFLX',
  'BITCOIN': 'BTC-USD',
  'BTC': 'BTC-USD',
  'ETHEREUM': 'ETH-USD',
  'ETH': 'ETH-USD',
  'SOLANA': 'SOL-USD',
  'SOL': 'SOL-USD',
  'DOGECOIN': 'DOGE-USD',
  'DOGE': 'DOGE-USD',
  'GOLD': 'GC=F',
  'SILVER': 'SI=F',
  'OIL': 'CL=F',
  'CRUDE': 'CL=F',
  'SP500': 'SPY',
  'S&P500': 'SPY',
  'S&P': 'SPY',
  'DOW': 'DIA',
  'DOWJONES': 'DIA',
  'NASDAQ': 'QQQ',
  'RELIANCE': 'RELIANCE.NS',
  'TCS': 'TCS.NS',
  'INFY': 'INFY.NS',
  'INFOSYS': 'INFY.NS',
  'HDFC': 'HDFCBANK.NS',
  'HDFCBANK': 'HDFCBANK.NS',
  'NIFTY': '^NSEI',
  'SENSEX': '^BSESN',
};

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
    const aliasTicker = CANONICAL_ALIASES[upperQuery];

    // Build main search query
    let queryPromise;
    if (aliasTicker) {
      // Query both the alias ticker and matching rows
      queryPromise = supabase
        .from('asset_snapshots')
        .select('ticker, short_name, asset_class, price, market_cap, sector')
        .or(`ticker.eq.${aliasTicker},ticker.ilike.%${sanitized}%,short_name.ilike.%${sanitized}%`)
        .order('market_cap', { ascending: false, nullsFirst: false })
        .limit(limit + 4);
    } else {
      queryPromise = supabase
        .from('asset_snapshots')
        .select('ticker, short_name, asset_class, price, market_cap, sector')
        .or(`ticker.ilike.%${sanitized}%,short_name.ilike.%${sanitized}%`)
        .order('market_cap', { ascending: false, nullsFirst: false })
        .limit(limit + 4);
    }

    const { data, error } = await queryPromise;

    if (error) {
      console.error('Asset search query error:', error);
      return NextResponse.json({ query: cleanQuery, results: [], error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ query: cleanQuery, results: [] });
    }

    // Rank and sort results so the most relevant ticker comes first:
    // 1. Exact alias match (e.g. MSFT when typing MICROSOFT)
    // 2. Exact ticker match (e.g. AAPL when typing AAPL)
    // 3. Ticker starts with query
    // 4. Short name starts with query
    // 5. Sorted by market cap
    const scored = data.map((item: any) => {
      let score = 0;
      const t = item.ticker.toUpperCase();
      const n = (item.short_name || '').toUpperCase();

      if (aliasTicker && t === aliasTicker) score += 1000;
      if (t === upperQuery) score += 500;
      if (t.startsWith(upperQuery)) score += 200;
      if (n.startsWith(upperQuery)) score += 100;
      if (n.includes(upperQuery)) score += 50;

      // Higher market cap adds weight
      if (item.market_cap && item.market_cap > 0) {
        score += Math.min(Math.log10(item.market_cap) * 2, 30);
      }

      return { item, score };
    });

    scored.sort((a: any, b: any) => b.score - a.score);

    // Deduplicate and take top `limit`
    const seen = new Set<string>();
    const results: any[] = [];

    for (const { item } of scored) {
      if (seen.has(item.ticker)) continue;
      seen.add(item.ticker);
      results.push({
        ticker: item.ticker,
        short_name: item.short_name || item.ticker,
        asset_class: item.asset_class || 'Stock',
        price: item.price ? Number(item.price) : 0,
        market_cap: item.market_cap ? Number(item.market_cap) : null,
        sector: item.sector || null,
      });
      if (results.length >= limit) break;
    }

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
