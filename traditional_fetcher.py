import yfinance as yf
import sqlite3
import time
from yahooquery import Ticker as YQTicker

from ticker_lists import (
    SP500_TICKERS, ETF_TICKERS, REIT_TICKERS,
    COMMODITY_TICKERS, BOND_TICKERS, INDIAN_TICKERS,
    INTERNATIONAL_TICKERS, GROWTH_TICKERS,
    MIDCAP_TICKERS, INDIAN_EXTENDED_TICKERS,
    RUSSELL_TICKERS, ADR_TICKERS, INDIAN_LARGE_TICKERS,
    THEMATIC_ETF_TICKERS, SMALLCAP_TICKERS,
    LSE_TICKERS, TSX_TICKERS, ASX_TICKERS,
    FSE_TICKERS, HKEX_TICKERS, TSE_TICKERS,
    SGX_TICKERS, EURONEXT_TICKERS, FOREX_TICKERS, INDICES_TICKERS,
    REIT_EXPANDED_TICKERS, BOND_EXPANDED_TICKERS,
    LSE_EXPANDED_TICKERS, TSX_EXPANDED_TICKERS,
    REIT_GLOBAL_TICKERS, EURONEXT_FULL_TICKERS, XETRA_FULL_TICKERS
)

# Load downloaded tickers from CSV scrape
def load_downloaded_tickers():
    all_tickers = []
    for filename in ['downloaded_tickers.txt', 'downloaded_tickers_v3.txt', 'downloaded_etfs.txt', 'downloaded_china_real.txt', 'downloaded_korea_clean.txt', 'downloaded_otc.txt', 'downloaded_bse_only.txt', 'downloaded_more_exchanges.txt', 'downloaded_final_push.txt', 'downloaded_final_squeeze.txt']:
        try:
            with open(filename, 'r') as f:
                tickers = [line.strip() for line in f if line.strip()]
            print(f"Loaded {len(tickers)} tickers from {filename}")
            all_tickers.extend(tickers)
        except:
            print(f"{filename} not found, skipping")
    unique = list(set(all_tickers))
    print(f"Total unique downloaded tickers: {len(unique)}")
    return unique

ASSET_CLASS_MAP = {
    "SP500": "Stock",
    "ETF": "ETF",
    "REIT": "REIT",
    "REIT_Global": "REIT",
    "Commodity": "Commodity",
    "Bond": "Bond",
    "Indian Stock": "Indian Stock",
    "International": "International",
    "Growth": "Stock",
    "MidCap": "Stock",
    "Indian Extended": "Indian Stock",
    "Russell": "Stock",
    "International ADR": "International",
    "Indian Stock Large": "Indian Stock",
    "Thematic ETF": "ETF",
    "SmallCap Growth": "Stock",
    "LSE": "International",
    "TSX": "International",
    "ASX": "International",
    "FSE": "International",
    "HKEX": "International",
    "TSE": "International",
    "SGX": "International",
    "Euronext": "International",
    "Xetra": "International",
    "Forex": "Forex",
    "Index": "Index",
    "Downloaded": "Stock",
}

