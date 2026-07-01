import requests
headers = {'User-Agent': 'Mozilla/5.0'}
res = requests.get('https://query2.finance.yahoo.com/v10/finance/quoteSummary/AAPL?modules=financialData', headers=headers)
print("AAPL Status:", res.status_code)
print(res.text[:200])

res2 = requests.get('https://query2.finance.yahoo.com/v10/finance/quoteSummary/MMC?modules=financialData', headers=headers)
print("MMC Status:", res2.status_code)
print(res2.text[:200])
