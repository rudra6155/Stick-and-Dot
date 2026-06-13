import sqlite3
import json
import os
import math

def sanitize_floats(obj):
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif isinstance(obj, dict):
        return {k: sanitize_floats(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_floats(v) for v in obj]
    return obj

DB_PATH = 'finance_hub.db'
JSON_PATH = os.path.join('src', 'data', 'marketData.json')

def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def main():
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found.")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = dict_factory
    cursor = conn.cursor()

    # We will process tables in reverse priority order: 
    # CoinGecko (lowest) -> FMP -> Traditional (highest)
    tables = [
        "coingecko_assets",
        "fmp_assets",
        "traditional_assets"
    ]
    
    merged_assets = {}
    source_counts = {
        "coingecko_assets": 0,
        "fmp_assets": 0,
        "traditional_assets": 0
    }

    for table_name in tables:
        try:
            cursor.execute(f"SELECT * FROM {table_name}")
            rows = cursor.fetchall()
            source_counts[table_name] = len(rows)
            
            for row in rows:
                ticker = row.get('ticker')
                if not ticker:
                    continue
                
                if ticker not in merged_assets:
                    merged_assets[ticker] = {}
                
                # Merge fields. Higher priority tables are processed later,
                # so they will overwrite values from lower priority tables (if not None).
                for k, v in row.items():
                    if v is not None:
                        # Convert timestamp to string if necessary
                        if k == 'timestamp' and not isinstance(v, str):
                            v = str(v)
                        merged_assets[ticker][k] = v
        except sqlite3.OperationalError:
            # Table might not exist yet
            pass

    conn.close()

    # Split into crypto_assets and traditional_assets
    crypto_assets = []
    traditional_assets = []

    for ticker, asset in merged_assets.items():
        # Handle field mismatches
        if 'asset_name' not in asset and 'short_name' in asset:
            asset['asset_name'] = asset['short_name']
        if 'symbol' not in asset:
            asset['symbol'] = ticker
            
        asset_class = asset.get('asset_class', '')
        if str(asset_class).lower() in ['crypto', 'cryptocurrency']:
            crypto_assets.append(asset)
        else:
            traditional_assets.append(asset)

    output_data = {
        "crypto_assets": crypto_assets,
        "traditional_assets": traditional_assets
    }

    os.makedirs(os.path.dirname(JSON_PATH), exist_ok=True)
    output_data = sanitize_floats(output_data)
    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2)

    print(f"Data merged and exported to {JSON_PATH}")
    print("--- Source Counts ---")
    print(f"Traditional: {source_counts['traditional_assets']}")
    print(f"FMP: {source_counts['fmp_assets']}")
    print(f"CoinGecko: {source_counts['coingecko_assets']}")
    print("--- Output Counts ---")
    print(f"Traditional Assets (Exported): {len(traditional_assets)}")
    print(f"Crypto Assets (Exported): {len(crypto_assets)}")
    print(f"Total Unique Assets: {len(traditional_assets) + len(crypto_assets)}")

if __name__ == "__main__":
    main()
