from yahooquery import Ticker
t = Ticker('MMC AAPL')
print("Testing yahooquery for MMC and AAPL...")
try:
    print(t.price)
except Exception as e:
    print(f"Exception: {e}")
