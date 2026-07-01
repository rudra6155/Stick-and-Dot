import sqlite3
import time
from yahooquery import Ticker
import datetime

def safe_float(val):
    try:
        return float(val) if val is not None else None
    except:
        return None

def safe_str(val):
    try:
        return str(val) if val is not None else None
    except:
        return None

conn = sqlite3.connect('finance_hub.db')
cursor = conn.cursor()

# Get tickers to fetch that haven't been successfully fetched yet
cursor.execute("SELECT DISTINCT ticker FROM fmp_assets") # Wait, wrong table!
