"use server";

import fs from "fs";
import path from "path";

export async function fetchAllAssets() {
  // Read static JSON file instead of querying SQLite
  const jsonPath = path.join(process.cwd(), "src/data/marketData.json");
  const rawData = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(rawData);
  
  const cryptoRows = data.crypto_assets || [];
  const traditionalRows = data.traditional_assets || [];
  
  // Normalize data
  const assets = [
    ...cryptoRows.map((row: any) => ({
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
      // Mock history since it's not in the DB
      history: Array.from({ length: 7 }, () => row.price * (1 + (Math.random() * 0.1 - 0.05))),
      change: ((Math.random() * 4) - 2).toFixed(1) + "%",
      isUp: Math.random() > 0.5,
    })),
    ...traditionalRows.map((row: any) => {
      let assetClass = row.asset_class;
      if (assetClass === 'Commodity') assetClass = 'Gold'; // Simplify based on prompt
      
      return {
        id: `trad_${row.id}`,
        name: row.ticker,
        symbol: row.ticker,
        assetClass: assetClass === 'Commodity' ? 'Gold' : assetClass, // e.g. ETF, REIT
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
        // Mock history
        history: Array.from({ length: 7 }, () => row.price * (1 + (Math.random() * 0.1 - 0.05))),
        change: ((Math.random() * 4) - 2).toFixed(1) + "%",
        isUp: Math.random() > 0.5,
      };
    })
  ];
  
  return assets;
}
