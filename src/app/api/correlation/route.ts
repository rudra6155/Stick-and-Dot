import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Representative tickers for each asset class (highest market cap / most liquid)
const CLASS_REPRESENTATIVES: Record<string, { ticker: string; label: string }> = {
  'Stock':          { ticker: 'AAPL',      label: 'US Stocks' },
  'Indian Stock':   { ticker: 'RELIANCE.NS', label: 'Indian Stocks' },
  'Crypto':         { ticker: 'BTC-USD',   label: 'Bitcoin' },
  'ETF':            { ticker: 'SPY',       label: 'S&P 500 ETF' },
  'Commodity':      { ticker: 'GC=F',      label: 'Gold' },
  'Bond':           { ticker: 'TLT',       label: 'US Bonds' },
  'REIT':           { ticker: 'VNQ',       label: 'REITs' },
  'International':  { ticker: '7203.T',    label: 'International' },
  'Forex':          { ticker: 'EURUSD=X',  label: 'EUR/USD' },
  'Index':          { ticker: '^GSPC',     label: 'S&P 500' },
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
  if (den === 0) return 0;
  return num / den;
}

// Normalize price series to percentage returns from start
function normalizeToReturns(prices: number[]): number[] {
  if (prices.length < 2) return [];
  const base = prices[0];
  if (base === 0) return prices.map(() => 0);
  return prices.map(p => ((p - base) / base) * 100);
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
    if (bClose !== undefined) {
      a.push(point.close);
      b.push(bClose);
    }
  }
  return { a, b };
}

async function fetchPriceHistory(ticker: string): Promise<{ date: string; close: number }[]> {
  const { data, error } = await supabase
    .from('price_history')
    .select('date, close')
    .eq('ticker', ticker)
    .order('date', { ascending: true });

  if (error || !data) return [];
  return data;
}

async function fetchPriceHistoryBatch(tickers: string[]): Promise<Record<string, { date: string; close: number }[]>> {
  const { data, error } = await supabase
    .from('price_history')
    .select('ticker, date, close')
    .in('ticker', tickers)
    .order('date', { ascending: true });

  if (error || !data) return {};

  const result: Record<string, { date: string; close: number }[]> = {};
  for (const row of data) {
    if (!result[row.ticker]) result[row.ticker] = [];
    result[row.ticker].push({ date: row.date, close: row.close });
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

      if (item.value > 0.7) {
        insights.push(`${item.rowLabel} and ${item.colLabel} are highly correlated (${item.value.toFixed(2)}) — they tend to move together.`);
      } else if (item.value < -0.5) {
        insights.push(`${item.rowLabel} and ${item.colLabel} show inverse correlation (${item.value.toFixed(2)}) — potential hedging pair.`);
      }

      if (insights.length >= 5) break;
    }

    return NextResponse.json({ labels, matrix, insights });
  }

  // ── MODE: compare ─────────────────────────────────────
  if (mode === 'compare') {
    const { tickers } = body;
    if (!tickers || !Array.isArray(tickers) || tickers.length < 2 || tickers.length > 6) {
      return NextResponse.json({ error: 'Provide 2-6 tickers to compare' }, { status: 400 });
    }

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

    const sampleTickers = sampleAssets.map(a => a.ticker);
    const allHistory = await fetchPriceHistoryBatch(sampleTickers);

    const results: { ticker: string; name: string; asset_class: string; price: number; correlation: number }[] = [];

    for (const asset of sampleAssets) {
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
