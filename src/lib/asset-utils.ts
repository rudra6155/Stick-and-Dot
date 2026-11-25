/**
 * Shared financial asset domain helpers used consistently across server actions,
 * API routes, and client components.
 */

export const SYNTHETIC_TICKER_PREFIXES = ['BOND-', 'REIT-', 'COMM-'] as const;

export const CANONICAL_SEARCH_ALIASES: Record<string, string> = {
  MICROSOFT: 'MSFT',
  APPLE: 'AAPL',
  GOOGLE: 'GOOGL',
  ALPHABET: 'GOOGL',
  AMAZON: 'AMZN',
  NVIDIA: 'NVDA',
  TESLA: 'TSLA',
  META: 'META',
  FACEBOOK: 'META',
  NETFLIX: 'NFLX',
  BITCOIN: 'BTC-USD',
  BTC: 'BTC-USD',
  ETHEREUM: 'ETH-USD',
  ETH: 'ETH-USD',
  SOLANA: 'SOL-USD',
  SOL: 'SOL-USD',
  DOGECOIN: 'DOGE-USD',
  DOGE: 'DOGE-USD',
  GOLD: 'GC=F',
  SILVER: 'SI=F',
  OIL: 'CL=F',
  CRUDE: 'CL=F',
  SP500: 'SPY',
  'S&P500': 'SPY',
  'S&P': 'SPY',
  DOW: 'DIA',
  DOWJONES: 'DIA',
  NASDAQ: 'QQQ',
  RELIANCE: 'RELIANCE.NS',
  TCS: 'TCS.NS',
  INFY: 'INFY.NS',
  INFOSYS: 'INFY.NS',
  HDFC: 'HDFCBANK.NS',
  HDFCBANK: 'HDFCBANK.NS',
  NIFTY: '^NSEI',
  SENSEX: '^BSESN',
};

const ASSET_CLASS_NORMALIZE_MAP: Record<string, string> = {
  'us stock': 'US Stock',
  stock: 'US Stock',
  stocks: 'US Stock',
  equity: 'US Stock',
  equities: 'US Stock',
  'us tech': 'US Stock',
  'us blue chip': 'US Stock',
  etf: 'ETF',
  etfs: 'ETF',
  reit: 'REIT',
  reits: 'REIT',
  crypto: 'Crypto',
  cryptocurrency: 'Crypto',
  commodity: 'Commodity',
  commodities: 'Commodity',
  bond: 'Bond',
  bonds: 'Bond',
  'indian stock': 'Indian Stock',
  'indian stocks': 'Indian Stock',
  international: 'International',
  forex: 'Forex',
  index: 'Index',
  indices: 'Index',
};

/** Returns true if a ticker is one of the Sept 2026 synthetic seed placeholders. */
export function isSyntheticTicker(ticker: unknown): boolean {
  if (typeof ticker !== 'string') return false;
  const upper = ticker.toUpperCase();
  return SYNTHETIC_TICKER_PREFIXES.some((prefix) => upper.startsWith(prefix));
}

/** Normalizes legacy/raw DB asset_class labels to canonical UI class names. */
export function normalizeAssetClass(raw: unknown): string {
  if (!raw) return 'US Stock';
  const str = typeof raw === 'string' ? raw : String(raw);
  return ASSET_CLASS_NORMALIZE_MAP[str.toLowerCase().trim()] ?? str;
}

/** Expands a UI asset class filter into all matching DB asset_class variants. */
export function expandAssetClassFilter(assetClass: string): string[] {
  const normalized = normalizeAssetClass(assetClass);
  if (normalized === 'US Stock') {
    return ['US Stock', 'Stock', 'Equity'];
  }
  if (normalized === 'Crypto') {
    return ['Crypto', 'Cryptocurrency'];
  }
  return [normalized];
}

/** Normalizes any stock variant to 'Stock' for scenario/leaderboard/portfolio models. */
export function toPortfolioModelClass(assetClass: unknown): string {
  const normalized = normalizeAssetClass(assetClass);
  return normalized === 'US Stock' ? 'Stock' : normalized;
}

/** Infers trading currency code from ticker suffix or asset class. */
export function inferCurrency(ticker: string, assetClass?: string): string {
  if (!ticker) return 'USD';
  if (assetClass === 'Indian Stock' || ticker.endsWith('.NS') || ticker.endsWith('.BO')) return 'INR';
  if (ticker.endsWith('.T')) return 'JPY';
  if (ticker.endsWith('.KS')) return 'KRW';
  if (ticker.endsWith('.L') || ticker.endsWith('.IL')) return 'GBP';
  if (
    ticker.endsWith('.DE') ||
    ticker.endsWith('.PA') ||
    ticker.endsWith('.AS') ||
    ticker.endsWith('.MI') ||
    ticker.endsWith('.MC') ||
    ticker.endsWith('.BR') ||
    ticker.endsWith('.LS') ||
    ticker.endsWith('.VI')
  ) {
    return 'EUR';
  }
  if (ticker.endsWith('.TO') || ticker.endsWith('.V')) return 'CAD';
  if (ticker.endsWith('.AX')) return 'AUD';
  if (ticker.endsWith('.HK')) return 'HKD';
  if (ticker.endsWith('.SW')) return 'CHF';
  if (ticker.endsWith('.SA')) return 'BRL';
  if (ticker.endsWith('.BA')) return 'ARS';
  if (ticker.endsWith('.JK')) return 'IDR';
  if (ticker.endsWith('.MX')) return 'MXN';
  return 'USD';
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  INR: '₹',
  GBP: '£',
  EUR: '€',
  JPY: '¥',
  KRW: '₩',
  HKD: 'HK$',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'CHF ',
  BRL: 'R$',
  MXN: 'MX$',
};

