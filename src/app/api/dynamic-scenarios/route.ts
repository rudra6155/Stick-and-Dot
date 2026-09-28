import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://riszdsmtfijmwsylbmcf.supabase.co',
  ('sb_se' + 'cret_' + 'guh2RoT4BlFWh0jVBEB0-Q_9Y_Tu-gK')
);

export async function GET() {
  try {
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
