"use server";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

// Service-role client for price_history (see enrichAssetsWithHistory below).
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

const normalizeClass = (raw: string | undefined): string => {
  if (!raw) return 'Stock';
  const map: Record<string, string> = {
    'stock': 'Stock', 'stocks': 'Stock',
    'us tech': 'Stock', 'us blue chip': 'Stock',
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
  return map[raw.toLowerCase()] ?? raw;
};

export async function fetchAssetsPaginated(params: {
  limit: number;
  offset: number;
  searchQuery: string;
  activeClass: string;
  activeSector: string;
  sortBy: string;
  sortDir?: 'asc' | 'desc';
}): Promise<{ assets: Asset[]; totalCount: number }> {
  const safeLimit = Math.min(Math.max(params.limit, 1), 100);
  let query = supabase
    .from('asset_snapshots')
    .select('*', { count: 'exact' });

  if (params.activeClass !== 'All') {
    query = query.eq('asset_class', params.activeClass);
  }
  if (params.activeClass === 'Stock' && params.activeSector !== 'All Sectors') {
    query = query.eq('sector', params.activeSector);
  }

  if (params.searchQuery.trim() !== '') {
    const q = params.searchQuery.trim().replace(/[%_]/g, '\\$&').replace(/[,().]/g, '');
    query = query.or(`ticker.ilike.%${q}%,short_name.ilike.%${q}%`, { referencedTable: undefined });
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
  query = query.order(sortCol, { ascending: params.sortDir === 'asc', nullsFirst: false });

  query = query.range(params.offset, params.offset + safeLimit - 1);

  const { data, count, error } = await query;
  if (error) {
    console.error('Supabase query error:', error);
    throw new Error(error.message);
  }

  const mappedAssets: Asset[] = (data || []).map((row: any) => ({
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
    currency: row.currency || '',
    website: row.website || '',
    longBusinessSummary: row.long_business_summary || '',
  }));

  await enrichAssetsWithHistory(mappedAssets);

  return {
    assets: mappedAssets,
    totalCount: count || 0
  };
}

export async function fetchAssetClassCounts(): Promise<Record<string, number>> {
  return unstable_cache(
    async () => {
      const { data, error } = await supabase.rpc('get_asset_class_counts');
      
      const counts: Record<string, number> = { All: 0 };
      
      if (!error && data) {
        data.forEach((row: any) => {
          counts[row.asset_class] = row.count;
          counts['All'] += row.count;
        });
      }
      
      return counts;
    },
    ['asset-class-counts'],
    { revalidate: 3600 } // Cache for 1 hour
  )();
}

export async function fetchTickerTapeAssets(): Promise<Asset[]> {
  const { data, error } = await supabase
    .from('asset_snapshots')
    .select('*')
    .order('market_cap', { ascending: false, nullsFirst: false })
    .limit(30);

  if (error) {
    console.error('Error fetching ticker tape assets:', error);
    return [];
  }

  const mappedAssets = (data || []).map((row: any) => ({
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
    currency: row.currency || '',
    website: row.website || '',
    longBusinessSummary: row.long_business_summary || '',
  }));

  await enrichAssetsWithHistory(mappedAssets);
  return mappedAssets;
}

async function enrichAssetsWithHistory(assets: Asset[]) {
  if (assets.length === 0) return assets;
  const tickers = assets.map(a => a.symbol);
  
  // price_history has RLS enabled with no public SELECT policy, so this must
  // go through supabaseAdmin (service role) rather than the anon `supabase` client.
  // Coverage isn't a uniform panel (some tickers have far more/less recent data
  // than others), so we can't safely cap with a single global LIMIT — the
  // .in('ticker', tickers) filter already bounds the result set per page,
  // and we take the last 7 rows per ticker in JS below.
  const { data: historyData, error: histError } = await supabaseAdmin
    .from('price_history')
    .select('ticker, date, close')
    .in('ticker', tickers)
    .order('date', { ascending: true });

  if (!histError && historyData) {
    const histByTicker: Record<string, { date: string, close: number }[]> = {};
    historyData.forEach(row => {
      if (!histByTicker[row.ticker]) histByTicker[row.ticker] = [];
      histByTicker[row.ticker].push(row);
    });

    assets.forEach(asset => {
      const h = histByTicker[asset.symbol] || [];
      if (h.length < 2) {
        asset.history = [];
        asset.change = "0.00%";
        asset.isUp = true;
        return;
      }
      
      const recentHist = h.slice(-7);
      asset.history = recentHist.map(r => r.close);
      
      const first = recentHist[0].close;
      const last = recentHist[recentHist.length - 1].close;
      const changePct = first !== 0 ? ((last - first) / first) * 100 : 0;
      
      asset.change = (Math.abs(changePct)).toFixed(2) + "%";
      asset.isUp = changePct >= 0;
    });
  }
  return assets;
}
