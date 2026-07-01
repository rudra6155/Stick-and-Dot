import sqlite3
conn = sqlite3.connect('finance_hub.db')
c = conn.cursor()
c.execute("UPDATE traditional_assets SET asset_class = 'Indian Stock' WHERE ticker LIKE '%.NS' AND asset_class != 'Indian Stock'")
c.execute("UPDATE traditional_assets SET asset_class = 'Indian Stock' WHERE ticker LIKE '%.BO' AND asset_class != 'Indian Stock'")
conn.commit()
count = c.execute("SELECT COUNT(DISTINCT ticker) FROM traditional_assets WHERE asset_class = 'Indian Stock'").fetchone()[0]
print('Indian Stock count after fix:', count)
conn.close()
