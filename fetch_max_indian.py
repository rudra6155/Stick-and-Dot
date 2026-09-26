import pandas as pd
import json
import requests
import io

# Optional: try to import financedatabase, if not installed, print a warning
indian_symbols = set()

try:
    import financedatabase as fd
    print("Fetching from financedatabase...")
    equities = fd.Equities()
    indian_equities = equities.select(country="India")
    for symbol in indian_equities.index:
        indian_symbols.add(symbol)
except ImportError:
    print("financedatabase not installed. Run 'pip install financedatabase'")

# Fetch from NSE
print("Fetching from NSE...")
url = "https://archives.nseindia.com/content/equities/EQUITY_L.csv"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

try:
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    df = pd.read_csv(io.StringIO(response.text))
    if 'SYMBOL' in df.columns:
        for symbol in df['SYMBOL']:
            indian_symbols.add(f"{symbol}.NS")
except Exception as e:
    print(f"Error fetching from NSE: {e}")

try:
    with open("downloaded_bse_only.txt", "r") as f:
        bse_lines = f.read().splitlines()
        for bse in bse_lines:
            indian_symbols.add(bse)
except Exception as e:
    print(f"No BSE file found: {e}")

# Save to JSON
with open('indian_stocks.json', 'w') as f:
    json.dump(list(indian_symbols), f)

print(f"Saved {len(indian_symbols)} symbols to indian_stocks.json")
