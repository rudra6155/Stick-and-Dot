import yfinance as yf
import sqlite3
import datetime
import time
import pandas as pd
from ticker_lists import CRYPTO_TICKERS

BATCH_SIZE = 25
SLEEP_BETWEEN_BATCHES = 1.5  # seconds

def setup_database():
    conn = sqlite3.connect('finance_hub.db')
    cursor = conn.cursor()
    cursor.execute('DROP TABLE IF EXISTS crypto_assets')
    cursor.execute('''
        CREATE TABLE crypto_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            asset_name TEXT,
            symbol TEXT,
            asset_class TEXT,
            price REAL,
            open REAL,
            day_high REAL,
            day_low REAL,
            volume REAL,
            avg_volume REAL,
            market_cap REAL,
            pe_ratio REAL,
            forward_pe REAL,
            price_to_book REAL,
            price_to_sales REAL,
            ev_to_ebitda REAL,
            dividend_yield REAL,
            earnings_growth REAL,
            revenue_growth REAL,
            profit_margins REAL,
            high_52_week REAL,
            low_52_week REAL,
            ma_50_day REAL,
            ma_200_day REAL,
            beta REAL,
            sector TEXT,
            industry TEXT,
            country TEXT,
            exchange TEXT,
            timestamp DATETIME
        )
    ''')
    conn.commit()
    return conn

def safe_float(val):
    try:
        if pd.isna(val):
            return 0.0
        return float(val) if val is not None else 0.0
    except Exception:
        return 0.0

def safe_str(val):
    return str(val) if val is not None else ""

def fetch_and_store():
    conn = setup_database()
    cursor = conn.cursor()
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    failed_tickers = []
    
    for i in range(0, len(CRYPTO_TICKERS), BATCH_SIZE):
        batch = CRYPTO_TICKERS[i:i + BATCH_SIZE]
        batch_tickers_str = " ".join(batch)
        
        hist_data = yf.download(batch_tickers_str, period="1d", group_by="ticker", threads=True, progress=False)
        
        for j, ticker in enumerate(batch):
            asset_class = "Crypto"
            idx = i + j + 1
            try:
                if len(batch) == 1:
                    hist = hist_data
                else:
                    if ticker in hist_data.columns.get_level_values(0):
                        hist = hist_data[ticker]
                    else:
                        hist = None
                
                if hist is None or hist.empty:
                    failed_tickers.append(ticker)
                    print(f"[{idx}/{len(CRYPTO_TICKERS)}] Fetching {ticker}... Failed (No history)")
                    continue
                
                price = safe_float(hist['Close'].iloc[-1])
                open_val = safe_float(hist['Open'].iloc[-1])
                day_high = safe_float(hist['High'].iloc[-1])
                day_low = safe_float(hist['Low'].iloc[-1])
                volume = safe_float(hist['Volume'].iloc[-1])
                
                ticker_obj = yf.Ticker(ticker)
                info = ticker_obj.info or {}
                
                asset_name = safe_str(info.get('shortName', ticker))
                symbol = ticker.split('-')[0]
                
                market_cap = safe_float(info.get('marketCap', 0))
                pe_ratio = safe_float(info.get('trailingPE', 0))
                forward_pe = safe_float(info.get('forwardPE', 0))
                price_to_book = safe_float(info.get('priceToBook', 0))
                price_to_sales = safe_float(info.get('priceToSalesTrailing12Months', 0))
                ev_to_ebitda = safe_float(info.get('enterpriseToEbitda', 0))
                dividend_yield = safe_float(info.get('dividendYield', 0))
                earnings_growth = safe_float(info.get('earningsGrowth', 0))
                revenue_growth = safe_float(info.get('revenueGrowth', 0))
                profit_margins = safe_float(info.get('profitMargins', 0))
                high_52_week = safe_float(info.get('fiftyTwoWeekHigh', 0))
                low_52_week = safe_float(info.get('fiftyTwoWeekLow', 0))
                ma_50_day = safe_float(info.get('fiftyDayAverage', 0))
                ma_200_day = safe_float(info.get('twoHundredDayAverage', 0))
                beta = safe_float(info.get('beta', 0))
                avg_volume = safe_float(info.get('averageVolume', 0))
                
                sector = safe_str(info.get('sector', ''))
                industry = safe_str(info.get('industry', ''))
                country = safe_str(info.get('country', ''))
                exchange = safe_str(info.get('exchange', ''))

                cursor.execute('''
                    INSERT INTO crypto_assets (
                        asset_name, symbol, asset_class, price, open, day_high, day_low, volume, avg_volume,
                        market_cap, pe_ratio, forward_pe, price_to_book, price_to_sales, ev_to_ebitda,
                        dividend_yield, earnings_growth, revenue_growth, profit_margins,
                        high_52_week, low_52_week, ma_50_day, ma_200_day, beta,
                        sector, industry, country, exchange, timestamp
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (asset_name, symbol, asset_class, price, open_val, day_high, day_low, volume, avg_volume,
                      market_cap, pe_ratio, forward_pe, price_to_book, price_to_sales, ev_to_ebitda,
                      dividend_yield, earnings_growth, revenue_growth, profit_margins,
                      high_52_week, low_52_week, ma_50_day, ma_200_day, beta,
                      sector, industry, country, exchange, timestamp))

                print(f"[{idx}/{len(CRYPTO_TICKERS)}] Fetching {ticker}... OK ${price:.2f}")
            except Exception as e:
                failed_tickers.append(ticker)
                print(f"[{idx}/{len(CRYPTO_TICKERS)}] Error processing {ticker}: {e}")
        
        conn.commit()
        time.sleep(SLEEP_BETWEEN_BATCHES)

    conn.close()
    
    if failed_tickers:
        print("\nFailed Tickers:")
        print(", ".join(failed_tickers))
    
    print("\nData successfully recorded in 'finance_hub.db'")

if __name__ == "__main__":
    fetch_and_store()
