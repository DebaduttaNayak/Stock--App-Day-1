import { logger } from "./logger";

export interface Stock {
  ticker: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  marketCap: number;
  pe: number | null;
  eps: number | null;
  high52w: number;
  low52w: number;
  rsi: number;
  beta: number;
  dividendYield: number | null;
}

export interface StockDetail extends Stock {
  description: string;
  employees: number | null;
  founded: number | null;
  ceo: string;
  website: string;
  revenueGrowth: number | null;
  grossMargin: number | null;
  debtToEquity: number | null;
}

export interface Candle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const SECTORS: Record<string, string[]> = {
  Technology: [
    "Software",
    "Semiconductors",
    "IT Services",
    "Hardware",
    "Internet",
    "Cloud Computing",
    "Cybersecurity",
    "AI & Machine Learning",
  ],
  Healthcare: [
    "Biotechnology",
    "Pharmaceuticals",
    "Medical Devices",
    "Health Services",
    "Diagnostics",
  ],
  "Financial Services": [
    "Banks",
    "Insurance",
    "Asset Management",
    "REITs",
    "Payment Processing",
    "Fintech",
  ],
  "Consumer Discretionary": [
    "E-Commerce",
    "Retail",
    "Automotive",
    "Hotels & Restaurants",
    "Entertainment",
  ],
  "Consumer Staples": [
    "Food & Beverage",
    "Household Products",
    "Personal Care",
    "Tobacco",
  ],
  Energy: [
    "Oil & Gas",
    "Renewables",
    "Utilities",
    "Coal",
    "LNG",
  ],
  Industrials: [
    "Aerospace & Defense",
    "Construction",
    "Logistics",
    "Manufacturing",
    "Engineering",
  ],
  Materials: [
    "Chemicals",
    "Mining",
    "Steel",
    "Paper & Packaging",
  ],
  "Communication Services": [
    "Telecom",
    "Media",
    "Social Media",
    "Streaming",
    "Gaming",
  ],
  "Real Estate": [
    "Commercial",
    "Residential",
    "Industrial REIT",
    "Healthcare REIT",
  ],
  Utilities: [
    "Electric Utilities",
    "Gas Utilities",
    "Water Utilities",
    "Renewable Energy",
  ],
};

const EXCHANGES = ["NYSE", "NASDAQ", "AMEX", "CBOE"];

const COMPANY_PREFIXES = [
  "Alpha", "Beta", "Apex", "Nexus", "Summit", "Peak", "Global", "United",
  "American", "National", "Premier", "Advanced", "Quantum", "Digital", "Smart",
  "Prime", "Elite", "Core", "Vertex", "Zenith", "Vanguard", "Titan", "Atlas",
  "Orion", "Nova", "Stellar", "Fusion", "Vector", "Synergy", "Momentum",
  "Horizon", "Catalyst", "Meridian", "Pinnacle", "Dynamic", "Patriot",
  "Eagle", "Liberty", "Frontier", "Heritage", "Pioneer", "First", "Pacific",
  "Atlantic", "Continental", "Imperial", "Sovereign", "Strategic", "Integral",
  "Precision", "Radiant", "Velocity", "Benchmark", "Visionary", "Legacy",
];

const COMPANY_SUFFIXES = [
  "Corp", "Inc", "Holdings", "Group", "Systems", "Solutions", "Technologies",
  "Industries", "Enterprises", "Partners", "Capital", "Resources", "Services",
  "Networks", "Communications", "Laboratories", "Sciences", "Dynamics",
  "Financial", "Healthcare", "Energy", "Media", "Ventures", "International",
  "Innovations", "Analytics", "Data", "Platforms", "Software", "Semiconductor",
];

