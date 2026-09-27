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

async function fetchQuotesWithRetry(batch, maxRetries = 3) {
  let attempt = 0;
  let backoffMs = 2000;
  while (attempt < maxRetries) {
    try {
      const quotes = await yahooFinance.quote(batch);
      return Array.isArray(quotes) ? quotes : (quotes ? [quotes] : []);
    } catch (err) {
      attempt++;
      const isRateLimit = (
        err.status === 429 ||
        err.code === 429 ||
        (err.message && (
          err.message.includes('429') ||
          err.message.toLowerCase().includes('too many requests') ||
          err.message.toLowerCase().includes('rate limit')
        ))
      );

      if (attempt < maxRetries) {
        const waitTime = isRateLimit ? Math.min(backoffMs * Math.pow(2, attempt - 1), 60000) : 1000 * attempt;
        console.warn(`[Yahoo Finance] Batch fetch attempt ${attempt} failed (${err.message}). Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
      } else {
        console.error(`[Yahoo Finance] Batch fetch permanently failed after ${maxRetries} attempts:`, err.message);
        return [];
      }
    }
  }
  return [];
}

async function runDaemon() {
  console.log('Starting Optimized Live Price Daemon...');
  while (true) {
    try {
      console.log('Fetching tickers from DB with ordered pagination...');
      let allRecords = [];
      let page = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('asset_snapshots')
          .select('id, ticker')
          .order('ticker', { ascending: true })
          .order('id', { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
          console.error('Error fetching tickers page:', error.message);
          break;
        }
        if (!data || data.length === 0) break;
        allRecords = allRecords.concat(data.filter(r => r.ticker));
        page++;
      }

      // Group IDs by ticker for efficient multi-row updates per quote
      const tickerToIds = new Map();
      for (const r of allRecords) {
        if (!tickerToIds.has(r.ticker)) {
          tickerToIds.set(r.ticker, []);
        }
        tickerToIds.get(r.ticker).push(r.id);
      }

      const tickers = Array.from(tickerToIds.keys());
      console.log(`Found ${tickers.length} distinct tickers (${allRecords.length} records) to update.`);

      const batchSize = 100;
      for (let i = 0; i < tickers.length; i += batchSize) {
        const batch = tickers.slice(i, i + batchSize);
        const quotesArray = await fetchQuotesWithRetry(batch);

        const payloads = [];
        const now = new Date().toISOString();

        for (const quote of quotesArray) {
          if (quote && quote.symbol && quote.regularMarketPrice != null) {
            const ids = tickerToIds.get(quote.symbol) || [];
            // Guard against corrupt market caps (> $6T or foreign currencies)
            const isUsd = !quote.currency || quote.currency === 'USD';
            const validMarketCap = (quote.marketCap && quote.marketCap > 0 && quote.marketCap < 6000000000000 && isUsd)
              ? quote.marketCap
              : null;

            for (const id of ids) {
              payloads.push({
                id,
                ticker: quote.symbol,
                price: quote.regularMarketPrice,
                market_cap: validMarketCap,
                fetched_at: now
              });
            }
          }
        }

        if (payloads.length > 0) {
          const { error: upsertError } = await supabase
            .from('asset_snapshots')
            .upsert(payloads, { onConflict: 'id' });

          if (upsertError) {
            console.error('Supabase batch upsert error:', upsertError.message);
          }
        }

        console.log(`Updated batch ${Math.floor(i / batchSize) + 1} / ${Math.ceil(tickers.length / batchSize)} (${payloads.length} snapshots updated)`);
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

// Only execute when run directly
if (require.main === module) {
  runDaemon();
}

module.exports = { runDaemon, fetchQuotesWithRetry };
