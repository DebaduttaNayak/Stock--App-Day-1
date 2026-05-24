import { useMemo, useState } from "react";
import {
  useListStocks,
  getListStocksQueryKey,
  type ListStocksParams,
} from "@workspace/api-client-react";
import { useScreenerStore } from "@/store/useScreenerStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { MarketSummaryBar } from "@/components/MarketSummaryBar";
import { FilterPanel } from "@/components/FilterPanel";
import { StockTable } from "@/components/StockTable";
import { WatchlistPanel } from "@/components/WatchlistPanel";
import { SlidersHorizontal, RefreshCw, Star } from "lucide-react";

export default function Screener() {
  const [filterOpen, setFilterOpen] = useState(true);
  const filters = useScreenerStore((s) => s.filters);
  const sort = useScreenerStore((s) => s.sort);
  const activeFilterCount = useScreenerStore((s) => s.activeFilterCount);
  const watchlist = useScreenerStore((s) => s.watchlist);
  const watchlistOpen = useScreenerStore((s) => s.watchlistOpen);
  const setWatchlistOpen = useScreenerStore((s) => s.setWatchlistOpen);

  const watchlistCount = Object.keys(watchlist).length;

  // Subscribe all watchlisted tickers to WebSocket for live updates
  const watchlistTickers = useMemo(() => Object.keys(watchlist), [watchlist]);
  useWebSocket(watchlistTickers.length > 0 ? watchlistTickers : undefined);

  // Build query params — fetch large page to enable client-side virtual scrolling
  const params = useMemo<ListStocksParams>(() => {
    const p: ListStocksParams = {
      page: 1,
      pageSize: 5200,
      sortBy: sort.sortBy,
      sortOrder: sort.sortOrder,
    };
    if (filters.search) p.search = filters.search;
    if (filters.sector) p.sector = filters.sector;
    if (filters.exchange) p.exchange = filters.exchange;
    if (filters.minPrice) p.minPrice = Number(filters.minPrice);
    if (filters.maxPrice) p.maxPrice = Number(filters.maxPrice);
    if (filters.minMarketCap) p.minMarketCap = Number(filters.minMarketCap);
    if (filters.maxMarketCap) p.maxMarketCap = Number(filters.maxMarketCap);
    if (filters.minPe) p.minPe = Number(filters.minPe);
    if (filters.maxPe) p.maxPe = Number(filters.maxPe);
    if (filters.minVolume) p.minVolume = Number(filters.minVolume);
    if (filters.maxVolume) p.maxVolume = Number(filters.maxVolume);
    if (filters.minChangePercent) p.minChangePercent = Number(filters.minChangePercent);
    if (filters.maxChangePercent) p.maxChangePercent = Number(filters.maxChangePercent);
    if (filters.minRsi) p.minRsi = Number(filters.minRsi);
    if (filters.maxRsi) p.maxRsi = Number(filters.maxRsi);
    return p;
  }, [filters, sort]);

  const { data, isLoading, isError, error, refetch } = useListStocks(params, {
    query: {
      queryKey: getListStocksQueryKey(params),
      retry: false,
    },
  });

  const stocks = data?.stocks ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Market summary bar */}
      <MarketSummaryBar />

      {/* Top toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card shrink-0">
        <h1 className="text-sm font-bold text-foreground tracking-tight mr-2">
          Stock Screener
        </h1>

        <button
          data-testid="button-toggle-filters"
          onClick={() => setFilterOpen((o) => !o)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
            filterOpen
              ? "bg-primary/10 border-primary/30 text-primary"
              : "bg-muted border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <SlidersHorizontal className="w-3 h-3" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        <button
          data-testid="button-refresh"
          onClick={() => refetch()}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-muted-foreground hover:text-foreground border border-border hover:border-primary/30 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>

        {/* Watchlist toggle */}
        <button
          data-testid="button-toggle-watchlist"
          onClick={() => setWatchlistOpen(!watchlistOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border transition-colors ml-auto ${
            watchlistOpen
              ? "bg-amber-400/10 border-amber-400/30 text-amber-400"
              : "bg-muted border-border text-muted-foreground hover:text-amber-400 hover:border-amber-400/30"
          }`}
        >
          <Star
            className="w-3 h-3"
            fill={watchlistOpen ? "currentColor" : "none"}
          />
          Watchlist
          {watchlistCount > 0 && (
            <span
              className={`text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ${
                watchlistOpen
                  ? "bg-amber-400 text-background"
                  : "bg-muted-foreground/30 text-foreground"
              }`}
            >
              {watchlistCount}
            </span>
          )}
        </button>

        <div className="text-[10px] text-muted-foreground font-mono">
          {isLoading ? (
            <span className="text-primary animate-pulse">Fetching...</span>
          ) : (
            <span>
              <span className="text-foreground tabular-nums">{total.toLocaleString()}</span>{" "}
              results
            </span>
          )}
        </div>
      </div>

      {isError && (
        <div className="px-3 py-2 border-b border-red-300 bg-red-500/10 text-red-700 text-sm">
          Unable to load stocks. {error instanceof Error ? error.message : String(error)}
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Filter panel */}
        <FilterPanel isOpen={filterOpen} onClose={() => setFilterOpen(false)} />

        {/* Table */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <StockTable stocks={stocks} total={total} isLoading={isLoading} />
        </div>

        {/* Watchlist panel */}
        {watchlistOpen && (
          <WatchlistPanel onClose={() => setWatchlistOpen(false)} />
        )}
      </div>
    </div>
  );
}
