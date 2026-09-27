import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GNEWS_API_KEY = process.env.GNEWS_API_KEY!;

// ── Fetch headlines from GNews ──────────────────────
async function fetchHeadlines(): Promise<string[]> {
  const categories = ['business', 'world', 'science', 'technology'];
  const allHeadlines: string[] = [];

  for (const cat of categories) {
    try {
      const res = await fetch(
        `https://gnews.io/api/v4/top-headlines?category=${cat}&lang=en&max=10&apikey=${GNEWS_API_KEY}`
      );
      if (!res.ok) continue;
      const data = await res.json();
      if (data.articles) {
        data.articles.forEach((a: any) => {
          allHeadlines.push(`[${cat.toUpperCase()}] ${a.title} — ${a.description || ''}`);
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
    .not('ticker', 'like', '%.%')
    .gt('market_cap', 0)
    .lt('market_cap', 6000000000000)
    .order('market_cap', { ascending: false, nullsFirst: false })
    .limit(500);

  if (!data || data.length === 0) return 'No tickers available';

  const seen = new Set<string>();
  const grouped: Record<string, string[]> = {};
  data.forEach((row: any) => {
    if (seen.has(row.ticker)) return;
    seen.add(row.ticker);
    const cls = row.asset_class || 'Other';
    if (!grouped[cls]) grouped[cls] = [];
    grouped[cls].push(`${row.ticker} (${row.short_name || row.ticker}, $${(row.price || 0).toFixed(2)})`);
  });

  return Object.entries(grouped)
    .map(([cls, tickers]) => `${cls}: ${tickers.join(', ')}`)
    .join('\n');
}

// ── Call Groq to generate a batch of scenarios ──────
async function generateScenarioBatch(headlines: string[], tickerList: string, batchNum: number, count: number) {
  const systemPrompt = `You are a senior macro-economic analyst at a top investment bank. You analyze real-time news and identify investable opportunities.

CRITICAL RULES:
- You MUST only recommend tickers from the AVAILABLE TICKERS list below. Do NOT invent or hallucinate tickers.
- Every ticker you mention must appear EXACTLY as written in the available tickers list.
- Your analysis must be grounded in the news headlines provided. Do not fabricate events.
- Projected returns must be conservative and realistic. Never promise guaranteed returns.
- Each preset must have 5-8 tickers with weights summing to exactly 1.0.
- Provide genuinely insightful analysis, not generic boilerplate.
- Each scenario MUST be about a DIFFERENT, DISTINCT news event. No duplicates.`;

  const userPrompt = `Analyze these REAL news headlines from today and identify ${count} DISTINCT investable macro events.
This is batch ${batchNum}, so pick DIFFERENT events from what typical first-pass analysis would cover. Dig deeper into the headlines.

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
      "category": "geopolitical|technology|monetary_policy|earnings|commodities|macro|energy|healthcare|defense|trade",
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
- Exactly ${count} scenarios in the array
- Each preset_portfolio has 5-8 tickers with weights summing to 1.0
- top_5_tickers has exactly 5 tickers per scenario
- watch_asset_classes has 1-2 entries per scenario
- projected_return_pct is a NUMBER, not a string
- Each scenario must be about a DIFFERENT news event — no overlapping themes`;

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7 + (batchNum * 0.05), // Slightly increase creativity for later batches
    max_tokens: 8000,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('Groq returned empty response');

  return JSON.parse(raw);
}

// ── Validate that recommended tickers exist in our DB ─
async function validateAndEnrichScenarios(scenarios: any[]) {
  const allTickers = new Set<string>();
  scenarios.forEach((s: any) => {
    s.preset_portfolio?.forEach((p: any) => allTickers.add(p.ticker));
    s.top_5_tickers?.forEach((t: any) => allTickers.add(t.ticker));
  });

  const { data: realAssets } = await supabase
    .from('asset_snapshots')
    .select('ticker, short_name, asset_class, price, market_cap, sector')
    .in('ticker', Array.from(allTickers));

  const assetMap: Record<string, any> = {};
  (realAssets || []).forEach((a: any) => { assetMap[a.ticker] = a; });

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
  }).filter((s: any) => s.preset_portfolio.length >= 3);
}

// ── Deduplicate scenarios by title similarity ───────
function deduplicateScenarios(scenarios: any[]): any[] {
  const seen = new Set<string>();
  return scenarios.filter((s: any) => {
    const key = s.title.toLowerCase().replace(/[^a-z]/g, '').slice(0, 20);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Main handler ────────────────────────────────────
async function handler(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('api/cron/dynamic-scenarios: CRON_SECRET env var is not set — rejecting request');
    return NextResponse.json({ error: 'Server misconfiguration: cron secret not configured' }, { status: 500 });
  }
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Scenarios] Starting real-time scenario generation...');
    
    // Step 1: Fetch news headlines
    const headlines = await fetchHeadlines();
    console.log(`[Scenarios] Fetched ${headlines.length} headlines`);
    
    if (headlines.length === 0) {
      return NextResponse.json({ error: 'No headlines available' }, { status: 503 });
    }

    // Step 2: Fetch available tickers
    const tickerList = await fetchAvailableTickers();
    console.log('[Scenarios] Loaded ticker list');

    // Step 3: Generate scenarios in 3 batches of ~9 each to get 25+ total
    const TARGET_SCENARIOS = 25;
    const BATCH_SIZE = 9;
    const batches = Math.ceil(TARGET_SCENARIOS / BATCH_SIZE);
    
    let allScenarios: any[] = [];
    
    for (let i = 0; i < batches; i++) {
      const count = Math.min(BATCH_SIZE, TARGET_SCENARIOS - allScenarios.length);
      console.log(`[Scenarios] Generating batch ${i + 1}/${batches} (${count} scenarios)...`);
      
      try {
        const raw = await generateScenarioBatch(headlines, tickerList, i, count);
        const batchScenarios = raw.scenarios || raw;
        
        if (Array.isArray(batchScenarios)) {
          allScenarios = allScenarios.concat(batchScenarios);
          console.log(`[Scenarios] Batch ${i + 1} returned ${batchScenarios.length} scenarios. Total: ${allScenarios.length}`);
        }
      } catch (err: any) {
        console.error(`[Scenarios] Batch ${i + 1} failed:`, err.message);
        // Continue with other batches
      }
    }

    if (allScenarios.length === 0) {
      return NextResponse.json({ error: 'All batches failed to generate scenarios' }, { status: 500 });
    }

    // Step 4: Deduplicate
    allScenarios = deduplicateScenarios(allScenarios);
    console.log(`[Scenarios] After deduplication: ${allScenarios.length} scenarios`);

    // Step 5: Validate tickers against our DB
    const validScenarios = await validateAndEnrichScenarios(allScenarios);
    console.log(`[Scenarios] After validation: ${validScenarios.length} scenarios with real tickers`);

    if (validScenarios.length === 0) {
      return NextResponse.json({ error: 'No valid scenarios after ticker validation' }, { status: 500 });
    }

    // Step 6: Insert all new scenarios first (up to 25)
    const rows = validScenarios.slice(0, TARGET_SCENARIOS).map((s: any) => ({
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

    const { data: insertedRows, error: insertError } = await supabase
      .from('dynamic_scenarios')
      .insert(rows)
      .select('id');

    if (insertError) {
      console.error('Failed to insert scenarios:', insertError);
      return NextResponse.json({ error: 'Insert failed, kept existing scenarios' }, { status: 500 });
    }

    // Step 7: Deactivate old scenarios only after new ones are safely inserted
    const newIds = insertedRows?.map((r: { id: string | number }) => r.id) || [];
    if (newIds.length > 0) {
      await supabase
        .from('dynamic_scenarios')
        .update({ is_active: false })
        .eq('is_active', true)
        .not('id', 'in', `(${newIds.join(',')})`);
    }

    console.log(`[Scenarios] Successfully inserted ${rows.length} real-time scenarios!`);

    return NextResponse.json({
      success: true,
      count: rows.length,
      headlines_used: headlines.length,
      scenarios: rows.map(r => ({ title: r.title, confidence: r.confidence, category: r.category, presetSize: r.preset_portfolio.length })),
    });
  } catch (err: any) {
    console.error('Dynamic scenarios cron error:', err);
    return NextResponse.json({ error: 'Internal server error', detail: err.message }, { status: 500 });
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
