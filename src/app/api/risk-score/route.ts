export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import YahooFinance from 'yahoo-finance2';
import { getSupabaseUrl, getSupabaseServiceKey } from '@/lib/supabase-config';
import {
  classifyStockSubClass,
  inferCurrency,
  normalizeAssetClass,
  normalizeDividendYieldPct,
  pickCanonicalAssetRow,
} from '@/lib/asset-utils';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

const FX_TO_USD_DIVISOR: Record<string, number> = {
  USD: 1,
  INR: 85,
  JPY: 150,
  KRW: 1400,
  HKD: 7.8,
  TWD: 32,
  CNY: 7.2,
  SGD: 1.35,
  MYR: 4.4,
  THB: 34,
  IDR: 16000,
  BRL: 5.8,
  MXN: 20,
  ARS: 1000,
  GBP: 0.79,
  EUR: 0.92,
  CAD: 1.4,
  AUD: 1.54,
  NZD: 1.7,
  CHF: 0.88,
  DKK: 6.9,
  SEK: 10.8,
  NOK: 11,
};

const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseServiceKey()
);

function scoreAsset(r: any) {
  const assetClass = normalizeAssetClass(r.asset_class);
  const normDy = normalizeDividendYieldPct(r.dividend_yield, r.dividend_rate, r.price);

  // --- 1. SPECIAL CASE: INDEX BENCHMARKS ---
  if (assetClass === 'Index' || r.ticker?.startsWith('^')) {
    const total = 84;
    return {
      total_score: total,
      grade: 'A-',
      breakdown: { earn_score: 20, lose_score: 22, exit_score: 24, value_score: 18 },
      earn_label: 'Benchmark Return',
      lose_label: 'Low Unsystematic Risk',
      exit_label: 'Institutional Liquidity',
      value_label: 'Market Aggregate',
      risks: [
        'Exposed to systemic macroeconomic cycles and central bank monetary tightening',
        'Market-cap weighting creates concentration in top mega-cap constituents',
        'No direct single-stock upside alpha (tracks weighted beta average)'
      ],
      opportunities: [
        'Complete elimination of single-company bankruptcy or fraud risk',
        'Institutional-grade benchmark representing broad economic expansion',
        'Highest structural liquidity with deep global derivative coverage'
      ]
    };
  }

  // --- 2. SPECIAL CASE: COMMODITIES ---
  if (assetClass === 'Commodity') {
    const total = 74;
    return {
      total_score: total,
      grade: 'B',
      breakdown: { earn_score: 18, lose_score: 16, exit_score: 20, value_score: 20 },
      earn_label: 'Cyclical / Spot Drift',
      lose_label: 'Moderate Volatility',
      exit_label: 'Global Market Liquidity',
      value_label: 'Tangible Asset Value',
      risks: [
        'Exposed to supply shocks, geopolitical embargoes, and physical storage dynamics',
        'Generates zero operational cash flow or corporate dividends',
        'Contango / backwardation roll yield decay in derivative contracts'
      ],
      opportunities: [
        'Historically effective hedge against fiat inflation and currency debasement',
        'Low structural correlation to standard corporate equity cycles',
        'Essential industrial or monetary reserve demand'
      ]
    };
  }

  // --- 3. SPECIAL CASE: FOREX ---
  if (assetClass === 'Forex') {
    const total = 78;
    return {
      total_score: total,
      grade: 'B+',
      breakdown: { earn_score: 15, lose_score: 22, exit_score: 25, value_score: 16 },
      earn_label: 'Interest Differential (Carry)',
      lose_label: 'Sovereign Macro Risk',
      exit_label: 'Deepest Global Liquidity',
      value_label: 'Purchasing Power Parity',
      risks: [
        'Subject to central bank monetary policy shifts and unexpected rate decisions',
        'Exposed to sovereign geopolitical events and foreign exchange controls',
        'Leverage risks in standard retail currency positions'
      ],
      opportunities: [
        'Highest daily turnover ($7.5T/day) of any asset class in the world',
        'Zero single-corporation failure or accounting fraud exposure',
        'Clear macro expression of relative sovereign economic performance'
      ]
    };
  }

  // --- 4. SPECIAL CASE: BONDS & FIXED INCOME ---
  if (assetClass === 'Bond') {
    const total = 82;
    return {
      total_score: total,
      grade: 'A-',
      breakdown: { earn_score: 18, lose_score: 24, exit_score: 20, value_score: 20 },
      earn_label: 'Contractual Yield',
      lose_label: 'Low Capital Risk',
      exit_label: 'Institutional Liquidity',
      value_label: 'Fixed Income Value',
      risks: [
        'Interest rate duration risk — bond prices fall when interest rates rise',
        'Inflation risk eroding real purchasing power of fixed coupon payments',
        'Credit spread widening during severe market distress'
      ],
      opportunities: [
        'Seniority in capital structure with contractual coupon income priority',
        'Lower historical drawdown and volatility compared to equities',
        'Defensive flight-to-safety asset during market recessions'
      ]
    };
  }

  // --- 4B. SPECIAL CASE: CRYPTOCURRENCIES ---
  if (assetClass === 'Crypto') {
    const cap = Number(r.market_cap) || 0;
    const price = Number(r.price) || 0;
    const hi52 = Number(r.high_52_week) || 0;
    const lo52 = Number(r.low_52_week) || 0;
    const rangePos = (hi52 > lo52 && price > 0)
      ? Math.max(0, Math.min(1, (price - lo52) / (hi52 - lo52)))
      : 0.5;
    const earn_score = Math.round(8 + rangePos * 17);
    const lose_score = cap > 1e11 ? 14 : cap > 1e10 ? 11 : cap > 1e9 ? 8 : 5;
    const exit_score = cap > 1e11 ? 25 : cap > 1e10 ? 22 : cap > 1e9 ? 16 : cap > 1e8 ? 10 : 5;
    const value_score = cap > 5e10 ? 18 : cap > 5e9 ? 14 : cap > 5e8 ? 10 : 6;
    const total = Math.max(0, Math.min(100, earn_score + lose_score + exit_score + value_score));
    const grade = total >= 80 ? 'A' : total >= 65 ? 'B' : total >= 50 ? 'C' : total >= 35 ? 'D' : 'F';

    const risks = [
      '24/7 digital asset trading carries elevated drawdown and regulatory volatility',
      ...(cap < 1e9 ? ['Lower market capitalization leads to thinner order-book depth'] : []),
    ];
    const opportunities = [
      ...(cap > 1e10 ? ['Large-cap network adoption and deep exchange liquidity'] : ['High asymmetric beta to broader digital-asset cycle']),
      ...(rangePos >= 0.7 && hi52 > 0 ? ['Trading in upper 30% of its 52-week range'] : []),
    ];

    return {
      total_score: total,
      grade,
      breakdown: { earn_score, lose_score, exit_score, value_score },
      earn_label: rangePos >= 0.6 ? 'Positive 52W Trend' : 'Range-Bound Drift',
      lose_label: lose_score >= 12 ? 'Moderate Crypto Risk' : 'High Crypto Risk',
      exit_label: exit_score >= 20 ? 'Deep Exchange Liquidity' : 'Moderate Liquidity',
      value_label: 'Network Scale',
      risks,
      opportunities,
    };
  }

  // --- 4C. SPECIAL CASE: REITs ---
  if (assetClass === 'REIT') {
    const cap = Number(r.market_cap) || 0;
    const beta = Number(r.beta) || 1;
    const earn_score = Math.round(Math.min(25, Math.max(5, (normDy ?? 3) * 2.5 + Math.max(0, (r.revenue_growth || 0) * 40))));
    const lose_score = Math.round(Math.max(4, Math.min(25, 25 - beta * 10)));
    const exit_score = cap > 1e10 ? 22 : cap > 1e9 ? 15 : 8;
    const margin_score = r.profit_margins && r.profit_margins > 0.15 ? 16 : r.profit_margins && r.profit_margins > 0 ? 12 : 8;
    const value_score = Math.min(25, margin_score + (normDy && normDy >= 4 ? 6 : 2));
    const total = Math.max(0, Math.min(100, earn_score + lose_score + exit_score + value_score));
    const grade = total >= 80 ? 'A' : total >= 65 ? 'B' : total >= 50 ? 'C' : total >= 35 ? 'D' : 'F';

    const risks = [
      'Real estate cap rates and refinancing costs remain sensitive to interest rates',
      ...(beta > 1.3 ? ['Above-average share price sensitivity to property cycle shifts'] : []),
    ];
    const opportunities = [
      ...(normDy && normDy > 3 ? [`Real estate income yield of ${normDy.toFixed(1)}%`] : []),
      'Inflation-linked lease cash flows and tangible property backing',
    ];

    return {
      total_score: total,
      grade,
      breakdown: { earn_score, lose_score, exit_score, value_score },
      earn_label: normDy && normDy >= 4 ? 'Income + Property Cash Flow' : 'Moderate REIT Cash Flow',
      lose_label: lose_score >= 16 ? 'Moderate Rate Risk' : 'Higher Leverage Risk',
      exit_label: exit_score >= 15 ? 'Liquid REIT' : 'Mid/Small REIT',
      value_label: 'Income & Asset Backing',
      risks,
      opportunities,
    };
  }

  // --- 5. CORPORATE EQUITIES & ETFS (Default Fundamental Model) ---
  const rev = Math.min(Math.max((r.revenue_growth || 0) * 100, 0), 15);
  const eps = Math.min(Math.max((r.earnings_growth || 0) * 100, 0), 10);
  const earn_score = Math.max(0, Math.min(25, Math.round(rev + eps)));

  // LOSE score (0-25): low beta = safer
  const beta = r.beta || 1;
  const lose_score = Math.round(Math.max(0, Math.min(25, 25 - beta * 12)));

  // EXIT score (0-25): market cap liquidity
  const cap = r.market_cap || 0;
  const exit_score = cap > 1e12 ? 25 : cap > 1e11 ? 20 : cap > 1e10 ? 15 : cap > 1e9 ? 10 : 5;

  // VALUE score (0-25): P/E, profit margins, ROE
  const pe_score = r.pe_ratio && r.pe_ratio > 0 && r.pe_ratio < 15 ? 10 : r.pe_ratio && r.pe_ratio > 0 && r.pe_ratio < 25 ? 7 : r.pe_ratio && r.pe_ratio > 0 && r.pe_ratio < 40 ? 4 : 0;
  const margin_score = r.profit_margins > 0.2 ? 8 : r.profit_margins > 0.1 ? 5 : r.profit_margins > 0 ? 2 : 0;
  const roe_score = r.return_on_equity > 0.2 ? 7 : r.return_on_equity > 0.1 ? 4 : 2;
  const value_score = Math.min(pe_score + margin_score + roe_score, 25);

  const total = Math.max(0, Math.min(100, earn_score + lose_score + exit_score + value_score));
  const grade = total >= 80 ? 'A' : total >= 65 ? 'B' : total >= 50 ? 'C' : total >= 35 ? 'D' : 'F';

  const risks = [];
  if (beta > 1.5) risks.push('High volatility — price swings significantly with market');
  if (r.pe_ratio > 40) risks.push('Expensive valuation — high P/E means limited margin of safety');
  if (r.total_debt > r.total_revenue && r.total_revenue > 0) risks.push('High debt load relative to annual revenue');
  if (r.profit_margins != null && r.profit_margins < 0) risks.push('Negative profit margins — company is operating at a loss');
  if (r.revenue_growth != null && r.revenue_growth < 0) risks.push('Declining revenue — business momentum is contracting');
  if (r.free_cashflow != null && r.free_cashflow < 0) risks.push('Negative free cash flow — net operational cash burn');
  if (cap > 0 && cap < 1e9) risks.push('Small cap profile — lower liquidity, higher bid-ask spreads');

  const opportunities = [];
  if (r.revenue_growth > 0.2) opportunities.push(`Strong top-line revenue growth at ${(Math.min(r.revenue_growth, 5) * 100).toFixed(1)}%`);
  if (normDy != null && normDy > 3) opportunities.push(`Attractive dividend cash yield of ${normDy.toFixed(1)}%`);
  if (r.return_on_equity > 0.2) opportunities.push(`High ROE of ${(Math.min(r.return_on_equity, 5) * 100).toFixed(1)}% — efficient management capital allocation`);
  if (r.pe_ratio && r.pe_ratio > 0 && r.pe_ratio < 15 && r.revenue_growth > 0.05) opportunities.push('Potentially undervalued relative to ongoing business growth');
  if (r.recommendation_mean && r.recommendation_mean < 2) opportunities.push('Strong institutional analyst consensus — overweight / buy rating');
  if (r.target_mean_price && r.price && r.target_mean_price > r.price * 1.15) opportunities.push(`Wall Street consensus price target ${((r.target_mean_price / r.price - 1) * 100).toFixed(0)}% above current market price`);

  return {
    total_score: total,
    grade,
    breakdown: { earn_score, lose_score, exit_score, value_score },
    earn_label: earn_score >= 18 ? 'High Growth' : earn_score >= 10 ? 'Moderate Growth' : 'Low Growth',
    lose_label: lose_score >= 20 ? 'Low Risk' : lose_score >= 12 ? 'Medium Risk' : 'High Risk',
    exit_label: exit_score >= 20 ? 'Very Liquid' : exit_score >= 15 ? 'Liquid' : exit_score >= 10 ? 'Moderate' : 'Illiquid',
    value_label: value_score >= 20 ? 'Strong Value' : value_score >= 12 ? 'Fair Value' : 'Expensive',
    risks,
    opportunities,
  };
}

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const { ticker } = body;
  if (!ticker) return NextResponse.json({ error: 'ticker required' }, { status: 400 });

  if (typeof ticker !== 'string' || !ticker.trim()) {
      return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 });
  }

  const escapedTicker = ticker.trim().replace(/[%_]/g, '\\$&');

  const { data: rows, error } = await supabase
    .from('asset_snapshots')
    .select('*')
    .ilike('ticker', escapedTicker)
    .not('ticker', 'like', 'BOND-%')
    .not('ticker', 'like', 'REIT-%')
    .not('ticker', 'like', 'COMM-%')
    .limit(10);

  const canonical = pickCanonicalAssetRow(rows);
  if (error || !canonical) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

  const normCls = normalizeAssetClass(canonical.asset_class);
  let enriched: Record<string, any> = { ...canonical };

  // Enrich stocks/ETFs/REITs whose DB snapshot lacks fundamentals (e.g. Indian/global stocks),
  // AND refresh live price for non-bond assets so risk headers match live market quotes.
  const needsFundamentalEnrichment =
    (normCls === 'Stocks' || normCls === 'ETF' || normCls === 'REIT') &&
    (enriched.market_cap == null || (enriched.revenue_growth == null && enriched.pe_ratio == null));

  if (needsFundamentalEnrichment || normCls !== 'Bond') {
    try {
      const [quoteRes, summaryRes] = await Promise.allSettled([
        yf.quote(canonical.ticker),
        needsFundamentalEnrichment
          ? yf.quoteSummary(canonical.ticker, { modules: ['price', 'assetProfile', 'financialData', 'defaultKeyStatistics', 'summaryDetail'] })
              .catch(() => yf.quoteSummary(canonical.ticker, { modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail'] }))
          : Promise.resolve(null),
      ]);
      const rawQ: any = quoteRes.status === 'fulfilled' ? quoteRes.value : null;
      const q: any = Array.isArray(rawQ) ? rawQ[0] : rawQ;
      const qs: any = summaryRes.status === 'fulfilled' ? summaryRes.value : null;
      const priceMod = qs?.price;
      const profileMod = qs?.assetProfile;
      const fin = qs?.financialData;
      const stats = qs?.defaultKeyStatistics;
      const detail = qs?.summaryDetail;

      if (q || qs) {
        const livePrice = q?.regularMarketPrice ?? priceMod?.regularMarketPrice ?? enriched.price;
        const rawCurr = (q?.currency || priceMod?.currency || fin?.financialCurrency || inferCurrency(canonical.ticker, canonical.asset_class)).toUpperCase();
        const fxDiv = FX_TO_USD_DIVISOR[rawCurr] || 1;
        const revImpliedShares =
          fin?.totalRevenue > 0 && fin?.revenuePerShare > 0
            ? fin.totalRevenue / fin.revenuePerShare
            : null;
        const sharesOut =
          stats?.sharesOutstanding ??
          stats?.impliedSharesOutstanding ??
          q?.sharesOutstanding ??
          revImpliedShares;
        const evImpliedCap =
          stats?.enterpriseValue && stats.enterpriseValue > 0
            ? Math.max(0, stats.enterpriseValue - (fin?.totalDebt || 0) + (fin?.totalCash || 0))
            : null;
        const rawCap =
          q?.marketCap ??
          priceMod?.marketCap ??
          detail?.marketCap ??
          (sharesOut && livePrice ? sharesOut * livePrice : null) ??
          evImpliedCap;
        const usdCap = rawCap && rawCap > 0 ? Math.round(rawCap / fxDiv) : enriched.market_cap;

        enriched = {
          ...enriched,
          price: livePrice,
          sector: enriched.sector ?? profileMod?.sector ?? null,
          industry: enriched.industry ?? profileMod?.industry ?? null,
          market_cap: (enriched.market_cap && enriched.market_cap > 0) ? enriched.market_cap : usdCap,
          pe_ratio: enriched.pe_ratio ?? q?.trailingPE ?? detail?.trailingPE ?? null,
          forward_pe: enriched.forward_pe ?? q?.forwardPE ?? detail?.forwardPE ?? null,
          beta: enriched.beta ?? q?.beta ?? stats?.beta ?? detail?.beta ?? null,
          dividend_yield: enriched.dividend_yield ?? (q?.trailingAnnualDividendYield != null ? q.trailingAnnualDividendYield * 100 : null),
          high_52_week: (enriched.high_52_week && livePrice)
            ? Math.max(enriched.high_52_week, q?.fiftyTwoWeekHigh ?? 0, livePrice)
            : (enriched.high_52_week ?? q?.fiftyTwoWeekHigh ?? detail?.fiftyTwoWeekHigh ?? null),
          low_52_week: (enriched.low_52_week && enriched.low_52_week > 0 && livePrice > 0)
            ? Math.min(enriched.low_52_week, ...(q?.fiftyTwoWeekLow > 0 ? [q.fiftyTwoWeekLow] : []), livePrice)
            : (enriched.low_52_week ?? q?.fiftyTwoWeekLow ?? detail?.fiftyTwoWeekLow ?? null),
          revenue_growth: enriched.revenue_growth ?? fin?.revenueGrowth ?? null,
          earnings_growth: enriched.earnings_growth ?? fin?.earningsGrowth ?? null,
          profit_margins: enriched.profit_margins ?? fin?.profitMargins ?? null,
          return_on_equity: enriched.return_on_equity ?? fin?.returnOnEquity ?? null,
          total_revenue: enriched.total_revenue ?? fin?.totalRevenue ?? null,
          total_debt: enriched.total_debt ?? fin?.totalDebt ?? null,
          free_cashflow: enriched.free_cashflow ?? fin?.freeCashflow ?? null,
          recommendation_mean: enriched.recommendation_mean ?? fin?.recommendationMean ?? null,
          target_mean_price: enriched.target_mean_price ?? fin?.targetMeanPrice ?? null,
        };
      }
    } catch {
      // Keep snapshot data on Yahoo transient failure
    }
  }

  const normalizedAsset = {
    ...enriched,
    asset_class: normCls,
    sub_class: normCls === 'Stocks' ? classifyStockSubClass(canonical.asset_class, canonical.ticker) : undefined,
    dividend_yield: normalizeDividendYieldPct(enriched.dividend_yield, enriched.dividend_rate, enriched.price),
  };

  const score = scoreAsset(normalizedAsset);

  return NextResponse.json({ asset: normalizedAsset, score });
}