const CEOS = [
  "James Anderson", "Sarah Chen", "Michael Torres", "Emily Rodriguez",
  "David Kim", "Jessica Park", "Robert Williams", "Amanda Foster",
  "Christopher Lee", "Patricia Davis", "Thomas Martinez", "Lauren Johnson",
  "Daniel Garcia", "Rebecca Thompson", "Kevin Mitchell", "Michelle Brown",
  "Brian Wilson", "Nicole Taylor", "Andrew White", "Stephanie Harris",
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function rng(seed: number, min: number, max: number): number {
  const r = seededRandom(seed);
  return min + r() * (max - min);
}

function generateTicker(index: number): string {
  const rnd = seededRandom(index * 7919);
  const len = rnd() < 0.4 ? 3 : rnd() < 0.7 ? 4 : 2;
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let ticker = "";
  for (let i = 0; i < len; i++) {
    const r2 = seededRandom(index * 7919 + i * 1301);
    ticker += chars[Math.floor(r2() * chars.length)];
  }
  return ticker;
}

let stockUniverse: Stock[] | null = null;
let stockDetailMap: Map<string, StockDetail> | null = null;

export function generateStockUniverse(count = 5200): Stock[] {
  if (stockUniverse) return stockUniverse;

  logger.info({ count }, "Generating stock universe");

  const sectors = Object.keys(SECTORS);
  const stocks: Stock[] = [];
  const tickerSet = new Set<string>();

  for (let i = 0; i < count; i++) {
    const sectorIndex = Math.floor(rng(i * 131, 0, sectors.length));
    const sector = sectors[sectorIndex];
    const industries = SECTORS[sector];
    const industryIndex = Math.floor(rng(i * 97, 0, industries.length));
    const industry = industries[industryIndex];

    const prefixIdx = Math.floor(rng(i * 53, 0, COMPANY_PREFIXES.length));
    const suffixIdx = Math.floor(rng(i * 71, 0, COMPANY_SUFFIXES.length));
    const companyName = `${COMPANY_PREFIXES[prefixIdx]} ${COMPANY_SUFFIXES[suffixIdx]}`;

    let ticker = generateTicker(i);
    let attempt = 0;
    while (tickerSet.has(ticker) && attempt < 10) {
      ticker = generateTicker(i * 13 + attempt);
      attempt++;
    }
    if (tickerSet.has(ticker)) ticker = ticker + String(i % 10);
    tickerSet.add(ticker);

    const exchangeIdx = Math.floor(rng(i * 43, 0, EXCHANGES.length));
    const exchange = EXCHANGES[exchangeIdx];

    // Price: spread across cap tiers realistically
    const capTier = rng(i * 29, 0, 1);
    let price: number;
    let marketCap: number;

    if (capTier < 0.05) {
      // Mega cap
      price = rng(i * 17, 100, 800);
      marketCap = rng(i * 23, 500e9, 3000e9);
    } else if (capTier < 0.2) {
      // Large cap
      price = rng(i * 17, 30, 400);
      marketCap = rng(i * 23, 10e9, 500e9);
    } else if (capTier < 0.5) {
      // Mid cap
      price = rng(i * 17, 10, 150);
      marketCap = rng(i * 23, 2e9, 10e9);
    } else if (capTier < 0.8) {
      // Small cap
      price = rng(i * 17, 2, 50);
      marketCap = rng(i * 23, 300e6, 2e9);
    } else {
      // Micro cap
      price = rng(i * 17, 0.5, 10);
      marketCap = rng(i * 23, 10e6, 300e6);
    }

    price = Math.round(price * 100) / 100;

    const changePercent = rng(i * 61, -15, 15) * (rng(i * 67, 0, 1) < 0.5 ? 1 : -1);
    const change = Math.round((price * changePercent) / 100 * 100) / 100;

    const avgVolume = Math.round(rng(i * 37, 50000, 50000000));
    const volume = Math.round(avgVolume * rng(i * 41, 0.3, 3.0));

    const pe = rng(i * 47, 0, 1) < 0.15 ? null : Math.round(rng(i * 47, 5, 80) * 10) / 10;
    const eps = pe ? Math.round((price / pe) * 100) / 100 : null;

    const high52w = Math.round(price * rng(i * 59, 1.05, 1.8) * 100) / 100;
    const low52w = Math.round(price * rng(i * 79, 0.4, 0.95) * 100) / 100;

    const rsi = Math.round(rng(i * 83, 15, 85) * 10) / 10;
    const beta = Math.round(rng(i * 89, 0.1, 2.5) * 100) / 100;

    const hasDividend = rng(i * 101, 0, 1) < 0.35;
    const dividendYield = hasDividend ? Math.round(rng(i * 103, 0.5, 8.0) * 100) / 100 : null;

    stocks.push({
      ticker,
      name: companyName,
      exchange,
      sector,
      industry,
      price,
      change,
      changePercent: Math.round(changePercent * 100) / 100,
      volume,
      avgVolume,
      marketCap,
      pe,
      eps,
      high52w,
      low52w,
      rsi,
      beta,
      dividendYield,
    });
  }

  stockUniverse = stocks;
  logger.info({ generated: stocks.length }, "Stock universe ready");
  return stocks;
}

export function getStockDetail(ticker: string): StockDetail | null {
  if (!stockDetailMap) {
    stockDetailMap = new Map();
  }

  if (stockDetailMap.has(ticker)) {
    return stockDetailMap.get(ticker)!;
  }

  const stocks = generateStockUniverse();
  const stock = stocks.find((s) => s.ticker === ticker);
  if (!stock) return null;

  const idx = stocks.indexOf(stock);
  const ceoIdx = Math.floor(rng(idx * 107, 0, CEOS.length));

  const detail: StockDetail = {
    ...stock,
    description: `${stock.name} operates in the ${stock.sector} sector, specifically in ${stock.industry}. The company delivers innovative solutions and services to its customers across global markets, maintaining strong operational excellence and strategic positioning.`,
    employees: Math.round(rng(idx * 109, 50, 500000)),
    founded: Math.round(rng(idx * 113, 1920, 2020)),
    ceo: CEOS[ceoIdx],
    website: `https://www.${stock.name.toLowerCase().replace(/[^a-z]/g, "")}.com`,
    revenueGrowth: Math.round(rng(idx * 127, -30, 60) * 10) / 10,
    grossMargin: Math.round(rng(idx * 131, 5, 80) * 10) / 10,
    debtToEquity: Math.round(rng(idx * 137, 0, 5) * 100) / 100,
  };

  stockDetailMap.set(ticker, detail);
  return detail;
}

export function generateCandles(
  ticker: string,
  period: string,
  basePrice: number
): { candles: Candle[]; indicators: Record<string, (number | null)[]> } {
  const periodDays: Record<string, number> = {
    "1d": 1,
    "5d": 5,
    "1m": 22,
    "3m": 66,
    "6m": 132,
    "1y": 252,
    "2y": 504,
    "5y": 1260,
  };

  const days = periodDays[period] ?? 66;
  const seed = ticker.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rnd = seededRandom(seed * 1000);

  const candles: Candle[] = [];
  let price = basePrice * 0.7;
  const volatility = 0.02 + rnd() * 0.03;

  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Skip weekends
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue;

    const drift = (rnd() - 0.48) * volatility;
    const open = price;
    price = price * (1 + drift);
    const high = Math.max(open, price) * (1 + rnd() * 0.01);
    const low = Math.min(open, price) * (1 - rnd() * 0.01);
    const close = price;
    const volume = Math.round(500000 + rnd() * 10000000);

    candles.push({
      timestamp: date.toISOString(),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });
  }

  // Compute indicators
  const closes = candles.map((c) => c.close);
  const volumes = candles.map((c) => c.volume);

  const sma = (arr: number[], n: number): (number | null)[] =>
    arr.map((_, i) =>
      i < n - 1
        ? null
        : Math.round(
            (arr.slice(i - n + 1, i + 1).reduce((a, b) => a + b, 0) / n) * 100
          ) / 100
    );

  const ema = (arr: number[], n: number): (number | null)[] => {
    const result: (number | null)[] = Array(arr.length).fill(null);
    const k = 2 / (n + 1);
    let prev: number | null = null;
    for (let i = 0; i < arr.length; i++) {
      if (i < n - 1) {
        result[i] = null;
      } else if (i === n - 1) {
        prev = arr.slice(0, n).reduce((a, b) => a + b, 0) / n;
        result[i] = Math.round(prev * 100) / 100;
      } else {
        prev = arr[i] * k + prev! * (1 - k);
        result[i] = Math.round(prev * 100) / 100;
      }
    }
    return result;
  };

  const sma20 = sma(closes, 20);
  const sma50 = sma(closes, 50);
  const ema20 = ema(closes, 20);

  // Bollinger Bands (20-period, 2 std)
  const bbMiddle = sma20;
  const bbUpper: (number | null)[] = [];
  const bbLower: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < 19) {
      bbUpper.push(null);
      bbLower.push(null);
    } else {
      const slice = closes.slice(i - 19, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / 20;
      const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / 20;
      const std = Math.sqrt(variance);
      bbUpper.push(Math.round((mean + 2 * std) * 100) / 100);
      bbLower.push(Math.round((mean - 2 * std) * 100) / 100);
    }
  }

  // RSI (14-period)
  const rsiArr: (number | null)[] = Array(closes.length).fill(null);
  if (closes.length >= 15) {
    let gains = 0;
    let losses = 0;
    for (let i = 1; i <= 14; i++) {
      const d = closes[i] - closes[i - 1];
      if (d > 0) gains += d;
      else losses += -d;
    }
    let avgGain = gains / 14;
    let avgLoss = losses / 14;
    for (let i = 14; i < closes.length; i++) {
      const d = closes[i] - closes[i - 1];
      const gain = d > 0 ? d : 0;
      const loss = d < 0 ? -d : 0;
      avgGain = (avgGain * 13 + gain) / 14;
      avgLoss = (avgLoss * 13 + loss) / 14;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsiArr[i] = Math.round((100 - 100 / (1 + rs)) * 10) / 10;
    }
  }

  // MACD (12, 26, 9)
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine: (number | null)[] = ema12.map((v, i) =>
    v !== null && ema26[i] !== null
      ? Math.round((v - ema26[i]!) * 100) / 100
      : null
  );

  const macdValues = macdLine.filter((v) => v !== null) as number[];
  const macdSignalRaw = ema(macdValues, 9);
  const macdOffset = macdLine.findIndex((v) => v !== null);
  const macdSignal: (number | null)[] = Array(macdLine.length).fill(null);
  const macdHistogram: (number | null)[] = Array(macdLine.length).fill(null);
  for (let i = 0; i < macdSignalRaw.length; i++) {
    const idx = macdOffset + i;
    if (idx < macdLine.length) {
      macdSignal[idx] = macdSignalRaw[i];
      if (macdSignalRaw[i] !== null && macdLine[idx] !== null) {
        macdHistogram[idx] =
          Math.round((macdLine[idx]! - macdSignalRaw[i]!) * 100) / 100;
      }
    }
  }

  return {
    candles,
    indicators: {
      sma20,
      sma50,
      ema20,
      bbUpper,
      bbMiddle,
      bbLower,
      rsi: rsiArr,
      macd: macdLine,
      macdSignal,
      macdHistogram,
      volume: volumes,
    },
  };
}

