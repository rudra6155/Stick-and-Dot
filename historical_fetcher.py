import yfinance as yf
import time
from supabase import create_client
from ticker_lists import (
    SP500_TICKERS, ETF_TICKERS, REIT_TICKERS,
    COMMODITY_TICKERS, BOND_TICKERS, INDIAN_TICKERS,
    INTERNATIONAL_TICKERS, GROWTH_TICKERS,
    MIDCAP_TICKERS, INDIAN_EXTENDED_TICKERS
)

SUPABASE_URL = "https://riszdsmtfijmwsylbmcf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpc3pkc210ZmlqbXdzeWxibWNmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTAwNjU1MSwiZXhwIjoyMDk0NTgyNTUxfQ.iOySao0m0yRVQuERASn2BB1uw4obL5GZxR3t6XNdfwk"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

ASSET_CLASS_MAP = {
    "SP500": "Stock", "ETF": "ETF", "REIT": "REIT",
    "Commodity": "Commodity", "Bond": "Bond",
    "Indian Stock": "Indian Stock", "International": "International",
    "Growth": "Stock", "MidCap": "Stock",
}

ALL_CATEGORIES = {
    "SP500": SP500_TICKERS,
    "ETF": ETF_TICKERS,
    "REIT": REIT_TICKERS,
    "Commodity": COMMODITY_TICKERS,
    "Bond": BOND_TICKERS,
    "Indian Stock": INDIAN_TICKERS + INDIAN_EXTENDED_TICKERS,
    "International": INTERNATIONAL_TICKERS,
    "Growth": GROWTH_TICKERS,
    "MidCap": MIDCAP_TICKERS,
}

def setup_supabase_tables():
    # Create tables via Supabase SQL - run this SQL in Supabase dashboard SQL editor:
    print("""
    Run this SQL in your Supabase dashboard (SQL Editor tab):

    CREATE TABLE IF NOT EXISTS asset_snapshots (
        id BIGSERIAL PRIMARY KEY,
        ticker TEXT NOT NULL,
        asset_class TEXT,
        short_name TEXT,
        price REAL,
        market_cap REAL,
        pe_ratio REAL,
        forward_pe REAL,
        peg_ratio REAL,
        price_to_book REAL,
        price_to_sales REAL,
        ev_to_ebitda REAL,
        dividend_yield REAL,
        dividend_rate REAL,
        payout_ratio REAL,
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
        ma_50_day REAL,
        ma_200_day REAL,
        beta REAL,
        recommendation_mean REAL,
        target_mean_price REAL,
        trailing_eps REAL,
        forward_eps REAL,
        held_percent_insiders REAL,
        held_percent_institutions REAL,
        sector TEXT,
        industry TEXT,
        country TEXT,
        fetched_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(ticker)
    );

    CREATE TABLE IF NOT EXISTS price_history (
        id BIGSERIAL PRIMARY KEY,
        ticker TEXT NOT NULL,
        asset_class TEXT,
        date DATE NOT NULL,
        open REAL,
        high REAL,
        low REAL,
        close REAL,
        volume REAL,
        UNIQUE(ticker, date)
    );

    CREATE INDEX IF NOT EXISTS idx_price_history_ticker ON price_history(ticker);
    CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(date);
    CREATE INDEX IF NOT EXISTS idx_asset_snapshots_class ON asset_snapshots(asset_class);
    CREATE INDEX IF NOT EXISTS idx_asset_snapshots_sector ON asset_snapshots(sector);
    """)
    input("Press Enter after running the SQL in Supabase dashboard...")

