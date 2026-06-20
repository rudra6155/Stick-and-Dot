import requests
import sqlite3
import time
import datetime

BASE_URL = "https://api.coingecko.com/api/v3"

def setup_database():
    conn = sqlite3.connect('finance_hub.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS coingecko_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker TEXT,
            coin_id TEXT,
            short_name TEXT,
            asset_class TEXT DEFAULT 'Crypto',
            price REAL,
            market_cap REAL,
            market_cap_rank INTEGER,
            volume_24h REAL,
            price_change_24h REAL,
            price_change_pct_24h REAL,
            price_change_7d REAL,
            price_change_30d REAL,
            price_change_1y REAL,
            high_24h REAL,
            low_24h REAL,
            ath REAL,
            atl REAL,
            circulating_supply REAL,
            total_supply REAL,
            max_supply REAL,
            fully_diluted_valuation REAL,
            developer_forks INTEGER,
            developer_stars INTEGER,
            developer_subscribers INTEGER,
            developer_commits_4w INTEGER,
            community_twitter_followers INTEGER,
            community_reddit_subscribers INTEGER,
            community_score REAL,
            developer_score REAL,
            liquidity_score REAL,
            public_interest_score REAL,
            sentiment_votes_up_pct REAL,
            sentiment_votes_down_pct REAL,
            description TEXT,
            website TEXT,
            timestamp DATETIME,
            UNIQUE(coin_id)
        )
    ''')
    conn.commit()
    return conn

def safe_float(val):
    try:
        return float(val) if val is not None else None
    except:
        return None

def safe_int(val):
    try:
        return int(val) if val is not None else None
    except:
        return None

def fetch_and_store():
    conn = setup_database()
    cursor = conn.cursor()

    all_coins = []
    for page in range(1, 101):  # 100 pages x 100 = 10000 coins
        print(f"Fetching page {page}/100...", end=" ")
        try:
            r = requests.get(
                f"{BASE_URL}/coins/markets",
                params={
                    'vs_currency': 'usd',
                    'order': 'market_cap_desc',
                    'per_page': 100,
                    'page': page,
                    'sparkline': False,
                    'price_change_percentage': '24h,7d,30d'
                },
                timeout=30
            )
            data = r.json()
            if not isinstance(data, list):
                print(f"Bad response: {data}")
                time.sleep(60)
                continue
            all_coins.extend(data)
            print(f"got {len(data)} coins (total: {len(all_coins)})")
            time.sleep(4)
        except Exception as e:
            print(f"Failed: {e}")
            time.sleep(10)

    print(f"\nTotal coins: {len(all_coins)}")

    for i, coin in enumerate(all_coins):
        if not isinstance(coin, dict):
            continue
        try:
            ticker = (coin.get('symbol') or '').upper() + '-USD'
            cursor.execute('''
                INSERT OR REPLACE INTO coingecko_assets (
                    ticker, coin_id, short_name, asset_class,
                    price, market_cap, market_cap_rank, volume_24h,
                    price_change_24h, price_change_pct_24h,
                    price_change_7d, price_change_30d, price_change_1y,
                    high_24h, low_24h, ath, atl,
                    circulating_supply, total_supply, max_supply,
                    fully_diluted_valuation,
                    developer_forks, developer_stars, developer_subscribers, developer_commits_4w,
                    community_twitter_followers, community_reddit_subscribers,
                    community_score, developer_score, liquidity_score, public_interest_score,
                    sentiment_votes_up_pct, sentiment_votes_down_pct,
                    description, website, timestamp
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ''', (
                ticker,
                coin.get('id'),
                coin.get('name'),
                'Crypto',
                safe_float(coin.get('current_price')),
                safe_float(coin.get('market_cap')),
                safe_int(coin.get('market_cap_rank')),
                safe_float(coin.get('total_volume')),
                safe_float(coin.get('price_change_24h')),
                safe_float(coin.get('price_change_percentage_24h')),
                safe_float(coin.get('price_change_percentage_7d_in_currency')),
                safe_float(coin.get('price_change_percentage_30d_in_currency')),
                None,
                safe_float(coin.get('high_24h')),
                safe_float(coin.get('low_24h')),
                safe_float(coin.get('ath')),
                safe_float(coin.get('atl')),
                safe_float(coin.get('circulating_supply')),
                safe_float(coin.get('total_supply')),
                safe_float(coin.get('max_supply')),
                safe_float(coin.get('fully_diluted_valuation')),
                None, None, None, None, None, None,
                None, None, None, None, None, None,
                None, None,
                datetime.datetime.now()
            ))
            if i % 50 == 0:
                conn.commit()
                print(f"[{i+1}/{len(all_coins)}] saved {ticker}")
        except Exception as e:
            print(f"Row error: {e}")
            continue

    conn.commit()
    count = cursor.execute("SELECT COUNT(*) FROM coingecko_assets").fetchone()[0]
    print(f"\nDone. Total crypto in DB: {count}")
    conn.close()

if __name__ == "__main__":
    fetch_and_store()
