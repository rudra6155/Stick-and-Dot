import requests
import time

def get_tsx_full():
    try:
        r = requests.get(
            "https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=10000&exchange=tsx",
            headers={'User-Agent':'Mozilla/5.0'}, timeout=30)
        rows = r.json().get('data',{}).get('table',{}).get('rows',[])
        tickers = [row['symbol'] + '.TO' for row in rows if row.get('symbol')]
        print(f"TSX: {len(tickers)}")
        return tickers
    except Exception as e:
        print(f"TSX failed: {e}")
        return []

def get_lse_full():
    try:
        r = requests.get(
            "https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=10000&exchange=lse",
            headers={'User-Agent':'Mozilla/5.0'}, timeout=30)
        rows = r.json().get('data',{}).get('table',{}).get('rows',[])
        tickers = [row['symbol'] + '.L' for row in rows if row.get('symbol')]
        print(f"LSE: {len(tickers)}")
        return tickers
    except Exception as e:
        print(f"LSE failed: {e}")
        return []

def get_singapore():
    tickers = [str(i).zfill(4) + '.SI' for i in range(1, 2000)]
    print(f"Singapore generated: {len(tickers)}")
    return tickers

def get_malaysia():
    tickers = [str(i).zfill(4) + '.KL' for i in range(1, 2000)]
    print(f"Malaysia generated: {len(tickers)}")
    return tickers

def get_indonesia():
    try:
        r = requests.get(
            "https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=5000&exchange=idx",
            headers={'User-Agent':'Mozilla/5.0'}, timeout=30)
        rows = r.json().get('data',{}).get('table',{}).get('rows',[])
        tickers = [row['symbol'] + '.JK' for row in rows if row.get('symbol')]
        print(f"Indonesia: {len(tickers)}")
        return tickers
    except Exception as e:
        print(f"Indonesia failed: {e}")
        return []

def get_more_reits():
    return [
        "O","NNN","VICI","GLPI","AMT","CCI","SBAC","EQIX","DLR","PSA",
        "EXR","CUBE","PLD","EGP","STAG","COLD","IIPR","WY","RYN","VTR",
        "WELL","OHI","SBRA","DOC","NHI","REG","KIM","FRT","SPG","BXP",
        "VNO","SLG","CPT","EQR","AVB","UDR","MAA","ESS","INVH","AMH",
        "SUI","ELS","RHP","HST","APLE","CTRE","HR","MPW","LAND","FPI",
        "SAFE","BRT","ALEX","GMG.AX","SCG.AX","VCX.AX","DXS.AX","GPT.AX",
        "MGR.AX","NSR.AX","CLW.AX","WPR.AX","A17U.SI","C38U.SI","M44U.SI",
        "8951.T","8952.T","8953.T","8954.T","8955.T","8956.T","8957.T",
        "8960.T","8961.T","8963.T","8964.T","8966.T","8967.T","8968.T",
        "0823.HK","0405.HK","0778.HK","2778.HK","0808.HK","1426.HK",
    ]

def get_more_bonds():
    return [
        "TLT","IEF","SHY","BND","AGG","LQD","HYG","JNK","TIP","VTIP",
        "BNDX","EMB","MUB","SHV","GOVT","VGSH","VGIT","VGLT","BSV","BIV",
        "BLV","VCSH","VCIT","VCLT","SCHZ","SCHR","SCHI","SCHQ","STIP","LTPZ",
        "EDV","SPTL","SPTS","SPTI","TLH","IEI","SHYG","FALN","HYLB","USHY",
        "ANGL","SJNK","HYS","SRLN","BKLN","FLOT","NEAR","MINT","JPST","ICSH",
        "VRIG","FTSM","GBIL","SGOV","BIL","CLTL","TBLL","SUB","SMB","PZA",
        "MLN","HYD","ITM","VTEB","TFI","MUNI","SMMU","SHM","BSJN","BSJO",
        "BSJP","BSJQ","BSJR","HYXU","IHYG","SLQD","FLRN","USFR","TFLO",
    ]

def get_more_commodities():
    return [
        "GC=F","SI=F","CL=F","BZ=F","NG=F","HG=F","PL=F","PA=F",
        "ZW=F","ZC=F","ZS=F","KC=F","CT=F","CC=F","SB=F","OJ=F",
        "LE=F","GF=F","HE=F","LBS=F","RB=F","HO=F","BO=F","ZO=F",
        "ZR=F","ZM=F","ZL=F","ALI=F","HRC=F","MGC=F","SIL=F","MCL=F",
        "QM=F","QG=F","QC=F","BB=F","BTC=F","ETH=F","MBT=F","MET=F",
        "GDX","GDXJ","SLV","GLD","IAU","SGOL","SIVR","PPLT","PALL",
        "USO","UNG","BNO","UGA","BOIL","KOLD","UCO","SCO","UGAZ","DGAZ",
        "DBA","CORN","WEAT","SOYB","CANE","NIB","JO","BAL","CPER","PLTM",
    ]

if __name__ == "__main__":
    all_t = (
        get_tsx_full() +
        get_lse_full() +
        get_singapore() +
        get_malaysia() +
        get_indonesia() +
        get_more_reits() +
        get_more_bonds() +
        get_more_commodities()
    )
    unique = list(set(all_t))
    with open('downloaded_final_push.txt', 'w') as f:
        for t in unique:
            f.write(t + '\n')
    print(f"Total saved: {len(unique)}")
