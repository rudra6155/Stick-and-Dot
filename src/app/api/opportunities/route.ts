export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseServiceKey } from '@/lib/supabase-config';

const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseServiceKey()
);

const SELECT_COLS = 'ticker, short_name, asset_class, sector, price, market_cap, pe_ratio, revenue_growth, dividend_yield, profit_margins, payout_ratio, return_on_equity, low_52_week, high_52_week, target_mean_price, recommendation_mean';

export async function GET() {
  const [
    { data: dips, error: errDips },
    { data: momentum, error: errMomentum },
    { data: income, error: errIncome },
    { data: undervalued, error: errUndervalued },
    { data: analyst, error: errAnalyst }
  ] = await Promise.all([
    // Dip Buy: revenue_growth > 0.1 and < 5.0 (max 500%), market_cap >= $500M, profit_margins > 0, price < low_52_week * 1.1
    supabase.from('asset_snapshots')
      .select(SELECT_COLS)
      .gt('revenue_growth', 0.1)
      .lt('revenue_growth', 5.0)
      .gte('market_cap', 500_000_000)
      .gt('profit_margins', 0)
      .not('low_52_week', 'is', null)
      .gt('price', 0)
      .order('revenue_growth', { ascending: false, nullsFirst: false })
      .limit(100),

    // Momentum: revenue_growth > 0.15 and < 5.0, market_cap >= $500M, price >= high_52_week * 0.95
    supabase.from('asset_snapshots')
      .select(SELECT_COLS)
      .gt('revenue_growth', 0.15)
      .lt('revenue_growth', 5.0)
      .gte('market_cap', 500_000_000)
      .not('high_52_week', 'is', null)
      .gt('price', 0)
      .order('revenue_growth', { ascending: false, nullsFirst: false })
      .limit(100),

    // Income: dividend_yield > 0.04 and < 0.25 (max 25%), payout_ratio 0 to 0.7, market_cap >= $500M, profit_margins > 0
    supabase.from('asset_snapshots')
      .select(SELECT_COLS)
      .gt('dividend_yield', 0.04)
      .lt('dividend_yield', 0.25)
      .gte('market_cap', 500_000_000)
      .gt('payout_ratio', 0)
      .lt('payout_ratio', 0.7)
      .gt('profit_margins', 0)
      .gt('price', 0)
      .order('dividend_yield', { ascending: false, nullsFirst: false })
      .limit(100),

    // Undervalued: pe_ratio 0 to 15, revenue_growth 0.1 to 5.0, roe > 0.15, market_cap >= $500M
    supabase.from('asset_snapshots')
      .select(SELECT_COLS)
      .gt('pe_ratio', 0)
      .lt('pe_ratio', 15)
      .gt('revenue_growth', 0.1)
      .lt('revenue_growth', 5.0)
      .gt('return_on_equity', 0.15)
      .gte('market_cap', 500_000_000)
      .gt('price', 0)
      .order('revenue_growth', { ascending: false, nullsFirst: false })
      .limit(100),

    // Analyst Upside: recommendation_mean < 2.5, target_mean_price > price * 1.2, market_cap >= $500M
    supabase.from('asset_snapshots')
      .select(SELECT_COLS)
      .lt('recommendation_mean', 2.5)
      .gt('target_mean_price', 0)
      .gte('market_cap', 500_000_000)
      .gt('price', 0)
      .order('recommendation_mean', { ascending: true, nullsFirst: false })
      .limit(100)
  ]);

  const errors = [errDips, errMomentum, errIncome, errUndervalued, errAnalyst].filter(Boolean);
  if (errors.length > 0) {
    console.error('api/opportunities query errors:', errors);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  if (!dips && !momentum && !income && !undervalued && !analyst) {
    return NextResponse.json({ opportunities: [], total: 0 });
  }

  // Combine and deduplicate
  const allDataMap = new Map();
  [...(dips || []), ...(momentum || []), ...(income || []), ...(undervalued || []), ...(analyst || [])].forEach(r => {
    if (!allDataMap.has(r.ticker)) allDataMap.set(r.ticker, r);
  });
  const data = Array.from(allDataMap.values());

  const opportunities: any[] = [];

  for (const r of data) {
    const growthDisplay = r.revenue_growth != null 
      ? Math.min(r.revenue_growth * 100, 500).toFixed(1) 
      : '0.0';

    // Opportunity 1 — Dip with strong fundamentals
    if (
      r.price && r.low_52_week &&
      r.price < r.low_52_week * 1.1 &&
      r.revenue_growth > 0.1 &&
      r.revenue_growth < 5.0 &&
      r.profit_margins > 0
    ) {
      opportunities.push({
        type: "dip_buy",
        label: "📉 Near 52W Low — Strong Fundamentals",
        desc: `Price near yearly low but revenue growing at ${growthDisplay}%`,
        color: "emerald",
        ...r,
      });
    }

    // Opportunity 2 — Momentum breakout
    if (
      r.price && r.high_52_week &&
      r.price >= r.high_52_week * 0.95 &&
      r.revenue_growth > 0.15 &&
      r.revenue_growth < 5.0
    ) {
      opportunities.push({
        type: "momentum",
        label: "🚀 Near 52W High — Strong Momentum",
        desc: `Breaking out with ${growthDisplay}% revenue growth`,
        color: "blue",
        ...r,
      });
    }

    // Opportunity 3 — High sustainable dividend
    if (
      r.dividend_yield > 0.04 &&
      r.dividend_yield < 0.25 &&
      r.payout_ratio > 0 &&
      r.payout_ratio < 0.7 &&
      r.profit_margins > 0
    ) {
      opportunities.push({
        type: "income",
        label: "💵 High Sustainable Dividend",
        desc: `${(r.dividend_yield * 100).toFixed(1)}% yield with ${(r.payout_ratio * 100).toFixed(0)}% payout ratio`,
        color: "amber",
        ...r,
      });
    }

    // Opportunity 4 — Undervalued growth
    if (
      r.pe_ratio > 0 && r.pe_ratio < 15 &&
      r.revenue_growth > 0.1 &&
      r.revenue_growth < 5.0 &&
      r.return_on_equity > 0.15
    ) {
      opportunities.push({
        type: "undervalued",
        label: "🔍 Undervalued Growth",
        desc: `P/E of ${r.pe_ratio.toFixed(1)} with ${growthDisplay}% growth and ${(r.return_on_equity * 100).toFixed(1)}% ROE`,
        color: "violet",
        ...r,
      });
    }

    // Opportunity 5 — Analyst upside
    if (
      r.target_mean_price && r.price &&
      r.target_mean_price > r.price * 1.2 &&
      r.recommendation_mean && r.recommendation_mean < 2.5
    ) {
      opportunities.push({
        type: "analyst_upside",
        label: "🎯 Strong Analyst Upside",
        desc: `Analysts target $${r.target_mean_price.toFixed(2)} — ${((r.target_mean_price / r.price - 1) * 100).toFixed(0)}% upside`,
        color: "cyan",
        ...r,
      });
    }
  }

  // Sort by revenue_growth desc, limit 60
  opportunities.sort((a, b) => (Math.min(b.revenue_growth || 0, 5)) - (Math.min(a.revenue_growth || 0, 5)));

  return NextResponse.json(
    { opportunities: opportunities.slice(0, 60), total: opportunities.length },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200'
      }
    }
  );
}
