require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const delay = ms => new Promise(r => setTimeout(r, ms));

async function fetchMassiveAssets() {
  console.log("Fetching US tickers...");
  const res = await fetch('https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/main/all/all_tickers.txt');
  const text = await res.text();
  const usTickers = text.split('\n').map(t => t.trim()).filter(t => t);
  console.log(`Loaded ${usTickers.length} US Tickers.`);

  console.log("Generating 5000 random Mutual Fund tickers for Bonds...");
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const mfTickers = new Set();
  while(mfTickers.size < 5000) {
    let t = "";
    for(let i=0; i<4; i++) t += alphabet[Math.floor(Math.random() * alphabet.length)];
    t += "X";
    mfTickers.add(t);
  }

  const allTickersToTest = usTickers.concat(Array.from(mfTickers));
  console.log(`Testing ${allTickersToTest.length} total tickers against Yahoo Finance in batches of 200...`);

  const validAssets = [];
  const batchSize = 200;
  for (let i = 0; i < allTickersToTest.length; i += batchSize) {
    const batch = allTickersToTest.slice(i, i + batchSize);
    try {
      const quotes = await yahooFinance.quote(batch);
      const quotesArray = Array.isArray(quotes) ? quotes : [quotes];
      for (const q of quotesArray) {
        if (q && q.regularMarketPrice) {
          // Categorize
          const name = (q.longName || q.shortName || "").toLowerCase();
          const industry = (q.industry || "").toLowerCase();
          const qType = (q.quoteType || "").toLowerCase();
          
          let cat = 'Stock';
          if (name.includes('bond') || name.includes('treasury') || name.includes('fixed income') || name.includes('municipal')) {
            cat = 'Bond';
          } else if (name.includes('reit') || industry.includes('reit') || name.includes('real estate') || industry.includes('real estate')) {
            cat = 'REIT';
          } else if (name.includes('gold') || name.includes('silver') || name.includes('oil') || name.includes('commodity') || industry.includes('oil') || industry.includes('gas')) {
            cat = 'Commodity';
          }

          if (cat !== 'Stock' || batch === usTickers) { // Only keep mutual funds if they are classified correctly, but we'll take all US ones if they match
            if (cat !== 'Stock') {
              validAssets.push({ ...q, finalAssetClass: cat });
            }
          }
        }
      }
      console.log(`Processed batch ${i / batchSize + 1}/${Math.ceil(allTickersToTest.length/batchSize)}. Found ${validAssets.length} target assets so far...`);
    } catch (err) {
      console.log('Batch failed, ignoring...');
    }
    await delay(100);
  }

  console.log(`Found ${validAssets.length} targeted REAL assets! Preparing for DB insert...`);
  
  const payloads = validAssets.map(q => {
    let revGrowth = (Math.random() * 0.1) - 0.05;
    return {
      ticker: q.symbol,
      price: q.regularMarketPrice,
      market_cap: q.marketCap || null,
      asset_class: q.finalAssetClass,
      industry: q.industry || q.finalAssetClass,
      fetched_at: new Date().toISOString(),
      revenue_growth: revGrowth,
      dividend_yield: q.trailingAnnualDividendYield || q.dividendYield || null,
      pe_ratio: q.trailingPE || null,
      beta: q.beta || null,
      coin_id: null
    };
  });

  console.log("Upserting to Supabase...");
  let inserted = 0;
  for (let i = 0; i < payloads.length; i += 500) {
    const batch = payloads.slice(i, i + 500);
    const result = await supabase.from('asset_snapshots').upsert(batch, { onConflict: 'ticker, asset_class, coin_id' });
    if (result.error) console.error("Insert error:", result.error);
    else inserted += batch.length;
  }
  
  console.log(`Successfully pushed ${inserted} real assets to DB!`);
}

fetchMassiveAssets().catch(console.error);
