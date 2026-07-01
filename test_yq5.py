import time
from yahooquery import Ticker
t = Ticker(','.join(['AAPL', 'MSFT', 'TSLA', 'GOOG', 'AMZN', 'META', 'NFLX', 'NVDA', 'AMD', 'INTC']).split(','), asynchronous=True)
start = time.time()
d = t.summary_detail
print("Time taken for 10 tickers:", time.time() - start)
