import yfinance as yf
print("Testing AAPL...")
aapl = yf.Ticker("AAPL")
print(aapl.fast_info)
print("Testing MMC...")
mmc = yf.Ticker("MMC")
print(mmc.fast_info)
