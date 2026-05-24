import { Router } from "express";
import {
  generateStockUniverse,
  getStockDetail,
  generateCandles,
  filterStocks,
} from "../lib/stockGenerator";
import {
  ListStocksQueryParams,
  GetStockParams,
  GetStockCandlesParams,
} from "@workspace/api-zod";

const router = Router();

// GET /stocks
router.get("/stocks", (req, res) => {
  const parsed = ListStocksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  const q = parsed.data;
  const stocks = generateStockUniverse();
  const result = filterStocks(stocks, {
    page: q.page ?? 1,
    pageSize: q.pageSize ?? 50,
    search: q.search ?? undefined,
    sector: q.sector ?? undefined,
    exchange: q.exchange ?? undefined,
    minPrice: q.minPrice ?? undefined,
    maxPrice: q.maxPrice ?? undefined,
    minMarketCap: q.minMarketCap ?? undefined,
    maxMarketCap: q.maxMarketCap ?? undefined,
    minPe: q.minPe ?? undefined,
    maxPe: q.maxPe ?? undefined,
    minVolume: q.minVolume ?? undefined,
    maxVolume: q.maxVolume ?? undefined,
    minChangePercent: q.minChangePercent ?? undefined,
    maxChangePercent: q.maxChangePercent ?? undefined,
    minRsi: q.minRsi ?? undefined,
    maxRsi: q.maxRsi ?? undefined,
    sortBy: q.sortBy ?? "marketCap",
    sortOrder: (q.sortOrder as "asc" | "desc") ?? "desc",
  });

  res.json({
    stocks: result.stocks,
    total: result.total,
    page: q.page ?? 1,
    pageSize: q.pageSize ?? 50,
  });
});

// GET /stocks/:ticker
router.get("/stocks/:ticker", (req, res) => {
  const parsed = GetStockParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  const detail = getStockDetail(parsed.data.ticker.toUpperCase());
  if (!detail) {
    res.status(404).json({ error: "Stock not found" });
    return;
  }

  res.json(detail);
});

// GET /stocks/:ticker/candles/:period
router.get("/stocks/:ticker/candles/:period", (req, res) => {
  const parsed = GetStockCandlesParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  const { ticker, period } = parsed.data;
  const stocks = generateStockUniverse();
  const stock = stocks.find(
    (s) => s.ticker === ticker.toUpperCase()
  );

  if (!stock) {
    res.status(404).json({ error: "Stock not found" });
    return;
  }

  const { candles, indicators } = generateCandles(
    ticker.toUpperCase(),
    period,
    stock.price
  );

  res.json({
    ticker: ticker.toUpperCase(),
    period,
    candles,
    indicators,
  });
});

export default router;
