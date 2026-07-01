import requests
import csv
import io
import time
import json

def get_nasdaq_exchange(exchange_code, suffix=""):
    """Generic NASDAQ screener API puller for any exchange"""
    try:
        url = f"https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=10000&exchange={exchange_code}"
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(url, headers=headers, timeout=30)
        data = r.json()
        rows = data.get('data', {}).get('table', {}).get('rows', [])
        tickers = [row['symbol'] + suffix for row in rows if row.get('symbol')]
        print(f"{exchange_code}: {len(tickers)} tickers")
        return tickers
    except Exception as e:
        print(f"{exchange_code} failed: {e}")
        return []

def get_tokyo_tickers():
    try:
        import pandas as pd
        url = "https://www.jpx.co.jp/markets/statistics-equities/misc/tvdivq0000001vg2-att/data_j.xls"
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(url, headers=headers, timeout=30)
        from io import BytesIO
        df = pd.read_excel(BytesIO(r.content), engine='xlrd')
        code_col = df.columns[1]  # usually second column is the code
        tickers = [str(int(c)) + '.T' for c in df[code_col].dropna() if str(c).replace('.','').isdigit()]
        print(f"Tokyo: {len(tickers)} tickers")
        return tickers
    except Exception as e:
        print(f"Tokyo failed: {e}")
        return []

def get_lse_tickers_wiki():
    try:
        import pandas as pd
        tables = pd.read_html("https://en.wikipedia.org/wiki/List_of_companies_listed_on_the_London_Stock_Exchange")
        tickers = []
        for table in tables:
            for col in table.columns:
                if 'ticker' in str(col).lower() or 'symbol' in str(col).lower() or 'epic' in str(col).lower():
                    tickers.extend([str(t).strip() + '.L' for t in table[col].dropna()])
        tickers = list(set(tickers))
        print(f"LSE (Wikipedia): {len(tickers)} tickers")
        return tickers
    except Exception as e:
        print(f"LSE wiki failed: {e}")
        return []

def get_tsx_tickers_wiki():
    try:
        import pandas as pd
        tables = pd.read_html("https://en.wikipedia.org/wiki/S%26P/TSX_Composite_Index")
        tickers = []
        for table in tables:
            for col in table.columns:
                if 'ticker' in str(col).lower() or 'symbol' in str(col).lower():
                    tickers.extend([str(t).strip() + '.TO' for t in table[col].dropna()])
        tickers = list(set(tickers))
        print(f"TSX (Wikipedia): {len(tickers)} tickers")
        return tickers
    except Exception as e:
        print(f"TSX wiki failed: {e}")
        return []

def get_korea_tickers():
    try:
        import pandas as pd
        url = "http://kind.krx.co.kr/corpgeneral/corpList.do?method=download&searchType=13"
        tables = pd.read_html(url, encoding='euc-kr')
        df = tables[0]
        code_col = [c for c in df.columns if '코드' in str(c)]
        if not code_col:
            code_col = [df.columns[1]]
        tickers = [str(c).zfill(6) + '.KS' for c in df[code_col[0]].dropna()]
        print(f"Korea: {len(tickers)} tickers")
        return tickers
    except Exception as e:
        print(f"Korea failed: {e}")
        return []

def get_taiwan_tickers():
    """Taiwan Stock Exchange"""
    try:
        url = "https://openapi.twse.com.tw/v1/opendata/t187ap03_L"
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(url, headers=headers, timeout=30)
        data = r.json()
        tickers = [item.get('公司代號', '') + '.TW' for item in data if item.get('公司代號')]
        print(f"Taiwan: {len(tickers)} tickers")
        return tickers
    except Exception as e:
        print(f"Taiwan failed: {e}")
        return []

def get_shanghai_shenzhen_tickers():
    """China A-shares - Shanghai and Shenzhen"""
    try:
        # Shanghai
        sh_tickers = [f"6{str(i).zfill(5)}.SS" for i in range(0, 9000, 3)]
        # Shenzhen
        sz_tickers = [f"0{str(i).zfill(5)}.SZ" for i in range(0, 9000, 3)]
        all_t = sh_tickers + sz_tickers
        print(f"China A-shares (generated): {len(all_t)} candidate tickers")
        return all_t
    except Exception as e:
        print(f"China failed: {e}")
        return []

def get_full_bse_tickers():
    try:
        session = requests.Session()
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.bseindia.com/',
            'Accept': 'application/json',
        }
        # First hit the main site to get cookies
        session.get("https://www.bseindia.com/", headers=headers, timeout=15)
        time.sleep(1)
        r = session.get(
            "https://api.bseindia.com/BseIndiaAPI/api/ListofScripData/w?Group=&Scripcode=&industry=&segment=Equity&status=Active",
            headers=headers, timeout=30
        )
        data = r.json()
        tickers = [str(item.get('SCRIP_CD', '')) + '.BO' for item in data if item.get('SCRIP_CD')]
        print(f"Full BSE: {len(tickers)} tickers")
        return tickers
    except Exception as e:
        print(f"BSE failed: {e} — skipping, NSE coverage already strong")
        return []

if __name__ == "__main__":
    all_new = []

    all_new += get_nasdaq_exchange('amex')
    time.sleep(2)
    all_new += get_lse_tickers_wiki()
    time.sleep(2)
    all_new += get_tsx_tickers_wiki()
    time.sleep(2)
    all_new += get_tokyo_tickers()
    time.sleep(2)
    all_new += get_korea_tickers()
    time.sleep(2)
    all_new += get_taiwan_tickers()
    time.sleep(2)
    all_new += get_shanghai_shenzhen_tickers()
    time.sleep(2)
    all_new += get_full_bse_tickers()

    unique_new = list(set(all_new))
    print(f"\nTotal new unique candidate tickers: {len(unique_new)}")

    with open('downloaded_tickers_v3.txt', 'w') as f:
        for t in unique_new:
            f.write(t + '\n')
    print("Saved to downloaded_tickers_v3.txt")
