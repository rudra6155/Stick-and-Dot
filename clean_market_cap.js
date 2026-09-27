require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanMarketCap() {
  console.log('Finding rows with market_cap > 20T...');
  const { count, error: countError } = await supabase
    .from('asset_snapshots')
    .select('*', { count: 'exact', head: true })
    .gt('market_cap', 20000000000000);

  if (countError) {
    console.error('Count error:', countError);
    return;
  }
  console.log(`Found ${count} rows with market_cap > 20T.`);

  if (count && count > 0) {
    const { data, error: updateError } = await supabase
      .from('asset_snapshots')
      .update({ market_cap: null })
      .gt('market_cap', 20000000000000);

    if (updateError) {
      console.error('Update error:', updateError);
    } else {
      console.log('Successfully nullified corrupt market_cap values > 20T');
    }
  }

  // Verify
  const { count: remainingCount } = await supabase
    .from('asset_snapshots')
    .select('*', { count: 'exact', head: true })
    .gt('market_cap', 20000000000000);

  console.log(`Remaining corrupt rows > 20T: ${remainingCount}`);
}

cleanMarketCap();
