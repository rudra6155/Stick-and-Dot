import yfinance as yf
print("Testing MMC fast_info price...")
try:
    print(yf.Ticker("MMC").fast_info.last_price)
except Exception as e:
    print(f"Exception: {e}")
