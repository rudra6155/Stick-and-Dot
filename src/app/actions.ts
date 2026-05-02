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
  
  const validCryptoRows = Array.from(latestCrypto.values()).filter((row: any) => row.high_52_week !== null);
  const validTraditionalRows = Array.from(latestTraditional.values()).filter((row: any) => row.high_52_week !== null);
  
  const allAssets: Asset[] = [
    ...validCryptoRows.map((row: any) => ({
      id: `crypto_${row.id}`,
      name: row.asset_name,
      symbol: row.asset_name === 'Bitcoin' ? 'BTC' : row.asset_name === 'Ethereum' ? 'ETH' : row.asset_name,
      assetClass: 'Crypto',
      price: row.price,
      volume: row.volume,
      marketCap: row.market_cap,
      high52Week: row.high_52_week,
      low52Week: row.low_52_week,
      peRatio: row.pe_ratio,
      dividendYield: row.dividend_yield,
      ma50Day: row.ma_50_day,
      ma200Day: row.ma_200_day,
      beta: row.beta,
      history: Array.from({ length: 7 }, () => row.price * (1 + (Math.random() * 0.1 - 0.05))),
      change: ((Math.random() * 4) - 2).toFixed(1) + "%",
      isUp: Math.random() > 0.5,
    })),
    ...validTraditionalRows.map((row: any) => {
      let assetClass = row.asset_class;
      if (assetClass === 'Commodity') assetClass = 'Gold';
      
      return {
        id: `trad_${row.id}`,
        name: row.ticker,
        symbol: row.ticker,
        assetClass: assetClass === 'Commodity' ? 'Gold' : assetClass,
        price: row.price,
        volume: row.volume,
        marketCap: row.market_cap,
        high52Week: row.high_52_week,
        low52Week: row.low_52_week,
        peRatio: row.pe_ratio,
        dividendYield: row.dividend_yield,
        ma50Day: row.ma_50_day,
        ma200Day: row.ma_200_day,
        beta: row.beta,
        history: Array.from({ length: 7 }, () => row.price * (1 + (Math.random() * 0.1 - 0.05))),
        change: ((Math.random() * 4) - 2).toFixed(1) + "%",
        isUp: Math.random() > 0.5,
      };
    })
  ];
  
  return allAssets;
}
