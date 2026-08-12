import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/utils/supabase/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { scenario_id, total_amount } = body;

  if (!scenario_id || typeof scenario_id !== 'string') {
    return NextResponse.json({ error: 'scenario_id is required' }, { status: 400 });
  }

  const investAmount = Number(total_amount);
  if (!investAmount || investAmount <= 0 || investAmount > 1000000) {
    return NextResponse.json({ error: 'total_amount must be between $1 and $1,000,000' }, { status: 400 });
  }

  // Authenticate user
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    // Fetch the scenario
    const { data: scenario, error: scenarioErr } = await supabaseAdmin
      .from('dynamic_scenarios')
      .select('preset_portfolio')
      .eq('id', scenario_id)
      .single();

    if (scenarioErr || !scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }

    const preset = scenario.preset_portfolio as Array<{
      ticker: string;
      name: string;
      asset_class: string;
      weight: number;
      price: number;
    }>;

    if (!Array.isArray(preset) || preset.length === 0) {
      return NextResponse.json({ error: 'Scenario has no preset portfolio' }, { status: 400 });
    }

    // Check which tickers user already has
    const { data: existingPicks } = await supabaseAdmin
      .from('user_picks')
      .select('ticker')
      .eq('user_id', user.id);

    const existingTickers = new Set((existingPicks || []).map((p: any) => p.ticker));

    // Build picks, skipping duplicates
    const newPicks: any[] = [];
    const skippedTickers: string[] = [];

    for (const asset of preset) {
      if (existingTickers.has(asset.ticker)) {
        skippedTickers.push(asset.ticker);
        continue;
      }

      const amount = Math.round(investAmount * asset.weight * 100) / 100;
      const quantity = asset.price > 0 ? parseFloat((amount / asset.price).toFixed(6)) : 0;

      newPicks.push({
        user_id: user.id,
        ticker: asset.ticker,
        asset_class: asset.asset_class,
        amount,
        quantity,
        holding_period: 'Medium (Months)',
        picked_at_price: asset.price,
      });
    }

    // Insert all new picks
    if (newPicks.length > 0) {
      const { error: insertErr } = await supabaseAdmin
        .from('user_picks')
        .insert(newPicks);

      if (insertErr) {
        console.error('Failed to insert preset picks:', insertErr);
        return NextResponse.json({ error: 'Failed to add assets to portfolio' }, { status: 500 });
      }
    }

    const totalInvested = newPicks.reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      success: true,
      added: newPicks.length,
      skipped: skippedTickers.length,
      skipped_tickers: skippedTickers,
      total_invested: Math.round(totalInvested * 100) / 100,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
