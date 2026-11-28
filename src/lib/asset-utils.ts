/**
 * Shared financial asset domain helpers used consistently across server actions,
 * API routes, and client components.
 */

export const TOP_LEVEL_ASSET_CLASSES = [
  'Stocks',
  'Crypto',
  'ETF',
  'REIT',
  'Commodity',
  'Bond',
  'Forex',
  'Index',
] as const;

export const STOCK_SUB_CLASSES = ['All', 'US', 'Indian', 'International'] as const;
export type StockSubClass = (typeof STOCK_SUB_CLASSES)[number];

export const STOCK_DB_CLASSES = [
  'US Stock',
  'Stock',
  'Equity',
  'Indian Stock',
  'International',
] as const;

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
  stocks: 'Stocks',
  stock: 'Stocks',
  'us stock': 'Stocks',
  'us stocks': 'Stocks',
  equity: 'Stocks',
  equities: 'Stocks',
  'us tech': 'Stocks',
  'us blue chip': 'Stocks',
  'indian stock': 'Stocks',
  'indian stocks': 'Stocks',
  international: 'Stocks',
  us: 'Stocks',
  indian: 'Stocks',
  india: 'Stocks',
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

/** Normalizes any raw/legacy DB asset_class into one of the 8 top-level UI classes. */
export function normalizeAssetClass(raw: unknown): string {
  if (!raw) return 'Stocks';
  const str = typeof raw === 'string' ? raw : String(raw);
  return ASSET_CLASS_NORMALIZE_MAP[str.toLowerCase().trim()] ?? str;
}

/** Classifies a stock row into one of the 3 sub-classes inside Stocks: US, Indian, or International. */
export function classifyStockSubClass(
  rawClass: unknown,
  ticker?: unknown
): 'US' | 'Indian' | 'International' {
  const clsLower = typeof rawClass === 'string' ? rawClass.toLowerCase().trim() : '';
  const upperTicker = typeof ticker === 'string' ? ticker.toUpperCase().trim() : '';

  if (
    clsLower === 'indian stock' ||
    clsLower === 'indian stocks' ||
    clsLower === 'indian' ||
    clsLower === 'india' ||
    upperTicker.endsWith('.NS') ||
    upperTicker.endsWith('.BO')
  ) {
    return 'Indian';
  }

  if (
    clsLower === 'international' ||
    (upperTicker.includes('.') && !upperTicker.startsWith('^'))
  ) {
    return 'International';
  }

  return 'US';
}

/** Infers stock sub-class when caller passes a legacy class or sub-class string. */
export function inferStockSubClassFilter(
  rawClass?: string | null,
  explicitSub?: string | null
): StockSubClass {
  const cleanSub = (explicitSub || '').toLowerCase().trim();
  if (cleanSub === 'us') return 'US';
  if (cleanSub === 'indian' || cleanSub === 'india') return 'Indian';
  if (cleanSub === 'international' || cleanSub === 'intl') return 'International';

  const cleanCls = (rawClass || '').toLowerCase().trim();
  if (cleanCls === 'us stock' || cleanCls === 'us stocks' || cleanCls === 'us') return 'US';
  if (cleanCls === 'indian stock' || cleanCls === 'indian stocks' || cleanCls === 'indian') return 'Indian';
  if (cleanCls === 'international') return 'International';

  return 'All';
}

/** Formats human badge text for an asset, preserving sub-class for Stocks. */
export function formatAssetClassBadge(rawClass: unknown, ticker?: unknown, explicitSub?: unknown): string {
  const main = normalizeAssetClass(rawClass);
  if (main !== 'Stocks') return main;
  if (explicitSub === 'US' || explicitSub === 'Indian' || explicitSub === 'International') {
    return `Stocks · ${explicitSub === 'International' ? 'Intl' : explicitSub}`;
  }
  const region = classifyStockSubClass(rawClass, ticker);
  return `Stocks · ${region === 'International' ? 'Intl' : region}`;
}

/** Expands a UI asset class filter (main or sub-class) into matching DB asset_class values. */
export function expandAssetClassFilter(assetClass: string, subClass?: string | null): string[] {
  const main = normalizeAssetClass(assetClass);
  if (main === 'Stocks') {
    const sub = inferStockSubClassFilter(assetClass, subClass);
    if (sub === 'US') return ['US Stock', 'Stock', 'Equity'];
    if (sub === 'Indian') return ['Indian Stock', 'US Stock', 'Stock', 'Equity', 'International'];
    if (sub === 'International') return ['International', 'US Stock', 'Stock', 'Equity'];
    return [...STOCK_DB_CLASSES];
  }
  if (main === 'Crypto') {
    return ['Crypto', 'Cryptocurrency'];
  }
  return [main];
}

interface FilterableQuery<T> {
  in(col: string, vals: readonly string[]): T;
  eq(col: string, val: string): T;
  not(col: string, op: string, val: string): T;
  or(filters: string): T;
}

