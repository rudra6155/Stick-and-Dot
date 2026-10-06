export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PredictionEvent } from '@/utils/sportsData';
import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl, getSupabaseServiceKey } from '@/lib/supabase-config';

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  // Removed all fake Math.random() and seededRandom() event generators.
  // The system must only use 100% real data. Since we do not have a real
  // predictions database or a real-time odds API integration that provides probabilities,
  // we return an empty array to maintain authenticity.
  
  return NextResponse.json({ 
    source: 'live-database',
    count: 0,
    data: [] 
  });
}
