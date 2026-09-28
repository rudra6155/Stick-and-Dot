"use server";
import { requireEnv } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

// Service-role client — used for ALL server-side queries in this file.
// This intentionally has NO user session; it bypasses RLS via the service
// role key.  Every table queried here (asset_snapshots, price_history) is
// public read-only data, so RLS bypass is safe and necessary.
//
// ⚠️  NEVER create a per-module singleton with the anon key on the server.
//     The vanilla `createClient` stores tokens in-memory, which leaks one
//     user's session to the next request that hits the same process.
const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const supabasePubKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_vmS28KOUKoixto_OSU4SVw_IJmiTf4I';

// Primary admin client (uses service role key if present, otherwise publishable key)
const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceKey || supabasePubKey,
  { auth: { persistSession: false } }
);

// Fallback public client (always has valid read access to asset_snapshots)
const supabasePub = createClient(
  supabaseUrl,
  supabasePubKey,
  { auth: { persistSession: false } }
);

// Alias for readability — all queries default to admin client with public fallback
const supabase = supabaseAdmin;


export type Asset = {
  id: string;
  name: string;
  symbol: string;
  assetClass: string;
  price: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  peRatio: number | null;
  forwardPe: number | null;
  priceToBook: number | null;
  priceToSales: number | null;
  evToEbitda: number | null;
  dividendYield: number | null;
  earningsGrowth: number | null;
  revenueGrowth: number | null;
  profitMargins: number | null;
  high52Week: number;
  low52Week: number;
  ma50Day: number;
  ma200Day: number;
  beta: number | null;
  history: number[];
  change: string;
  isUp: boolean;
  sector: string;
  industry: string;
  country: string;
  exchange: string;
  shortName: string;
  longName: string;
  previousClose: number;
  enterpriseValue: number;
  pegRatio: number | null;
  dividendRate: number | null;
  payoutRatio: number | null;
  fiveYearAvgDividendYield: number | null;
  grossMargins: number | null;
  operatingMargins: number | null;
  returnOnEquity: number | null;
  returnOnAssets: number | null;
  totalRevenue: number;
  ebitda: number;
  totalDebt: number;
  freeCashflow: number;
  allTimeHigh: number;
  allTimeLow: number;
  sharesOutstanding: number;
  floatShares: number;
  sharesShort: number;
  heldPercentInsiders: number;
  heldPercentInstitutions: number;
  recommendationMean: number;
  targetMeanPrice: number;
  targetHighPrice: number;
  trailingEps: number;
  forwardEps: number;
  currency: string;
  website: string;
  longBusinessSummary: string;

  // FMP additional fields
  netIncome: number;
  operatingCashflow: number;
  capex: number;
  bookValuePerShare: number;
  revenuePerShare: number;
  debtToEquity: number;
  currentRatio: number;
  quickRatio: number;
  cashAndEquivalents: number;
  targetLowPrice: number;
  analystCount: number;

  // CoinGecko crypto fields
  marketCapRank: number;
  priceChange24h: number;
  priceChangePct24h: number;
  priceChange7d: number;
  priceChange30d: number;
  priceChange1y: number;
  high24h: number;
  low24h: number;
  ath: number;
  atl: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number;
  fullyDilutedValuation: number;
  developerScore: number;
  communityScore: number;
  liquidityScore: number;
  sentimentVotesUpPct: number;
  sentimentVotesDownPct: number;
  communityTwitterFollowers: number;
  communityRedditSubscribers: number;
};

const normalizeClass = (raw: unknown): string => {
  if (!raw) return 'US Stock';
  // DB rows are typed `any`, so a non-string value (number/boolean) could
  // reach here — coerce before calling string methods to avoid a crash.
  const str = typeof raw === 'string' ? raw : String(raw);
  const map: Record<string, string> = {
    'us stock': 'US Stock', 'stock': 'US Stock', 'stocks': 'US Stock',
    'equity': 'US Stock', 'equities': 'US Stock',
    'us tech': 'US Stock', 'us blue chip': 'US Stock',
    'etf': 'ETF', 'etfs': 'ETF',
    'reit': 'REIT', 'reits': 'REIT',
    'crypto': 'Crypto', 'cryptocurrency': 'Crypto',
    'commodity': 'Commodity', 'commodities': 'Commodity',
    'bond': 'Bond', 'bonds': 'Bond',
    'indian stock': 'Indian Stock', 'indian stocks': 'Indian Stock',
    'international': 'International',
    'forex': 'Forex',
    'index': 'Index', 'indices': 'Index',
  };
  return map[str.toLowerCase()] ?? str;
};

