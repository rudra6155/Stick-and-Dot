import { NextRequest, NextResponse } from 'next/server';

const GNEWS_API_KEY = 'e91739ced412d236b89fcf38b5cdb370';

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
  const body = await req.json();
  const topic = body.topic || 'finance';

  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(topic)}&lang=en&country=us&max=10&apikey=${GNEWS_API_KEY}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.articles) {
      return NextResponse.json({ error: 'No articles returned', raw: data }, { status: 500 });
    }

    const articles = data.articles.map((article: any) => {
      const combined = `${article.title || ''} ${article.description || ''}`;
      return {
        ...article,
        related_classes: getRelatedClasses(combined),
        sentiment: getSentiment(article.title || ''),
      };
    });

    return NextResponse.json({ articles });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
