import requests
import sqlite3
import yfinance as yf
import time
import datetime
from concurrent.futures import ThreadPoolExecutor

DB_PATH = 'finance_hub.db'

def setup_database():
    conn = sqlite3.connect(DB_PATH)
    return conn

def get_nasdaq_etfs():
    tickers = []
    headers = {'User-Agent': 'Mozilla/5.0'}
    offset = 0
    total = 5000
    while offset < total:
        url = f"https://api.nasdaq.com/api/screener/etf?tableonly=true&limit=50&offset={offset}"
        try:
            r = requests.get(url, headers=headers, timeout=15)
            data = r.json()
            records = data.get('data', {}).get('records', {})
            total = records.get('totalrecords', 0)
            rows = records.get('data', {}).get('rows', [])
            if not rows:
                break
            for row in rows:
                symbol = row.get('symbol')
                if symbol:
                    tickers.append(symbol)
            offset += 50
            print(f"Scraped {len(tickers)} / {total} ETFs...")
            time.sleep(1)
        except Exception as e:
            print(f"NASDAQ ETF scrape failed at offset {offset}: {e}")
            break
    
    # Clean up symbols (NASDAQ sometimes adds dots or spaces)
    tickers = [t.strip().replace('^', '-') for t in tickers]
    return list(set(tickers))

def safe_float(val):
    if val is None: return None
    try:
        f = float(val)
        import math
        if math.isnan(f) or math.isinf(f): return None
        return f
    except:
        return None

def fetch_ticker_data(ticker):
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        if not info or 'regularMarketPrice' not in info:
            info = stock.fast_info
        
        price = info.get('currentPrice') or info.get('regularMarketPrice') or info.get('last_price')
        if not price:
            try:
                hist = stock.history(period="1d")
                if not hist.empty:
                    price = hist['Close'].iloc[-1]
            except:
                pass

        if not price:
            return None

        mcap = info.get('marketCap')
        if not mcap and hasattr(info, 'get'):
            try:
                mcap = price * info.get('sharesOutstanding', 0)
            except:
                pass

        data = {
            'ticker': ticker,
            'short_name': info.get('shortName', ticker),
            'long_name': info.get('longName', ''),
            'asset_class': 'ETF',
            'price': safe_float(price),
            'previous_close': safe_float(info.get('previousClose')),
            'open': safe_float(info.get('open')),
            'day_high': safe_float(info.get('dayHigh')),
            'day_low': safe_float(info.get('dayLow')),
            'volume': safe_float(info.get('volume')),
            'avg_volume': safe_float(info.get('averageVolume')),
            'market_cap': safe_float(mcap),
            'pe_ratio': safe_float(info.get('trailingPE')),
            'dividend_yield': safe_float(info.get('dividendYield')),
            'high_52_week': safe_float(info.get('fiftyTwoWeekHigh')),
            'low_52_week': safe_float(info.get('fiftyTwoWeekLow')),
            'ma_50_day': safe_float(info.get('fiftyDayAverage')),
            'ma_200_day': safe_float(info.get('twoHundredDayAverage')),
            'beta': safe_float(info.get('beta')),
            'sector': info.get('sector', ''),
            'industry': info.get('industry', ''),
            'country': info.get('country', ''),
            'exchange': info.get('exchange', ''),
            'currency': info.get('currency', 'USD'),
            'website': info.get('website', ''),
            'long_business_summary': info.get('longBusinessSummary', ''),
            'timestamp': datetime.datetime.now()
        }
        return data
    except Exception as e:
        return None

def process_batch(tickers):
    conn = setup_database()
    cursor = conn.cursor()
    for t in tickers:
        data = fetch_ticker_data(t)
        if data:
            cursor.execute('''
                INSERT OR REPLACE INTO traditional_assets (
                    ticker, short_name, long_name, asset_class, price, previous_close,
                    open, day_high, day_low, volume, avg_volume, market_cap,
                    pe_ratio, dividend_yield, high_52_week, low_52_week,
                    ma_50_day, ma_200_day, beta, sector, industry, country,
                    exchange, currency, website, long_business_summary, timestamp
                ) VALUES (
                    :ticker, :short_name, :long_name, :asset_class, :price, :previous_close,
                    :open, :day_high, :day_low, :volume, :avg_volume, :market_cap,
                    :pe_ratio, :dividend_yield, :high_52_week, :low_52_week,
                    :ma_50_day, :ma_200_day, :beta, :sector, :industry, :country,
                    :exchange, :currency, :website, :long_business_summary, :timestamp
                )
            ''', data)
            conn.commit()
            print(f"Saved {t} - ${data['price']}")
        else:
            print(f"Skipped {t} - No data")
    conn.close()

if __name__ == "__main__":
    print("Fetching ETF list from NASDAQ...")
    etfs = get_nasdaq_etfs()
    print(f"Total ETFs downloaded: {len(etfs)}")
    
    # Read existing DB to skip if already processed in this run or recently
    conn = setup_database()
    c = conn.cursor()
    c.execute("SELECT ticker FROM traditional_assets WHERE asset_class='ETF'")
    existing = set(row[0] for row in c.fetchall())
    conn.close()
    
    missing = [t for t in etfs if t not in existing]
    print(f"Fetching data for {len(missing)} new ETFs...")
    
    # Process in chunks
    chunk_size = 50
    chunks = [missing[i:i + chunk_size] for i in range(0, len(missing), chunk_size)]
    
    with ThreadPoolExecutor(max_workers=5) as executor:
        executor.map(process_batch, chunks)
        
    print("Done fetching ETFs!")
