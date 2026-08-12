import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const GNEWS_API_KEY = process.env.GNEWS_API_KEY!;

// ── Fetch headlines from GNews ──────────────────────
async function fetchHeadlines(): Promise<string[]> {
  const categories = ['business', 'world'];
  const allHeadlines: string[] = [];

  for (const cat of categories) {
    try {
      const res = await fetch(
        `https://gnews.io/api/v4/top-headlines?category=${cat}&lang=en&max=8&apikey=${GNEWS_API_KEY}`
      );
      if (!res.ok) continue;
      const data = await res.json();
      if (data.articles) {
        data.articles.forEach((a: any) => {
          allHeadlines.push(`[${cat.toUpperCase()}] ${a.title}`);
        });
      }
    } catch {
      // skip failed category
    }
  }

  return allHeadlines;
}

// ── Fetch available tickers from our DB ─────────────
async function fetchAvailableTickers(): Promise<string> {
  const { data } = await supabase
    .from('asset_snapshots')
    .select('ticker, short_name, asset_class, sector, price, market_cap')
    .order('market_cap', { ascending: false, nullsFirst: false })
    .limit(250);

  if (!data || data.length === 0) return 'No tickers available';

  // Group by asset class for the LLM
  const grouped: Record<string, string[]> = {};
  data.forEach((row: any) => {
    const cls = row.asset_class || 'Other';
    if (!grouped[cls]) grouped[cls] = [];
    grouped[cls].push(`${row.ticker} (${row.short_name || row.ticker}, $${(row.price || 0).toFixed(2)})`);
  });

  return Object.entries(grouped)
    .map(([cls, tickers]) => `${cls}: ${tickers.join(', ')}`)
    .join('\n');
}

// ── Call Groq to generate scenarios ─────────────────
async function generateScenarios(headlines: string[], tickerList: string) {
  const systemPrompt = `You are a senior macro-economic analyst at a top investment bank. You analyze real-time news and identify investable opportunities.

CRITICAL RULES:
- You MUST only recommend tickers from the AVAILABLE TICKERS list below. Do NOT invent or hallucinate tickers.
- Every ticker you mention must appear EXACTLY as written in the available tickers list.
- Your analysis must be grounded in the news headlines provided. Do not fabricate events.
- Projected returns must be conservative and realistic. Never promise guaranteed returns.
- Each preset must have 5-8 tickers with weights summing to exactly 1.0.
- Provide genuinely insightful analysis, not generic boilerplate.`;

  const userPrompt = `Analyze these REAL news headlines from today and identify the TOP 3 most investable macro events.

For each event, build a complete portfolio preset using ONLY tickers from the provided list.

TODAY'S HEADLINES:
${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}

AVAILABLE TICKERS (you MUST pick from these ONLY):
${tickerList}

Return a JSON object with this EXACT structure:
{
  "scenarios": [
    {
      "title": "Short punchy title (5-8 words)",
      "emoji": "Single relevant emoji",
      "summary": "2-3 sentence overview of the event and its market impact",
      "impact_analysis": "Detailed 4-5 sentence analysis: what happened, why it matters for markets, historical precedent if any, risk factors, and time horizon for the opportunity",
      "news_headline": "The actual headline that triggered this analysis",
      "category": "geopolitical|technology|monetary_policy|earnings|commodities|macro",
      "preset_portfolio": [
        {
          "ticker": "EXACT_TICKER_FROM_LIST",
          "name": "Full company name",
          "asset_class": "Stock|ETF|Crypto|Commodity|Bond|REIT|Indian Stock|International",
          "weight": 0.20,
          "reason": "One clear sentence explaining why this specific asset benefits from this event"
        }
      ],
      "top_5_tickers": [
        {"ticker": "EXACT_TICKER_FROM_LIST", "name": "Full name", "reason": "Brief reason"}
      ],
      "watch_asset_classes": ["Technology", "Crypto"],
      "projected_return_pct": 8.5,
      "projected_return_1k": "$1,000 → ~$1,085 (est. 3-6 month horizon)",
      "confidence": "High|Moderate|Speculative"
    }
  ]
}

IMPORTANT:
- Exactly 3 scenarios in the array
- Each preset_portfolio has 5-8 tickers with weights summing to 1.0
- top_5_tickers has exactly 5 tickers per scenario
- watch_asset_classes has 1-2 entries per scenario
- projected_return_pct is a NUMBER, not a string
- Pick the 3 events with the HIGHEST profit potential and clearest thesis`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.6,
    max_tokens: 4096,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('Groq returned empty response');

  return JSON.parse(raw);
}

