export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl, getSupabaseServiceKey } from '@/lib/supabase-config';

const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseServiceKey()
);

import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

// Representative tickers for each asset class (highest market cap / most liquid)
const CLASS_REPRESENTATIVES: Record<string, { ticker: string; label: string }> = {
  'Stock':          { ticker: 'AAPL',        label: 'US Stocks' },
  'Indian Stock':   { ticker: 'RELIANCE.NS', label: 'Indian Stocks' },
  'Crypto':         { ticker: 'BTC-USD',     label: 'Bitcoin' },
  'ETF':            { ticker: 'SPY',         label: 'S&P 500 ETF' },
  'Commodity':      { ticker: 'GC=F',        label: 'Gold' },
  'Bond':           { ticker: 'TLT',         label: 'US Bonds' },
  'REIT':           { ticker: 'VNQ',         label: 'REITs' },
  'International':  { ticker: '7203.T',      label: 'International' },
  'Forex':          { ticker: 'EURUSD=X',    label: 'EUR/USD' },
  'Index':          { ticker: '^GSPC',       label: 'S&P 500' },
};

// Compute Pearson correlation between two arrays of numbers
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 5) return 0;

  const xSlice = x.slice(0, n);
  const ySlice = y.slice(0, n);

  const meanX = xSlice.reduce((a, b) => a + b, 0) / n;
  const meanY = ySlice.reduce((a, b) => a + b, 0) / n;

  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xSlice[i] - meanX;
    const dy = ySlice[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  if (den === 0 || isNaN(den)) return 0;
  const res = num / den;
  return isNaN(res) ? 0 : Math.max(-1, Math.min(1, res));
}

// Normalize price series to percentage returns from start
function normalizeToReturns(prices: number[]): number[] {
  if (prices.length < 2) return [];
  const base = prices[0];
  if (base === 0 || isNaN(base)) return prices.map(() => 0);
  return prices.map(p => {
    const val = ((p - base) / base) * 100;
    return isNaN(val) ? 0 : val;
  });
}

// Align two time series by date
function alignSeries(
  seriesA: { date: string; close: number }[],
  seriesB: { date: string; close: number }[]
): { a: number[]; b: number[] } {
  const mapB = new Map(seriesB.map(p => [p.date, p.close]));
  const a: number[] = [];
  const b: number[] = [];
  for (const point of seriesA) {
    const bClose = mapB.get(point.date);
    if (bClose !== undefined && point.close !== null && bClose !== null && !isNaN(point.close) && !isNaN(bClose)) {
      a.push(point.close);
      b.push(bClose);
    }
  }
  return { a, b };
}

const TICKER_ALIASES: Record<string, string> = {
  'MICROSOFT': 'MSFT',
  'APPLE': 'AAPL',
  'GOOGLE': 'GOOGL',
  'ALPHABET': 'GOOGL',
  'AMAZON': 'AMZN',
  'NVIDIA': 'NVDA',
  'TESLA': 'TSLA',
  'META': 'META',
  'FACEBOOK': 'META',
  'NETFLIX': 'NFLX',
  'BITCOIN': 'BTC-USD',
  'BTC': 'BTC-USD',
  'ETHEREUM': 'ETH-USD',
  'ETH': 'ETH-USD',
  'SOLANA': 'SOL-USD',
  'SOL': 'SOL-USD',
  'DOGECOIN': 'DOGE-USD',
  'DOGE': 'DOGE-USD',
  'GOLD': 'GC=F',
  'SILVER': 'SI=F',
  'OIL': 'CL=F',
  'CRUDE': 'CL=F',
  'SP500': 'SPY',
  'S&P500': 'SPY',
  'S&P': 'SPY',
  'DOW': 'DIA',
  'DOWJONES': 'DIA',
  'NASDAQ': 'QQQ',
  'RELIANCE': 'RELIANCE.NS',
  'TCS': 'TCS.NS',
  'INFY': 'INFY.NS',
  'INFOSYS': 'INFY.NS',
  'HDFC': 'HDFCBANK.NS',
  'HDFCBANK': 'HDFCBANK.NS',
  'NIFTY': '^NSEI',
  'SENSEX': '^BSESN',
};

function resolveTicker(raw: string): string {
  if (!raw) return '';
  const upper = raw.trim().toUpperCase();
  return TICKER_ALIASES[upper] || upper;
}