def setup_database():
    conn = sqlite3.connect('finance_hub.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS traditional_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker TEXT,
            short_name TEXT,
            long_name TEXT,
            asset_class TEXT,
            price REAL,
            previous_close REAL,
            open REAL,
            day_high REAL,
            day_low REAL,
            volume REAL,
            avg_volume REAL,
            market_cap REAL,
            enterprise_value REAL,
            pe_ratio REAL,
            forward_pe REAL,
            peg_ratio REAL,
            price_to_book REAL,
            price_to_sales REAL,
            ev_to_ebitda REAL,
            dividend_rate REAL,
            dividend_yield REAL,
            payout_ratio REAL,
            five_year_avg_dividend_yield REAL,
            earnings_growth REAL,
            revenue_growth REAL,
            profit_margins REAL,
            gross_margins REAL,
            operating_margins REAL,
            return_on_equity REAL,
            return_on_assets REAL,
            total_revenue REAL,
            ebitda REAL,
            total_debt REAL,
            free_cashflow REAL,
            high_52_week REAL,
            low_52_week REAL,
            all_time_high REAL,
            all_time_low REAL,
            ma_50_day REAL,
            ma_200_day REAL,
            beta REAL,
            shares_outstanding REAL,
            float_shares REAL,
            shares_short REAL,
            held_percent_insiders REAL,
            held_percent_institutions REAL,
            recommendation_mean REAL,
            target_mean_price REAL,
            target_high_price REAL,
            trailing_eps REAL,
            forward_eps REAL,
            sector TEXT,
            industry TEXT,
            country TEXT,
            exchange TEXT,
            currency TEXT,
            website TEXT,
            long_business_summary TEXT,
            timestamp DATETIME
        )
    ''')
    conn.commit()
    return conn

def safe_float(val):
    try:
        return float(val) if val is not None else None
    except:
        return None

def safe_str(val):
    try:
        return str(val) if val is not None else None
    except:
        return None

def fetch_ticker_data(ticker, asset_class):
    try:
        info = yf.Ticker(ticker).info
        price = safe_float(info.get('currentPrice') or info.get('regularMarketPrice') or info.get('previousClose'))
        if not price:
            return None

        return (
            ticker,
            safe_str(info.get('shortName')),
            safe_str(info.get('longName')),
            asset_class,
            price,
            safe_float(info.get('previousClose')),
            safe_float(info.get('open')),
            safe_float(info.get('dayHigh')),
            safe_float(info.get('dayLow')),
            safe_float(info.get('volume')),
            safe_float(info.get('averageVolume')),
            safe_float(info.get('marketCap')),
            safe_float(info.get('enterpriseValue')),
            safe_float(info.get('trailingPE')),
            safe_float(info.get('forwardPE')),
            safe_float(info.get('pegRatio')),
            safe_float(info.get('priceToBook')),
            safe_float(info.get('priceToSalesTrailing12Months')),
            safe_float(info.get('enterpriseToEbitda')),
            safe_float(info.get('dividendRate')),
            safe_float(info.get('dividendYield')),
            safe_float(info.get('payoutRatio')),
            safe_float(info.get('fiveYearAvgDividendYield')),
            safe_float(info.get('earningsGrowth')),
            safe_float(info.get('revenueGrowth')),
            safe_float(info.get('profitMargins')),
            safe_float(info.get('grossMargins')),
            safe_float(info.get('operatingMargins')),
            safe_float(info.get('returnOnEquity')),
            safe_float(info.get('returnOnAssets')),
            safe_float(info.get('totalRevenue')),
            safe_float(info.get('ebitda')),
            safe_float(info.get('totalDebt')),
            safe_float(info.get('freeCashflow')),
            safe_float(info.get('fiftyTwoWeekHigh')),
            safe_float(info.get('fiftyTwoWeekLow')),
            safe_float(info.get('allTimeHigh')),
            safe_float(info.get('allTimeLow')),
            safe_float(info.get('fiftyDayAverage')),
            safe_float(info.get('twoHundredDayAverage')),
            safe_float(info.get('beta')),
            safe_float(info.get('sharesOutstanding')),
            safe_float(info.get('floatShares')),
            safe_float(info.get('sharesShort')),
            safe_float(info.get('heldPercentInsiders')),
            safe_float(info.get('heldPercentInstitutions')),
            safe_float(info.get('recommendationMean')),
            safe_float(info.get('targetMeanPrice')),
            safe_float(info.get('targetHighPrice')),
            safe_float(info.get('trailingEps')),
            safe_float(info.get('forwardEps')),
            safe_str(info.get('sector')),
            safe_str(info.get('industry')),
            safe_str(info.get('country')),
            safe_str(info.get('exchange')),
            safe_str(info.get('currency')),
            safe_str(info.get('website')),
            safe_str(info.get('longBusinessSummary')),
            __import__('datetime').datetime.now()
        )
    except Exception as e:
        return None

def fetch_and_store():
    conn = setup_database()
    cursor = conn.cursor()

    categories = {
        "SP500": SP500_TICKERS,
        "ETF": ETF_TICKERS,
        "REIT": REIT_EXPANDED_TICKERS,
        "REIT_Global": REIT_GLOBAL_TICKERS,
        "Commodity": COMMODITY_TICKERS,
        "Bond": BOND_EXPANDED_TICKERS,
        "Indian Stock": INDIAN_TICKERS,
        "International": INTERNATIONAL_TICKERS,
        "Growth": GROWTH_TICKERS,
        "MidCap": MIDCAP_TICKERS,
        "Indian Extended": INDIAN_EXTENDED_TICKERS,
        "Russell": RUSSELL_TICKERS,
        "International ADR": ADR_TICKERS,
        "Indian Stock Large": INDIAN_LARGE_TICKERS,
        "Thematic ETF": THEMATIC_ETF_TICKERS,
        "SmallCap Growth": SMALLCAP_TICKERS,
        "LSE": LSE_EXPANDED_TICKERS,
        "TSX": TSX_EXPANDED_TICKERS,
        "ASX": ASX_TICKERS,
        "FSE": FSE_TICKERS,
        "HKEX": HKEX_TICKERS,
        "TSE": TSE_TICKERS,
        "SGX": SGX_TICKERS,
        "Euronext": EURONEXT_FULL_TICKERS,
        "Xetra": XETRA_FULL_TICKERS,
        "Forex": FOREX_TICKERS,
        "Index": INDICES_TICKERS,
        "Downloaded": load_downloaded_tickers(),
    }

    # Deduplicate tickers across categories and assign classes
    ticker_to_class = {}
    for category, tickers in categories.items():
        base_asset_class = ASSET_CLASS_MAP[category]
        for t in tickers:
            if t:
                t_clean = t.strip()
                asset_class = base_asset_class
                
                if t_clean.endswith('.T'):
                    asset_class = "International"
                elif t_clean.endswith('.KS'):
                    asset_class = "International"
                elif t_clean.endswith('.TW'):
                    asset_class = "International"
                elif t_clean.endswith('.SS') or t_clean.endswith('.SZ'):
                    asset_class = "International"
                elif t_clean.endswith('.BO'):
                    asset_class = "Indian Stock"

                # Prioritize specific asset classes over general 'Stock' / 'Downloaded'
                if t_clean not in ticker_to_class or ticker_to_class[t_clean] in ['Stock']:
                    ticker_to_class[t_clean] = asset_class

    # Get already fetched tickers from database
    cursor.execute("SELECT DISTINCT ticker FROM traditional_assets WHERE price IS NOT NULL AND price > 0")
    existing_tickers = set(row[0] for row in cursor.fetchall())

    # Filter tickers to fetch
    tickers_to_fetch = [(t, asset_class) for t, asset_class in ticker_to_class.items() if t not in existing_tickers]
    total_to_fetch = len(tickers_to_fetch)

    print(f"Deduplicated total tickers: {len(ticker_to_class)}")
    print(f"Skipping {len(existing_tickers)} already successfully fetched tickers.")
    print(f"Need to fetch {total_to_fetch} remaining tickers.")

    if total_to_fetch == 0:
        print("No new tickers to fetch.")
        conn.close()
        return

    # Fast fetching using yahooquery to pre-filter garbage tickers
    print(f"Pre-filtering {total_to_fetch} tickers in batches of 500...")
    
    # Split into chunks of 500
    chunk_size = 500
    valid_tickers_to_fetch = []
    
    for i in range(0, total_to_fetch, chunk_size):
        chunk = tickers_to_fetch[i:i + chunk_size]
        symbols = [t[0] for t in chunk]
        print(f"Filtering batch {i//chunk_size + 1}/{(total_to_fetch // chunk_size) + 1} ({len(symbols)} tickers)...", end=" ")
        
        try:
            yq_t = YQTicker(symbols, asynchronous=True)
            data = yq_t.summary_detail
            
            if isinstance(data, dict):
                valid_symbols = {k for k, v in data.items() if isinstance(v, dict)}
            else:
                valid_symbols = set()
                
            valid_chunk = [t for t in chunk if t[0] in valid_symbols]
            valid_tickers_to_fetch.extend(valid_chunk)
            print(f"Found {len(valid_chunk)} valid.")
        except Exception as e:
            print(f"Batch failed: {e}")
        
        time.sleep(1) # Small delay between batch queries

    print(f"\nFinished filtering. Found {len(valid_tickers_to_fetch)} potentially valid tickers out of {total_to_fetch}.")
    
    if len(valid_tickers_to_fetch) == 0:
        print("No valid tickers to fetch.")
        conn.close()
        return

    # Fetch and store only the valid ones
    done = 0
    total_valid = len(valid_tickers_to_fetch)
    for ticker, asset_class in valid_tickers_to_fetch:
        done += 1
        print(f"[{done}/{total_valid}] {ticker}...", end=" ")
        try:
            data = fetch_ticker_data(ticker, asset_class)
            if data:
                placeholders = ','.join(['?'] * len(data))
                cursor.execute(f'''
                    INSERT INTO traditional_assets (
                        ticker, short_name, long_name, asset_class,
                        price, previous_close, open, day_high, day_low,
                        volume, avg_volume, market_cap, enterprise_value,
                        pe_ratio, forward_pe, peg_ratio, price_to_book, price_to_sales, ev_to_ebitda,
                        dividend_rate, dividend_yield, payout_ratio, five_year_avg_dividend_yield,
                        earnings_growth, revenue_growth, profit_margins, gross_margins,
                        operating_margins, return_on_equity, return_on_assets,
                        total_revenue, ebitda, total_debt, free_cashflow,
                        high_52_week, low_52_week, all_time_high, all_time_low,
                        ma_50_day, ma_200_day, beta,
                        shares_outstanding, float_shares, shares_short,
                        held_percent_insiders, held_percent_institutions,
                        recommendation_mean, target_mean_price, target_high_price,
                        trailing_eps, forward_eps,
                        sector, industry, country, exchange, currency,
                        website, long_business_summary, timestamp
                    ) VALUES (
                        {placeholders}
                    )
                ''', data)
                if done % 10 == 0:
                    conn.commit()
                print(f"OK ${data[4]:.2f}")
            else:
                print(f"Failed (no price)")
        except Exception as e:
            print(f"Failed ({e})")

        # Smaller delay since these are known good tickers
        time.sleep(0.5)

    conn.commit()
    conn.close()
    print("\nDone. Data saved to finance_hub.db")

if __name__ == "__main__":
    fetch_and_store()
