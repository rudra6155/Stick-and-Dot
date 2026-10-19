export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl, getSupabaseServiceKey } from '@/lib/supabase-config';

const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseServiceKey()
);

export async function GET(req: NextRequest) {
  try {
    const refresh = req.nextUrl?.searchParams?.get('refresh') === 'true';
    if (refresh) {
      try {
        const cronSecret = process.env.CRON_SECRET || 'super_fin_hub_cron_secret_2026';
        const baseUrl = req.nextUrl.origin || 'http://localhost:3000';
        await fetch(`${baseUrl}/api/cron/dynamic-scenarios?force=true&key=${cronSecret}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${cronSecret}` },
        });
      } catch (err) {
        console.warn('Refresh trigger warning:', err);
      }
    }

    const { data, error } = await supabase
      .from('dynamic_scenarios')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ scenarios: data || [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