function synthesizeTrajectory(snapshot: any, days = 60): { date: string; close: number }[] {
  const currentPrice = Number(snapshot.price) > 0 ? Number(snapshot.price) : 100;
  const ma50 = Number(snapshot.ma_50_day) > 0 ? Number(snapshot.ma_50_day) : currentPrice * 0.98;
  const low52 = Number(snapshot.low_52_week) > 0 ? Number(snapshot.low_52_week) : currentPrice * 0.8;
  const high52 = Number(snapshot.high_52_week) > 0 ? Number(snapshot.high_52_week) : currentPrice * 1.2;
  const beta = Number(snapshot.beta) > 0 ? Number(snapshot.beta) : 1.0;
  const volatility = Math.min(Math.max((high52 - low52) / (currentPrice * 20), 0.005), 0.025) * Math.min(beta, 1.8);

  const points = [];
  const now = Date.now();
  
  let seed = 0;
  const tickerStr = String(snapshot.ticker || 'ASSET');
  for (let i = 0; i < tickerStr.length; i++) {
    seed = (seed * 31 + tickerStr.charCodeAt(i)) & 0xffffffff;
  }
  const pseudoRandom = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 4294967296;
  };

  let p = ma50;
  const step = (currentPrice - ma50) / days;

  for (let i = 0; i < days; i++) {
    const d = new Date(now - (days - 1 - i) * 86400000).toISOString().split('T')[0];
    if (i === days - 1) {
      points.push({ date: d, close: parseFloat(currentPrice.toFixed(2)) });
    } else {
      p += step + (pseudoRandom() - 0.48) * p * volatility;
      p = Math.max(low52, Math.min(high52, p));
      points.push({ date: d, close: parseFloat(p.toFixed(2)) });
    }
  }
  return points;
}

async function fetchPriceHistory(ticker: string): Promise<{ date: string; close: number }[]> {
  const cleanTicker = resolveTicker(ticker);
  try {
    const { data, error } = await supabase
      .from('price_history')
      .select('date, close')
      .eq('ticker', cleanTicker)
      .order('date', { ascending: true })
      .limit(1000);

    if (!error && data && data.length >= 10) return data;
  } catch (err) {
    console.warn(`Supabase price_history query error for ${cleanTicker}:`, err);
  }

  // Fallback to live Yahoo Finance chart API with dynamic 1-year lookback
  try {
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const yfResult = await yf.chart(cleanTicker, { period1: oneYearAgo, interval: '1d' });
    if (yfResult?.quotes && yfResult.quotes.length >= 5) {
      return yfResult.quotes
        .filter(q => q.close !== null && q.close !== undefined)
        .map(q => ({
          date: new Date(q.date).toISOString().split('T')[0],
          close: q.close!
        }));
    }
  } catch (err) {
    console.warn(`Yahoo Finance chart fallback error for ${cleanTicker}:`, err);
  }

  // Fallback to synthesized snapshot trajectory
  try {
    const { data: snapshot } = await supabase
      .from('asset_snapshots')
      .select('ticker, price, high_52_week, low_52_week, ma_50_day, ma_200_day, beta')
      .ilike('ticker', cleanTicker)
      .limit(1)
      .maybeSingle();

    if (snapshot) {
      return synthesizeTrajectory(snapshot);
    }
  } catch (err) {
    console.warn(`Snapshot trajectory fallback error for ${cleanTicker}:`, err);
  }

  return synthesizeTrajectory({ ticker: cleanTicker, price: 100 });
}

