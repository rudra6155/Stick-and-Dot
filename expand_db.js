const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const assets = [];

  // MORE FOREX (expanded from 20 to 35 currencies)
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD', 'CNY', 'INR', 'SGD', 'BRL', 'ZAR', 'MXN', 'SEK', 'NOK', 'KRW', 'TRY', 'RUB', 'HKD', 'PLN', 'THB', 'MYR', 'IDR', 'CZK', 'HUF', 'ILS', 'CLP', 'PHP', 'AED', 'COP', 'SAR', 'RON', 'PEN', 'KWD'];
  for (let i = 0; i < currencies.length; i++) {
    for (let j = i + 1; j < currencies.length; j++) {
      if (assets.length >= 1000) break; // Arbitrary cap if needed, let's just insert all 595 pairs
      const base = currencies[i];
      const quote = currencies[j];
      const ticker = `${base}${quote}=X`;
      assets.push({
        ticker,
        asset_class: 'Forex',
        short_name: `${base}/${quote}`,
        price: 0.5 + Math.random() * 150,
        market_cap: null,
        dividend_yield: 0,
        beta: 0,
        sector: 'Currency',
        fetched_at: new Date().toISOString()
      });
    }
  }

  // 1000 BONDS
  const bondTypes = ['US Treasury 10Y', 'Corporate High Yield', 'Muni Bond', 'Global Gov Bond', 'UK Gilt 5Y', 'EU Green Bond', 'Asian Sovereign', 'Emerging Market Debt', 'Investment Grade Corp', 'Zero Coupon Bond'];
  for (let i = 1; i <= 1000; i++) {
    const type = bondTypes[i % bondTypes.length];
    assets.push({
      ticker: `BOND-MEGA-${i}`,
      asset_class: 'Bond',
      short_name: `${type} ${Math.floor(Math.random() * 10) + 1}Y Series ${2000 + i}`,
      price: 80 + Math.random() * 40,
      market_cap: 1e9 + Math.random() * 50e9,
      dividend_yield: 0.01 + Math.random() * 0.07,
      beta: Math.random() * 0.6,
      sector: 'Fixed Income',
      fetched_at: new Date().toISOString()
    });
  }

  // 1000 COMMODITIES
  const comms = ['Gold', 'Silver', 'Oil (WTI)', 'Brent Crude', 'Natural Gas', 'Copper', 'Platinum', 'Palladium', 'Wheat', 'Corn', 'Soybeans', 'Coffee', 'Sugar', 'Cocoa', 'Cotton', 'Lumber', 'Lean Hogs', 'Live Cattle'];
  for (let i = 1; i <= 1000; i++) {
    const type = comms[i % comms.length];
    assets.push({
      ticker: `COMM-MEGA-${i}`,
      asset_class: 'Commodity',
      short_name: `${type} Futures ${['Mar', 'Jun', 'Sep', 'Dec'][i % 4]} ${2026 + (i % 5)}`,
      price: 10 + Math.random() * 3000,
      market_cap: null,
      dividend_yield: 0,
      beta: Math.random() * 2.0,
      sector: 'Commodity Futures',
      fetched_at: new Date().toISOString()
    });
  }

  // 1000 REIT
  const reitTypes = ['Commercial', 'Residential', 'Healthcare', 'Data Center', 'Industrial', 'Retail', 'Mortgage', 'Storage', 'Cell Tower'];
  for (let i = 1; i <= 1000; i++) {
    const type = reitTypes[i % reitTypes.length];
    assets.push({
      ticker: `REIT-MEGA-${i}`,
      asset_class: 'REIT',
      short_name: `${type} Property Trust ${i}`,
      price: 20 + Math.random() * 150,
      market_cap: 1e8 + Math.random() * 30e9,
      dividend_yield: 0.03 + Math.random() * 0.09,
      beta: 0.6 + Math.random() * 0.6,
      sector: 'Real Estate',
      fetched_at: new Date().toISOString()
    });
  }

  // 1000 INDEX
  const regions = ['Global', 'US', 'Europe', 'Asia Pacific', 'Emerging Markets', 'Nordic', 'Latin America', 'Frontier Markets'];
  const sectors = ['Tech', 'Healthcare', 'Financials', 'Energy', 'Consumer Discretionary', 'Utilities', 'Industrials', 'ESG'];
  for (let i = 1; i <= 1000; i++) {
    const region = regions[i % regions.length];
    const sector = sectors[i % sectors.length];
    assets.push({
      ticker: `IDX-MEGA-${i}`,
      asset_class: 'Index',
      short_name: `${region} ${sector} Index ${i}`,
      price: 500 + Math.random() * 5000,
      market_cap: null,
      dividend_yield: 0.01 + Math.random() * 0.04,
      beta: 1.0,
      sector: 'Market Index',
      fetched_at: new Date().toISOString()
    });
  }

  console.log(`Inserting ${assets.length} assets...`);
  
  // Upsert in batches of 100
  for (let i = 0; i < assets.length; i += 100) {
    const batch = assets.slice(i, i + 100);
    const { error } = await supabase.from('asset_snapshots').upsert(batch, { onConflict: 'ticker, asset_class, coin_id' });
    if (error) {
      console.error('Error inserting batch:', error);
    } else {
      console.log(`Inserted batch ${i / 100 + 1}`);
    }
  }

  console.log('Database mega upgrade complete.');
}

run();
