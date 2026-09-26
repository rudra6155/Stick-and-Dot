require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanDb() {
  console.log('Deleting all rows where asset_class is Forex...');
  const res1 = await supabase.from('asset_snapshots').delete().eq('asset_class', 'Forex');
  if (res1.error) console.error('Error deleting Forex:', res1.error);
  else console.log('Forex deletion success');

  const prefixes = ['BND-', 'CMD-', 'RET-', 'IDX-'];
  for (const prefix of prefixes) {
    console.log(`Deleting all rows where ticker starts with ${prefix}...`);
    const res = await supabase.from('asset_snapshots').delete().like('ticker', `${prefix}%`);
    if (res.error) console.error(`Error deleting ${prefix}:`, res.error);
    else console.log(`${prefix} deletion success`);
  }
  
  console.log('Database cleanup completed.');
}

cleanDb().catch(console.error);
