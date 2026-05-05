import yfinance as yf
import sqlite3
import datetime

# Assets: Expanded traditional categories
ASSETS = {
  "US Tech": {
    "tickers": ["AAPL","MSFT","NVDA","GOOGL","AMZN","META","TSLA","ORCL","AMD","INTC","CRM","ADBE","NFLX","QCOM","NOW","UBER","SNOW","PLTR","SHOP","NET","RBLX","SPOT","ZM","DOCU","CRWD"],
    "class": "Stock"
  },
  "US Blue Chip": {
    "tickers": ["BRK-B","JPM","V","MA","UNH","JNJ","WMT","PG","HD","BAC","XOM","CVX","KO","PEP","MCD","DIS","NKE","GS","MS","AXP","LLY","ABT","TMO","DHR","CAT"],
    "class": "Stock"
  },
  "Broad ETF": {
    "tickers": ["SPY","QQQ","VTI","VOO","IWM","DIA","VEA","VWO","EFA","EEM","IEMG","SCHB","ITOT","SPDW","VT","VXUS","GLD","SLV","IAU","GLDM"],
    "class": "ETF"
  },
  "Sector ETF": {
    "tickers": ["XLK","XLF","XLE","XLV","XLI","XLB","XLU","XLP","XLRE","XLC","ARKK","ARKG","ARKW","IBB","VGT","SOXX","HACK","BOTZ","FINX","BLOK"],
    "class": "ETF"
  },
  "REIT": {
    "tickers": ["VNQ","SCHH","O","AMT","PLD","EQIX","SPG","PSA","DLR","CCI","AVB","EQR","WELL","BXP","KIM","REG","NNN","STAG","MPW","WPC","ARE","EXR","LSI","IRM","SBAC"],
    "class": "REIT"
  },
  "Commodity": {
    "tickers": ["GC=F","SI=F","CL=F","BZ=F","NG=F","HG=F","ZW=F","ZC=F","PL=F","PA=F","ZS=F","KC=F","CT=F","LB=F","OJ=F","RB=F","HO=F","ZO=F","ZR=F","GF=F","LE=F","HE=F","ALI=F","MNQ=F","RTY=F"],
    "class": "Commodity"
  },
  "Bond": {
    "tickers": ["TLT","IEF","HYG","LQD","BND","SHY","VGIT","VCIT","VCLT","AGG","MUB","TIP","STIP","VTIP","BNDX","USHY","ANGL","EMHY","FALN","SPSB"],
    "class": "Bond"
  },
  "Indian Stock": {
    "tickers": ["RELIANCE.NS","TCS.NS","HDFCBANK.NS","INFY.NS","ICICIBANK.NS","HINDUNILVR.NS","SBIN.NS","BAJFINANCE.NS","ADANIENT.NS","WIPRO.NS","KOTAKBANK.NS","LT.NS","AXISBANK.NS","ASIANPAINT.NS","MARUTI.NS","TITAN.NS","SUNPHARMA.NS","ULTRACEMCO.NS","NESTLEIND.NS","POWERGRID.NS","NTPC.NS","ONGC.NS","TATAMOTORS.NS","TATASTEEL.NS","TECHM.NS"],
    "class": "Indian Stock"
  },
  "International": {
    "tickers": ["TSM","BABA","ASML","TM","SONY","SAP","BHP","SHOP","NVO","RDS-A","TD","RY","SNE","BIDU","JD","PDD","SE","GRAB","TCEHY","BYDDF","NTE","UL","BP","HSBC","AZN"],
    "class": "International"
  }
}

def setup_database():
    conn = sqlite3.connect('finance_hub.db')
    cursor = conn.cursor()
    # Create generic assets table with all columns
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS traditional_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker TEXT,
            asset_class TEXT,
            price REAL,
            volume REAL,
            market_cap REAL,
            timestamp DATETIME,
            high_52_week REAL,
            low_52_week REAL,
            pe_ratio REAL,
            dividend_yield REAL,
            ma_50_day REAL,
            ma_200_day REAL,
            beta REAL
        )
    ''')
    conn.commit()
    return conn

def safe_float(val):
    try:
        return float(val) if val is not None else 0.0
    except Exception:
        return 0.0

def fetch_and_store():
    conn = setup_database()
    cursor = conn.cursor()
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    print("\n" + "="*120)
    print(f"{'Ticker':<8} | {'Class':<10} | {'Price':<10} | {'PE Ratio':<10} | {'Div Yield':<10} | {'50d MA':<10} | {'200d MA':<10} | {'Beta'}")
    print("-" * 120)

    for category, info in ASSETS.items():
        asset_class = info["class"]
        for ticker in info["tickers"]:
            try:
                ticker_obj = yf.Ticker(ticker)
                
                # Fetch history for price/volume
                hist = ticker_obj.history(period="1d")
                
                if hist.empty:
                    print(f"Failed to fetch historical data for {ticker}")
                    continue
                
                price = float(hist['Close'].iloc[-1])
                volume = float(hist['Volume'].iloc[-1])
                
                # Fetch detailed info
                t_info = ticker_obj.info or {}
                
                # Get market cap
                market_cap = 0
                if hasattr(ticker_obj, 'fast_info'):
                    market_cap = safe_float(ticker_obj.fast_info.get('marketCap', 0))
                if not market_cap:
                    market_cap = safe_float(t_info.get('marketCap', 0))
                
                # Deep dive metrics
                high_52_week = safe_float(t_info.get('fiftyTwoWeekHigh', 0.0))
                low_52_week = safe_float(t_info.get('fiftyTwoWeekLow', 0.0))
                pe_ratio = safe_float(t_info.get('trailingPE', t_info.get('forwardPE', 0.0)))
                dividend_yield = safe_float(t_info.get('dividendYield', 0.0))
                ma_50_day = safe_float(t_info.get('fiftyDayAverage', 0.0))
                ma_200_day = safe_float(t_info.get('twoHundredDayAverage', 0.0))
                beta = safe_float(t_info.get('beta', 0.0))

                cursor.execute('''
                    INSERT INTO traditional_assets (
                        ticker, asset_class, price, volume, market_cap, timestamp,
                        high_52_week, low_52_week, pe_ratio, dividend_yield, ma_50_day, ma_200_day, beta
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (ticker, asset_class, price, volume, market_cap, timestamp,
                      high_52_week, low_52_week, pe_ratio, dividend_yield, ma_50_day, ma_200_day, beta))

                print(f"{ticker:<8} | {asset_class:<10} | ${price:<9,.2f} | {pe_ratio:<10.2f} | {dividend_yield:<10.4f} | ${ma_50_day:<9,.2f} | ${ma_200_day:<9,.2f} | {beta:.2f}")
            except Exception as e:
                print(f"Error processing {ticker}: {e}")

    conn.commit()
    conn.close()
    print("=" * 120)
    print(f"Data successfully recorded in 'finance_hub.db' at {timestamp}\n")

if __name__ == "__main__":
    fetch_and_store()
