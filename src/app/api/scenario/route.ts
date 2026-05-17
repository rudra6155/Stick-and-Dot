import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SCENARIOS: Record<string, {
  description: string;
  filters: Record<string, any>;
  sort_by: string;
  logic: string;
}> = {
  "us_china_tension": {
    description: "US-China tensions rising — rotate to domestic US, gold, defense",
    filters: { asset_class: "Stock", sector: "Industrials" },
    sort_by: "revenue_growth",
    logic: "Favor defense, domestic manufacturing, and gold ETFs"
  },
  "inflation_high": {
    description: "High inflation — commodities, REITs, dividend stocks outperform",
    filters: { asset_class: "Commodity" },
    sort_by: "price",
    logic: "Commodities and inflation-protected assets"
  },
  "rate_hike": {
    description: "Rate hike cycle — financials gain, growth stocks drop",
    filters: { asset_class: "Stock", sector: "Financial Services" },
    sort_by: "pe_ratio",
    logic: "Banks and financials benefit from higher rates"
  },
  "recession_fear": {
    description: "Recession fears — defensive sectors, bonds, gold",
    filters: { asset_class: "Bond" },
    sort_by: "dividend_yield",
    logic: "Safe havens: bonds, utilities, consumer staples"
  },
  "ai_boom": {
    description: "AI boom — semiconductors, cloud, data infrastructure",
    filters: { asset_class: "Stock", sector: "Technology" },
    sort_by: "revenue_growth",
    logic: "AI infrastructure plays: semis, cloud, data centers"
  },
  "india_growth": {
    description: "India growth story — Indian equities, infrastructure, banking",
    filters: { asset_class: "Indian Stock" },
    sort_by: "revenue_growth",
    logic: "Indian domestic consumption and infrastructure boom"
  },
};

export async function POST(req: NextRequest) {
  const { scenario_key } = await req.json();
  const scenario = SCENARIOS[scenario_key];
  if (!scenario) return NextResponse.json({ error: 'Unknown scenario' }, { status: 400 });

  let query = supabase
    .from('asset_snapshots')
    .select('*')
    .order(scenario.sort_by, { ascending: false })
    .limit(15);

  const f = scenario.filters;
  if (f.asset_class) query = query.eq('asset_class', f.asset_class);
  if (f.sector) query = query.eq('sector', f.sector);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error }, { status: 500 });

  return NextResponse.json({
    scenario: scenario_key,
    description: scenario.description,
    logic: scenario.logic,
    results: data,
  });
}
