import requests
import csv
import io

def get_nasdaq_tickers():
    url = "https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=10000&exchange=nasdaq"
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        r = requests.get(url, headers=headers, timeout=30)
        data = r.json()
        rows = data['data']['table']['rows']
        tickers = [row['symbol'] for row in rows if row.get('symbol')]
        print(f"NASDAQ: {len(tickers)} tickers")
        return tickers
    except Exception as e:
        print(f"NASDAQ failed: {e}")
        return []

def get_nyse_tickers():
    url = "https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=10000&exchange=nyse"
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        r = requests.get(url, headers=headers, timeout=30)
        data = r.json()
        rows = data['data']['table']['rows']
        tickers = [row['symbol'] for row in rows if row.get('symbol')]
        print(f"NYSE: {len(tickers)} tickers")
        return tickers
    except Exception as e:
        print(f"NYSE failed: {e}")
        return []

def get_nse_tickers():
    url = "https://archives.nseindia.com/content/equities/EQUITY_L.csv"
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        r = requests.get(url, headers=headers, timeout=30)
        reader = csv.reader(io.StringIO(r.text))
        next(reader)  # skip header
        tickers = [row[0].strip() + '.NS' for row in reader if row]
        print(f"NSE: {len(tickers)} tickers")
        return tickers
    except Exception as e:
        print(f"NSE failed: {e}")
        return []

if __name__ == "__main__":
    nasdaq = get_nasdaq_tickers()
    nyse = get_nyse_tickers()
    nse = get_nse_tickers()

    all_tickers = list(set(nasdaq + nyse + nse))
    print(f"\nTotal unique tickers: {len(all_tickers)}")

    # Save to file
    with open('downloaded_tickers.txt', 'w') as f:
        for t in all_tickers:
            f.write(t + '\n')
    print("Saved to downloaded_tickers.txt")
