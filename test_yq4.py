from yahooquery import Ticker
t = Ticker(['AAPL', 'MSFT', 'MMC', 'HES'], asynchronous=True)
d1 = t.summary_detail
d2 = t.key_stats
d3 = t.financial_data
for sym in ['AAPL', 'MSFT', 'MMC', 'HES']:
    print(f"--- {sym} ---")
    print("summary_detail:", type(d1.get(sym)))
    if isinstance(d1.get(sym), str): print("Error:", d1.get(sym))
    print("key_stats:", type(d2.get(sym)))
    if isinstance(d2.get(sym), str): print("Error:", d2.get(sym))
    print("financial_data:", type(d3.get(sym)))
    if isinstance(d3.get(sym), str): print("Error:", d3.get(sym))
