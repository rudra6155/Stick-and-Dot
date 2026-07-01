import yfinance as yf
print("Testing 7999.T info...")
try:
    info = yf.Ticker("7999.T").info
    print(info.get("currentPrice"), info.get("regularMarketPrice"), info.get("previousClose"))
except Exception as e:
    print(f"Exception: {e}")

print("Testing 1468.TW info...")
try:
    info = yf.Ticker("1468.TW").info
    print(info.get("currentPrice"), info.get("regularMarketPrice"), info.get("previousClose"))
except Exception as e:
    print(f"Exception: {e}")

print("Testing HES info...")
try:
    info = yf.Ticker("HES").info
    print(info.get("currentPrice"), info.get("regularMarketPrice"), info.get("previousClose"))
except Exception as e:
    print(f"Exception: {e}")
