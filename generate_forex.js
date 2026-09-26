require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const currencies = [
  "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNH", "HKD", "NZD", 
  "SEK", "KRW", "SGD", "NOK", "MXN", "INR", "RUB", "ZAR", "TRY", "BRL", 
  "TWD", "DKK", "PLN", "THB", "IDR", "HUF", "CZK", "ILS", "CLP", "PHP", 
  "AED", "COP", "SAR", "MYR", "RON", "ARS", "PKR", "EGP", "BDT", "NGN", 
  "VND", "KES", "GHS", "UGX", "TZS", "DZD", "MAD", "IQD", "QAR", "KWD", "OMR", "BHD", "JOD"
];

async function generateForex() {
  console.log("Generating all Forex permutations...");
  const pairs = [];
  for (let i = 0; i < currencies.length; i++) {
    for (let j = 0; j < currencies.length; j++) {
      if (i !== j) {
        pairs.push(`${currencies[i]}${currencies[j]}=X`);
      }
    }
  }
  console.log(`Testing ${pairs.length} potential Forex pairs against Yahoo Finance...`);

  const validPairs = [];
  const batchSize = 100;
  for (let i = 0; i < pairs.length; i += batchSize) {
    const batch = pairs.slice(i, i + batchSize);
    try {
      const quotes = await yahooFinance.quote(batch);
      const quotesArray = Array.isArray(quotes) ? quotes : [quotes];
      for (const q of quotesArray) {
        if (q && q.regularMarketPrice) {
          validPairs.push(q);
        }
      }
      console.log(`Processed batch ${i / batchSize + 1}, found ${validPairs.length} valid so far...`);
    } catch(e) {
      // Ignore batch errors, just means some symbols were very invalid
      console.log('Batch had some invalid symbols, filtering individually...');
      for (const p of batch) {
          try {
              const q = await yahooFinance.quote(p);
              if (q && q.regularMarketPrice) validPairs.push(q);
          } catch(err) {}
      }
    }
  }

  console.log(`\nFound ${validPairs.length} REAL valid Forex pairs! Inserting into database...`);

  const payloads = validPairs.map(q => ({
    ticker: q.symbol,
    price: q.regularMarketPrice,
    market_cap: null,
    asset_class: 'Forex',
    industry: 'Currency',
    fetched_at: new Date().toISOString(),
    revenue_growth: null,
    coin_id: null
  }));

  for (let i = 0; i < payloads.length; i += 500) {
    const batch = payloads.slice(i, i + 500);
    const res = await supabase.from('asset_snapshots').upsert(batch, { onConflict: 'ticker, asset_class, coin_id' });
    if (res.error) {
      console.error('Insert error:', res.error);
    }
  }
  
  console.log("Forex Generation Complete!");
}

generateForex();
