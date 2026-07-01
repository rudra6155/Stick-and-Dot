import requests

def get_all_etfs():
    try:
        url = "https://api.nasdaq.com/api/screener/etf?tableonly=true&limit=10000&download=true"
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(url, headers=headers, timeout=30)
        data = r.json()
        rows = data.get('data', {}).get('data', {}).get('rows', []) or data.get('data', {}).get('rows', [])
        tickers = [row.get('symbol') for row in rows if row.get('symbol')]
        print(f"NASDAQ ETF list: {len(tickers)} tickers")
        return tickers
    except Exception as e:
        print(f"ETF fetch failed: {e}")
        return []

if __name__ == "__main__":
    etfs = get_all_etfs()
    with open('downloaded_etfs.txt', 'w') as f:
        for t in etfs:
            f.write(t + '\n')
    print(f"Saved {len(etfs)} ETF tickers to downloaded_etfs.txt")
