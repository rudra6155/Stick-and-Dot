import yfinance as yf
print("Testing 7999.T...")
t1 = yf.Ticker("7999.T")
print(t1.fast_info)

print("Testing 1468.TW...")
t2 = yf.Ticker("1468.TW")
print(t2.fast_info)

print("Testing 500084.BO...")
t3 = yf.Ticker("500084.BO")
print(t3.fast_info)