function inferCurrency(ticker: string, assetClass?: string): string {
  if (!ticker) return 'USD';
  if (assetClass === 'Indian Stock' || ticker.endsWith('.NS') || ticker.endsWith('.BO')) return 'INR';
  if (ticker.endsWith('.T')) return 'JPY';
  if (ticker.endsWith('.KS')) return 'KRW';
  if (ticker.endsWith('.L')) return 'GBP';
  if (ticker.endsWith('.DE') || ticker.endsWith('.PA')) return 'EUR';
  if (ticker.endsWith('.SA')) return 'BRL';
  if (ticker.endsWith('.BA')) return 'ARS';
  if (ticker.endsWith('.JK')) return 'IDR';
  if (ticker.endsWith('.MX')) return 'MXN';
  return 'USD';
}

const mapRowToAsset = (row: any) => ({
  id: `trad_${row.id || row.ticker}`,
  name: row.short_name || row.ticker,
  symbol: row.ticker,
  assetClass: normalizeClass(row.asset_class),
  price: row.price || 0,
  open: row.open || 0,
  dayHigh: row.day_high || 0,
  dayLow: row.day_low || 0,
  volume: row.volume || 0,
  avgVolume: row.avg_volume || 0,
  marketCap: row.market_cap || 0,
  peRatio: row.pe_ratio ?? null,
  forwardPe: row.forward_pe ?? null,
  priceToBook: row.price_to_book ?? null,
  priceToSales: row.price_to_sales ?? null,
  evToEbitda: row.ev_to_ebitda ?? null,
  dividendYield: row.dividend_yield ?? null,
  earningsGrowth: row.earnings_growth ?? null,
  revenueGrowth: row.revenue_growth ?? null,
  profitMargins: row.profit_margins ?? null,
  high52Week: row.high_52_week || 0,
  low52Week: row.low_52_week || 0,
  ma50Day: row.ma_50_day || 0,
  ma200Day: row.ma_200_day || 0,
  beta: row.beta ?? null,
  history: [],
  change: "0.00%",
  isUp: true,
  sector: row.sector || '',
  industry: row.industry || '',
  country: row.country || '',
  exchange: row.exchange || '',
  shortName: row.short_name || '',
  longName: row.long_name || '',
  previousClose: row.previous_close || 0,
  enterpriseValue: row.enterprise_value || 0,
  pegRatio: row.peg_ratio ?? null,
  dividendRate: row.dividend_rate ?? null,
  payoutRatio: row.payout_ratio ?? null,
  fiveYearAvgDividendYield: row.five_year_avg_dividend_yield ?? null,
  grossMargins: row.gross_margins ?? null,
  operatingMargins: row.operating_margins ?? null,
  returnOnEquity: row.return_on_equity ?? null,
  returnOnAssets: row.return_on_assets ?? null,
  totalRevenue: row.total_revenue || 0,
  ebitda: row.ebitda || 0,
  totalDebt: row.total_debt || 0,
  freeCashflow: row.free_cashflow || 0,
  allTimeHigh: row.all_time_high || 0,
  allTimeLow: row.all_time_low || 0,
  sharesOutstanding: row.shares_outstanding || 0,
  floatShares: row.float_shares || 0,
  sharesShort: row.shares_short || 0,
  heldPercentInsiders: row.held_percent_insiders || 0,
  heldPercentInstitutions: row.held_percent_institutions || 0,
  recommendationMean: row.recommendation_mean || 0,
  targetMeanPrice: row.target_mean_price || 0,
  targetHighPrice: row.target_high_price || 0,
  trailingEps: row.trailing_eps || 0,
  forwardEps: row.forward_eps || 0,
  currency: row.currency || inferCurrency(row.ticker, row.asset_class),
  website: row.website || '',
  longBusinessSummary: row.long_business_summary || '',

  // FMP additional fields
  netIncome: row.net_income || 0,
  operatingCashflow: row.operating_cashflow || 0,
  capex: row.capex || 0,
  bookValuePerShare: row.book_value_per_share || 0,
  revenuePerShare: row.revenue_per_share || 0,
  debtToEquity: row.debt_to_equity || 0,
  currentRatio: row.current_ratio || 0,
  quickRatio: row.quick_ratio || 0,
  cashAndEquivalents: row.cash_and_equivalents || 0,
  targetLowPrice: row.target_low_price || 0,
  analystCount: row.analyst_count || 0,

  // CoinGecko crypto fields
  marketCapRank: row.market_cap_rank || 0,
  priceChange24h: row.price_change_24h || 0,
  priceChangePct24h: row.price_change_pct_24h || 0,
  priceChange7d: row.price_change_7d || 0,
  priceChange30d: row.price_change_30d || 0,
  priceChange1y: row.price_change_1y || 0,
  high24h: row.high_24h || 0,
  low24h: row.low_24h || 0,
  ath: row.ath || 0,
  atl: row.atl || 0,
  circulatingSupply: row.circulating_supply || 0,
  totalSupply: row.total_supply || 0,
  maxSupply: row.max_supply || 0,
  fullyDilutedValuation: row.fully_diluted_valuation || 0,
  developerScore: row.developer_score || 0,
  communityScore: row.community_score || 0,
  liquidityScore: row.liquidity_score || 0,
  sentimentVotesUpPct: row.sentiment_votes_up_pct || 0,
  sentimentVotesDownPct: row.sentiment_votes_down_pct || 0,
  communityTwitterFollowers: row.community_twitter_followers || 0,
  communityRedditSubscribers: row.community_reddit_subscribers || 0,
});

