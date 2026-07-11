import requests

def get_philippines():
    tickers = [str(i).zfill(3) for i in range(1, 500)]
    return [t + '.PS' for t in tickers]

def get_vietnam():
    tickers = [chr(65+i)+chr(65+j) for i in range(26) for j in range(26)][:500]
    return [t + '.VN' for t in tickers]

def get_qatar():
    return [str(i).zfill(4) + '.QA' for i in range(1, 200)]

def get_uae():
    return [str(i).zfill(4) + '.AE' for i in range(1, 300)]

def get_egypt():
    try:
        r = requests.get(
            "https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=2000&exchange=egx",
            headers={'User-Agent':'Mozilla/5.0'}, timeout=30)
        rows = r.json().get('data',{}).get('table',{}).get('rows',[])
        tickers = [row['symbol'] + '.CA' for row in rows if row.get('symbol')]
        print(f"Egypt: {len(tickers)}")
        return tickers
    except Exception as e:
        print(f"Egypt failed: {e}")
        return []

def get_nasdaq_smallcap():
    try:
        r = requests.get(
            "https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=10000&exchange=nasdaq&marketcap=SMALL",
            headers={'User-Agent':'Mozilla/5.0'}, timeout=30)
        rows = r.json().get('data',{}).get('table',{}).get('rows',[])
        tickers = [row['symbol'] for row in rows if row.get('symbol')]
        print(f"NASDAQ smallcap: {len(tickers)}")
        return tickers
    except Exception as e:
        print(f"NASDAQ smallcap failed: {e}")
        return []

def get_more_crypto_etfs():
    return [
        "BITO","BTF","BITI","GBTC","ETHE","GDLC","BITQ","BTCW","DEFI",
        "BLOK","LEGR","BITS","BKCH","FDIG","DAPP","XBTF","BTCC","BITC",
        "IBIT","FBTC","ARKB","BRRR","EZBC","BTCO","HODL","BTCW","GBTC",
    ]

def get_dividend_etfs():
    return [
        "SCHD","VYM","DVY","SDY","HDV","NOBL","DGRO","VIG","SPHD","SPYD",
        "RDVY","DHS","FDL","DTD","DLN","PEY","DES","DGRW","QDF","FVD",
        "DON","DEF","EFAD","IDV","DEM","DGS","IDOG","EDOG","AUSF","GDIV",
    ]

if __name__ == "__main__":
    all_t = (
        get_philippines() + get_vietnam() + get_qatar() + get_uae() +
        get_egypt() + get_nasdaq_smallcap() +
        get_more_crypto_etfs() + get_dividend_etfs()
    )
    unique = list(set(all_t))
    with open('downloaded_more_global.txt', 'w') as f:
        for t in unique:
            f.write(t + '\n')
    print(f"Total saved: {len(unique)}")
