from yahooquery import Ticker
t = Ticker(["GARBAGE.NS", "BULLSHIT.BO"], asynchronous=True)
data = t.summary_detail
print("Type:", type(data))
print("Data:", data)
valid = [k for k, v in data.items() if isinstance(v, dict)] if isinstance(data, dict) else []
print("Valid:", valid)
