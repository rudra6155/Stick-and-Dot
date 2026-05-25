import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SCENARIOS: Record<string, {
  description: string;
  logic: string;
  queries: Array<{
    label: string;
    filters: Record<string, any>;
    sort_by: string;
    sort_dir?: string;
    limit: number;
  }>;
}> = {
  us_china_tension: {
    description: "US-China tensions rising — rotate to domestic US, gold, defense",
    logic: "In US-China tension scenarios, defense contractors and domestic manufacturers outperform. Gold acts as a safe haven. Avoid tech with heavy China exposure.",
    queries: [
      { label: "Defense & Industrials", filters: { asset_class: "Stock", sector: "Industrials" }, sort_by: "revenue_growth", limit: 5 },
      { label: "Safe Haven ETFs", filters: { asset_class: "ETF" }, sort_by: "dividend_yield", limit: 5 },
      { label: "Commodities", filters: { asset_class: "Commodity" }, sort_by: "price", limit: 5 },
    ]
  },
  inflation_high: {
    description: "High inflation — commodities, REITs, dividend stocks outperform",
    logic: "High inflation erodes cash. Hard assets like commodities and real estate historically preserve value. Dividend stocks provide income above inflation.",
    queries: [
      { label: "Commodities", filters: { asset_class: "Commodity" }, sort_by: "price", limit: 5 },
      { label: "REITs", filters: { asset_class: "REIT" }, sort_by: "dividend_yield", limit: 5 },
      { label: "High Dividend Stocks", filters: { asset_class: "Stock" }, sort_by: "dividend_yield", limit: 5 },
    ]
  },
  rate_hike: {
    description: "Rate hike cycle — financials gain, growth stocks drop",
    logic: "Rising rates boost bank margins. Avoid high-PE growth stocks — their future earnings are worth less. Short-duration bonds outperform long-duration.",
    queries: [
      { label: "Financial Services", filters: { asset_class: "Stock", sector: "Financial Services" }, sort_by: "return_on_equity", limit: 5 },
      { label: "Short Duration Bonds", filters: { asset_class: "Bond" }, sort_by: "dividend_yield", limit: 5 },
      { label: "Value Stocks", filters: { asset_class: "Stock" }, sort_by: "pe_ratio", sort_dir: "asc", limit: 5 },
    ]
  },
  recession_fear: {
    description: "Recession fears — defensive sectors, bonds, gold",
    logic: "Recessions hit cyclical stocks hard. Consumer staples, utilities, and healthcare hold up because demand is inelastic. Bonds and gold act as flight-to-safety assets.",
    queries: [
      { label: "Defensive Stocks", filters: { asset_class: "Stock", sector: "Consumer Defensive" }, sort_by: "dividend_yield", limit: 5 },
      { label: "Bonds", filters: { asset_class: "Bond" }, sort_by: "dividend_yield", limit: 5 },
      { label: "Healthcare", filters: { asset_class: "Stock", sector: "Healthcare" }, sort_by: "profit_margins", limit: 5 },
    ]
  },
  ai_boom: {
    description: "AI boom — semiconductors, cloud, data infrastructure",
    logic: "AI capex is flowing into chips, cloud compute, and data centers. Companies enabling AI infrastructure are growing revenues faster than end-use AI apps.",
    queries: [
      { label: "Technology Leaders", filters: { asset_class: "Stock", sector: "Technology" }, sort_by: "revenue_growth", limit: 5 },
      { label: "Tech ETFs", filters: { asset_class: "ETF" }, sort_by: "market_cap", limit: 5 },
      { label: "International Tech", filters: { asset_class: "International" }, sort_by: "revenue_growth", limit: 5 },
    ]
  },
  india_growth: {
    description: "India growth story — Indian equities, infrastructure, banking",
    logic: "India is the fastest growing major economy. Demographics, digital adoption, and infrastructure spending are secular tailwinds. Banking and consumption are key beneficiaries.",
    queries: [
      { label: "Indian Stocks", filters: { asset_class: "Indian Stock" }, sort_by: "revenue_growth", limit: 8 },
      { label: "Indian Banking", filters: { asset_class: "Indian Stock", sector: "Financial Services" }, sort_by: "return_on_equity", limit: 4 },
      { label: "Emerging Market ETFs", filters: { asset_class: "ETF" }, sort_by: "market_cap", limit: 3 },
    ]
  },
};

export async function POST(req: NextRequest) {
  const { scenario_key } = await req.json();
  const scenario = SCENARIOS[scenario_key];
  if (!scenario) return NextResponse.json({ error: 'Unknown scenario' }, { status: 400 });

  const groupedResults: Array<{ label: string; assets: any[] }> = [];

  for (const q of scenario.queries) {
    let query = supabase
      .from('asset_snapshots')
      .select('*')
      .order(q.sort_by, { ascending: q.sort_dir === 'asc' })
      .limit(q.limit);

    if (q.filters.asset_class) query = query.eq('asset_class', q.filters.asset_class);
    if (q.filters.sector) query = query.eq('sector', q.filters.sector);

    const { data } = await query;
    groupedResults.push({ label: q.label, assets: data || [] });
  }

  return NextResponse.json({
    scenario: scenario_key,
    description: scenario.description,
    logic: scenario.logic,
    groups: groupedResults,
  });
}
