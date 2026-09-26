const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const data = JSON.parse(fs.readFileSync('max_indices_equities.json', 'utf8'));
const indices = data.indices;
const equities = data.equities;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function processBatch(batch, assetClass) {
    try {
        const quotes = await yahooFinance.quote(batch);
        const quotesArray = Array.isArray(quotes) ? quotes : (quotes ? [quotes] : []);
        const toInsert = quotesArray
            .filter(quote => quote && quote.regularMarketPrice)
            .map(quote => ({
                ticker: quote.symbol,
                short_name: quote.longName || quote.shortName || quote.symbol,
                asset_class: assetClass,
                price: quote.regularMarketPrice,
                market_cap: quote.marketCap || 0,
                coin_id: null,
                fetched_at: new Date().toISOString()
            }));

        if (toInsert.length > 0) {
            const { error } = await supabase
                .from('asset_snapshots')
                .upsert(toInsert, { onConflict: 'ticker, asset_class, coin_id' });
            if (error) {
                console.error(`Supabase error for ${assetClass}:`, error);
            } else {
                console.log(`Inserted ${toInsert.length} ${assetClass}`);
            }
        }
    } catch (err) {
        console.error(`Error processing batch: ${err.message}`);
    }
}

async function insertBatch(symbols, assetClass) {
    const batchSize = 100;
    const concurrentBatches = 5;
    for (let i = 0; i < symbols.length; i += batchSize * concurrentBatches) {
        const promises = [];
        for (let j = 0; j < concurrentBatches; j++) {
            const start = i + j * batchSize;
            if (start < symbols.length) {
                const batch = symbols.slice(start, start + batchSize);
                console.log(`Processing ${assetClass} chunk ${start} to ${start + batch.length} / ${symbols.length}`);
                promises.push(processBatch(batch, assetClass));
            }
        }
        await Promise.all(promises);
        await sleep(200);
    }
}

async function main() {
    console.log(`Found ${indices.length} indices and ${equities.length} equities`);
    console.log("Starting indices...");
    await insertBatch(indices, 'Index');
    console.log("Starting equities...");
    await insertBatch(equities, 'Equity');
    console.log("Done");
}

main();
