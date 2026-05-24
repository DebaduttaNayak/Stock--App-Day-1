import { Router } from "express";
import { generateStockUniverse } from "../lib/stockGenerator";

const router = Router();

// GET /market/summary
router.get("/market/summary", (_req, res) => {
  const stocks = generateStockUniverse();
  const advancers = stocks.filter((s) => s.changePercent > 0).length;
  const decliners = stocks.filter((s) => s.changePercent < 0).length;
  const unchanged = stocks.length - advancers - decliners;
  const totalVolume = stocks.reduce((acc, s) => acc + s.volume, 0);
  const avgChangePercent =
    stocks.reduce((acc, s) => acc + s.changePercent, 0) / stocks.length;
  const totalMarketCap = stocks.reduce((acc, s) => acc + s.marketCap, 0);

  // Simulate index changes
  const seed = Date.now() % 10000;
  const spyChange = Math.round((avgChangePercent * 0.7 + (seed % 200 - 100) / 1000) * 100) / 100;
  const qqqChange = Math.round((avgChangePercent * 0.9 + (seed % 300 - 150) / 1000) * 100) / 100;
  const diaChange = Math.round((avgChangePercent * 0.6 + (seed % 150 - 75) / 1000) * 100) / 100;

  res.json({
    totalStocks: stocks.length,
    advancers,
    decliners,
    unchanged,
    totalVolume,
    avgChangePercent: Math.round(avgChangePercent * 100) / 100,
    marketCap: totalMarketCap,
    spyChange,
    qqqChange,
    diaChange,
  });
});

// GET /market/sectors
router.get("/market/sectors", (_req, res) => {
  const stocks = generateStockUniverse();

  const sectorMap: Record<string, { change: number; count: number; cap: number }> =
    {};

  for (const s of stocks) {
    if (!sectorMap[s.sector]) {
      sectorMap[s.sector] = { change: 0, count: 0, cap: 0 };
    }
    sectorMap[s.sector].change += s.changePercent;
    sectorMap[s.sector].count += 1;
    sectorMap[s.sector].cap += s.marketCap;
  }

  const sectors = Object.entries(sectorMap).map(([sector, data]) => ({
    sector,
    change: Math.round((data.change / data.count) * 100) / 100,
    stocks: data.count,
    marketCap: data.cap,
  }));

  sectors.sort((a, b) => b.marketCap - a.marketCap);
  res.json(sectors);
});

// GET /market/top-movers
router.get("/market/top-movers", (_req, res) => {
  const stocks = generateStockUniverse();

  const sorted = [...stocks].sort((a, b) => b.changePercent - a.changePercent);
  const gainers = sorted.slice(0, 10);
  const losers = sorted.slice(-10).reverse();
  const mostActive = [...stocks]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 10);

  res.json({ gainers, losers, mostActive });
});

export default router;
