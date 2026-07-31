const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const assetClasses = ["Crypto", "Stock", "ETF", "REIT", "Commodity", "Bond", "Indian Stock", "International", "Forex", "Index"];
  
  const counts = {};
  
  const promises = assetClasses.map(async (cls) => {
    const { count, error } = await supabase
      .from('asset_snapshots')
      .select('*', { count: 'exact', head: true })
      .eq('asset_class', cls);
    
    if (error) {
      console.error("Error for", cls, error);
    } else {
      counts[cls] = count || 0;
    }
  });

  await Promise.all(promises);
  console.log("Asset Classes and Counts:");
  console.log(counts);
}

run();
