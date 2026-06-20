import sqlite3
import json
import os

DB_PATH = 'finance_hub.db'
OUTPUT_PATH = 'src/data/marketData.json'

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

def export():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # --- TRADITIONAL ASSETS from traditional_assets table ---
    cursor.execute('''
        SELECT * FROM traditional_assets
        WHERE price IS NOT NULL AND price > 0
    ''')
    trad_rows = cursor.fetchall()

    # Deduplicate by ticker keeping latest
    trad_map = {}
    for row in trad_rows:
        t = row['ticker']
        if t not in trad_map or row['id'] > trad_map[t]['id']:
            trad_map[t] = dict(row)

    # --- CRYPTO ASSETS from coingecko_assets table ---
    cursor.execute('''
        SELECT * FROM coingecko_assets
        WHERE price IS NOT NULL AND price > 0
    ''')
    crypto_rows = cursor.fetchall()

    # Deduplicate crypto by coin_id
    crypto_map = {}
    for row in crypto_rows:
        cid = row['coin_id']
        if cid not in crypto_map:
            crypto_map[cid] = dict(row)

    conn.close()

    # Build traditional JSON array
    traditional_out = []
    for t, r in trad_map.items():
        traditional_out.append({
            'id': r.get('id'),
            'ticker': r.get('ticker'),
            'symbol': r.get('ticker'),
            'asset_name': r.get('short_name') or r.get('ticker'),
            'short_name': r.get('short_name'),
            'long_name': r.get('long_name'),
            'asset_class': r.get('asset_class'),
            'price': safe(r.get('price')),
            'previous_close': safe(r.get('previous_close')),
            'open': safe(r.get('open')),
            'day_high': safe(r.get('day_high')),
            'day_low': safe(r.get('day_low')),
            'volume': safe(r.get('volume')),
            'avg_volume': safe(r.get('avg_volume')),
            'market_cap': safe(r.get('market_cap')),
            'enterprise_value': safe(r.get('enterprise_value')),
            'pe_ratio': safe(r.get('pe_ratio')),
            'forward_pe': safe(r.get('forward_pe')),
            'peg_ratio': safe(r.get('peg_ratio')),
            'price_to_book': safe(r.get('price_to_book')),
            'price_to_sales': safe(r.get('price_to_sales')),
            'ev_to_ebitda': safe(r.get('ev_to_ebitda')),
            'dividend_rate': safe(r.get('dividend_rate')),
            'dividend_yield': safe(r.get('dividend_yield')),
            'payout_ratio': safe(r.get('payout_ratio')),
            'five_year_avg_dividend_yield': safe(r.get('five_year_avg_dividend_yield')),
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
            'all_time_high': safe(r.get('all_time_high')),
            'all_time_low': safe(r.get('all_time_low')),
            'ma_50_day': safe(r.get('ma_50_day')),
            'ma_200_day': safe(r.get('ma_200_day')),
            'beta': safe(r.get('beta')),
            'shares_outstanding': safe(r.get('shares_outstanding')),
            'float_shares': safe(r.get('float_shares')),
            'shares_short': safe(r.get('shares_short')),
            'held_percent_insiders': safe(r.get('held_percent_insiders')),
            'held_percent_institutions': safe(r.get('held_percent_institutions')),
            'recommendation_mean': safe(r.get('recommendation_mean')),
            'target_mean_price': safe(r.get('target_mean_price')),
            'target_high_price': safe(r.get('target_high_price')),
            'trailing_eps': safe(r.get('trailing_eps')),
            'forward_eps': safe(r.get('forward_eps')),
            'sector': r.get('sector'),
            'industry': r.get('industry'),
            'country': r.get('country'),
            'exchange': r.get('exchange'),
            'currency': r.get('currency'),
            'website': r.get('website'),
            'long_business_summary': r.get('long_business_summary'),
            'timestamp': r.get('timestamp'),
        })

    # Build crypto JSON array
    crypto_out = []
    for cid, r in crypto_map.items():
        crypto_out.append({
            'id': r.get('id'),
            'ticker': r.get('ticker'),
            'symbol': r.get('ticker'),
            'coin_id': r.get('coin_id'),
            'asset_name': r.get('short_name'),
            'short_name': r.get('short_name'),
            'asset_class': 'Crypto',
            'price': safe(r.get('price')),
            'market_cap': safe(r.get('market_cap')),
            'market_cap_rank': safe(r.get('market_cap_rank')),
            'volume': safe(r.get('volume_24h')),
            'price_change_24h': safe(r.get('price_change_24h')),
            'price_change_pct_24h': safe(r.get('price_change_pct_24h')),
            'price_change_7d': safe(r.get('price_change_7d')),
            'price_change_30d': safe(r.get('price_change_30d')),
            'price_change_1y': safe(r.get('price_change_1y')),
            'high_24h': safe(r.get('high_24h')),
            'low_24h': safe(r.get('low_24h')),
            'ath': safe(r.get('ath')),
            'atl': safe(r.get('atl')),
            'high_52_week': safe(r.get('ath')),
            'low_52_week': safe(r.get('atl')),
            'circulating_supply': safe(r.get('circulating_supply')),
            'total_supply': safe(r.get('total_supply')),
            'max_supply': safe(r.get('max_supply')),
            'fully_diluted_valuation': safe(r.get('fully_diluted_valuation')),
            'developer_forks': safe(r.get('developer_forks')),
            'developer_stars': safe(r.get('developer_stars')),
            'developer_commits_4w': safe(r.get('developer_commits_4w')),
            'community_twitter_followers': safe(r.get('community_twitter_followers')),
            'community_reddit_subscribers': safe(r.get('community_reddit_subscribers')),
            'community_score': safe(r.get('community_score')),
            'developer_score': safe(r.get('developer_score')),
            'liquidity_score': safe(r.get('liquidity_score')),
            'sentiment_votes_up_pct': safe(r.get('sentiment_votes_up_pct')),
            'sentiment_votes_down_pct': safe(r.get('sentiment_votes_down_pct')),
            'description': r.get('description'),
            'website': r.get('website'),
            'timestamp': r.get('timestamp'),
        })

    # Write JSON
    output = {
        'crypto_assets': crypto_out,
        'traditional_assets': traditional_out
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(output, f)

    print(f"Data merged and exported to {OUTPUT_PATH}")
    print(f"--- Source Counts ---")
    print(f"Traditional (unique): {len(traditional_out)}")
    print(f"Crypto (unique): {len(crypto_out)}")
    print(f"--- Output Counts ---")
    print(f"Total Unique Assets: {len(traditional_out) + len(crypto_out)}")

    # Verify field counts
    if crypto_out:
        filled = {k:v for k,v in crypto_out[0].items() if v is not None and v != 0}
        print(f"Crypto fields with data: {len(filled)}")
    if traditional_out:
        filled2 = {k:v for k,v in traditional_out[0].items() if v is not None and v != 0}
        print(f"Traditional fields with data: {len(filled2)}")

if __name__ == "__main__":
    export()