export async function fetchAssetsByTickers(tickers: string[]): Promise<Asset[]> {
  if (!tickers || tickers.length === 0) return [];

  let data: any[] | null = null;
  const { data: adminData, error: adminErr } = await supabaseAdmin
    .from('asset_snapshots')
    .select('*')
    .in('ticker', tickers);

  if (!adminErr && adminData && adminData.length > 0) {
    data = adminData;
  } else {
    if (adminErr) console.warn('fetchAssetsByTickers admin query error, trying pub client:', adminErr.message);
    const { data: pubData, error: pubErr } = await supabasePub
      .from('asset_snapshots')
      .select('*')
      .in('ticker', tickers);
    if (!pubErr && pubData) {
      data = pubData;
    } else if (pubErr) {
      console.error('fetchAssetsByTickers pub query failed:', pubErr.message);
    }
  }

  // Deduplicate by ticker, preferring row with sector/details or US Stock
  const tickerMap = new Map<string, any>();
  for (const row of data || []) {
    const existing = tickerMap.get(row.ticker);
    if (!existing) {
      tickerMap.set(row.ticker, row);
    } else {
      if (row.asset_class === 'US Stock' || (row.sector && !existing.sector)) {
        tickerMap.set(row.ticker, row);
      }
    }
  }

  const mappedAssets: Asset[] = Array.from(tickerMap.values()).map(mapRowToAsset);
  await enrichAssetsWithHistory(mappedAssets).catch(() => {});
  return mappedAssets;
}

