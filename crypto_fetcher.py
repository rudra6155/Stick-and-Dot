import sqlite3
import requests
import datetime

def fetch_crypto_data():
    url = "https://api.coingecko.com/api/v3/simple/price"
    params = {
        "ids": "bitcoin,ethereum",
        "vs_currencies": "usd",
        "include_market_cap": "true",
        "include_24hr_vol": "true"
    }

    print("Fetching data from CoinGecko API...")
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None

def setup_database():
    conn = sqlite3.connect('finance_hub.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS crypto_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            asset_name TEXT,
            price REAL,
            volume REAL,
            market_cap REAL,
            timestamp DATETIME
        )
    ''')
    conn.commit()
    return conn

def main():
    data = fetch_crypto_data()
    if not data:
        print("Failed to fetch data. Exiting.")
        return

    conn = setup_database()
    cursor = conn.cursor()
    
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    print("\n" + "="*80)
    print(f"{'Asset Name':<15} | {'Price (USD)':<15} | {'24h Volume (USD)':<20} | {'Market Cap (USD)'}")
    print("-" * 80)

    for asset, metrics in data.items():
        price = metrics.get('usd', 0)
        vol = metrics.get('usd_24h_vol', 0)
        cap = metrics.get('usd_market_cap', 0)
        asset_name = asset.capitalize()

        cursor.execute('''
            INSERT INTO crypto_assets (asset_name, price, volume, market_cap, timestamp)
            VALUES (?, ?, ?, ?, ?)
        ''', (asset_name, price, vol, cap, timestamp))

        print(f"{asset_name:<15} | ${price:<14,.2f} | ${vol:<19,.2f} | ${cap:,.2f}")

    conn.commit()
    conn.close()
    
    print("=" * 80)
    print(f"Data successfully recorded in 'finance_hub.db' at {timestamp}\n")

if __name__ == "__main__":
    main()
