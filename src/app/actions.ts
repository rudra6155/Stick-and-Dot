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

  const latestCrypto = new Map();
  cryptoRows.forEach((row: any) => {
    if (!latestCrypto.has(row.asset_name) || latestCrypto.get(row.asset_name).id < row.id) {
      latestCrypto.set(row.asset_name, row);
    }
  });
  const latestTraditional = new Map();
  traditionalRows.forEach((row: any) => {
    if (!latestTraditional.has(row.ticker) || latestTraditional.get(row.ticker).id < row.id) {
      latestTraditional.set(row.ticker, row);
    }
  });

  const validCryptoRows = Array.from(latestCrypto.values());
  const validTraditionalRows = Array.from(latestTraditional.values());

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
    }))
  ];

  return allAssets;
}
