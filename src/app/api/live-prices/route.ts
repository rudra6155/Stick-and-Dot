export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

const FX_TO_USD_DIVISOR: Record<string, number> = {
  USD: 1, INR: 85, JPY: 150, KRW: 1400, HKD: 7.8, TWD: 32, CNY: 7.2,
  SGD: 1.35, MYR: 4.4, THB: 34, IDR: 16000, BRL: 5.8, MXN: 20, ARS: 1000,
  GBP: 0.79, EUR: 0.92, CAD: 1.4, AUD: 1.54, NZD: 1.7, CHF: 0.88, DKK: 6.9, SEK: 10.8, NOK: 11,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tickers } = body;

    if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
      return NextResponse.json({ error: 'Tickers array is required' }, { status: 400 });
    }

    // De-duplicate requested tickers
    const uniqueTickers = Array.from(new Set(tickers)).filter(t => typeof t === 'string' && t.trim() !== '');
    
    if (uniqueTickers.length === 0) {
      return NextResponse.json({ error: 'No valid tickers provided' }, { status: 400 });
    }

    // Limit to 50 tickers per request to prevent timeouts / rate limits
    const requestedTickers = uniqueTickers.slice(0, 50);

    // Fetch quotes via batch request, isolating invalid/delisted ticker failures
    let quotes: any[] = [];
    try {
      const batchRes = await yf.quote(requestedTickers);
      quotes = Array.isArray(batchRes) ? batchRes : [batchRes];
    } catch {
      const settled = await Promise.allSettled(
        requestedTickers.map((t) => yf.quote(t))
      );
      quotes = settled
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && Boolean(r.value))
        .map((r) => r.value);
    }

    // Create a mapping of ticker -> { price, marketCap, change, isUp }
    const liveData: Record<string, any> = {};

    for (const quote of quotes) {
      if (quote && quote.symbol) {
        const pct = quote.regularMarketChangePercent;
        const hasPct = typeof pct === 'number' && Number.isFinite(pct);
        const curr = String(quote.currency || 'USD').toUpperCase();
        const fxDiv = FX_TO_USD_DIVISOR[curr] || 1;
        const rawCap = quote.marketCap ?? (quote.sharesOutstanding && quote.regularMarketPrice ? quote.sharesOutstanding * quote.regularMarketPrice : null);
        const usdCap = rawCap && rawCap > 0 ? Math.round(rawCap / fxDiv) : null;
        liveData[quote.symbol] = {
          price: quote.regularMarketPrice ?? null,
          marketCap: usdCap,
          volume: quote.regularMarketVolume ?? null,
          high52Week: quote.fiftyTwoWeekHigh ?? null,
          low52Week: quote.fiftyTwoWeekLow ?? null,
          ma50Day: quote.fiftyDayAverage ?? null,
          ma200Day: quote.twoHundredDayAverage ?? null,
          change: hasPct ? Math.abs(pct).toFixed(2) + "%" : null,
          isUp: hasPct ? pct >= 0 : true,
          quoteTime: quote.regularMarketTime
            ? (quote.regularMarketTime instanceof Date
                ? quote.regularMarketTime.toISOString()
                : new Date(typeof quote.regularMarketTime === 'number' && quote.regularMarketTime < 1e11 ? quote.regularMarketTime * 1000 : quote.regularMarketTime).toISOString())
            : new Date().toISOString(),
        };
      }
    }

    return NextResponse.json({ data: liveData }, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30'
      }
    });
  } catch (error: any) {
    console.error('Error fetching live prices:', error.message);
    return NextResponse.json({ error: 'Failed to fetch live prices' }, { status: 500 });
  }
}
