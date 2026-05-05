import sqlite3
import datetime
import requests

CG_IDS = "bitcoin,ethereum,tether,binancecoin,solana,ripple,dogecoin,cardano,avalanche-2,shiba-inu,chainlink,polkadot,tron,matic-network,litecoin,bitcoin-cash,uniswap,stellar,ethereum-classic,internet-computer"

def setup_database():
    conn = sqlite3.connect('finance_hub.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS crypto_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            asset_name TEXT,
            symbol TEXT,
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
    try:
        cursor.execute("ALTER TABLE crypto_assets ADD COLUMN symbol TEXT")
    except sqlite3.OperationalError:
        pass
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
    print(f"{'Asset Name':<20} | {'Symbol':<8} | {'Price':<10} | {'24h High':<10} | {'24h Low':<10}")
    print("-" * 120)

    url = f"https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids={CG_IDS}"
    
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        data = response.json()
        
        for coin in data:
            asset_name = coin.get('name', 'Unknown')
            symbol = coin.get('symbol', '').upper()
            price = safe_float(coin.get('current_price', 0))
            volume = safe_float(coin.get('total_volume', 0))
            market_cap = safe_float(coin.get('market_cap', 0))
            
            high_52_week = safe_float(coin.get('high_24h', 0))
            low_52_week = safe_float(coin.get('low_24h', 0))
            
            pe_ratio = None
            dividend_yield = None
            ma_50_day = None
            ma_200_day = None
            beta = None

            cursor.execute('''
                INSERT INTO crypto_assets (
                    asset_name, symbol, price, volume, market_cap, timestamp,
                    high_52_week, low_52_week, pe_ratio, dividend_yield, ma_50_day, ma_200_day, beta
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (asset_name, symbol, price, volume, market_cap, timestamp,
                  high_52_week, low_52_week, pe_ratio, dividend_yield, ma_50_day, ma_200_day, beta))

            print(f"{asset_name:<20} | {symbol:<8} | ${price:<9,.2f} | ${high_52_week:<9,.2f} | ${low_52_week:<9,.2f}")

    except Exception as e:
        print(f"Error fetching from CoinGecko: {e}")

    conn.commit()
    conn.close()
    
    print("=" * 120)
    print(f"Data successfully recorded in 'finance_hub.db' at {timestamp}\n")

if __name__ == "__main__":
    fetch_and_store()
