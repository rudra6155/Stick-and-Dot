const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://riszdsmtfijmwsylbmcf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpc3pkc210ZmlqbXdzeWxibWNmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTAwNjU1MSwiZXhwIjoyMDk0NTgyNTUxfQ.iOySao0m0yRVQuERASn2BB1uw4obL5GZxR3t6XNdfwk'
);

async function run() {
  const q = 'AAPL';
  let query = supabase
    .from('asset_snapshots')
    .select('ticker, short_name', { count: 'exact' })
    .or(`ticker.ilike.%${q}%,short_name.ilike.%${q}%`, { referencedTable: undefined })
    .order('market_cap', { ascending: false, nullsFirst: false })
    .range(0, 39);

  const { data, count, error } = await query;
  console.log('Error:', error);
  console.log('Count:', count);
  console.log('Returned rows:', data ? data.length : 0);
  if (data && data.length > 0) {
    console.log('First returned:', data[0].ticker, data[0].short_name);
    console.log('Second returned:', data[1]?.ticker, data[1]?.short_name);
  }
}
run();