/** Applies consistent Supabase filtering for unified Stocks + US/Indian/International sub-classes. */
export function applySupabaseAssetClassFilter<T extends FilterableQuery<T>>(
  query: T,
  activeClass?: string | null,
  subClass?: string | null
): T {
  if (!activeClass || activeClass === 'All') return query;

  const main = normalizeAssetClass(activeClass);
  if (main !== 'Stocks') {
    const variants = expandAssetClassFilter(main);
    return variants.length > 1 ? query.in('asset_class', variants) : query.eq('asset_class', variants[0]);
  }

  const sub = inferStockSubClassFilter(activeClass, subClass);
  if (sub === 'US') {
    return query.in('asset_class', ['US Stock', 'Stock', 'Equity']).not('ticker', 'like', '%.%');
  }
  if (sub === 'Indian') {
    return query
      .in('asset_class', ['US Stock', 'Stock', 'Equity', 'Indian Stock', 'International'])
      .or('asset_class.eq.Indian Stock,ticker.like.%.NS,ticker.like.%.BO');
  }
  if (sub === 'International') {
    return query
      .in('asset_class', ['US Stock', 'Stock', 'Equity', 'International'])
      .not('ticker', 'like', '%.NS')
      .not('ticker', 'like', '%.BO')
      .or('asset_class.eq.International,ticker.ilike.%.%');
  }
  return query.in('asset_class', [...STOCK_DB_CLASSES]);
}

/** Converts a stock/asset class + ticker into the regional stress-test key for scenario/portfolio models. */
export function toPortfolioModelClass(assetClass: unknown, ticker?: unknown): string {
  const main = normalizeAssetClass(assetClass);
  if (main !== 'Stocks') return main;
  const sub = classifyStockSubClass(assetClass, ticker);
  if (sub === 'Indian') return 'Indian Stock';
  if (sub === 'International') return 'International';
  return 'Stock';
}

/** Normalizes any stock variant into unified 'Stocks' for leaderboard diversification checks. */
export function toLeaderboardClass(assetClass: unknown): string {
  return normalizeAssetClass(assetClass);
}

/** Infers trading currency code from ticker suffix or asset class. */
export function inferCurrency(ticker: string, assetClass?: string): string {
  if (!ticker) return 'USD';
  const clsLower = typeof assetClass === 'string' ? assetClass.toLowerCase().trim() : '';
  if (clsLower === 'indian stock' || clsLower === 'indian' || ticker.endsWith('.NS') || ticker.endsWith('.BO')) {
    return 'INR';
  }
  if (ticker.endsWith('.T')) return 'JPY';
  if (ticker.endsWith('.KS')) return 'KRW';
  if (ticker.endsWith('.L') || ticker.endsWith('.IL')) return 'GBP';
  if (
    ticker.endsWith('.DE') ||
    ticker.endsWith('.SG') ||
    ticker.endsWith('.F') ||
    ticker.endsWith('.PA') ||
    ticker.endsWith('.AS') ||
    ticker.endsWith('.MI') ||
    ticker.endsWith('.MC') ||
    ticker.endsWith('.BR') ||
    ticker.endsWith('.LS') ||
    ticker.endsWith('.VI') ||
    ticker.endsWith('.HE')
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
  if (ticker.endsWith('.KL')) return 'MYR';
  if (ticker.endsWith('.TW') || ticker.endsWith('.TWO')) return 'TWD';
  if (ticker.endsWith('.SS') || ticker.endsWith('.SZ')) return 'CNY';
  if (ticker.endsWith('.SI')) return 'SGD';
  if (ticker.endsWith('.KQ')) return 'KRW';
  if (ticker.endsWith('.BK')) return 'THB';
  if (ticker.endsWith('.CO')) return 'DKK';
  if (ticker.endsWith('.ST')) return 'SEK';
  if (ticker.endsWith('.OL')) return 'NOK';
  if (ticker.endsWith('.NZ')) return 'NZD';
  return 'USD';
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  INR: '₹',
  GBP: '£',
  EUR: '€',
  JPY: '¥',
  CNY: 'CN¥',
  KRW: '₩',
  HKD: 'HK$',
  TWD: 'NT$',
  CAD: 'C$',
  AUD: 'A$',
  NZD: 'NZ$',
  SGD: 'S$',
  MYR: 'RM',
  THB: '฿',
  CHF: 'CHF ',
  BRL: 'R$',
  MXN: 'MX$',
};

/** Returns display currency symbol for an explicit currency code or ticker/class fallback. */
export function getCurrencySymbol(currencyOrTicker?: string | null, assetClass?: string): string {
  if (normalizeAssetClass(assetClass) === 'Index' || currencyOrTicker === 'PTS') {
    return '';
  }
  if (currencyOrTicker && CURRENCY_SYMBOLS[currencyOrTicker]) {
    return CURRENCY_SYMBOLS[currencyOrTicker];
  }
  if (currencyOrTicker) {
    const inferred = inferCurrency(currencyOrTicker, assetClass);
    return CURRENCY_SYMBOLS[inferred] || '$';
  }
  if (assetClass === 'Indian Stock' || assetClass === 'Indian') return '₹';
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
