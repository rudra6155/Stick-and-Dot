import requests

def get_otc_stocks():
    try:
        url = "https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=10000&exchange=nasdaq&marketcap=NANO|MICRO"
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(url, headers=headers, timeout=30)
        print(f"Status code: {r.status_code}")
        data = r.json()
        print(f"Top level keys: {list(data.keys()) if isinstance(data, dict) else 'not a dict'}")
        rows = data.get('data', {}).get('table', {}).get('rows', [])
        print(f"Rows found: {len(rows)}")
        tickers = [row['symbol'] for row in rows if row.get('symbol')]
        print(f"Tickers extracted: {len(tickers)}")
        return tickers
    except Exception as e:
        print(f"Failed: {e}")
        return []

if __name__ == "__main__":
    tickers = get_otc_stocks()
    with open('downloaded_otc.txt', 'w') as f:
        for t in tickers:
            f.write(t + '\n')
    print(f"Saved {len(tickers)} tickers")
    if tickers:
        print("Sample:", tickers[:5])