export async function fetchAssetsPaginated(params: {
  limit: number;
  offset: number;
  searchQuery: string;
  activeClass: string;
  activeSector: string;
  sortBy: string;
  sortDir?: 'asc' | 'desc';
}): Promise<{ assets: Asset[]; totalCount: number }> {
  try {
    const safeLimit = Math.min(Math.max(params.limit, 1), 100);
    const safeOffset = Math.max(Number(params.offset) || 0, 0);

    const buildQuery = (client: any) => {
      let q = client
        .from('asset_snapshots')
        .select('*', { count: 'exact' });

      if (params.activeClass !== 'All') {
        if (params.activeClass === 'Stock' || params.activeClass === 'US Stock') {
          q = q.in('asset_class', ['US Stock', 'Stock', 'Equity']);
        } else {
          q = q.eq('asset_class', params.activeClass);
        }
      }
      if ((params.activeClass === 'US Stock' || params.activeClass === 'Stock') && params.activeSector !== 'All Sectors') {
        q = q.eq('sector', params.activeSector);
      }

      if (typeof params.searchQuery === 'string' && params.searchQuery.trim() !== '') {
        const queryStr = params.searchQuery.trim().replace(/[%_]/g, '\\$&').replace(/[,()]/g, '');
        q = q.or(`ticker.ilike.%${queryStr}%,short_name.ilike.%${queryStr}%`, { referencedTable: undefined });
      }

      const sortMap: Record<string, string> = {
        'Market Cap': 'market_cap',
        'Price': 'price',
        'Volume': 'volume',
        'P/E': 'pe_ratio',
        'Div Yield': 'dividend_yield',
        '52W High': 'high_52_week',
        'Beta': 'beta'
      };
      const sortCol = sortMap[params.sortBy] ?? 'market_cap';
      if (sortCol === 'market_cap') {
        q = q.lt('market_cap', 6000000000000);
        // Protect default sort and US Stock views from foreign unadjusted local currencies
        if (params.activeClass === 'All' || params.activeClass === 'US Stock' || params.activeClass === 'Stock') {
          q = q.not('ticker', 'like', '%.%');
        }
      }
      q = q.order(sortCol, { ascending: params.sortDir === 'asc', nullsFirst: false });
      q = q.order('ticker', { ascending: true });
      q = q.range(safeOffset, safeOffset + safeLimit - 1);
      return q;
    };

    let data: any[] | null = null;
    let count: number | null = null;

    // First attempt: admin client
    const { data: adminData, count: adminCount, error: adminErr } = await buildQuery(supabaseAdmin);
    if (!adminErr && adminData) {
      data = adminData;
      count = adminCount;
    } else {
      if (adminErr) console.warn('fetchAssetsPaginated admin query error, falling back to public client:', adminErr.message);
      // Fallback: public client
      const { data: pubData, count: pubCount, error: pubErr } = await buildQuery(supabasePub);
      if (!pubErr && pubData) {
        data = pubData;
        count = pubCount;
      } else {
        console.error('fetchAssetsPaginated pub query error:', pubErr?.message);
      }
    }

    const mappedAssets: Asset[] = (data || []).map(mapRowToAsset);

    // Bounded sparkline history enrichment
    await enrichAssetsWithHistory(mappedAssets).catch((err) =>
      console.error('enrichAssetsWithHistory error:', err)
    );

    return {
      assets: mappedAssets,
      totalCount: count ?? mappedAssets.length
    };
  } catch (err: any) {
    console.error('fetchAssetsPaginated caught error:', err?.message || err);
    return {
      assets: [],
      totalCount: 0
    };
  }
}

export async function fetchAssetClassCounts(): Promise<Record<string, number>> {
  try {
    return await unstable_cache(
      async () => {
        const assetClasses = ['Crypto', 'US Stock', 'ETF', 'REIT', 'Commodity', 'Bond', 'Indian Stock', 'International', 'Forex', 'Index', 'Equity'];
        const counts: Record<string, number> = { All: 0 };
        
        await Promise.all(assetClasses.map(async (cls) => {
          const { count, error } = await supabase
            .from('asset_snapshots')
            .select('*', { count: 'exact', head: true })
            .eq('asset_class', cls);
            
          if (error) {
            throw new Error(`Count failed for ${cls}: ${error.message}`);
          }
          if (count !== null) {
            counts[cls] = count;
            counts['All'] += count;
          }
        }));

        // Populate 'Stock' for any UI component looking up counts['Stock']
        counts['Stock'] = (counts['US Stock'] || 0) + (counts['Equity'] || 0);

        if (counts.All === 0) {
          throw new Error('All asset class counts returned 0, likely temporary DB outage');
        }

        return counts;
      },
      ['asset-class-counts'],
      { revalidate: 3600 } // Cache for 1 hour
    )();
  } catch (err: any) {
    console.warn('fetchAssetClassCounts error during fetch/prerender, using fallback counts:', err?.message || err);
    return {
      All: 202302,
      'Equity': 70426,
      'Index': 33226,
      'International': 18732,
      'Bond': 16181,
      'Crypto': 15262,
      'Indian Stock': 13363,
      'US Stock': 10886,
      'Stock': 81312,
      'Commodity': 8962,
      'REIT': 5895,
      'Forex': 4832,
      'ETF': 4537,
    };
  }
}

