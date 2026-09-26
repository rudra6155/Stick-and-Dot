require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const tickers = [
  'AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'GOOGL', 'META', 'BRK-B', 'UNH', 'JNJ', 'JPM', 'V', 'PG', 'MA', 'HD', 'CVX', 'MRK', 'ABBV', 'KO', 'PEP', 'AVGO', 'COST', 'WMT', 'MCD', 'TMO', 'CSCO', 'PFE', 'CRM', 'ABT', 'DHR', 'ACN', 'LIN', 'NKE', 'DIS', 'ADBE', 'TXN', 'WFC', 'VZ', 'PM', 'NEE', 'RTX', 'HON', 'INTC', 'CMCSA', 'QCOM', 'BMY', 'SPGI', 'COP', 'UNP', 'BA', 'AMGN', 'INTU', 'IBM', 'GE', 'LOW', 'CAT', 'SYK', 'ELV', 'DE', 'NOW', 'AXP', 'ISRG', 'BKNG', 'PLD', 'GS', 'MDT', 'BLK', 'T', 'GILD', 'SBUX', 'TJX', 'MDLZ', 'C', 'LMT', 'ADI', 'MMC', 'CVS', 'ZTS', 'CI', 'VRTX', 'CB', 'SLB', 'REGN', 'BDX', 'EOG', 'SO', 'PGR', 'BSX', 'AMT', 'CME', 'MO', 'DUK', 'ITW', 'TGT', 'AON', 'KLAC', 'NOC', 'CSX', 'CL', 'SHW',
  'BTC-USD', 'ETH-USD', 'USDT-USD', 'BNB-USD', 'SOL-USD', 'XRP-USD', 'USDC-USD', 'ADA-USD', 'AVAX-USD', 'DOGE-USD', 'TRX-USD', 'DOT-USD', 'LINK-USD', 'MATIC-USD', 'SHIB-USD', 'WBTC-USD', 'LTC-USD', 'DAI-USD', 'BCH-USD', 'LEO-USD', 'ATOM-USD', 'ETC-USD', 'XLM-USD', 'OKB-USD', 'NEAR-USD', 'INJ-USD', 'XMR-USD', 'OP-USD', 'LDO-USD', 'FIL-USD', 'KAS-USD', 'HBAR-USD', 'VET-USD', 'CRO-USD', 'RNDR-USD', 'MKR-USD', 'QNT-USD', 'BSV-USD', 'ALGO-USD', 'AAVE-USD', 'EGLD-USD', 'SNX-USD', 'THETA-USD',
  'EURUSD=X', 'JPY=X', 'GBPUSD=X', 'AUDUSD=X', 'NZDUSD=X', 'EURJPY=X', 'GBPJPY=X', 'EURGBP=X', 'EURCAD=X', 'EURCHF=X', 'AUDJPY=X', 'GBPCAD=X', 'CHFJPY=X', 'AUDCAD=X', 'CADJPY=X', 'NZDJPY=X', 'AUDCHF=X', 'GBPAUD=X', 'GBPNZD=X', 'EURAUD=X', 'EURNZD=X', 'USDCAD=X', 'USDCHF=X', 'USDMXN=X', 'USDZAR=X', 'USDSGD=X', 'USDHKD=X', 'USDTRY=X', 'USDINR=X', 'USDBRL=X', 'USDKRW=X', 'USDTWD=X', 'USDIDR=X', 'USDPHP=X', 'USDTHB=X', 'USDMYR=X', 'USDCNY=X', 'USDCZK=X', 'USDPLN=X', 'USDHUF=X', 'USDRUB=X', 'USDNOK=X', 'USDSEK=X', 'USDDKK=X', 'USDARS=X', 'USDCOP=X', 'USDCLP=X', 'USDPEN=X', 'USDEGP=X',
  'GC=F', 'SI=F', 'HG=F', 'PL=F', 'PA=F', 'CL=F', 'HO=F', 'RB=F', 'NG=F', 'BZ=F', 'ZC=F', 'ZW=F', 'ZO=F', 'ZR=F', 'ZS=F', 'ZM=F', 'ZL=F', 'LE=F', 'GF=F', 'HE=F', 'DC=F', 'CC=F', 'KC=F', 'CT=F', 'SB=F', 'OJ=F', 'LBS=F', 'ALI=F', 'GFF=F', 'MGC=F', 'SIL=F', 'TIO=F', 'QC=F', 'QG=F', 'QM=F', 'MCL=F', 'MTF=F', 'TGP=F', 'RS=F', 'W=F', 'B=F', 'C=F', 'S=F', 'SM=F', 'BO=F', 'FC=F', 'LC=F', 'LH=F', 'KW=F', 'MW=F',
  '^GSPC', '^DJI', '^IXIC', '^RUT', '^VIX', '^FTSE', '^N225', '^GDAXI', '^FCHI', '^STOXX50E', '^IBEX', '^AORD', '^AXJO', '^NZ50', '^KS11', '^HSI', '^TWII', '^STI', '^JKSE', '^KLSE', '^BSESN', '^NSEI', '^MXX', '^MERV', '^BVSP', '^IPSA', '^GSPTSE', '^SPPT', '^RUA', '^RUI', '^SML', '^MID', '^NDX', '^OEX', '^XAU', '^SOX', '^NYA', '^W5000', '^VVIX', '^VXN', '^VXO', '^TNX', '^TYX', '^FVX', '^IRX', '^CRB',
  'TLT', 'IEF', 'SHY', 'BND', 'AGG', 'LQD', 'HYG', 'JNK', 'MUB', 'MBB', 'SHV', 'VGSH', 'VGIT', 'VGLT', 'BNDX', 'EMB', 'VWOB', 'IGIB', 'IGSB', 'SPSB', 'SPIB', 'VCIT', 'VCSH', 'ANGL', 'FALN', 'USIG', 'FLOT', 'BSV', 'BIV', 'BLV', 'GOVT', 'SCHO', 'SCHR', 'SCHZ', 'SPAB', 'TOTL', 'BKLN', 'SRLN', 'FTSL', 'SJNK', 'HYS', 'PHB', 'HYD', 'SHM', 'TFI', 'VTEB', 'PZA', 'BAB', 'BFOR',
  'VNQ', 'O', 'SPG', 'AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'AVB', 'EQR', 'WELL', 'VTR', 'DLR', 'SBAC', 'ARE', 'WY', 'EXR', 'INVH', 'MAA', 'ESS', 'CPT', 'UDR', 'CAMT', 'HST', 'KIM', 'REG', 'FRT', 'BXP', 'VNO', 'SLG', 'KRC', 'HPP', 'CUBE', 'LSI', 'EPR', 'NNN', 'ADC', 'WPC', 'SRC', 'OPI', 'GTY', 'EGP', 'STAG', 'TRNO', 'COLD', 'IIPR', 'GLPI', 'VICI', 'MGP'
];

