import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from('asset_snapshots')
    .select('*')
    .not('price', 'is', null)
    .gt('price', 0);

  if (error) return NextResponse.json({ error }, { status: 500 });
  if (!data) return NextResponse.json({ opportunities: [] });

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

  // Sort by revenue_growth desc, limit 50
  opportunities.sort((a, b) => (b.revenue_growth || 0) - (a.revenue_growth || 0));

  return NextResponse.json({ opportunities: opportunities.slice(0, 60), total: opportunities.length });
}
