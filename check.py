import sqlite3
conn = sqlite3.connect('finance_hub.db')
c = conn.cursor()
# Count how many candidate tickers exist in each source file
import re
with open('downloaded_tickers_v3.txt') as f:
    lines = [l.strip() for l in f if l.strip()]
for suffix, name in [('.T','Tokyo'), ('.KS','Korea'), ('.TW','Taiwan'), ('.BO','BSE')]:
    candidates = [l for l in lines if l.endswith(suffix)]
    print(name, 'candidates in file:', len(candidates))
    if candidates:
        print('  sample:', candidates[:3])
conn.close()
