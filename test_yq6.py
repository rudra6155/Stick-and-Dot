from yahooquery import Ticker
import time

# Create 500 garbage tickers
tickers = [f"GARBAGE{i}.NS" for i in range(500)]
tickers.append('MSFT')

start = time.time()
t = Ticker(tickers, asynchronous=True)
data = t.summary_detail
valid = [k for k, v in data.items() if isinstance(v, dict)]
print("Valid:", valid)
print("Time taken:", time.time() - start)
