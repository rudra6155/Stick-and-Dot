require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runDaemon() {
  console.log('Starting Live Price Daemon...');
  while (true) {
    try {
      console.log('Fetching tickers from DB...');
      let allTickers = [];
      let page = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase.from('asset_snapshots').select('ticker').range(page * pageSize, (page + 1) * pageSize - 1);
        if (error) { console.error(error); break; }
        if (!data || data.length === 0) break;
        allTickers = allTickers.concat(data.map(r => r.ticker).filter(Boolean));
        page++;
      }
      
      const tickers = Array.from(new Set(allTickers));
      console.log(`Found ${tickers.length} tickers to update.`);
      
      const batchSize = 100; // Yahoo allows larger arrays
      for (let i = 0; i < tickers.length; i += batchSize) {
        const batch = tickers.slice(i, i + batchSize);
        try {
          const quotes = await yahooFinance.quote(batch);
          // quote returns a single object if array length=1, or array if multiple
          const quotesArray = Array.isArray(quotes) ? quotes : [quotes];
          
          for (const quote of quotesArray) {
            if (quote && quote.regularMarketPrice) {
              await supabase
                .from('asset_snapshots')
                .update({ 
                  price: quote.regularMarketPrice,
                  fetched_at: new Date().toISOString()
                })
                .eq('ticker', quote.symbol);
            }
          }
          console.log(`Updated batch ${Math.floor(i / batchSize) + 1} / ${Math.ceil(tickers.length / batchSize)}`);
        } catch (e) {
          console.error(`Error fetching quote batch:`, e.message);
        }
        await sleep(100); 
      }
      console.log('Completed a full pass. Sleeping for 30s...');
      await sleep(30000);
    } catch (err) {
      console.error('Fatal Daemon Error:', err);
      await sleep(5000);
    }
  }
}

runDaemon();
