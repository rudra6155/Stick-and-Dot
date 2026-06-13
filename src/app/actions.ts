"use server";
import marketData from '@/data/marketData.json';

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
  peRatio: number;
  forwardPe: number;
  priceToBook: number;
  priceToSales: number;
  evToEbitda: number;
  dividendYield: number;
  earningsGrowth: number;
  revenueGrowth: number;
  profitMargins: number;
  high52Week: number;
  low52Week: number;
  ma50Day: number;
  ma200Day: number;
  beta: number;
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
  pegRatio: number;
  dividendRate: number;
  payoutRatio: number;
  fiveYearAvgDividendYield: number;
  grossMargins: number;
  operatingMargins: number;
  returnOnEquity: number;
  returnOnAssets: number;
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
  };
  return map[raw.toLowerCase()] ?? raw;
};

export async function fetchAllAssets(): Promise<Asset[]> {
  const cryptoRows = (marketData as any).crypto_assets || [];
  const traditionalRows = (marketData as any).traditional_assets || [];

  const validCryptoRows = cryptoRows;
  const validTraditionalRows = traditionalRows;

  const allAssets: Asset[] = [
    ...validCryptoRows.map((row: any) => ({
      id: `crypto_${row.id}`,
      name: row.asset_name,
      symbol: row.symbol || row.asset_name,
      assetClass: 'Crypto',
      price: row.price || 0,
      open: row.open || 0,
      dayHigh: row.day_high || 0,
      dayLow: row.day_low || 0,
      volume: row.volume || 0,
      avgVolume: row.avg_volume || 0,
      marketCap: row.market_cap || 0,
      peRatio: row.pe_ratio || 0,
      forwardPe: row.forward_pe || 0,
      priceToBook: row.price_to_book || 0,
      priceToSales: row.price_to_sales || 0,
      evToEbitda: row.ev_to_ebitda || 0,
      dividendYield: row.dividend_yield || 0,
      earningsGrowth: row.earnings_growth || 0,
      revenueGrowth: row.revenue_growth || 0,
      profitMargins: row.profit_margins || 0,
      high52Week: row.high_52_week || 0,
      low52Week: row.low_52_week || 0,
      ma50Day: row.ma_50_day || 0,
      ma200Day: row.ma_200_day || 0,
      beta: row.beta || 0,
      history: Array.from({ length: 7 }, () => (row.price || 0) * (1 + (Math.random() * 0.1 - 0.05))),
      change: ((Math.random() * 4) - 2).toFixed(1) + "%",
      isUp: Math.random() > 0.5,
      sector: row.sector || '',
      industry: row.industry || '',
      country: row.country || '',
      exchange: row.exchange || '',
      shortName: row.short_name || '',
      longName: row.long_name || '',
      previousClose: row.previous_close || 0,
      enterpriseValue: row.enterprise_value || 0,
      pegRatio: row.peg_ratio || 0,
      dividendRate: row.dividend_rate || 0,
      payoutRatio: row.payout_ratio || 0,
      fiveYearAvgDividendYield: row.five_year_avg_dividend_yield || 0,
      grossMargins: row.gross_margins || 0,
      operatingMargins: row.operating_margins || 0,
      returnOnEquity: row.return_on_equity || 0,
      returnOnAssets: row.return_on_assets || 0,
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
    })),
    ...validTraditionalRows.map((row: any) => ({
      id: `trad_${row.id}`,
      name: row.ticker,
      symbol: row.ticker,
      assetClass: normalizeClass(row.asset_class),
      price: row.price || 0,
      open: row.open || 0,
      dayHigh: row.day_high || 0,
      dayLow: row.day_low || 0,
      volume: row.volume || 0,
      avgVolume: row.avg_volume || 0,
      marketCap: row.market_cap || 0,
      peRatio: row.pe_ratio || 0,
      forwardPe: row.forward_pe || 0,
      priceToBook: row.price_to_book || 0,
      priceToSales: row.price_to_sales || 0,
      evToEbitda: row.ev_to_ebitda || 0,
      dividendYield: row.dividend_yield || 0,
      earningsGrowth: row.earnings_growth || 0,
      revenueGrowth: row.revenue_growth || 0,
      profitMargins: row.profit_margins || 0,
      high52Week: row.high_52_week || 0,
      low52Week: row.low_52_week || 0,
      ma50Day: row.ma_50_day || 0,
      ma200Day: row.ma_200_day || 0,
      beta: row.beta || 0,
      history: Array.from({ length: 7 }, () => (row.price || 0) * (1 + (Math.random() * 0.1 - 0.05))),
      change: ((Math.random() * 4) - 2).toFixed(1) + "%",
      isUp: Math.random() > 0.5,
      sector: row.sector || '',
      industry: row.industry || '',
      country: row.country || '',
      exchange: row.exchange || '',
      shortName: row.short_name || '',
      longName: row.long_name || '',
      previousClose: row.previous_close || 0,
      enterpriseValue: row.enterprise_value || 0,
      pegRatio: row.peg_ratio || 0,
      dividendRate: row.dividend_rate || 0,
      payoutRatio: row.payout_ratio || 0,
      fiveYearAvgDividendYield: row.five_year_avg_dividend_yield || 0,
      grossMargins: row.gross_margins || 0,
      operatingMargins: row.operating_margins || 0,
      returnOnEquity: row.return_on_equity || 0,
      returnOnAssets: row.return_on_assets || 0,
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
    }))
  ];

  return allAssets;
}