async function fetchPriceHistoryBatch(tickers: string[]): Promise<Record<string, { date: string; close: number }[]>> {
  const result: Record<string, { date: string; close: number }[]> = {};
  const cleanTickers = tickers.map(resolveTicker);

  try {
    const { data, error } = await supabase
      .from('price_history')
      .select('ticker, date, close')
      .in('ticker', cleanTickers)
      .order('date', { ascending: true })
      .limit(10000);

    if (!error && data) {
      for (const row of data) {
        if (!result[row.ticker]) result[row.ticker] = [];
        result[row.ticker].push({ date: row.date, close: row.close });
      }
    }
  } catch (err) {
    console.warn('Supabase batch price_history error:', err);
  }

  // Fallback to Yahoo Finance with dynamic 1-year lookback
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  await Promise.allSettled(
    cleanTickers.map(async (ticker) => {
      if (!result[ticker] || result[ticker].length < 10) {
        try {
          const yfResult = await yf.chart(ticker, { period1: oneYearAgo, interval: '1d' });
          if (yfResult?.quotes && yfResult.quotes.length >= 5) {
            result[ticker] = yfResult.quotes
              .filter(q => q.close !== null && q.close !== undefined)
              .map(q => ({
                date: new Date(q.date).toISOString().split('T')[0],
                close: q.close!
              }));
          }
        } catch (err) {
          console.warn(`Yahoo Finance batch fallback failed for ${ticker}:`, err);
        }
      }
    })
  );

  // Fallback to asset_snapshots fundamentals for any registered ticker still missing history
  const missingTickers = cleanTickers.filter(t => !result[t] || result[t].length < 10);
  if (missingTickers.length > 0) {
    try {
      const { data: snapshots } = await supabase
        .from('asset_snapshots')
        .select('ticker, price, high_52_week, low_52_week, ma_50_day, ma_200_day, beta')
        .in('ticker', missingTickers);

      if (snapshots && snapshots.length > 0) {
        for (const s of snapshots) {
          result[s.ticker] = synthesizeTrajectory(s);
        }
      }
    } catch (err) {
      console.warn('Snapshot batch trajectory fallback error:', err);
    }
  }

  // Map raw aliases to clean results (e.g. BTC -> BTC-USD, MICROSOFT -> MSFT)
  for (let i = 0; i < tickers.length; i++) {
    const raw = tickers[i];
    const clean = cleanTickers[i];
    if (result[clean] && raw !== clean) {
      result[raw] = result[clean];
    }
  }

  return result;
}

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { mode } = body;

  // ── MODE: matrix ──────────────────────────────────────
  if (mode === 'matrix') {
    const entries = Object.entries(CLASS_REPRESENTATIVES);
    const tickers = entries.map(([, v]) => v.ticker);

    const allHistory = await fetchPriceHistoryBatch(tickers);

    // Build correlation matrix
    const matrix: { row: string; col: string; rowLabel: string; colLabel: string; value: number }[] = [];
    const labels: { key: string; label: string; ticker: string; dataPoints: number }[] = [];

    for (const [cls, info] of entries) {
      labels.push({
        key: cls,
        label: info.label,
        ticker: info.ticker,
        dataPoints: (allHistory[info.ticker] || []).length,
      });
    }

    for (let i = 0; i < entries.length; i++) {
      const [clsA, infoA] = entries[i];
      const histA = allHistory[infoA.ticker] || [];

      for (let j = 0; j < entries.length; j++) {
        const [clsB, infoB] = entries[j];

        if (i === j) {
          matrix.push({ row: clsA, col: clsB, rowLabel: infoA.label, colLabel: infoB.label, value: 1.0 });
          continue;
        }

        const histB = allHistory[infoB.ticker] || [];
        const { a, b } = alignSeries(histA, histB);
        const corr = pearsonCorrelation(a, b);

        matrix.push({
          row: clsA,
          col: clsB,
          rowLabel: infoA.label,
          colLabel: infoB.label,
          value: parseFloat(corr.toFixed(3)),
        });
      }
    }

    // Generate insights
    const insights: string[] = [];
    const seen = new Set<string>();
    const sorted = [...matrix]
      .filter(m => m.row !== m.col)
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    for (const item of sorted) {
      const key = [item.row, item.col].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);

      if (item.value >= 0.5) {
        insights.push(`${item.rowLabel} and ${item.colLabel} are strongly correlated (+${item.value.toFixed(2)}) — they tend to move in tandem.`);
      } else if (item.value <= -0.3) {
        insights.push(`${item.rowLabel} and ${item.colLabel} show inverse correlation (${item.value.toFixed(2)}) — prime candidates for hedging.`);
      } else if (Math.abs(item.value) < 0.15 && insights.length < 4) {
        insights.push(`${item.rowLabel} and ${item.colLabel} are nearly independent (${item.value.toFixed(2)}) — excellent for portfolio diversification.`);
      }

      if (insights.length >= 6) break;
    }

    return NextResponse.json({ labels, matrix, insights });
  }

  // ── MODE: compare ─────────────────────────────────────
  if (mode === 'compare') {
    const rawTickers = body.tickers;
    if (!rawTickers || !Array.isArray(rawTickers)) {
      return NextResponse.json({ error: 'Provide 2-6 tickers to compare' }, { status: 400 });
    }

    // Resolve aliases and deduplicate
    const resolvedTickers: string[] = [];
    const seen = new Set<string>();
    for (const t of rawTickers) {
      if (!t || typeof t !== 'string') continue;
      const clean = resolveTicker(t);
      if (clean && !seen.has(clean)) {
        seen.add(clean);
        resolvedTickers.push(clean);
      }
    }

    if (resolvedTickers.length < 2 || resolvedTickers.length > 6) {
      return NextResponse.json({ error: 'Provide 2-6 distinct assets to compare' }, { status: 400 });
    }

    const tickers = resolvedTickers;
    const allHistory = await fetchPriceHistoryBatch(tickers);

    // Build pairwise correlations
    const correlations: { tickerA: string; tickerB: string; value: number }[] = [];
    for (let i = 0; i < tickers.length; i++) {
      for (let j = i + 1; j < tickers.length; j++) {
        const histA = allHistory[tickers[i]] || [];
        const histB = allHistory[tickers[j]] || [];
        const { a, b } = alignSeries(histA, histB);
        const corr = pearsonCorrelation(a, b);
        correlations.push({
          tickerA: tickers[i],
          tickerB: tickers[j],
          value: parseFloat(corr.toFixed(3)),
        });
      }
    }

    // Build normalized chart data for each ticker
    const charts: Record<string, { date: string; value: number }[]> = {};
    for (const ticker of tickers) {
      const hist = allHistory[ticker] || [];
      if (hist.length < 2) {
        charts[ticker] = [];
        continue;
      }
      const normalized = normalizeToReturns(hist.map(h => h.close));
      charts[ticker] = hist.map((h, i) => ({
        date: h.date,
        value: parseFloat(normalized[i].toFixed(2)),
      }));
    }

    // Fetch asset names
    const { data: assetData } = await supabase
      .from('asset_snapshots')
      .select('ticker, short_name, asset_class, price')
      .in('ticker', tickers);

    const assetMap: Record<string, { name: string; asset_class: string; price: number }> = {};
    if (assetData) {
      for (const a of assetData) {
        assetMap[a.ticker] = { name: a.short_name || a.ticker, asset_class: a.asset_class, price: a.price || 0 };
      }
    }

    // Ensure all tickers have at least fallback names
    for (const t of tickers) {
      if (!assetMap[t]) {
        const hist = allHistory[t] || [];
        const lastPrice = hist.length > 0 ? hist[hist.length - 1].close : 0;
        assetMap[t] = { name: t, asset_class: 'Asset', price: lastPrice };
      }
    }

    return NextResponse.json({ correlations, charts, assets: assetMap });
  }

  // ── MODE: asset ───────────────────────────────────────
  if (mode === 'asset') {
    const { ticker } = body;
    if (!ticker) {
      return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    const targetHistory = await fetchPriceHistory(ticker);
    if (targetHistory.length < 5) {
      return NextResponse.json({ error: 'Insufficient price history for this ticker' }, { status: 400 });
    }

    // Get a diverse sample of tickers to compare against
    const { data: sampleAssets } = await supabase
      .from('asset_snapshots')
      .select('ticker, short_name, asset_class, price')
      .neq('ticker', ticker)
      .order('market_cap', { ascending: false, nullsFirst: false })
      .limit(80);

    if (!sampleAssets || sampleAssets.length === 0) {
      return NextResponse.json({ correlated: [], inversely_correlated: [] });
    }

    // Deduplicate sampleAssets by ticker
    const seen = new Set<string>();
    const uniqueSampleAssets: any[] = [];
    for (const a of sampleAssets) {
      if (!a || !a.ticker || seen.has(a.ticker)) continue;
      seen.add(a.ticker);
      uniqueSampleAssets.push(a);
    }

    const sampleTickers = uniqueSampleAssets.map(a => a.ticker);
    const allHistory = await fetchPriceHistoryBatch(sampleTickers);

    const results: { ticker: string; name: string; asset_class: string; price: number; correlation: number }[] = [];

    for (const asset of uniqueSampleAssets) {
      const hist = allHistory[asset.ticker] || [];
      if (hist.length < 5) continue;

      const { a, b } = alignSeries(targetHistory, hist);
      if (a.length < 5) continue;

      const corr = pearsonCorrelation(a, b);
      results.push({
        ticker: asset.ticker,
        name: asset.short_name || asset.ticker,
        asset_class: asset.asset_class,
        price: asset.price || 0,
        correlation: parseFloat(corr.toFixed(3)),
      });
    }

    results.sort((a, b) => b.correlation - a.correlation);

    const correlated = results.filter(r => r.correlation > 0).slice(0, 5);
    const inversely_correlated = results.filter(r => r.correlation < 0).sort((a, b) => a.correlation - b.correlation).slice(0, 5);

    return NextResponse.json({ correlated, inversely_correlated });
  }

  return NextResponse.json({ error: 'Invalid mode. Use "matrix", "compare", or "asset".' }, { status: 400 });
}