def push_historical_data():
    import sqlite3
    conn = sqlite3.connect('finance_hub.db')
    cursor = conn.cursor()
    cursor.execute("SELECT ticker, asset_class FROM traditional_assets WHERE price IS NOT NULL")
    rows = cursor.fetchall()
    conn.close()

    total = len(rows)
    done = 0

    for ticker, asset_class in rows:
            done += 1
            print(f"[{done}/{total}] {ticker}...", end=" ")
            try:
                t = yf.Ticker(ticker)
                info = t.info
                hist = t.history(period="6mo")

                if hist.empty:
                    print("No history")
                    continue

                price = info.get('currentPrice') or info.get('regularMarketPrice')
                if not price:
                    print("No price")
                    continue

                # Upsert snapshot
                supabase.table('asset_snapshots').upsert({
                    'ticker': ticker,
                    'asset_class': asset_class,
                    'short_name': info.get('shortName'),
                    'price': float(price),
                    'market_cap': float(info.get('marketCap') or 0),
                    'pe_ratio': float(info.get('trailingPE') or 0),
                    'forward_pe': float(info.get('forwardPE') or 0),
                    'peg_ratio': float(info.get('pegRatio') or 0),
                    'price_to_book': float(info.get('priceToBook') or 0),
                    'price_to_sales': float(info.get('priceToSalesTrailing12Months') or 0),
                    'ev_to_ebitda': float(info.get('enterpriseToEbitda') or 0),
                    'dividend_yield': float(info.get('dividendYield') or 0),
                    'dividend_rate': float(info.get('dividendRate') or 0),
                    'payout_ratio': float(info.get('payoutRatio') or 0),
                    'earnings_growth': float(info.get('earningsGrowth') or 0),
                    'revenue_growth': float(info.get('revenueGrowth') or 0),
                    'profit_margins': float(info.get('profitMargins') or 0),
                    'gross_margins': float(info.get('grossMargins') or 0),
                    'operating_margins': float(info.get('operatingMargins') or 0),
                    'return_on_equity': float(info.get('returnOnEquity') or 0),
                    'return_on_assets': float(info.get('returnOnAssets') or 0),
                    'total_revenue': float(info.get('totalRevenue') or 0),
                    'ebitda': float(info.get('ebitda') or 0),
                    'total_debt': float(info.get('totalDebt') or 0),
                    'free_cashflow': float(info.get('freeCashflow') or 0),
                    'high_52_week': float(info.get('fiftyTwoWeekHigh') or 0),
                    'low_52_week': float(info.get('fiftyTwoWeekLow') or 0),
                    'ma_50_day': float(info.get('fiftyDayAverage') or 0),
                    'ma_200_day': float(info.get('twoHundredDayAverage') or 0),
                    'beta': float(info.get('beta') or 0),
                    'recommendation_mean': float(info.get('recommendationMean') or 0),
                    'target_mean_price': float(info.get('targetMeanPrice') or 0),
                    'trailing_eps': float(info.get('trailingEps') or 0),
                    'forward_eps': float(info.get('forwardEps') or 0),
                    'held_percent_insiders': float(info.get('heldPercentInsiders') or 0),
                    'held_percent_institutions': float(info.get('heldPercentInstitutions') or 0),
                    'sector': info.get('sector'),
                    'industry': info.get('industry'),
                    'country': info.get('country'),
                }, on_conflict='ticker').execute()

                # Insert price history rows
                rows = []
                for date, row in hist.iterrows():
                    rows.append({
                        'ticker': ticker,
                        'asset_class': asset_class,
                        'date': str(date.date()),
                        'open': float(row['Open']),
                        'high': float(row['High']),
                        'low': float(row['Low']),
                        'close': float(row['Close']),
                        'volume': float(row['Volume']),
                    })

                # Batch insert in chunks of 100
                for i in range(0, len(rows), 100):
                    supabase.table('price_history').upsert(
                        rows[i:i+100], on_conflict='ticker,date'
                    ).execute()

                print(f"OK {len(rows)} days")

            except Exception as e:
                print(f"Failed ({e})")
                continue

            time.sleep(2)

    print("\nDone.")

if __name__ == "__main__":
    import sys
    if "--skip-setup" in sys.argv:
        print("Skipping Supabase table setup as --skip-setup was specified.")
    else:
        setup_supabase_tables()
    push_historical_data()
