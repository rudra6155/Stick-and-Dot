require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const Groq = require('groq-sdk').default;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function fetchHeadlines() {
  const categories = ['business', 'world', 'science', 'technology'];
  const allHeadlines = [];

  for (const cat of categories) {
    try {
      const res = await fetch(
        `https://gnews.io/api/v4/top-headlines?category=${cat}&lang=en&max=10&apikey=${GNEWS_API_KEY}`
      );
      if (!res.ok) { console.log(`  GNews ${cat}: HTTP ${res.status}`); continue; }
      const data = await res.json();
      if (data.articles) {
        data.articles.forEach(a => {
          allHeadlines.push(`[${cat.toUpperCase()}] ${a.title}`);
        });
      }
      console.log(`  GNews ${cat}: ${data.articles?.length || 0} articles`);
    } catch (e) {
      console.log(`  GNews ${cat}: Error - ${e.message}`);
    }
  }
  return allHeadlines;
}

async function fetchAvailableTickers() {
  const { data } = await supabase
    .from('asset_snapshots')
    .select('ticker, short_name, asset_class, sector, price, market_cap')
    .order('market_cap', { ascending: false, nullsFirst: false })
    .limit(150);

  if (!data || data.length === 0) return 'No tickers available';

  const grouped = {};
  data.forEach(row => {
    const cls = row.asset_class || 'Other';
    if (!grouped[cls]) grouped[cls] = [];
    grouped[cls].push(`${row.ticker} (${row.short_name || row.ticker}, $${(row.price || 0).toFixed(2)})`);
  });

  return Object.entries(grouped)
    .map(([cls, tickers]) => `${cls}: ${tickers.join(', ')}`)
    .join('\n');
}

