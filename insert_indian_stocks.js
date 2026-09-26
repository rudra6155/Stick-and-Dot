require("dotenv").config({ path: ".env" });
const { createClient } = require("@supabase/supabase-js");
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance();
const fs = require("fs");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  if (!fs.existsSync("indian_stocks.json")) {
    console.error("indian_stocks.json not found!");
    return;
  }
  
  const symbols = JSON.parse(fs.readFileSync("indian_stocks.json", "utf-8"));
  console.log(`Loaded ${symbols.length} Indian stock symbols.`);
  
  const batchSize = 100;
  let totalInserted = 0;
  
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    console.log(`Testing batch ${i / batchSize + 1} of ${Math.ceil(symbols.length / batchSize)}`);
    
    try {
      const results = await yahooFinance.quote(batch);
      const validResults = Array.isArray(results) ? results : (results ? [results] : []);
      
      const toInsert = validResults.map(q => ({
        ticker: q.symbol,
        short_name: (q.shortName || q.longName || q.symbol).substring(0, 255),
        price: q.regularMarketPrice || 0,
        market_cap: q.marketCap || null,
        asset_class: "Indian Stock",
        coin_id: null,
        fetched_at: new Date().toISOString()
      })).filter(q => q.price > 0);
      
      if (toInsert.length > 0) {
        const { error } = await supabase
          .from("asset_snapshots")
          .upsert(toInsert, { onConflict: "ticker,asset_class,coin_id" });
          
        if (error) {
          console.error("Supabase insert error:", error);
        } else {
          totalInserted += toInsert.length;
          console.log(`Inserted ${toInsert.length} Indian stocks. Total so far: ${totalInserted}`);
        }
      }
    } catch (err) {
      console.log(`Error in batch ${i / batchSize + 1}: ${err.message}`);
    }
    
    await delay(100);
  }
  
  console.log(`Done inserting Indian stocks. Total inserted: ${totalInserted}`);
}

main();
