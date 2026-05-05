import yfinance as yf
import sqlite3
import datetime

# Assets: Stocks, ETFs, REITs, Commodities, Bonds, Indian Stocks
ASSETS = {
    "Stock": {
        "tickers": ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "BRK-B", "JPM", "V", "UNH", "XOM", "JNJ", "WMT", "MA", "PG", "HD", "ORCL", "COST", "BAC"],
        "class": "Stock"
    },
    "ETF": {
        "tickers": ["SPY", "QQQ", "VTI", "VOO", "IWM", "DIA", "GLD", "SLV", "XLK", "XLF", "XLE", "XLV", "ARKK", "XLI"],
        "class": "ETF"
    },
    "REIT": {
        "tickers": ["VNQ", "SCHH", "O", "AMT", "PLD", "EQIX", "SPG", "PSA", "DLR", "CCI"],
        "class": "REIT"
    },
    "Commodity": {
        "tickers": ["GC=F", "SI=F", "CL=F", "BZ=F", "NG=F", "HG=F", "ZW=F", "ZC=F", "PL=F", "PA=F"],
        "class": "Commodity"
    },
    "Bond": {
        "tickers": ["TLT", "IEF", "HYG", "LQD", "BND"],
        "class": "Bond"
    },
    "Indian Stock": {
        "tickers": ["RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS", "HINDUNILVR.NS", "SBIN.NS", "BAJFINANCE.NS", "ADANIENT.NS", "WIPRO.NS"],
        "class": "Indian Stock"
    }
}

def setup_database():
    conn = sqlite3.connect('finance_hub.db')
    cursor = conn.cursor()
    # Create generic assets table with all columns
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS traditional_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker TEXT,
            asset_class TEXT,
            price REAL,
            volume REAL,
            market_cap REAL,
            timestamp DATETIME,
            high_52_week REAL,
            low_52_week REAL,
            pe_ratio REAL,
            dividend_yield REAL,
            ma_50_day REAL,
            ma_200_day REAL,
            beta REAL
        )
    ''')
    conn.commit()
    return conn

def safe_float(val):
    try:
        return float(val) if val is not None else 0.0
    except Exception:
        return 0.0

def fetch_and_store():
    conn = setup_database()
    cursor = conn.cursor()
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    print("\n" + "="*120)
    print(f"{'Ticker':<8} | {'Class':<10} | {'Price':<10} | {'PE Ratio':<10} | {'Div Yield':<10} | {'50d MA':<10} | {'200d MA':<10} | {'Beta'}")
    print("-" * 120)

    for category, info in ASSETS.items():
        asset_class = info["class"]
        for ticker in info["tickers"]:
            try:
                ticker_obj = yf.Ticker(ticker)
                
                # Fetch history for price/volume
                hist = ticker_obj.history(period="1d")
                
                if hist.empty:
                    print(f"Failed to fetch historical data for {ticker}")
                    continue
                
                price = float(hist['Close'].iloc[-1])
                volume = float(hist['Volume'].iloc[-1])
                
                # Fetch detailed info
                t_info = ticker_obj.info or {}
                
                # Get market cap
                market_cap = 0
                if hasattr(ticker_obj, 'fast_info'):
                    market_cap = safe_float(ticker_obj.fast_info.get('marketCap', 0))
                if not market_cap:
                    market_cap = safe_float(t_info.get('marketCap', 0))
                
                # Deep dive metrics
                high_52_week = safe_float(t_info.get('fiftyTwoWeekHigh', 0.0))
                low_52_week = safe_float(t_info.get('fiftyTwoWeekLow', 0.0))
                pe_ratio = safe_float(t_info.get('trailingPE', t_info.get('forwardPE', 0.0)))
                dividend_yield = safe_float(t_info.get('dividendYield', 0.0))
                ma_50_day = safe_float(t_info.get('fiftyDayAverage', 0.0))
                ma_200_day = safe_float(t_info.get('twoHundredDayAverage', 0.0))
                beta = safe_float(t_info.get('beta', 0.0))

                cursor.execute('''
                    INSERT INTO traditional_assets (
                        ticker, asset_class, price, volume, market_cap, timestamp,
                        high_52_week, low_52_week, pe_ratio, dividend_yield, ma_50_day, ma_200_day, beta
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (ticker, asset_class, price, volume, market_cap, timestamp,
                      high_52_week, low_52_week, pe_ratio, dividend_yield, ma_50_day, ma_200_day, beta))

                print(f"{ticker:<8} | {asset_class:<10} | ${price:<9,.2f} | {pe_ratio:<10.2f} | {dividend_yield:<10.4f} | ${ma_50_day:<9,.2f} | ${ma_200_day:<9,.2f} | {beta:.2f}")
            except Exception as e:
                print(f"Error processing {ticker}: {e}")

    conn.commit()
    conn.close()
    print("=" * 120)
    print(f"Data successfully recorded in 'finance_hub.db' at {timestamp}\n")

if __name__ == "__main__":
    fetch_and_store()
