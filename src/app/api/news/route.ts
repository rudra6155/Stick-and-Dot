import { NextRequest, NextResponse } from 'next/server';

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

const CLASS_KEYWORDS: { keywords: string[]; label: string }[] = [
  { keywords: ['crypto', 'bitcoin', 'ethereum'], label: 'Crypto' },
  { keywords: ['stock', 'equity', 'earnings', 'nasdaq', 's&p'], label: 'Stock' },
  { keywords: ['gold', 'oil', 'commodity', 'wheat', 'silver'], label: 'Commodity' },
  { keywords: ['bond', 'yield', 'treasury', 'fed', 'rate'], label: 'Bond' },
  { keywords: ['india', 'nse', 'sensex', 'nifty'], label: 'Indian Stock' },
  { keywords: ['reit', 'real estate', 'property'], label: 'REIT' },
  { keywords: ['etf', 'fund', 'vanguard', 'blackrock'], label: 'ETF' },
];

const POSITIVE_WORDS = ['surge', 'gain', 'rise', 'high', 'growth', 'rally', 'up', 'bull'];
const NEGATIVE_WORDS = ['fall', 'drop', 'crash', 'low', 'bear', 'down', 'sell', 'risk'];

function getRelatedClasses(text: string): string[] {
  const lower = text.toLowerCase();
  const classes: string[] = [];
  for (const { keywords, label } of CLASS_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) {
      classes.push(label);
    }
  }
  return classes;
}

function getSentiment(title: string): 'positive' | 'negative' | 'neutral' {
  const lower = title.toLowerCase();
  if (POSITIVE_WORDS.some((w) => lower.includes(w))) return 'positive';
  if (NEGATIVE_WORDS.some((w) => lower.includes(w))) return 'negative';
  return 'neutral';
}

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const topic = body.topic || 'finance';

  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(topic)}&newsCount=10`;

  try {
    const res = await fetch(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(10000) 
    });
    let data;
    try {
      data = await res.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON response from news API' }, { status: 500 });
    }

    if (!data.news) {
      return NextResponse.json({ error: 'No articles returned' }, { status: 500 });
    }

    const articles = data.news.map((item: any) => {
      const combined = `${item.title || ''}`;
      return {
        title: item.title,
        description: "",
        url: item.link,
        source: { name: item.publisher || 'Yahoo Finance' },
        publishedAt: item.providerPublishTime ? new Date(item.providerPublishTime * 1000).toISOString() : new Date().toISOString(),
        related_classes: getRelatedClasses(combined),
        sentiment: getSentiment(item.title || ''),
      };
    });

    return NextResponse.json({ articles });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
