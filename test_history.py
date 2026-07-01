import yfinance as yf
print("Testing MMC history...")
try:
    hist = yf.Ticker("MMC").history(period="1d")
    print(hist)
    print("Last price:", hist['Close'].iloc[-1])
except Exception as e:
    print(f"Exception: {e}")
