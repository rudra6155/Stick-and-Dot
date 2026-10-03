export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

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

    // Yahoo Finance can batch request via an array
    const quotes = await yf.quote(requestedTickers);
    
    // Create a mapping of ticker -> { price, marketCap, change, isUp }
    const liveData: Record<string, any> = {};
    
    for (const quote of quotes) {
      if (quote && quote.symbol) {
        liveData[quote.symbol] = {
          price: quote.regularMarketPrice || null,
          marketCap: quote.marketCap || null,
          change: quote.regularMarketChangePercent !== undefined && quote.regularMarketChangePercent !== null 
            ? quote.regularMarketChangePercent.toFixed(2) + "%" 
            : null,
          isUp: quote.regularMarketChangePercent !== undefined && quote.regularMarketChangePercent >= 0,
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
