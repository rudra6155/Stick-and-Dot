"use server";

import marketData from '@/data/marketData.json';

export type Asset = {
  id: string;
  name: string;
  symbol: string;
  assetClass: string;
  price: number;
  volume: number;
  marketCap: number;
  high52Week: number;
  low52Week: number;
  peRatio: number;
  dividendYield: number;
  ma50Day: number;
  ma200Day: number;
  beta: number;
  history: number[];
  change: string;
  isUp: boolean;
  sector: string;
  industry: string;
};

export async function fetchAllAssets(): Promise<Asset[]> {
  const cryptoRows = marketData.crypto_assets || [];
  const traditionalRows = marketData.traditional_assets || [];
  
  // Deduplicate by highest id
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
      volume: row.volume || 0,
      marketCap: row.market_cap || 0,
      high52Week: row.high_52_week || 0,
      low52Week: row.low_52_week || 0,
      peRatio: row.pe_ratio || 0,
      dividendYield: row.dividend_yield || 0,
      ma50Day: row.ma_50_day || 0,
      ma200Day: row.ma_200_day || 0,
      beta: row.beta || 0,
      history: Array.from({ length: 7 }, () => (row.price || 0) * (1 + (Math.random() * 0.1 - 0.05))),
      change: ((Math.random() * 4) - 2).toFixed(1) + "%",
      isUp: Math.random() > 0.5,
      sector: row.sector || '',
      industry: row.industry || '',
    })),
    ...validTraditionalRows.map((row: any) => {
      let assetClass = row.asset_class;
      if (assetClass === 'Commodity' && row.ticker === 'GC=F') assetClass = 'Gold';
      if (assetClass === 'US Tech' || assetClass === 'US Blue Chip') assetClass = 'Stock';
      
      return {
        id: `trad_${row.id}`,
        name: row.ticker,
        symbol: row.ticker,
        assetClass: assetClass,
        price: row.price || 0,
        volume: row.volume || 0,
        marketCap: row.market_cap || 0,
        high52Week: row.high_52_week || 0,
        low52Week: row.low_52_week || 0,
        peRatio: row.pe_ratio || 0,
        dividendYield: row.dividend_yield || 0,
        ma50Day: row.ma_50_day || 0,
        ma200Day: row.ma_200_day || 0,
        beta: row.beta || 0,
        history: Array.from({ length: 7 }, () => (row.price || 0) * (1 + (Math.random() * 0.1 - 0.05))),
        change: ((Math.random() * 4) - 2).toFixed(1) + "%",
        isUp: Math.random() > 0.5,
        sector: row.sector || '',
        industry: row.industry || '',
      };
    })
  ];
  
  return allAssets;
}
