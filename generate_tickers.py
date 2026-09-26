import financedatabase as fd
import json
import os
import pandas as pd

try:
    os.makedirs('scratch', exist_ok=True)
    
    print("Loading ETFs...")
    etfs = fd.ETFs().select()
    bond_etfs = []
    reit_etfs = []
    comm_etfs = []
    
    for symbol, row in etfs.iterrows():
        cat = str(row.get('category', '')).lower()
        if 'bond' in cat or 'fixed income' in cat or 'treasury' in cat:
            bond_etfs.append(symbol)
        elif 'real estate' in cat or 'reit' in cat:
            reit_etfs.append(symbol)
        elif 'commodit' in cat or 'gold' in cat or 'silver' in cat or 'oil' in cat:
            comm_etfs.append(symbol)

    print("Loading Equities...")
    equities = fd.Equities().select()
    reit_stocks = []
    for symbol, row in equities.iterrows():
        ind = str(row.get('industry', '')).lower()
        if 'reit' in ind:
            reit_stocks.append(symbol)

    print("Loading Mutual Funds...")
    mfs = fd.Funds().select()
    bond_mfs = []
    for symbol, row in mfs.iterrows():
        cat = str(row.get('category', '')).lower()
        if 'bond' in cat or 'fixed income' in cat:
            bond_mfs.append(symbol)

    res = {
        'Bond': list(set(bond_etfs + bond_mfs)),
        'REIT': list(set(reit_etfs + reit_stocks)),
        'Commodity': list(set(comm_etfs))
    }
    
    with open('scratch/tickers.json', 'w') as f:
        json.dump(res, f)
        
    print(f"Saved {len(res['Bond'])} Bonds, {len(res['REIT'])} REITs, {len(res['Commodity'])} Commodities")
except Exception as e:
    print('Error:', e)