export async function fetchTickerTapeAssets(): Promise<Asset[]> {
  try {
    const fetchWithClient = (client: any) =>
      Promise.all([
        client
          .from('asset_snapshots')
          .select('*')
          .in('asset_class', ['US Stock', 'ETF'])
          .not('ticker', 'like', '%.%')
          .gt('market_cap', 0)
          .lt('market_cap', 6000000000000)
          .order('market_cap', { ascending: false, nullsFirst: false })
          .limit(40),
        client
          .from('asset_snapshots')
          .select('*')
          .eq('asset_class', 'Crypto')
          .gt('market_cap', 0)
          .order('market_cap', { ascending: false, nullsFirst: false })
          .limit(10),
        client
          .from('asset_snapshots')
          .select('*')
          .eq('asset_class', 'Forex')
          .gt('price', 0)
          .limit(10)
      ]);

    let [equitiesRes, cryptoRes, forexRes] = await fetchWithClient(supabaseAdmin);
    if (!equitiesRes.data || equitiesRes.data.length === 0) {
      [equitiesRes, cryptoRes, forexRes] = await fetchWithClient(supabasePub);
    }

    const seenTickers = new Set<string>();
    const uniqueRows: any[] = [];

    // Up to 18 top Equities/ETFs
    for (const row of equitiesRes.data || []) {
      if (!seenTickers.has(row.ticker)) {
        seenTickers.add(row.ticker);
        uniqueRows.push(row);
        if (uniqueRows.length >= 18) break;
      }
    }
    // Up to 6 top Cryptos
    for (const row of cryptoRes.data || []) {
      if (!seenTickers.has(row.ticker)) {
        seenTickers.add(row.ticker);
        uniqueRows.push(row);
        if (uniqueRows.length >= 24) break;
      }
    }
    // Up to 6 top Forex pairs
    for (const row of forexRes.data || []) {
      if (!seenTickers.has(row.ticker)) {
        seenTickers.add(row.ticker);
        uniqueRows.push(row);
        if (uniqueRows.length >= 30) break;
      }
    }

    const mappedAssets: Asset[] = uniqueRows.map(mapRowToAsset);
    await enrichAssetsWithHistory(mappedAssets);
    return mappedAssets;
  } catch (error) {
    console.error('Error fetching ticker tape assets:', error);
    return [];
  }
}

async function enrichAssetsWithHistory(assets: Asset[]) {
  if (assets.length === 0) return assets;
  const tickers = assets.map(a => a.symbol);

  // price_history has RLS enabled with no public SELECT policy, so this must
  // go through supabaseAdmin (service role) rather than the anon `supabase` client.
  // Instead of up to 100 individual parallel queries (N+1), fetch all history in a single bounded query.
  let historyData: { ticker: string; date: string; close: number }[] = [];
  try {
    const { data, error } = await supabaseAdmin
      .from('price_history')
      .select('ticker, date, close')
      .in('ticker', tickers)
      .order('date', { ascending: false })
      .limit(Math.min(tickers.length * 7, 1000));

    if (error) {
      console.error('enrichAssetsWithHistory: query error:', error.message);
      return assets;
    }
    historyData = data || [];
  } catch (err) {
    console.error('enrichAssetsWithHistory: query threw:', err);
    return assets;
  }

  if (historyData && historyData.length > 0) {
    const histByTicker: Record<string, { date: string, close: number }[]> = {};
    for (const row of historyData) {
      if (!histByTicker[row.ticker]) histByTicker[row.ticker] = [];
      // Keep only up to 7 most recent entries per ticker
      if (histByTicker[row.ticker].length < 7) {
        histByTicker[row.ticker].push(row);
      }
    }

    assets.forEach(asset => {
      const h = histByTicker[asset.symbol] || [];
      if (h.length < 2) {
        asset.history = [];
        asset.change = "0.00%";
        asset.isUp = true;
        return;
      }

      // Reverse so oldest-first for sparkline display and calculation
      const chronological = [...h].reverse();
      asset.history = chronological.map(r => r.close);

      const first = chronological[0].close;
      const last = chronological[chronological.length - 1].close;
      const changePct = (first != null && first !== 0) ? ((last - first) / first) * 100 : 0;

      asset.change = (Math.abs(changePct)).toFixed(2) + "%";
      asset.isUp = changePct >= 0;
    });
  }
  return assets;
}
