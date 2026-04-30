import yfinance as yf
import sqlite3
import datetime

# Assets: Gold, ETFs, REITs
ASSETS = {
    "Gold": {"tickers": ["GC=F"], "class": "Commodity"},
    "ETFs": {"tickers": ["SPY", "QQQ"], "class": "ETF"},
    "REITs": {"tickers": ["VNQ", "SCHH"], "class": "REIT"}
}

def setup_database():
    conn = sqlite3.connect('finance_hub.db')
    cursor = conn.cursor()
    # Create generic assets table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS traditional_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker TEXT,
            asset_class TEXT,
            price REAL,
            volume REAL,
            market_cap REAL,
            timestamp DATETIME
        )
    ''')
    conn.commit()
    return conn

def fetch_and_store():
    conn = setup_database()
    cursor = conn.cursor()
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    print("\n" + "="*80)
    print(f"{'Ticker':<10} | {'Class':<10} | {'Price':<12} | {'Volume':<15} | {'Market Cap'}")
    print("-" * 80)

    for category, info in ASSETS.items():
        asset_class = info["class"]
        for ticker in info["tickers"]:
            try:
                ticker_obj = yf.Ticker(ticker)
                # Fetch history for 1 day
                hist = ticker_obj.history(period="1d")
                
                if hist.empty:
                    print(f"Failed to fetch historical data for {ticker}")
                    continue
                
                price = float(hist['Close'].iloc[-1])
                volume = float(hist['Volume'].iloc[-1])
                
                # Try to get market cap from fast_info or info
                market_cap = 0
                try:
                    if hasattr(ticker_obj, 'fast_info'):
                        market_cap = ticker_obj.fast_info.get('marketCap', 0)
                    else:
                        market_cap = ticker_obj.info.get('marketCap', 0)
                except Exception:
                    market_cap = 0

                # Ensure market cap is numeric
                if market_cap is None:
                    market_cap = 0

                cursor.execute('''
                    INSERT INTO traditional_assets (ticker, asset_class, price, volume, market_cap, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (ticker, asset_class, price, volume, float(market_cap), timestamp))

                print(f"{ticker:<10} | {asset_class:<10} | ${price:<11,.2f} | {volume:<15,.0f} | ${float(market_cap):,.2f}")
            except Exception as e:
                print(f"Error processing {ticker}: {e}")

    conn.commit()
    conn.close()
    print("=" * 80)
    print(f"Data successfully recorded in 'finance_hub.db' at {timestamp}\n")

if __name__ == "__main__":
    fetch_and_store()
