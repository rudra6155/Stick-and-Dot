import sqlite3

def fix_db():
    conn = sqlite3.connect('finance_hub.db')
    c = conn.cursor()
    c.execute("UPDATE traditional_assets SET asset_class='Forex' WHERE ticker LIKE '%=X'")
    c.execute("UPDATE traditional_assets SET asset_class='Commodity' WHERE ticker LIKE '%=F'")
    c.execute("UPDATE traditional_assets SET asset_class='International' WHERE ticker LIKE '%.HK' OR ticker LIKE '%.AX' OR ticker LIKE '%.L' OR ticker LIKE '%.TO'")
    c.execute("UPDATE traditional_assets SET asset_class='Indian Stock' WHERE ticker LIKE '%.NS' OR ticker LIKE '%.BO'")
    c.execute("UPDATE traditional_assets SET asset_class='Index' WHERE ticker LIKE '^%'")
    conn.commit()
    conn.close()
    print("Database asset classes fixed!")

if __name__ == "__main__":
    fix_db()
