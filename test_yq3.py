from yahooquery import Ticker
t = Ticker('AAPL')
data = t.summary_detail
print(data['AAPL'].keys())
data2 = t.key_stats
print(data2['AAPL'].keys())
data3 = t.financial_data
print(data3['AAPL'].keys())
