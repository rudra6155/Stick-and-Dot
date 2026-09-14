import { NextRequest, NextResponse } from 'next/server';

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

const CLASS_KEYWORDS: { keywords: string[]; label: string }[] = [
  { keywords: ['crypto', 'bitcoin', 'ethereum', 'blockchain', 'defi', 'nft'], label: 'Crypto' },
  { keywords: ['stock', 'equity', 'earnings', 'nasdaq', 's&p', 'wall street', 'shares', 'ipo'], label: 'Stock' },
  { keywords: ['gold', 'oil', 'commodity', 'wheat', 'silver', 'crude', 'metals'], label: 'Commodity' },
  { keywords: ['bond', 'yield', 'treasury', 'fed', 'rate', 'federal reserve', 'interest'], label: 'Bond' },
  { keywords: ['india', 'nse', 'sensex', 'nifty', 'sebi', 'bse', 'rupee', 'rbi'], label: 'Indian Stock' },
  { keywords: ['reit', 'real estate', 'property', 'housing', 'mortgage'], label: 'REIT' },
  { keywords: ['etf', 'fund', 'vanguard', 'blackrock', 'fidelity', 'ishares'], label: 'ETF' },
  { keywords: ['startup', 'unicorn', 'venture', 'funding', 'series a', 'series b', 'valuation'], label: 'Startup' },
];

const POSITIVE_WORDS = ['surge', 'gain', 'rise', 'high', 'growth', 'rally', 'up', 'bull', 'soar', 'jump', 'boost', 'record'];
const NEGATIVE_WORDS = ['fall', 'drop', 'crash', 'low', 'bear', 'down', 'sell', 'risk', 'plunge', 'slump', 'decline', 'tumble'];

// In-memory TTL cache — note: on serverless this only persists for the
// lifetime of a single warm function instance. It still prevents duplicate
// calls within the same invocation and throttles API usage during development
// where instances stay warm for several minutes.
const NEWS_CACHE_TTL_MS = 90_000; // 1.5 minutes
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

  // Check cache first
  const cached = newsCache.get(topic);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ articles: cached.articles });
  }

  // Require GNews API key — return empty gracefully if not configured
  if (!GNEWS_API_KEY) {
    console.error('api/news: GNEWS_API_KEY is not set — returning empty article list');
    return NextResponse.json({ articles: [] });
  }

  try {
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(topic)}&lang=en&max=10&sortby=publishedAt&apikey=${GNEWS_API_KEY}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      console.error(`api/news: GNews request failed: HTTP ${res.status} — ${errorText.slice(0, 200)}`);
      // Return empty gracefully — news is supplementary, not critical to the UI
      return NextResponse.json({ articles: [] });
    }

    let data;
    try {
      data = await res.json();
    } catch (parseErr) {
      console.error('api/news: Failed to parse GNews response as JSON:', parseErr);
      return NextResponse.json({ articles: [] });
    }

    if (!data.articles || !Array.isArray(data.articles)) {
      console.error('api/news: GNews response missing articles array. Keys:', Object.keys(data));
      return NextResponse.json({ articles: [] });
    }

    const articles = data.articles.map((item: any) => {
      const combined = `${item.title || ''} ${item.description || ''}`;
      return {
        title: item.title,
        description: item.description || '',
        url: item.url,
        source: { name: item.source?.name || 'GNews' },
        publishedAt: item.publishedAt || new Date().toISOString(),
        related_classes: getRelatedClasses(combined),
        sentiment: getSentiment(item.title || ''),
      };
    });

    newsCache.set(topic, { articles, expiresAt: Date.now() + NEWS_CACHE_TTL_MS });

    return NextResponse.json({ articles });
  } catch (err: any) {
    // Network timeout or unexpected error — return empty gracefully
    console.error('api/news: Unexpected error fetching news:', err?.message || err);
    return NextResponse.json({ articles: [] });
  }
}