// ── Validate that recommended tickers exist in our DB ─
async function validateAndEnrichScenarios(scenarios: any[]) {
  // Collect all tickers mentioned across all scenarios
  const allTickers = new Set<string>();
  scenarios.forEach((s: any) => {
    s.preset_portfolio?.forEach((p: any) => allTickers.add(p.ticker));
    s.top_5_tickers?.forEach((t: any) => allTickers.add(t.ticker));
  });

  // Fetch real data for these tickers
  const { data: realAssets } = await supabase
    .from('asset_snapshots')
    .select('ticker, short_name, asset_class, price, market_cap, sector')
    .in('ticker', Array.from(allTickers));

  const assetMap: Record<string, any> = {};
  (realAssets || []).forEach((a: any) => { assetMap[a.ticker] = a; });

  // Filter out any hallucinated tickers and enrich with real prices
  return scenarios.map((s: any) => {
    const validPreset = (s.preset_portfolio || [])
      .filter((p: any) => assetMap[p.ticker])
      .map((p: any) => ({
        ...p,
        name: assetMap[p.ticker].short_name || p.name,
        asset_class: assetMap[p.ticker].asset_class || p.asset_class,
        price: assetMap[p.ticker].price,
        market_cap: assetMap[p.ticker].market_cap,
        sector: assetMap[p.ticker].sector,
      }));

    // Re-normalize weights if any tickers were removed
    const totalWeight = validPreset.reduce((sum: number, p: any) => sum + (p.weight || 0), 0);
    if (totalWeight > 0 && totalWeight !== 1) {
      validPreset.forEach((p: any) => { p.weight = parseFloat((p.weight / totalWeight).toFixed(4)); });
    }

    const validTop5 = (s.top_5_tickers || [])
      .filter((t: any) => assetMap[t.ticker])
      .map((t: any) => ({
        ...t,
        name: assetMap[t.ticker].short_name || t.name,
        asset_class: assetMap[t.ticker].asset_class,
        price: assetMap[t.ticker].price,
      }));

    return {
      ...s,
      preset_portfolio: validPreset,
      top_5_tickers: validTop5,
    };
  }).filter((s: any) => s.preset_portfolio.length >= 3); // Only keep scenarios with at least 3 valid tickers
}

// ── Main handler ────────────────────────────────────
async function handler(req: NextRequest) {
  // Verify cron secret in production
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Step 1: Fetch news headlines
    const headlines = await fetchHeadlines();
    if (headlines.length === 0) {
      return NextResponse.json({ error: 'No headlines available' }, { status: 503 });
    }

    // Step 2: Fetch available tickers
    const tickerList = await fetchAvailableTickers();

    // Step 3: Generate scenarios via Groq
    const raw = await generateScenarios(headlines, tickerList);
    const rawScenarios = raw.scenarios || raw;

    if (!Array.isArray(rawScenarios) || rawScenarios.length === 0) {
      return NextResponse.json({ error: 'Groq returned no scenarios' }, { status: 500 });
    }

    // Step 4: Validate tickers against our DB and enrich with real prices
    const validScenarios = await validateAndEnrichScenarios(rawScenarios);

    if (validScenarios.length === 0) {
      return NextResponse.json({ error: 'No valid scenarios after ticker validation' }, { status: 500 });
    }

    // Step 5: Deactivate old scenarios
    await supabase
      .from('dynamic_scenarios')
      .update({ is_active: false })
      .eq('is_active', true);

    // Step 6: Insert new scenarios
    const rows = validScenarios.slice(0, 3).map((s: any) => ({
      title: s.title,
      emoji: s.emoji || '📊',
      summary: s.summary,
      impact_analysis: s.impact_analysis,
      news_headline: s.news_headline,
      category: s.category || 'macro',
      preset_portfolio: s.preset_portfolio,
      top_5_tickers: s.top_5_tickers,
      watch_asset_classes: s.watch_asset_classes || [],
      projected_return_pct: s.projected_return_pct || 0,
      projected_return_1k: s.projected_return_1k || '',
      confidence: s.confidence || 'Moderate',
      is_active: true,
    }));

    const { error: insertError } = await supabase
      .from('dynamic_scenarios')
      .insert(rows);

    if (insertError) {
      console.error('Failed to insert scenarios:', insertError);
      return NextResponse.json({ error: 'Failed to save scenarios' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: rows.length,
      scenarios: rows.map(r => ({ title: r.title, confidence: r.confidence, presetSize: r.preset_portfolio.length })),
    });
  } catch (err: any) {
    console.error('Dynamic scenarios cron error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET = manual trigger for development
export async function GET(req: NextRequest) {
  return handler(req);
}

// POST = Vercel Cron trigger
export async function POST(req: NextRequest) {
  return handler(req);
}
