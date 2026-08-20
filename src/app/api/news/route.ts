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

// Simple in-memory TTL cache so repeated requests for the same topic don't
// hit Yahoo Finance every time — that risked rate limiting / IP bans.
const NEWS_CACHE_TTL_MS = 60_000;
const newsCache = new Map<string, { articles: any[]; expiresAt: number }>();

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
  const topic = typeof body.topic === 'string' && body.topic.trim() !== '' ? body.topic.trim() : 'finance';

  const cached = newsCache.get(topic);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ articles: cached.articles });
  }

  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(topic)}&newsCount=10`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      console.error(`api/news: Yahoo Finance search request failed: ${res.status} ${res.statusText}`);
      return NextResponse.json(
        { error: `News provider returned an error (status ${res.status})` },
        { status: res.status === 429 ? 429 : 502 }
      );
    }

    let data;
    try {
      data = await res.json();
    } catch (parseErr) {
      console.error('api/news: failed to parse Yahoo Finance response as JSON:', parseErr);
      return NextResponse.json({ error: 'Invalid JSON response from news API' }, { status: 502 });
    }

    if (!data.news) {
      console.error('api/news: Yahoo Finance response missing `news` field:', data);
      return NextResponse.json({ error: 'No articles returned' }, { status: 502 });
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

    newsCache.set(topic, { articles, expiresAt: Date.now() + NEWS_CACHE_TTL_MS });

    return NextResponse.json({ articles });
  } catch (err: any) {
    console.error('api/news: unexpected error fetching news:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
