import requests
import time

def get_brazil():
    try:
        r = requests.get(
            "https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=5000&exchange=bovespa",
            headers={'User-Agent':'Mozilla/5.0'}, timeout=30)
        rows = r.json().get('data',{}).get('table',{}).get('rows',[])
        tickers = [row['symbol'] + '.SA' for row in rows if row.get('symbol')]
        print(f"Brazil: {len(tickers)}")
        return tickers
    except Exception as e:
        print(f"Brazil failed: {e}")
        return []

def get_europe_full():
    suffixes = [
        ('.MI', 'Milan'), ('.MC', 'Madrid'), ('.ST', 'Stockholm'),
        ('.HE', 'Helsinki'), ('.OL', 'Oslo'), ('.CO', 'Copenhagen'),
        ('.VI', 'Vienna'), ('.WA', 'Warsaw'), ('.PR', 'Prague'),
        ('.BD', 'Budapest'), ('.AT', 'Athens'), ('.IR', 'Dublin'),
    ]
    all_tickers = []
    for suffix, name in suffixes:
        candidates = [f"{str(i).zfill(4)}{suffix}" for i in range(1, 500)]
        all_tickers.extend(candidates)
        print(f"{name} generated: {len(candidates)}")
    return all_tickers

def get_taiwan_otc():
    try:
        r = requests.get(
            "https://openapi.twse.com.tw/v1/opendata/t187ap03_L",
            headers={'User-Agent':'Mozilla/5.0'}, timeout=30)
        data = r.json()
        tickers = [item.get('公司代號','') + '.TWO' for item in data if item.get('公司代號')]
        print(f"Taiwan OTC: {len(tickers)}")
        return tickers
    except Exception as e:
        print(f"Taiwan OTC failed: {e}")
        return []

def get_thailand():
    tickers = [str(i).zfill(4) + '.BK' for i in range(1, 1000)]
    print(f"Thailand generated: {len(tickers)}")
    return tickers

def get_south_africa():
    tickers = [str(i).zfill(4) + '.JO' for i in range(1, 1000)]
    print(f"South Africa generated: {len(tickers)}")
    return tickers

def get_mexico():
    tickers = [str(i).zfill(4) + '.MX' for i in range(1, 500)]
    print(f"Mexico generated: {len(tickers)}")
    return tickers

def get_saudi():
    tickers = [str(i).zfill(4) + '.SR' for i in range(1000, 9000, 4)]
    print(f"Saudi generated: {len(tickers)}")
    return tickers

def get_more_tokyo():
    existing = list(range(1300, 9999))
    tickers = [str(i) + '.T' for i in existing]
    print(f"Tokyo extended: {len(tickers)}")
    return tickers

def get_global_etfs_extended():
    return [
        "SPY","IVV","VOO","QQQ","VTI","VEA","VWO","EFA","EEM","GLD",
        "SLV","USO","UNG","TLT","IEF","LQD","HYG","BND","AGG","VNQ",
        "XLF","XLK","XLE","XLV","XLI","XLU","XLP","XLY","XLB","XLRE",
        "DIA","MDY","IJH","IJR","IWM","IWB","IWV","IWF","IWD","IWN",
        "VGK","VPL","VGT","VHT","VFH","VDE","VDC","VAW","VIS","VCR",
        "ARKK","ARKW","ARKG","ARKF","ARKQ","ARKX","PRNT","IZRL",
        "ICLN","QCLN","PBW","ACES","CNRG","FAN","GRID","LIT","REMX",
        "HACK","BUG","CIBR","IHAK","WCBR","ROBO","BOTZ","AIQ","IRBO",
        "SOXX","SMH","PSI","SOXL","SOXS","USD","NVDL","TQQQ","SQQQ",
        "SPXL","SPXS","UPRO","SPXU","TNA","TZA","UDOW","SDOW","UMDD",
        "EWJ","EWG","EWU","EWC","EWA","EWZ","EWY","EWT","MCHI","INDA",
        "RSX","EWW","EWS","THD","IDX","EPHE","VNM","FM","GULF","MES",
        "KWEB","CQQQ","ASHR","AAXJ","KBWY","KBWB","KBWR","KBWP","KBWD",
        "PDBC","DJP","GSG","PDBC","COMT","FTGC","COMB","BCIM","DCMB",
        "BITO","BTF","BITI","GBTC","ETHE","GDLC","BITQ","BTCW","DEFI",
    ]

if __name__ == "__main__":
    all_t = (
        get_brazil() +
        get_europe_full() +
        get_taiwan_otc() +
        get_thailand() +
        get_south_africa() +
        get_mexico() +
        get_saudi() +
        get_more_tokyo() +
        get_global_etfs_extended()
    )
    unique = list(set(all_t))
    with open('downloaded_final_squeeze.txt', 'w') as f:
        for t in unique:
            f.write(t + '\n')
    print(f"Total saved: {len(unique)}")
