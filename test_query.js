require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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
