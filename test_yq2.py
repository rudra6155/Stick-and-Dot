from yahooquery import Ticker
t = Ticker('MSFT GOOG TSLA MMC HES CMA STOR')
print("Testing yahooquery for various tickers...")
try:
    print(t.price)
except Exception as e:
    print(f"Exception: {e}")
