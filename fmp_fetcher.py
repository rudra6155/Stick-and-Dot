import requests
import sqlite3
import time
import datetime

FMP_KEY = "j2L69moMLNSlje1Ogbyajs2fCP2sNUnV"
BASE_URL = "https://financialmodelingprep.com/api/v3"

def setup_database():
    conn = sqlite3.connect('finance_hub.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS fmp_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticker TEXT,
            short_name TEXT,
            asset_class TEXT,
            price REAL,
            market_cap REAL,
            pe_ratio REAL,
            forward_pe REAL,
            peg_ratio REAL,
            price_to_book REAL,
            price_to_sales REAL,
            ev_to_ebitda REAL,
            enterprise_value REAL,
            dividend_yield REAL,
            dividend_rate REAL,
            payout_ratio REAL,
            earnings_growth REAL,
            revenue_growth REAL,
            profit_margins REAL,
            gross_margins REAL,
            operating_margins REAL,
            return_on_equity REAL,
            return_on_assets REAL,
            total_revenue REAL,
            net_income REAL,
            ebitda REAL,
            total_debt REAL,
            cash_and_equivalents REAL,
            free_cashflow REAL,
            operating_cashflow REAL,
            capex REAL,
            high_52_week REAL,
            low_52_week REAL,
            ma_50_day REAL,
            ma_200_day REAL,
            beta REAL,
            shares_outstanding REAL,
            float_shares REAL,
            shares_short REAL,
            held_percent_insiders REAL,
            held_percent_institutions REAL,
            recommendation_mean REAL,
            target_mean_price REAL,
            target_high_price REAL,
            target_low_price REAL,
            analyst_count INTEGER,
            trailing_eps REAL,
            forward_eps REAL,
            book_value_per_share REAL,
            revenue_per_share REAL,
            debt_to_equity REAL,
            current_ratio REAL,
            quick_ratio REAL,
            sector TEXT,
            industry TEXT,
            country TEXT,
            exchange TEXT,
            currency TEXT,
            website TEXT,
            description TEXT,
            timestamp DATETIME,
            UNIQUE(ticker)
        )
    ''')
    conn.commit()
    return conn

def safe_float(val):
    try:
        return float(val) if val is not None else None
    except:
        return None

def safe_int(val):
    try:
        return int(val) if val is not None else None
    except:
        return None

def fetch_and_store():
    conn = setup_database()
    cursor = conn.cursor()

    # Step 1 — get full stock list from FMP
    print("Fetching stock list from FMP v4...")
    all_stocks = []

    # Use the new v4 search endpoint to get stocks by exchange
    exchanges = ['NYSE', 'NASDAQ', 'NSE', 'LSE', 'TSX']
    for exchange in exchanges:
        try:
            r = requests.get(
                f"https://financialmodelingprep.com/api/v3/stock/list",
                params={'apikey': FMP_KEY},
                timeout=30
            )
            data = r.json()
            if isinstance(data, list):
                exchange_stocks = [s for s in data if s.get('exchangeShortName') == exchange]
                all_stocks.extend(exchange_stocks)
                print(f"{exchange}: {len(exchange_stocks)} stocks")
            time.sleep(1)
        except Exception as e:
            print(f"{exchange} failed: {e}")

    # If that fails too, fall back to using our own ticker lists
    if len(all_stocks) == 0:
        print("FMP list endpoint unavailable. Using ticker lists directly...")
        from ticker_lists import SP500_TICKERS, RUSSELL_TICKERS, GROWTH_TICKERS, MIDCAP_TICKERS
        manual_tickers = list(set(SP500_TICKERS + RUSSELL_TICKERS + GROWTH_TICKERS + MIDCAP_TICKERS))
        all_stocks = [{'symbol': t, 'price': 1, 'exchangeShortName': 'NYSE'} for t in manual_tickers]
        print(f"Using {len(all_stocks)} tickers from local lists")

    valid = all_stocks[:2000]
    print(f"Processing {len(valid)} tickers")

    # Process in batches — 250 calls/day free limit
    done = 0
    for stock in valid:
        ticker = stock.get('symbol')
        if not ticker:
            continue

        done += 1
        print(f"[{done}/{len(valid)}] {ticker}...", end=" ")

        try:
            # Get profile (fundamentals + company info)
            r = requests.get(f"{BASE_URL}/profile/{ticker}?apikey={FMP_KEY}", timeout=15)
            profiles = r.json()
            if not profiles or not isinstance(profiles, list) or 'Error Message' in str(profiles):
                print("No profile")
                time.sleep(0.5)
                continue

            p = profiles[0]

            # Get key metrics
            r2 = requests.get(f"{BASE_URL}/key-metrics-ttm/{ticker}?apikey={FMP_KEY}", timeout=15)
            metrics = r2.json()
            m = metrics[0] if metrics and isinstance(metrics, list) else {}

            # Get ratios
            r3 = requests.get(f"{BASE_URL}/ratios-ttm/{ticker}?apikey={FMP_KEY}", timeout=15)
            ratios = r3.json()
            rat = ratios[0] if ratios and isinstance(ratios, list) else {}

            # Determine asset class
            asset_class = "Stock"
            exchange = p.get('exchangeShortName', '')
            if '.NS' in ticker or '.BO' in ticker or exchange in ['NSE', 'BSE']:
                asset_class = "Indian Stock"
            elif exchange in ['LSE', 'LSE_EXT']:
                asset_class = "International"
            elif exchange in ['TSX', 'TSXV']:
                asset_class = "International"
            elif stock.get('type') == 'etf':
                asset_class = "ETF"

            cursor.execute('''
                INSERT OR REPLACE INTO fmp_assets (
                    ticker, short_name, asset_class,
                    price, market_cap, pe_ratio, forward_pe, peg_ratio,
                    price_to_book, price_to_sales, ev_to_ebitda, enterprise_value,
                    dividend_yield, dividend_rate, payout_ratio,
                    earnings_growth, revenue_growth, profit_margins, gross_margins, operating_margins,
                    return_on_equity, return_on_assets,
                    total_revenue, net_income, ebitda, total_debt, cash_and_equivalents,
                    free_cashflow, operating_cashflow, capex,
                    high_52_week, low_52_week, ma_50_day, ma_200_day, beta,
                    shares_outstanding, float_shares,
                    held_percent_insiders, held_percent_institutions,
                    target_mean_price, target_high_price, target_low_price, analyst_count,
                    trailing_eps, forward_eps, book_value_per_share, revenue_per_share,
                    debt_to_equity, current_ratio, quick_ratio,
                    sector, industry, country, exchange, currency,
                    website, description, timestamp
                ) VALUES (
                    ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
                )
            ''', (
                ticker,
                p.get('companyName'),
                asset_class,
                safe_float(p.get('price')),
                safe_float(p.get('mktCap')),
                safe_float(p.get('pe')),
                safe_float(m.get('peRatioTTM')),
                safe_float(m.get('pegRatioTTM')),
                safe_float(m.get('pbRatioTTM')),
                safe_float(m.get('priceToSalesRatioTTM')),
                safe_float(m.get('evToEbitdaTTM')),
                safe_float(m.get('enterpriseValueTTM')),
                safe_float(p.get('lastDiv')),
                safe_float(p.get('lastDiv')),
                safe_float(rat.get('payoutRatioTTM')),
                safe_float(m.get('revenueGrowthTTM')),
                safe_float(m.get('revenueGrowthTTM')),
                safe_float(rat.get('netProfitMarginTTM')),
                safe_float(rat.get('grossProfitMarginTTM')),
                safe_float(rat.get('operatingProfitMarginTTM')),
                safe_float(rat.get('returnOnEquityTTM')),
                safe_float(rat.get('returnOnAssetsTTM')),
                safe_float(m.get('revenuePerShareTTM')),
                safe_float(m.get('netIncomePerShareTTM')),
                safe_float(m.get('evToEbitdaTTM')),
                safe_float(m.get('debtToEquityTTM')),
                safe_float(m.get('cashPerShareTTM')),
                safe_float(m.get('freeCashFlowPerShareTTM')),
                safe_float(m.get('operatingCashFlowPerShareTTM')),
                safe_float(m.get('capexPerShareTTM')),
                safe_float(p.get('yearHigh')),
                safe_float(p.get('yearLow')),
                safe_float(p.get('priceAvg50')),
                safe_float(p.get('priceAvg200')),
                safe_float(p.get('beta')),
                safe_float(p.get('sharesOutstanding')),
                safe_float(p.get('sharesOutstanding')),
                None, None,
                safe_float(p.get('dcfDiff')),
                safe_float(p.get('dcf')),
                None, None,
                safe_float(m.get('epsRatioTTM')),
                safe_float(m.get('epsRatioTTM')),
                safe_float(m.get('bookValuePerShareTTM')),
                safe_float(m.get('revenuePerShareTTM')),
                safe_float(rat.get('debtRatioTTM')),
                safe_float(rat.get('currentRatioTTM')),
                safe_float(rat.get('quickRatioTTM')),
                p.get('sector'),
                p.get('industry'),
                p.get('country'),
                p.get('exchangeShortName'),
                p.get('currency'),
                p.get('website'),
                p.get('description'),
                datetime.datetime.now()
            ))
            conn.commit()
            print(f"OK ${safe_float(p.get('price', 0)):.2f}")

        except Exception as e:
            print(f"Failed ({e})")
            continue

        time.sleep(0.5)

        # Stop at 240 to stay within free tier daily limit
        if done >= 2000:
            print(f"\nReached 2000 assets. Run again for more.")
            break

    conn.close()
    print(f"\nDone. {done} assets processed.")

if __name__ == "__main__":
    fetch_and_store()
