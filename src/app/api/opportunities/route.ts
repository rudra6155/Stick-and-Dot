import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const [
    { data: dips, error: errDips },
    { data: momentum, error: errMomentum },
    { data: income, error: errIncome },
    { data: undervalued, error: errUndervalued },
    { data: analyst, error: errAnalyst }
  ] = await Promise.all([
    // Dip Buy: revenue_growth > 0.1, profit_margins > 0, price < low_52_week * 1.1 (filtered in JS)
    supabase.from('asset_snapshots').select('*').gt('revenue_growth', 0.1).gt('profit_margins', 0).not('low_52_week', 'is', null).gt('price', 0).order('revenue_growth', { ascending: false }).limit(100),
    // Momentum: revenue_growth > 0.15, price >= high_52_week * 0.95 (filtered in JS)
    supabase.from('asset_snapshots').select('*').gt('revenue_growth', 0.15).not('high_52_week', 'is', null).gt('price', 0).order('revenue_growth', { ascending: false }).limit(100),
    // Income: dividend_yield > 0.04, payout_ratio 0 to 0.7, profit_margins > 0
    supabase.from('asset_snapshots').select('*').gt('dividend_yield', 0.04).gt('payout_ratio', 0).lt('payout_ratio', 0.7).gt('profit_margins', 0).gt('price', 0).order('dividend_yield', { ascending: false }).limit(100),
    // Undervalued: pe_ratio 0 to 15, revenue_growth > 0.1, roe > 0.15
    supabase.from('asset_snapshots').select('*').gt('pe_ratio', 0).lt('pe_ratio', 15).gt('revenue_growth', 0.1).gt('return_on_equity', 0.15).gt('price', 0).order('revenue_growth', { ascending: false }).limit(100),
    // Analyst Upside: recommendation_mean < 2.5, target_mean_price > price * 1.2 (filtered in JS)
    supabase.from('asset_snapshots').select('*').lt('recommendation_mean', 2.5).gt('target_mean_price', 0).gt('price', 0).order('recommendation_mean', { ascending: true }).limit(100)
  ]);

  const errors = [errDips, errMomentum, errIncome, errUndervalued, errAnalyst].filter(Boolean);
  if (errors.length > 0) {
    console.error("Errors fetching opportunities:", errors);
  }

  if (!dips && !momentum && !income && !undervalued && !analyst) {
    return NextResponse.json({ opportunities: [], total: 0 });
  }

  // Combine and deduplicate
  const allDataMap = new Map();
  [...(dips||[]), ...(momentum||[]), ...(income||[]), ...(undervalued||[]), ...(analyst||[])].forEach(r => {
    if (!allDataMap.has(r.ticker)) allDataMap.set(r.ticker, r);
  });
  const data = Array.from(allDataMap.values());

  const opportunities: any[] = [];

  for (const r of data) {
    // Opportunity 1 — Dip with strong fundamentals
    if (
      r.price && r.low_52_week &&
      r.price < r.low_52_week * 1.1 &&
      r.revenue_growth > 0.1 &&
      r.profit_margins > 0
    ) {
      opportunities.push({
        type: "dip_buy",
        label: "📉 Near 52W Low — Strong Fundamentals",
        desc: `Price near yearly low but revenue growing at ${(r.revenue_growth * 100).toFixed(1)}%`,
        color: "emerald",
        ...r,
      });
    }

    // Opportunity 2 — Momentum breakout
    if (
      r.price && r.high_52_week &&
      r.price >= r.high_52_week * 0.95 &&
      r.revenue_growth > 0.15
    ) {
      opportunities.push({
        type: "momentum",
        label: "🚀 Near 52W High — Strong Momentum",
        desc: `Breaking out with ${(r.revenue_growth * 100).toFixed(1)}% revenue growth`,
        color: "blue",
        ...r,
      });
    }

    // Opportunity 3 — High sustainable dividend
    if (
      r.dividend_yield > 0.04 &&
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
      r.return_on_equity > 0.15
    ) {
      opportunities.push({
        type: "undervalued",
        label: "🔍 Undervalued Growth",
        desc: `P/E of ${r.pe_ratio.toFixed(1)} with ${(r.revenue_growth * 100).toFixed(1)}% growth and ${(r.return_on_equity * 100).toFixed(1)}% ROE`,
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
  opportunities.sort((a, b) => (b.revenue_growth || 0) - (a.revenue_growth || 0));

  return NextResponse.json({ opportunities: opportunities.slice(0, 60), total: opportunities.length });
}
