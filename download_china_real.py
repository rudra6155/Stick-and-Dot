import requests

import time

def get_china_a_shares():
    all_tickers = []
    for page in range(1, 101):  # 80 pages x 100 = up to 8000
        for attempt in range(3): # Retry up to 3 times per page
            try:
                url = "http://82.push2.eastmoney.com/api/qt/clist/get"
                params = {
                    'pn': page, 'pz': 100, 'po': 1, 'np': 1, 'fltt': 2, 'invt': 2,
                    'fid': 'f3',
                    'fs': 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23',
                    'fields': 'f12,f13,f14'
                }
                headers = {'User-Agent': 'Mozilla/5.0'}
                r = requests.get(url, params=params, headers=headers, timeout=30)
                data = r.json()
                items = data.get('data', {}).get('diff', [])
                if not items:
                    print(f"Page {page}: no more data, stopping")
                    break
                for item in items:
                    code = item.get('f12')
                    market = item.get('f13')
                    if not code:
                        continue
                    suffix = '.SS' if market == 1 else '.SZ'
                    all_tickers.append(code + suffix)
                print(f"Page {page}: total so far {len(all_tickers)}")
                time.sleep(2)
                break # Success, break the retry loop
            except Exception as e:
                print(f"Page {page} failed (attempt {attempt+1}): {e}")
                time.sleep(3)
        else:
            print(f"Page {page} failed 3 times, stopping.")
            break
    print(f"China A-shares (real) total: {len(all_tickers)}")
    return all_tickers

if __name__ == "__main__":
    tickers = get_china_a_shares()
    with open('downloaded_china_real.txt', 'w') as f:
        for t in tickers:
            f.write(t + '\n')
    print(f"Saved {len(tickers)} real China tickers")
    if tickers:
        print("Sample:", tickers[:5])
