"use server";

import Database from "better-sqlite3";
import path from "path";

// In production, this would be more robust. For now, it points to the root directory
const dbPath = path.join(process.cwd(), "finance_hub.db");

export async function fetchAllAssets() {
  const db = new Database(dbPath);
  
  try {
    const cryptoRows = db.prepare("SELECT * FROM crypto_assets").all() as any[];
    const traditionalRows = db.prepare("SELECT * FROM traditional_assets").all() as any[];
    
    // Normalize data
    const assets = [
      ...cryptoRows.map(row => ({
        id: `crypto_${row.id}`,
        name: row.asset_name,
        symbol: row.asset_name === 'Bitcoin' ? 'BTC' : row.asset_name === 'Ethereum' ? 'ETH' : row.asset_name,
        assetClass: 'Crypto',
        price: row.price,
        volume: row.volume,
        marketCap: row.market_cap,
        // Mock history since it's not in the DB
        history: Array.from({ length: 7 }, () => row.price * (1 + (Math.random() * 0.1 - 0.05))),
        change: ((Math.random() * 4) - 2).toFixed(1) + "%",
        isUp: Math.random() > 0.5,
      })),
      ...traditionalRows.map(row => {
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
          // Mock history
          history: Array.from({ length: 7 }, () => row.price * (1 + (Math.random() * 0.1 - 0.05))),
          change: ((Math.random() * 4) - 2).toFixed(1) + "%",
          isUp: Math.random() > 0.5,
        };
      })
    ];
    
    return assets;
  } finally {
    db.close();
  }
}
