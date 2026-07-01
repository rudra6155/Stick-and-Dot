import sqlite3

with open('downloaded_etfs.txt') as f:
    etf_tickers = [l.strip() for l in f if l.strip()]

conn = sqlite3.connect('finance_hub.db')
c = conn.cursor()
updated = 0
for t in etf_tickers:
    c.execute("UPDATE traditional_assets SET asset_class = 'ETF' WHERE ticker = ? AND asset_class != 'ETF'", (t,))
    updated += c.rowcount
conn.commit()

c.execute("SELECT DISTINCT ticker FROM traditional_assets WHERE asset_class = 'ETF'")
count = len(c.fetchall())
print("Rows updated:", updated)
print("Total ETF count now:", count)
conn.close()