async function generateScenarioBatch(headlines, tickerList, batchNum, count) {
  const systemPrompt = `You are a senior macro-economic analyst at a top investment bank. You analyze real-time news and identify investable opportunities.

CRITICAL RULES:
- You MUST only recommend tickers from the AVAILABLE TICKERS list below. Do NOT invent or hallucinate tickers.
- Every ticker you mention must appear EXACTLY as written in the available tickers list.
- Your analysis must be grounded in the news headlines provided. Do not fabricate events.
- Projected returns must be conservative and realistic.
- Each preset must have 5-8 tickers with weights summing to exactly 1.0.
- Each scenario MUST be about a DIFFERENT, DISTINCT news event. No duplicates.`;

  const userPrompt = `Analyze these REAL news headlines from today and identify ${count} DISTINCT investable macro events.
This is batch ${batchNum + 1}, so pick DIFFERENT events from what a first-pass analysis would cover. Dig deeper.

TODAY'S HEADLINES:
${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}

AVAILABLE TICKERS (you MUST pick from these ONLY):
${tickerList}

Return a JSON object:
{
  "scenarios": [
    {
      "title": "Short punchy title (5-8 words)",
      "emoji": "Single relevant emoji",
      "summary": "2-3 sentence overview of the event and market impact",
      "impact_analysis": "Detailed 4-5 sentence analysis",
      "news_headline": "The actual headline that triggered this",
      "category": "geopolitical|technology|monetary_policy|earnings|commodities|macro|energy|healthcare|defense|trade",
      "preset_portfolio": [
        { "ticker": "EXACT_TICKER", "name": "Full name", "asset_class": "Stock|ETF|Crypto|Commodity|Bond|REIT", "weight": 0.20, "reason": "Why this asset benefits" }
      ],
      "top_5_tickers": [
        { "ticker": "EXACT_TICKER", "name": "Full name", "reason": "Brief reason" }
      ],
      "watch_asset_classes": ["Technology"],
      "projected_return_pct": 8.5,
      "projected_return_1k": "$1,000 → ~$1,085 (est. 3-6 month horizon)",
      "confidence": "High|Moderate|Speculative"
    }
  ]
}

IMPORTANT:
- Exactly ${count} scenarios. Each about a DIFFERENT news event.
- Each preset_portfolio: 5-8 tickers, weights sum to 1.0
- top_5_tickers: exactly 5 per scenario
- projected_return_pct is a NUMBER`;

  const completion = await groq.chat.completions.create({
    model: 'qwen/qwen3.8-27b',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.65 + (batchNum * 0.05),
    max_tokens: 950,
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('Groq returned empty response');
  return JSON.parse(raw);
}

async function validateAndEnrich(scenarios) {
  const allTickers = new Set();
  scenarios.forEach(s => {
    (s.preset_portfolio || []).forEach(p => allTickers.add(p.ticker));
    (s.top_5_tickers || []).forEach(t => allTickers.add(t.ticker));
  });

  const { data: realAssets } = await supabase
    .from('asset_snapshots')
    .select('ticker, short_name, asset_class, price, market_cap, sector')
    .in('ticker', Array.from(allTickers));

  const assetMap = {};
  (realAssets || []).forEach(a => { assetMap[a.ticker] = a; });

  return scenarios.map(s => {
    const validPreset = (s.preset_portfolio || [])
      .filter(p => assetMap[p.ticker])
      .map(p => ({
        ...p,
        name: assetMap[p.ticker].short_name || p.name,
        asset_class: assetMap[p.ticker].asset_class || p.asset_class,
        price: assetMap[p.ticker].price,
        market_cap: assetMap[p.ticker].market_cap,
        sector: assetMap[p.ticker].sector,
      }));

    const totalWeight = validPreset.reduce((sum, p) => sum + (p.weight || 0), 0);
    if (totalWeight > 0 && totalWeight !== 1) {
      validPreset.forEach(p => { p.weight = parseFloat((p.weight / totalWeight).toFixed(4)); });
    }

    const validTop5 = (s.top_5_tickers || [])
      .filter(t => assetMap[t.ticker])
      .map(t => ({
        ...t,
        name: assetMap[t.ticker].short_name || t.name,
        asset_class: assetMap[t.ticker].asset_class,
        price: assetMap[t.ticker].price,
      }));

    return { ...s, preset_portfolio: validPreset, top_5_tickers: validTop5 };
  }).filter(s => s.preset_portfolio.length >= 3);
}

async function main() {
  console.log('=== REAL-TIME SCENARIO GENERATOR ===\n');

  // Step 1: Fetch headlines
  console.log('Step 1: Fetching live news headlines...');
  const headlines = await fetchHeadlines();
  console.log(`  Total headlines: ${headlines.length}\n`);

  if (headlines.length === 0) {
    console.error('No headlines found! Check GNEWS_API_KEY.');
    process.exit(1);
  }

  // Step 2: Fetch tickers
  console.log('Step 2: Loading available tickers from DB...');
  const tickerList = await fetchAvailableTickers();
  console.log('  Ticker list loaded.\n');

  // Step 3: Generate scenarios in batches
  const TARGET = 15;
  const BATCH_SIZE = 1;
  const batches = Math.ceil(TARGET / BATCH_SIZE);
  let allScenarios = [];

  for (let i = 0; i < batches; i++) {
    const count = Math.min(BATCH_SIZE, TARGET - allScenarios.length);
    console.log(`Step 3.${i + 1}: Generating batch ${i + 1}/${batches} (${count} scenarios)...`);

    try {
      const raw = await generateScenarioBatch(headlines, tickerList, i, count);
      const batchScenarios = raw.scenarios || raw;

      if (Array.isArray(batchScenarios)) {
        allScenarios = allScenarios.concat(batchScenarios);
        console.log(`  Batch ${i + 1} returned ${batchScenarios.length} scenarios. Total: ${allScenarios.length}`);
      }
    } catch (err) {
      console.error(`  Batch ${i + 1} FAILED: ${err.message}`);
    }

    // Wait 65 seconds between batches to respect Groq free-tier rate limit (1000 OTPM)
    if (i < batches - 1) {
      console.log(`  Waiting 65s for rate limit cooldown...`);
      await new Promise(r => setTimeout(r, 65000));
    }
  }

  console.log(`\nTotal raw scenarios: ${allScenarios.length}`);

  // Step 4: Deduplicate
  const seen = new Set();
  allScenarios = allScenarios.filter(s => {
    const key = s.title.toLowerCase().replace(/[^a-z]/g, '').slice(0, 20);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  console.log(`After deduplication: ${allScenarios.length}`);

  // Step 5: Validate
  console.log('\nStep 4: Validating tickers against DB...');
  const valid = await validateAndEnrich(allScenarios);
  console.log(`  Valid scenarios (with ≥3 real tickers): ${valid.length}`);

  if (valid.length === 0) {
    console.error('No valid scenarios! Aborting.');
    process.exit(1);
  }

  // Step 6: Deactivate old
  // Skip deactivation — we're adding MORE to the existing 10
  // await supabase.from('dynamic_scenarios').update({ is_active: false }).eq('is_active', true);

  // Step 7: Insert new
  const rows = valid.slice(0, TARGET).map(s => ({
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

  console.log(`\nStep 6: Inserting ${rows.length} scenarios into DB...`);
  const { error } = await supabase.from('dynamic_scenarios').insert(rows);

  if (error) {
    console.error('INSERT ERROR:', error);
    process.exit(1);
  }

  console.log(`\n✅ SUCCESS! Inserted ${rows.length} real-time scenarios.`);
  console.log('\nScenarios:');
  rows.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.emoji} ${r.title} [${r.confidence}] - ${r.preset_portfolio.length} assets`);
  });
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
