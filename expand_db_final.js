require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const currencies = [
  "USD", "EUR", "JPY", "GBP", "AUD", "CAD", "CHF", "CNY", "HKD", "NZD",
  "SEK", "KRW", "SGD", "NOK", "MXN", "INR", "RUB", "ZAR", "TRY", "BRL",
  "TWD", "DKK", "PLN", "THB", "IDR", "HUF", "CZK", "ILS", "CLP", "PHP",
  "AED", "COP", "SAR", "MYR", "RON"
];

// Base rates against USD
const baseRates = {
  "USD": 1.0, "EUR": 1.08, "GBP": 1.27, "JPY": 1/150, "AUD": 0.65, "CAD": 0.73,
  "CHF": 1.13, "CNY": 0.14, "HKD": 0.13, "NZD": 0.60, "SEK": 0.095, "KRW": 0.00075,
  "SGD": 0.74, "NOK": 0.092, "MXN": 0.059, "INR": 0.012, "RUB": 0.011, "ZAR": 0.053,
  "TRY": 0.031, "BRL": 0.20, "TWD": 0.031, "DKK": 0.14, "PLN": 0.25, "THB": 0.027,
  "IDR": 0.000063, "HUF": 0.0028, "CZK": 0.043, "ILS": 0.27, "CLP": 0.0010, "PHP": 0.018,
  "AED": 0.27, "COP": 0.00026, "SAR": 0.27, "MYR": 0.21, "RON": 0.22
};

const commoditiesList = [
  { name: "Gold", price: 2350 }, { name: "Silver", price: 28 }, { name: "Oil WTI", price: 70 },
  { name: "Brent Crude", price: 74 }, { name: "Natural Gas", price: 2.50 }, { name: "Copper", price: 4.20 },
  { name: "Wheat", price: 5.50 }, { name: "Corn", price: 4.30 }, { name: "Soybeans", price: 11.50 },
  { name: "Coffee", price: 2.15 }, { name: "Sugar", price: 0.22 }, { name: "Cotton", price: 0.85 },
  { name: "Platinum", price: 950 }, { name: "Palladium", price: 1050 }, { name: "Zinc", price: 2500 },
  { name: "Nickel", price: 18000 }, { name: "Lead", price: 2100 }, { name: "Aluminum", price: 2400 },
  { name: "Cocoa", price: 8000 }, { name: "Lumber", price: 350 }
];

const indicesList = [
  { name: "S&P 500", price: 5500 }, { name: "NASDAQ", price: 17500 }, { name: "Dow Jones", price: 39000 },
  { name: "NIFTY 50", price: 25000 }, { name: "Sensex", price: 82000 }, { name: "FTSE 100", price: 8200 },
  { name: "DAX", price: 18500 }, { name: "Nikkei 225", price: 38000 }, { name: "CAC 40", price: 8100 },
  { name: "Hang Seng", price: 18500 }, { name: "Shanghai Composite", price: 3100 }, { name: "ASX 200", price: 7800 },
  { name: "KOSPI", price: 2700 }, { name: "TSX", price: 22000 }, { name: "Nifty Bank", price: 50000 }
];

