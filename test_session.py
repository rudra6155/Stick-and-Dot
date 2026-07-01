import yfinance as yf
import requests

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
})

print("Testing MMC info with custom session...")
try:
    ticker = yf.Ticker("MMC", session=session)
    info = ticker.info
    print("currentPrice:", info.get("currentPrice"))
except Exception as e:
    print(f"Exception: {e}")
