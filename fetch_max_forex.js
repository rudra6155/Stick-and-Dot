require("dotenv").config({ path: ".env" });
const { createClient } = require("@supabase/supabase-js");
const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const currencies = [
  "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD", "CNY", "HKD",
  "SGD", "INR", "AED", "ZAR", "BRL", "MXN", "RUB", "SEK", "NOK", "DKK",
  "KRW", "TRY", "SAR", "THB", "IDR", "MYR", "PHP", "TWD", "PLN", "CZK",
  "HUF", "RON", "BGN", "HRK", "RSD", "ILS", "EGP", "KWD", "QAR", "BHD",
  "OMR", "JOD", "LBP", "MAD", "DZD", "TND", "NGN", "KES", "GHS", "UGX",
  "TZS", "ZMW", "MZN", "BWP", "NAD", "SZL", "LSL", "ARS", "CLP", "COP",
  "PEN", "UYU", "PYG", "BOB", "VEF", "VND", "PKR", "BDT", "LKR", "NPR",
  "MMK", "KHR", "LAK", "MNT", "BND", "FJD", "PGK", "SBD", "VUV", "WST",
  "TOP", "XPF", "XAF", "XOF", "BIF", "CDF", "RWF", "STN", "CVE", "GMD",
  "GNF", "LRD", "SLL", "SOS", "DJF", "ERN", "ETB", "MWK", "AOA", "MGA",
  "MUR", "SCR", "KMF", "MVR", "AMD", "AZN", "GEL", "KZT", "KGS", "TJS",
  "UZS", "TMT", "AFN", "IQD", "SYP", "YER", "IRR", "BBD", "BSD", "BZD",
  "BMD", "KYD", "CUP", "DOP", "HTG", "JMD", "ANG", "AWG", "TTD", "XCD",
  "BAM", "MKD", "ALL", "ISK", "GIP", "FKP", "SHP", "BND", "MOP", "SDG",
  "SSP", "CUP", "CUC", "BAM", "MDL", "BYN", "UAH"
];

// Unique currencies
const uniqueCurrencies = [...new Set(currencies)];

const allPairs = [];
for (let i = 0; i < uniqueCurrencies.length; i++) {
  for (let j = 0; j < uniqueCurrencies.length; j++) {
    if (i !== j) {
      allPairs.push(`${uniqueCurrencies[i]}${uniqueCurrencies[j]}=X`);
    }
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(`Total pairs to test: ${allPairs.length}`);
  const batchSize = 100;
  
  for (let i = 0; i < allPairs.length; i += batchSize) {
    const batch = allPairs.slice(i, i + batchSize);
    console.log(`Testing batch ${i / batchSize + 1} of ${Math.ceil(allPairs.length / batchSize)}`);
    
    try {
      const results = await yahooFinance.quote(batch);
      const validResults = Array.isArray(results) ? results : (results ? [results] : []);
      
      const toInsert = validResults.map(q => ({
        ticker: q.symbol,
        short_name: (q.shortName || q.longName || q.symbol).substring(0, 255),
        price: q.regularMarketPrice || 0,
        market_cap: q.marketCap || null,
        asset_class: "Forex",
        coin_id: null,
        fetched_at: new Date().toISOString()
      })).filter(q => q.price > 0);
      
      if (toInsert.length > 0) {
        const { error } = await supabase
          .from("asset_snapshots")
          .upsert(toInsert, { onConflict: "ticker,asset_class,coin_id" });
          
        if (error) {
          console.error("Supabase insert error:", error);
        } else {
          console.log(`Inserted ${toInsert.length} forex pairs.`);
        }
      }
    } catch (err) {
      console.log(`Error in batch ${i / batchSize + 1}: ${err.message}`);
    }
    
    await delay(100);
  }
  console.log("Done fetching forex.");
}

main();