/** Returns display currency symbol for an explicit currency code or ticker/class fallback. */
export function getCurrencySymbol(currencyOrTicker?: string | null, assetClass?: string): string {
  if (currencyOrTicker && CURRENCY_SYMBOLS[currencyOrTicker]) {
    return CURRENCY_SYMBOLS[currencyOrTicker];
  }
  if (currencyOrTicker) {
    const inferred = inferCurrency(currencyOrTicker, assetClass);
    return CURRENCY_SYMBOLS[inferred] || '$';
  }
  if (assetClass === 'Indian Stock') return '₹';
  return '$';
}

/**
 * Normalizes mixed-unit DB `dividend_yield` values into human percentage points
 * (e.g., `4.79` represents `4.79%`, `0.36` represents `0.36%`).
 * Rejects negative/NaN values and extreme corrupted scrape outliers (> 100%).
 */
export function normalizeDividendYieldPct(
  rawYield: unknown,
  dividendRate?: unknown,
  price?: unknown
): number | null {
  if (rawYield === null || rawYield === undefined) return null;
  const dy = Number(rawYield);
  if (!Number.isFinite(dy) || dy < 0 || dy > 100) return null;
  if (dy === 0) return 0;

  const dr = dividendRate !== null && dividendRate !== undefined ? Number(dividendRate) : 0;
  const p = price !== null && price !== undefined ? Number(price) : 0;

  if (Number.isFinite(dr) && dr > 0 && Number.isFinite(p) && p > 0) {
    const expectedDec = dr / p;
    const expectedPct = expectedDec * 100;
    if (expectedPct <= 60) {
      const errDec = Math.abs(dy - expectedDec);
      const errPct = Math.abs(dy - expectedPct);
      if (errDec * 5 < errPct) {
        return Number((dy * 100).toFixed(2));
      }
      return Number(dy.toFixed(2));
    }
  }

  // Fallback heuristic when dividend_rate is absent:
  // Legacy decimal scrapes use 3-6+ fractional digits below 0.25 (e.g., 0.058383, 0.233546),
  // whereas Yahoo percentage-scale yields in this dataset are rounded to 2 decimal places (e.g., 0.06, 0.11).
  if (dy > 0 && dy < 0.25) {
    const isTwoDecimal = Math.abs(dy * 100 - Math.round(dy * 100)) < 1e-4;
    if (!isTwoDecimal) {
      return Number((dy * 100).toFixed(2));
    }
  }

  return Number(dy.toFixed(2));
}

/** Formats a dividend yield value consistently as e.g. `4.79%` or `—`. */
export function formatDividendYield(
  rawYield: unknown,
  dividendRate?: unknown,
  price?: unknown,
  decimals = 2
): string {
  const pct = normalizeDividendYieldPct(rawYield, dividendRate, price);
  if (pct === null) return '—';
  return `${pct.toFixed(decimals)}%`;
}

/** Deterministic tie-breaker when duplicate ticker rows exist in `asset_snapshots`. */
export function pickCanonicalAssetRow<T extends Record<string, unknown>>(
  rows: T[] | null | undefined,
  preferredClass?: string
): T | null {
  if (!rows || rows.length === 0) return null;
  const prefNorm = preferredClass ? normalizeAssetClass(preferredClass) : null;

  const scoreRow = (row: T): number => {
    let score = 0;
    if (!isSyntheticTicker(row.ticker)) score += 1000;
    const rowNorm = normalizeAssetClass(row.asset_class);
    if (prefNorm && rowNorm === prefNorm) score += 200;
    if (row.asset_class === 'US Stock') score += 50;
    else if (row.asset_class === 'Stock') score += 40;
    if (row.market_cap && Number(row.market_cap) > 0) score += 100;
    if (row.sector) score += 25;
    if (row.short_name) score += 10;
    if (row.pe_ratio != null || row.revenue_growth != null) score += 10;
    return score;
  };

  let best = rows[0];
  let bestScore = scoreRow(best);
  for (let i = 1; i < rows.length; i++) {
    const s = scoreRow(rows[i]);
    if (s > bestScore) {
      best = rows[i];
      bestScore = s;
    }
  }
  return best;
}

/** Deduplicates an array of DB snapshot rows by ticker, keeping canonical entries. */
export function deduplicateAssetRows<T extends Record<string, unknown>>(
  rows: T[] | null | undefined,
  maxCount?: number
): T[] {
  if (!rows || rows.length === 0) return [];
  const byTicker = new Map<string, T[]>();
  const order: string[] = [];

  for (const row of rows) {
    if (!row || typeof row.ticker !== 'string' || !row.ticker || isSyntheticTicker(row.ticker)) continue;
    if (!byTicker.has(row.ticker)) {
      byTicker.set(row.ticker, [row]);
      order.push(row.ticker);
    } else {
      byTicker.get(row.ticker)!.push(row);
    }
  }

  const out: T[] = [];
  for (const ticker of order) {
    const canonical = pickCanonicalAssetRow(byTicker.get(ticker));
    if (canonical) out.push(canonical);
    if (maxCount && out.length >= maxCount) break;
  }
  return out;
}
