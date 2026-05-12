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
    }))
  ];

  return allAssets;
}
