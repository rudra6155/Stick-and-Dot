import sqlite3
import time
from supabase import create_client

SUPABASE_URL = "https://riszdsmtfijmwsylbmcf.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpc3pkc210ZmlqbXdzeWxibWNmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTAwNjU1MSwiZXhwIjoyMDk0NTgyNTUxfQ.iOySao0m0yRVQuERASn2BB1uw4obL5GZxR3t6XNdfwk"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
DB_PATH = 'finance_hub.db'

def safe(val):
    if val is None:
        return None
    try:
        f = float(val)
        import math
        if math.isnan(f) or math.isinf(f):
            return None
    except:
        pass
    try:
        return float(val) if isinstance(val, (int, float)) else val
    except:
        return val

def push_data():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    print("Fetching traditional assets...")
    cursor.execute('''
        SELECT * FROM traditional_assets
        WHERE price IS NOT NULL AND price > 0
    ''')
    trad_rows = cursor.fetchall()

    print("Fetching crypto assets...")
    cursor.execute('''
        SELECT * FROM coingecko_assets
        WHERE price IS NOT NULL AND price > 0
    ''')
    crypto_rows = cursor.fetchall()
    
    conn.close()

    # Deduplicate trad by ticker keeping latest
    trad_map = {}
    for row in trad_rows:
        t = row['ticker']
        if t not in trad_map or row['id'] > trad_map[t]['id']:
            trad_map[t] = dict(row)

    # Deduplicate crypto by coin_id
    crypto_map = {}
    for row in crypto_rows:
        cid = row['coin_id']
        if cid not in crypto_map:
            crypto_map[cid] = dict(row)

    print(f"To push: {len(trad_map)} Traditional, {len(crypto_map)} Crypto")

    all_records = []
    
    # Process Traditional
    for t, r in trad_map.items():
        all_records.append({
            'ticker': r.get('ticker'),
            'coin_id': '',  # Default to empty string for traditional assets to prevent duplicate NULL entries
            'asset_class': r.get('asset_class'),
            'short_name': r.get('short_name') or r.get('ticker'),
            'price': safe(r.get('price')),
            'market_cap': safe(r.get('market_cap')),
            'pe_ratio': safe(r.get('pe_ratio')),
            'forward_pe': safe(r.get('forward_pe')),
            'peg_ratio': safe(r.get('peg_ratio')),
            'price_to_book': safe(r.get('price_to_book')),
            'price_to_sales': safe(r.get('price_to_sales')),
            'ev_to_ebitda': safe(r.get('ev_to_ebitda')),
            'dividend_yield': safe(r.get('dividend_yield')),
            'dividend_rate': safe(r.get('dividend_rate')),
            'payout_ratio': safe(r.get('payout_ratio')),
            'earnings_growth': safe(r.get('earnings_growth')),
            'revenue_growth': safe(r.get('revenue_growth')),
            'profit_margins': safe(r.get('profit_margins')),
            'gross_margins': safe(r.get('gross_margins')),
            'operating_margins': safe(r.get('operating_margins')),
            'return_on_equity': safe(r.get('return_on_equity')),
            'return_on_assets': safe(r.get('return_on_assets')),
            'total_revenue': safe(r.get('total_revenue')),
            'ebitda': safe(r.get('ebitda')),
            'total_debt': safe(r.get('total_debt')),
            'free_cashflow': safe(r.get('free_cashflow')),
            'high_52_week': safe(r.get('high_52_week')),
            'low_52_week': safe(r.get('low_52_week')),
            'ma_50_day': safe(r.get('ma_50_day')),
            'ma_200_day': safe(r.get('ma_200_day')),
            'beta': safe(r.get('beta')),
            'recommendation_mean': safe(r.get('recommendation_mean')),
            'target_mean_price': safe(r.get('target_mean_price')),
            'trailing_eps': safe(r.get('trailing_eps')),
            'forward_eps': safe(r.get('forward_eps')),
            'held_percent_insiders': safe(r.get('held_percent_insiders')),
            'held_percent_institutions': safe(r.get('held_percent_institutions')),
            'sector': r.get('sector'),
            'industry': r.get('industry'),
            'country': r.get('country'),
        })

    # Process Crypto
    for cid, r in crypto_map.items():
        all_records.append({
            'ticker': r.get('ticker'),
            'asset_class': 'Crypto',
            'coin_id': r.get('coin_id') or cid,  # Pushing the CoinGecko ID to prevent duplicate collisions on same tickers
            'short_name': r.get('short_name') or r.get('ticker'),
            'price': safe(r.get('price')),
            'market_cap': safe(r.get('market_cap')),
            'high_52_week': safe(r.get('ath')),
            'low_52_week': safe(r.get('atl')),
        })

    # Deduplicate all records by (ticker, asset_class, coin_id) before pushing
    unique_records = {}
    for record in all_records:
        ticker = record['ticker']
        asset_class = record.get('asset_class') or 'Stock'
        coin_id = record.get('coin_id') or ''
        key = (ticker, asset_class, coin_id)
        if ticker:
            unique_records[key] = record
            
    final_records = list(unique_records.values())

    # Batch upsert to Supabase
    batch_size = 500
    for i in range(0, len(final_records), batch_size):
        batch = final_records[i:i+batch_size]
        print(f"Pushing batch {i//batch_size + 1}/{(len(final_records)+batch_size-1)//batch_size}...")
        try:
            supabase.table('asset_snapshots').upsert(batch, on_conflict='ticker,asset_class,coin_id').execute()
        except Exception as e:
            print(f"Error pushing batch {i}: {e}")
            time.sleep(2)
            try:
                # Retry once
                supabase.table('asset_snapshots').upsert(batch, on_conflict='ticker,asset_class,coin_id').execute()
            except Exception as e2:
                print(f"Failed again: {e2}")

    print("Push to Supabase complete!")

if __name__ == "__main__":
    push_data()
