import requests
import csv
import io
import time

def get_lse_tickers():
    """London Stock Exchange via LSE website"""
    try:
        url = "https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=5000&exchange=lse"
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(url, headers=headers, timeout=30)
        data = r.json()
        rows = data.get('data', {}).get('table', {}).get('rows', [])
        tickers = [row['symbol'] + '.L' for row in rows if row.get('symbol')]
        print(f"LSE: {len(tickers)} tickers")
        return tickers
    except Exception as e:
        print(f"LSE failed: {e}")
        return []

def get_tsx_tickers():
    """Toronto Stock Exchange"""
    try:
        url = "https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=5000&exchange=tsx"
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(url, headers=headers, timeout=30)
        data = r.json()
        rows = data.get('data', {}).get('table', {}).get('rows', [])
        tickers = [row['symbol'] + '.TO' for row in rows if row.get('symbol')]
        print(f"TSX: {len(tickers)} tickers")
        return tickers
    except Exception as e:
        print(f"TSX failed: {e}")
        return []

def get_asx_tickers():
    """Australian Stock Exchange"""
    try:
        url = "https://asx.com.au/asx/research/ASXListedCompanies.csv"
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(url, headers=headers, timeout=30)
        reader = csv.reader(io.StringIO(r.text))
        tickers = []
        for i, row in enumerate(reader):
            if i < 3: continue  # skip headers
            if row and len(row) >= 2:
                tickers.append(row[1].strip() + '.AX')
        print(f"ASX: {len(tickers)} tickers")
        return tickers
    except Exception as e:
        print(f"ASX failed: {e}")
        return []

def get_bse_tickers():
    """Bombay Stock Exchange"""
    try:
        url = "https://api.bseindia.com/BseIndiaAPI/api/ListofScripData/w?Group=&Scripcode=&industry=&segment=Equity&status=Active"
        headers = {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://www.bseindia.com'
        }
        r = requests.get(url, headers=headers, timeout=30)
        data = r.json()
        tickers = [str(item.get('SCRIP_CD', '')) + '.BO' for item in data if item.get('SCRIP_CD')]
        print(f"BSE: {len(tickers)} tickers")
        return tickers
    except Exception as e:
        print(f"BSE failed: {e}")
        return []

def get_hkex_tickers():
    """Hong Kong Stock Exchange"""
    try:
        url = "https://www.hkex.com.hk/eng/services/trading/securities/securitieslists/ListOfSecurities.xlsx"
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(url, headers=headers, timeout=30)
        import openpyxl
        from io import BytesIO
        wb = openpyxl.load_workbook(BytesIO(r.content))
        ws = wb.active
        tickers = []
        for row in ws.iter_rows(min_row=4, values_only=True):
            if row[0]:
                code = str(row[0]).zfill(4)
                tickers.append(code + '.HK')
        print(f"HKEX: {len(tickers)} tickers")
        return tickers
    except Exception as e:
        print(f"HKEX failed: {e}")
        return []

def get_extra_commodities():
    """Extended commodity futures"""
    return [
        "GC=F","SI=F","CL=F","BZ=F","NG=F","HG=F","PL=F","PA=F",
        "ZW=F","ZC=F","ZS=F","KC=F","CT=F","CC=F","SB=F","OJ=F",
        "LE=F","GF=F","HE=F","LBS=F","RB=F","HO=F","BO=F","ZO=F",
        "ZR=F","ZM=F","ZL=F","ZT=F","ZF=F","ZN=F","ZB=F","UB=F",
        "ES=F","NQ=F","RTY=F","YM=F","GE=F","6E=F","6B=F","6J=F",
        "6C=F","6A=F","6N=F","6S=F","6M=F","MCL=F","MGC=F","SIL=F",
        "ALI=F","HRC=F","BB=F","BTC=F","ETH=F","MBT=F","MET=F",
    ]

def get_extra_forex():
    """Extended forex pairs"""
    return [
        "EURUSD=X","GBPUSD=X","USDJPY=X","USDCHF=X","AUDUSD=X","USDCAD=X",
        "NZDUSD=X","USDINR=X","USDCNY=X","USDSGD=X","USDHKD=X","USDMXN=X",
        "USDBRL=X","USDZAR=X","USDKRW=X","USDTRY=X","USDTHB=X","USDMYR=X",
        "USDPHP=X","USDPLN=X","USDSEK=X","USDNOK=X","USDDKK=X","USDHUF=X",
        "USDCZK=X","USDRON=X","USDIDR=X","USDVND=X","USDPKR=X","USDBDT=X",
        "EURGBP=X","EURJPY=X","EURCHF=X","EURAUD=X","EURCAD=X","EURNZD=X",
        "EURINR=X","EURCNY=X","EURSGD=X","EURHKD=X","EURMXN=X","EURBRL=X",
        "GBPJPY=X","GBPCHF=X","GBPAUD=X","GBPCAD=X","GBPNZD=X","GBPINR=X",
        "AUDJPY=X","AUDCHF=X","AUDCAD=X","AUDNZD=X","CADJPY=X","CHFJPY=X",
        "NZDJPY=X","NZDCAD=X","NZDCHF=X","NZDSGD=X","NZDHKD=X",
        "SGDJPY=X","SGDCNY=X","HKDJPY=X","CNYJPY=X","INRJPY=X",
        "XAUUSD=X","XAGUSD=X","XPTUSD=X","XPDUSD=X","XAUEUR=X",
        "XAUINR=X","XAUGBP=X","XAUCNY=X","XAUAUD=X","XAUCAD=X",
    ]

def get_extra_indices():
    """Extended global indices"""
    return [
        "^GSPC","^DJI","^IXIC","^RUT","^VIX","^FTSE","^GDAXI","^FCHI",
        "^N225","^HSI","^BSESN","^NSEI","^AXJO","^STOXX50E","^AEX",
        "^IBEX","^SSMI","^GSPTSE","^MXX","^BVSP","^MERV","^KS11",
        "^TWII","^STI","^KLSE","^JKSE","^NZ50","^XU100","^ATX",
        "^BFX","^OSEAX","^OMXC25","^OMXS30","^HEX","^PSI20","^CASE30",
        "^TA125.TA","^NIFTY50","^NIFTYBANK","^CNXIT","^CNXPHARMA",
        "^CNXAUTO","^CNXFMCG","^CNXMETAL","^CNXREALTY","^CNXINFRA",
        "^SP500TR","^NDX","^OEX","^MID","^SML","^W5000","^SPDAUDP",
        "^FTLC","^FTMC","^FTAS","^FTT1X","^N100","^STOXX","^E1SNS",
    ]

if __name__ == "__main__":
    all_tickers = []

    lse = get_lse_tickers()
    time.sleep(2)
    tsx = get_tsx_tickers()
    time.sleep(2)
    asx = get_asx_tickers()
    time.sleep(2)
    bse = get_bse_tickers()
    time.sleep(2)
    hkex = get_hkex_tickers()
    commodities = get_extra_commodities()
    forex = get_extra_forex()
    indices = get_extra_indices()

    all_tickers = list(set(lse + tsx + asx + bse + hkex + commodities + forex + indices))
    print(f"\nTotal new unique tickers: {len(all_tickers)}")

    # Append to existing downloaded_tickers.txt
    with open('downloaded_tickers.txt', 'a') as f:
        for t in all_tickers:
            f.write(t + '\n')
    print("Appended to downloaded_tickers.txt")

    # Show total
    with open('downloaded_tickers.txt', 'r') as f:
        total = len(set(f.read().splitlines()))
    print(f"Total unique tickers in file: {total}")
