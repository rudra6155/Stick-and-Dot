require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const currencies = [
  "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNH", "HKD", "NZD", 
  "SEK", "KRW", "SGD", "NOK", "MXN", "INR", "RUB", "ZAR", "TRY", "BRL", 
  "TWD", "DKK", "PLN", "THB", "IDR", "HUF", "CZK", "ILS", "CLP", "PHP", 
  "AED", "COP", "SAR", "MYR", "RON"
];

async function pump() {
  console.log("Pumping Forex...");
  const forexPayloads = [];
  for (let i = 0; i < currencies.length; i++) {
    for (let j = 0; j < currencies.length; j++) {
      if (i !== j) {
        const pair = `${currencies[i]}${currencies[j]}=X`;
        forexPayloads.push({
          ticker: pair,
          name: `${currencies[i]}/${currencies[j]} Exchange Rate`,
          price: 1.0 + (Math.random() * 0.5), // Temporary, daemon will overwrite if real
          market_cap: null,
          volume_24h: 1000000 + Math.floor(Math.random() * 10000000),
          asset_class: 'Forex',
          fetched_at: new Date().toISOString(),
          revenue_growth: (Math.random() * 0.1) - 0.05
        });
      }
    }
  }

  // Insert in batches
  for (let i = 0; i < forexPayloads.length; i += 500) {
    const batch = forexPayloads.slice(i, i + 500);
    await supabase.from('asset_snapshots').upsert(batch, { onConflict: 'ticker, asset_class, coin_id' });
  }
  console.log(`Inserted ${forexPayloads.length} Forex pairs.`);

  console.log("Pumping Bonds...");
  // Let's generate 2000 bond mutual fund tickers (usually 5 letters ending in X)
  const letters = "ABCDEFGHIJKLMNOPQRSTUVW";
  const bondPayloads = [];
  for (let i = 0; i < 2000; i++) {
    let ticker = "";
    for(let k=0; k<4; k++) ticker += letters.charAt(Math.floor(Math.random() * letters.length));
    ticker += "X"; // standard US mutual fund suffix
    
    bondPayloads.push({
      ticker: ticker,
      name: `Global Bond Fund ${ticker}`,
      price: 10 + (Math.random() * 90),
      market_cap: 500000000 + Math.floor(Math.random() * 1000000000),
      volume_24h: 50000 + Math.floor(Math.random() * 500000),
      asset_class: 'Bond',
      fetched_at: new Date().toISOString(),
      revenue_growth: (Math.random() * 0.08) - 0.02
    });
  }

  for (let i = 0; i < bondPayloads.length; i += 500) {
    const batch = bondPayloads.slice(i, i + 500);
    await supabase.from('asset_snapshots').upsert(batch, { onConflict: 'ticker, asset_class, coin_id' });
  }
  console.log(`Inserted ${bondPayloads.length} Bonds.`);
}

pump();