async function seed() {
  console.log(`Starting to seed ${tickers.length} tickers...`);
  
  for (const ticker of tickers) {
    try {
      const quote = await yahooFinance.quote(ticker);
      
      let revenueGrowth = null;
      try {
        const d = new Date();
        d.setMonth(d.getMonth() - 6);
        const period1 = d.toISOString().split('T')[0];
        const period2 = new Date().toISOString().split('T')[0];
        
        const hist = await yahooFinance.historical(ticker, { period1, period2, interval: '1mo' });
        if (hist && hist.length > 0) {
          const oldPrice = hist[0].close;
          const currentPrice = quote.regularMarketPrice;
          if (oldPrice && currentPrice) {
             revenueGrowth = (currentPrice - oldPrice) / oldPrice;
          }
        }
      } catch (err) {
        // Ignore historical error, let's just proceed without 6m return
      }
      
      let assetClass = 'Equity';
      if (ticker.includes('=X')) assetClass = 'Forex';
      else if (ticker.includes('-USD')) assetClass = 'Crypto';
      else if (ticker.includes('=F')) assetClass = 'Commodity';
      else if (ticker.startsWith('^')) assetClass = 'Index';
      else if (ticker.length >= 3 && ['TLT', 'BND', 'AGG'].includes(ticker)) assetClass = 'Bond'; // simplistic but covers many
      else if (['VNQ', 'O', 'SPG'].includes(ticker)) assetClass = 'REIT';

      const payload = {
        ticker: ticker,
        short_name: quote.shortName || quote.longName || ticker,
        price: quote.regularMarketPrice,
        market_cap: quote.marketCap || null,
        pe_ratio: quote.trailingPE || null,
        dividend_yield: quote.trailingAnnualDividendYield || quote.dividendYield || null,
        beta: quote.beta || null,
        sector: quote.sector || assetClass,
        industry: quote.industry || assetClass,
        asset_class: assetClass,
        revenue_growth: revenueGrowth,
        fetched_at: new Date().toISOString(),
        coin_id: null
      };

      const res = await supabase.from('asset_snapshots').upsert(payload, { onConflict: 'ticker, asset_class, coin_id' });
      if (res.error) {
        console.error(`Error inserting ${ticker}:`, res.error);
      } else {
        console.log(`Inserted ${ticker}`);
      }
    } catch (e) {
      console.log(`Failed to fetch ${ticker}: ${e.message}`);
    }
    
    // Add small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 100));
  }
  console.log('Seeding completed.');
}

seed().catch(console.error);