export type FilterParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  sector?: string;
  exchange?: string;
  minPrice?: number;
  maxPrice?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  minPe?: number;
  maxPe?: number;
  minVolume?: number;
  maxVolume?: number;
  minChangePercent?: number;
  maxChangePercent?: number;
  minRsi?: number;
  maxRsi?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export function filterStocks(
  stocks: Stock[],
  params: FilterParams
): { stocks: Stock[]; total: number } {
  const {
    page = 1,
    pageSize = 50,
    search,
    sector,
    exchange,
    minPrice,
    maxPrice,
    minMarketCap,
    maxMarketCap,
    minPe,
    maxPe,
    minVolume,
    maxVolume,
    minChangePercent,
    maxChangePercent,
    minRsi,
    maxRsi,
    sortBy = "marketCap",
    sortOrder = "desc",
  } = params;

  let filtered = stocks;

  if (search) {
    const q = search.toUpperCase();
    filtered = filtered.filter(
      (s) => s.ticker.includes(q) || s.name.toUpperCase().includes(q)
    );
  }

  if (sector) filtered = filtered.filter((s) => s.sector === sector);
  if (exchange) filtered = filtered.filter((s) => s.exchange === exchange);
  if (minPrice !== undefined) filtered = filtered.filter((s) => s.price >= minPrice);
  if (maxPrice !== undefined) filtered = filtered.filter((s) => s.price <= maxPrice);
  if (minMarketCap !== undefined) filtered = filtered.filter((s) => s.marketCap >= minMarketCap);
  if (maxMarketCap !== undefined) filtered = filtered.filter((s) => s.marketCap <= maxMarketCap);
  if (minPe !== undefined) filtered = filtered.filter((s) => s.pe !== null && s.pe >= minPe);
  if (maxPe !== undefined) filtered = filtered.filter((s) => s.pe !== null && s.pe <= maxPe);
  if (minVolume !== undefined) filtered = filtered.filter((s) => s.volume >= minVolume);
  if (maxVolume !== undefined) filtered = filtered.filter((s) => s.volume <= maxVolume);
  if (minChangePercent !== undefined) filtered = filtered.filter((s) => s.changePercent >= minChangePercent);
  if (maxChangePercent !== undefined) filtered = filtered.filter((s) => s.changePercent <= maxChangePercent);
  if (minRsi !== undefined) filtered = filtered.filter((s) => s.rsi >= minRsi);
  if (maxRsi !== undefined) filtered = filtered.filter((s) => s.rsi <= maxRsi);

  // Sort
  const validSortKeys = [
    "ticker", "name", "price", "changePercent", "volume",
    "marketCap", "pe", "rsi", "beta", "high52w", "low52w",
  ];
  const key = validSortKeys.includes(sortBy) ? sortBy : "marketCap";

  filtered.sort((a, b) => {
    const aVal = (a as unknown as Record<string, unknown>)[key] ?? 0;
    const bVal = (b as unknown as Record<string, unknown>)[key] ?? 0;
    const numA = typeof aVal === "number" ? aVal : String(aVal).charCodeAt(0);
    const numB = typeof bVal === "number" ? bVal : String(bVal).charCodeAt(0);
    return sortOrder === "asc" ? numA - numB : numB - numA;
  });

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return { stocks: paginated, total };
}
