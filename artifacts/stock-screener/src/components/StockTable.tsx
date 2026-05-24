import { useRef, useMemo, useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useLocation } from "wouter";
import { useScreenerStore } from "@/store/useScreenerStore";
import {
  formatPrice,
  formatPercent,
  formatLargeNumber,
  formatVolume,
  formatPe,
  formatRsi,
  changeColor,
  rsiColor,
} from "@/lib/format";
import type { Stock } from "@workspace/api-client-react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Star } from "lucide-react";

const ROW_HEIGHT = 34;

type FlashState = Record<string, "green" | "red">;

interface StockTableProps {
  stocks: Stock[];
  total: number;
  isLoading: boolean;
}

function SortIcon({ column }: { column: string }) {
  const sort = useScreenerStore((s) => s.sort);
  if (sort.sortBy !== column)
    return <ChevronsUpDown className="w-3 h-3 text-muted-foreground/40 ml-0.5" />;
  return sort.sortOrder === "asc" ? (
    <ChevronUp className="w-3 h-3 text-primary ml-0.5" />
  ) : (
    <ChevronDown className="w-3 h-3 text-primary ml-0.5" />
  );
}

export function StockTable({ stocks, total, isLoading }: StockTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const toggleSort = useScreenerStore((s) => s.toggleSort);
  const livePrices = useScreenerStore((s) => s.livePrices);
  const watchlist = useScreenerStore((s) => s.watchlist);
  const toggleWatchlist = useScreenerStore((s) => s.toggleWatchlist);
  const [flashState, setFlashState] = useState<FlashState>({});
  const prevPricesRef = useRef<Record<string, number>>({});

  // Track flash on live price changes
  useEffect(() => {
    const newFlash: FlashState = {};
    for (const [ticker, lp] of Object.entries(livePrices)) {
      const prev = prevPricesRef.current[ticker];
      if (prev !== undefined && prev !== lp.price) {
        newFlash[ticker] = lp.price > prev ? "green" : "red";
      }
      prevPricesRef.current[ticker] = lp.price;
    }
    if (Object.keys(newFlash).length > 0) {
      setFlashState((prev) => ({ ...prev, ...newFlash }));
      setTimeout(() => {
        setFlashState((prev) => {
          const next = { ...prev };
          for (const t of Object.keys(newFlash)) delete next[t];
          return next;
        });
      }, 800);
    }
  }, [livePrices]);

  const columns = useMemo<ColumnDef<Stock>[]>(
    () => [
      // Star / watchlist toggle
      {
        id: "watch",
        header: "",
        size: 32,
        cell: ({ row }) => {
          const s = row.original;
          const isWatched = !!watchlist[s.ticker];
          const livePrice = livePrices[s.ticker];
          return (
            <button
              data-testid={`button-watch-${s.ticker}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleWatchlist({
                  ticker: s.ticker,
                  name: s.name,
                  exchange: s.exchange,
                  sector: s.sector,
                  addedPrice: livePrice?.price ?? s.price,
                  addedAt: Date.now(),
                });
              }}
              className={`w-5 h-5 flex items-center justify-center rounded transition-all hover:scale-110 ${
                isWatched
                  ? "text-amber-400"
                  : "text-muted-foreground/30 hover:text-amber-400/70"
              }`}
              title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
            >
              <Star
                className="w-3 h-3"
                fill={isWatched ? "currentColor" : "none"}
              />
            </button>
          );
        },
      },
      {
        id: "ticker",
        header: "Ticker",
        accessorKey: "ticker",
        size: 72,
        cell: ({ row }) => {
          const ticker = row.original.ticker;
          // eslint-disable-next-line react-hooks/rules-of-hooks
          const [, navigate] = useLocation();
          return (
            <button
              data-testid={`link-ticker-${ticker}`}
              onClick={() => navigate(`/stocks/${ticker}`)}
              className="font-mono font-semibold text-primary hover:text-blue-300 transition-colors text-xs tracking-wider"
            >
              {ticker}
            </button>
          );
        },
      },
      {
        id: "name",
        header: "Company",
        accessorKey: "name",
        size: 160,
        cell: ({ getValue }) => (
          <span className="text-xs text-foreground truncate block max-w-[160px]">
            {getValue() as string}
          </span>
        ),
      },
      {
        id: "price",
        header: "Price",
        accessorKey: "price",
        size: 80,
        cell: ({ row }) => {
          const live = livePrices[row.original.ticker];
          const price = live?.price ?? row.original.price;
          return (
            <span className="tabular-nums text-xs text-foreground font-semibold">
              ${formatPrice(price)}
            </span>
          );
        },
      },
      {
        id: "changePercent",
        header: "Chg%",
        accessorKey: "changePercent",
        size: 72,
        cell: ({ row }) => {
          const live = livePrices[row.original.ticker];
          const pct = live?.changePercent ?? row.original.changePercent;
          return (
            <span className={`tabular-nums text-xs font-semibold ${changeColor(pct)}`}>
              {formatPercent(pct)}
            </span>
          );
        },
      },
      {
        id: "volume",
        header: "Volume",
        accessorKey: "volume",
        size: 80,
        cell: ({ row }) => {
          const live = livePrices[row.original.ticker];
          const vol = live?.volume ?? row.original.volume;
          const ratio = Math.min(vol / (row.original.avgVolume * 3), 1);
          return (
            <div
              className="volume-bar-cell tabular-nums text-xs text-foreground/80"
              style={{ "--volume-ratio": `${Math.round(ratio * 100)}%` } as React.CSSProperties}
            >
              {formatVolume(vol)}
            </div>
          );
        },
      },
      {
        id: "marketCap",
        header: "Mkt Cap",
        accessorKey: "marketCap",
        size: 88,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-xs text-foreground/80">
            {formatLargeNumber(getValue() as number)}
          </span>
        ),
      },
      {
        id: "pe",
        header: "P/E",
        accessorKey: "pe",
        size: 56,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-xs text-foreground/70">
            {formatPe(getValue() as number | null)}
          </span>
        ),
      },
      {
        id: "rsi",
        header: "RSI",
        accessorKey: "rsi",
        size: 52,
        cell: ({ getValue }) => {
          const val = getValue() as number;
          return (
            <span className={`tabular-nums text-xs font-semibold ${rsiColor(val)}`}>
              {formatRsi(val)}
            </span>
          );
        },
      },
      {
        id: "high52w",
        header: "52W Hi",
        accessorKey: "high52w",
        size: 72,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-xs text-emerald-400/70">
            ${formatPrice(getValue() as number)}
          </span>
        ),
      },
      {
        id: "low52w",
        header: "52W Lo",
        accessorKey: "low52w",
        size: 72,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-xs text-red-400/70">
            ${formatPrice(getValue() as number)}
          </span>
        ),
      },
      {
        id: "beta",
        header: "Beta",
        accessorKey: "beta",
        size: 52,
        cell: ({ getValue }) => (
          <span className="tabular-nums text-xs text-foreground/60">
            {(getValue() as number).toFixed(2)}
          </span>
        ),
      },
      {
        id: "exchange",
        header: "Exch",
        accessorKey: "exchange",
        size: 60,
        cell: ({ getValue }) => (
          <span className="text-[10px] font-semibold text-muted-foreground tracking-wider">
            {getValue() as string}
          </span>
        ),
      },
      {
        id: "sector",
        header: "Sector",
        accessorKey: "sector",
        size: 140,
        cell: ({ getValue }) => (
          <span className="text-[10px] text-muted-foreground truncate block max-w-[140px]">
            {getValue() as string}
          </span>
        ),
      },
    ],
    [livePrices, watchlist, toggleWatchlist]
  );

  const [sorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: stocks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    state: { sorting },
    columnResizeMode: "onChange",
  });

  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 20,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - virtualRows[virtualRows.length - 1].end
      : 0;

  const headerGroups = table.getHeaderGroups();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header stats */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card shrink-0">
        <span className="text-[10px] text-muted-foreground">
          Showing{" "}
          <span className="text-foreground font-semibold tabular-nums">
            {stocks.length.toLocaleString()}
          </span>{" "}
          of{" "}
          <span className="text-foreground font-semibold tabular-nums">
            {total.toLocaleString()}
          </span>{" "}
          stocks
        </span>
        {isLoading && (
          <span className="text-[10px] text-primary animate-pulse">Loading...</span>
        )}
      </div>

      {/* Table scroll container */}
      <div ref={parentRef} className="flex-1 overflow-auto">
        <table className="w-full border-separate border-spacing-0" style={{ minWidth: "1140px" }}>
          <thead className="sticky top-0 z-10 bg-sidebar">
            {headerGroups.map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const isSortable = header.id !== "watch";
                  return (
                    <th
                      key={header.id}
                      data-testid={`th-${header.id}`}
                      onClick={isSortable ? () => toggleSort(header.id) : undefined}
                      style={{ width: header.column.getSize() }}
                      className={`text-left text-[10px] font-semibold tracking-wider text-muted-foreground uppercase px-2 py-1.5 border-b border-border select-none whitespace-nowrap ${
                        isSortable ? "cursor-pointer hover:text-foreground" : ""
                      }`}
                    >
                      <div className="flex items-center">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {isSortable && <SortIcon column={header.id} />}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {paddingTop > 0 && (
              <tr>
                <td colSpan={columns.length} style={{ height: paddingTop }} />
              </tr>
            )}
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index];
              const ticker = row.original.ticker;
              const flash = flashState[ticker];

              return (
                <tr
                  key={row.id}
                  data-testid={`row-stock-${ticker}`}
                  className={`border-b border-border/40 hover:bg-muted/30 transition-colors ${
                    flash === "green" ? "flash-green" : flash === "red" ? "flash-red" : ""
                  }`}
                  style={{ height: ROW_HEIGHT }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-2 overflow-hidden"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
            {paddingBottom > 0 && (
              <tr>
                <td colSpan={columns.length} style={{ height: paddingBottom }} />
              </tr>
            )}
          </tbody>
        </table>

        {stocks.length === 0 && !isLoading && (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            No stocks match your filters
          </div>
        )}
      </div>
    </div>
  );
}