function generateData(type, count) {
  const data = [];
  const now = new Date().toISOString();
  
  if (type === 'Forex') {
    let pairId = 0;
    for (let i = 0; i < currencies.length; i++) {
      for (let j = i + 1; j < currencies.length; j++) {
        const base = currencies[i];
        const quote = currencies[j];
        
        let rate;
        if (baseRates[base] && baseRates[quote]) {
            rate = baseRates[base] / baseRates[quote];
        } else {
            rate = 1.0;
        }

        const variance = 1 + (Math.random() * 0.02 - 0.01);
        const finalPrice = rate * variance;

        data.push({
          ticker: base + quote,
          asset_class: 'Forex',
          short_name: `${base}/${quote}`,
          price: finalPrice,
          market_cap: null,
          dividend_yield: null,
          beta: 0.05 + Math.random() * 0.1,
          sector: 'Currency',
          fetched_at: now,
          coin_id: null
        });
        pairId++;
      }
    }
  } else if (type === 'Bond') {
    for (let i = 0; i < count; i++) {
      const rndStr = Math.random().toString(36).substring(2, 8).toUpperCase();
      const sectorOptions = ['US Treasury', 'Corporate IG', 'Corporate HY', 'Municipal', 'Global Sovereign'];
      const sector = sectorOptions[i % sectorOptions.length];
      
      let price, dividend_yield;
      if (sector === 'US Treasury') {
        price = 98 + Math.random() * 4;
        dividend_yield = 0.04 + Math.random() * 0.01;
      } else if (sector === 'Corporate IG') {
        price = 95 + Math.random() * 10;
        dividend_yield = 0.05 + Math.random() * 0.015;
      } else if (sector === 'Corporate HY') {
        price = 85 + Math.random() * 20;
        dividend_yield = 0.07 + Math.random() * 0.03;
      } else if (sector === 'Municipal') {
        price = 99 + Math.random() * 3;
        dividend_yield = 0.03 + Math.random() * 0.015;
      } else {
        price = 90 + Math.random() * 15;
        dividend_yield = 0.04 + Math.random() * 0.03;
      }

      data.push({
        ticker: 'BND-' + rndStr,
        asset_class: 'Bond',
        short_name: sector + ' Bond ' + i,
        price: price,
        market_cap: null,
        dividend_yield: dividend_yield,
        beta: 0.1 + Math.random() * 0.3,
        sector: sector,
        fetched_at: now,
        coin_id: null
      });
    }
  } else if (type === 'Commodity') {
    for (let i = 0; i < count; i++) {
      const baseCmd = commoditiesList[i % commoditiesList.length];
      const variance = 1 + (Math.random() * 0.1 - 0.05);
      
      data.push({
        ticker: 'CMD-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        asset_class: 'Commodity',
        short_name: baseCmd.name + ' Contract ' + i,
        price: baseCmd.price * variance,
        market_cap: null,
        dividend_yield: null,
        beta: 0.5 + Math.random() * 1.0,
        sector: 'Commodity',
        fetched_at: now,
        coin_id: null
      });
    }
  } else if (type === 'REIT') {
    for (let i = 0; i < count; i++) {
      const sector = ['Commercial', 'Residential', 'Healthcare', 'Industrial'][i % 4];
      data.push({
        ticker: 'RET-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        asset_class: 'REIT',
        short_name: sector + ' Trust ' + i,
        price: 15 + Math.random() * 285,
        market_cap: 100000000 + Math.random() * 10000000000,
        dividend_yield: 0.03 + Math.random() * 0.09,
        beta: 0.5 + Math.random() * 0.7,
        sector: sector,
        fetched_at: now,
        coin_id: null
      });
    }
  } else if (type === 'Index') {
    for (let i = 0; i < count; i++) {
      const baseIdx = indicesList[i % indicesList.length];
      const variance = 1 + (Math.random() * 0.05 - 0.025);
      data.push({
        ticker: 'IDX-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        asset_class: 'Index',
        short_name: baseIdx.name + ' Tracker ' + i,
        price: baseIdx.price * variance,
        market_cap: null,
        dividend_yield: 0.01 + Math.random() * 0.02,
        beta: 1.0,
        sector: 'Broad Market',
        fetched_at: now,
        coin_id: null
      });
    }
  }
  return data;
}

async function insertInBatches(data) {
  const batchSize = 100;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const { error } = await supabase
      .from('asset_snapshots')
      .upsert(batch, { onConflict: 'ticker, asset_class, coin_id' });
    
    if (error) {
      console.error("Error inserting batch:", error);
    } else {
      console.log("Inserted " + (i + batch.length) + " of " + data.length + " " + data[0].asset_class + "s");
    }
  }
}

async function main() {
  console.log("Generating and inserting data...");
  const types = [
    { type: 'Bond', count: 3000 },
    { type: 'Commodity', count: 2000 },
    { type: 'REIT', count: 2000 },
    { type: 'Index', count: 2000 },
    { type: 'Forex', count: 0 } // count ignored for Forex, generates all pairs
  ];
  for (const t of types) {
    const data = generateData(t.type, t.count);
    await insertInBatches(data);
  }
  console.log("Done!");
}

main().catch(console.error);
