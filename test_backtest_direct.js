const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, val] = line.split('=');
  if (key && val) env[key.trim()] = val.trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const tickers = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META',
    'TSLA', 'NVDA', 'JPM', 'V', 'WMT',
    'JNJ', 'PG', 'MA', 'HD', 'CVX', 'ABBV', 'MRK'
  ]; // 17 tickers

  console.log('Testing backtest Promise.all logic with 17 tickers...');
  const historyPromises = tickers.map(ticker => 
    supabase
      .from('price_history')
      .select('ticker, date, close')
      .eq('ticker', ticker)
      .order('date', { ascending: false })
      .limit(200)
  );

  const start = Date.now();
  const historyResults = await Promise.all(historyPromises);
  const end = Date.now();

  const history = historyResults.flatMap(r => r.data || []);
  
  const tickerHistory = {};
  history.reverse().forEach(row => {
    if (!tickerHistory[row.ticker]) tickerHistory[row.ticker] = [];
    tickerHistory[row.ticker].push({ date: row.date, close: row.close });
  });

  for (const t of tickers) {
    const hist = tickerHistory[t] || [];
    if (hist.length > 0) {
      console.log(`Ticker ${t}: ${hist.length} rows, newest date: ${hist[hist.length - 1].date}, oldest date: ${hist[0].date}`);
    } else {
      console.log(`Ticker ${t}: NO DATA`);
    }
  }

  console.log(`Done in ${end - start}ms`);
}

test().catch(console.error);
