import { useLocation } from "wouter";
import { useScreenerStore, WatchlistEntry } from "@/store/useScreenerStore";
import {
  formatPrice,
  formatPercent,
  formatLargeNumber,
  changeColor,
} from "@/lib/format";
import {
  X,
  Star,
  TrendingUp,
  TrendingDown,
  Trash2,
  ExternalLink,
  Clock,
} from "lucide-react";

function PnlBadge({ pct }: { pct: number }) {
  const isPos = pct >= 0;
  return (
    <span
      className={`text-[10px] font-bold px-1.5 py-0.5 rounded tabular-nums ${
        isPos
          ? "bg-emerald-400/15 text-emerald-400"
          : "bg-red-400/15 text-red-400"
      }`}
    >
      {isPos ? "+" : ""}
      {pct.toFixed(2)}%
    </span>
  );
}

function WatchlistRow({ entry }: { entry: WatchlistEntry }) {
  const [, navigate] = useLocation();
  const livePrice = useScreenerStore((s) => s.livePrices[entry.ticker]);
  const removeFromWatchlist = useScreenerStore((s) => s.removeFromWatchlist);

  const currentPrice = livePrice?.price ?? entry.addedPrice;
  const currentChange = livePrice?.changePercent ?? 0;
  const pnlPct = ((currentPrice - entry.addedPrice) / entry.addedPrice) * 100;
  const pnlAbs = currentPrice - entry.addedPrice;
  const addedDate = new Date(entry.addedAt);
  const daysHeld = Math.floor((Date.now() - entry.addedAt) / 86_400_000);

  return (
    <div className="group border border-border/60 rounded bg-card hover:border-border transition-colors">
      {/* Header row */}
      <div className="flex items-center justify-between px-2.5 pt-2 pb-1">
        <button
          onClick={() => navigate(`/stocks/${entry.ticker}`)}
          className="flex items-baseline gap-1.5 hover:opacity-80 transition-opacity"
        >
          <span className="font-mono font-bold text-primary text-sm tracking-wider">
            {entry.ticker}
          </span>
          <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
            {entry.name}
          </span>
        </button>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate(`/stocks/${entry.ticker}`)}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
          <button
            onClick={() => removeFromWatchlist(entry.ticker)}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
            title="Remove from watchlist"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Price row */}
      <div className="flex items-center justify-between px-2.5 pb-1.5">
        <div>
          <div className="text-sm font-bold text-foreground tabular-nums font-mono">
            ${formatPrice(currentPrice)}
          </div>
          <div className={`text-[10px] tabular-nums ${changeColor(currentChange)}`}>
            {formatPercent(currentChange)} today
          </div>
        </div>
        <div className="text-right">
          <PnlBadge pct={pnlPct} />
          <div
            className={`text-[10px] tabular-nums mt-0.5 ${
              pnlAbs >= 0 ? "text-emerald-400/70" : "text-red-400/70"
            }`}
          >
            {pnlAbs >= 0 ? "+" : ""}${formatPrice(Math.abs(pnlAbs))} per share
          </div>
        </div>
      </div>

      {/* Footer meta */}
      <div className="flex items-center gap-1.5 px-2.5 pb-1.5 border-t border-border/40 pt-1">
        <Clock className="w-2.5 h-2.5 text-muted-foreground/50" />
        <span className="text-[9px] text-muted-foreground/60">
          Added {daysHeld === 0 ? "today" : `${daysHeld}d ago`} @{" "}
          <span className="tabular-nums">${formatPrice(entry.addedPrice)}</span>
        </span>
        <span className="ml-auto text-[9px] text-muted-foreground/50">
          {entry.exchange}
        </span>
      </div>
    </div>
  );
}

interface WatchlistPanelProps {
  onClose: () => void;
}

export function WatchlistPanel({ onClose }: WatchlistPanelProps) {
  const watchlist = useScreenerStore((s) => s.watchlist);
  const clearWatchlist = useScreenerStore((s) => s.clearWatchlist);
  const livePrices = useScreenerStore((s) => s.livePrices);

  const entries = Object.values(watchlist);

  // Aggregate P&L across all entries
  const totalPnl = entries.reduce((acc, e) => {
    const currentPrice = livePrices[e.ticker]?.price ?? e.addedPrice;
    return acc + ((currentPrice - e.addedPrice) / e.addedPrice) * 100;
  }, 0);
  const avgPnl = entries.length > 0 ? totalPnl / entries.length : 0;

  const gainers = entries.filter((e) => {
    const p = livePrices[e.ticker]?.price ?? e.addedPrice;
    return p > e.addedPrice;
  }).length;
  const losers = entries.length - gainers;

  return (
    <div className="w-72 shrink-0 bg-sidebar border-l border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span className="text-xs font-semibold text-foreground">Watchlist</span>
          {entries.length > 0 && (
            <span className="bg-amber-400/20 text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {entries.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {entries.length > 0 && (
            <button
              onClick={clearWatchlist}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Clear watchlist"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Summary strip — only show when there are entries */}
      {entries.length > 0 && (
        <div className="flex items-center gap-0 border-b border-border shrink-0 bg-card">
          <div className="flex-1 flex flex-col items-center py-2 border-r border-border">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">
              Avg P&L
            </div>
            <div className={`text-xs font-bold tabular-nums ${changeColor(avgPnl)}`}>
              {avgPnl >= 0 ? "+" : ""}
              {avgPnl.toFixed(2)}%
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center py-2 border-r border-border">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">
              Gainers
            </div>
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-2.5 h-2.5" /> {gainers}
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center py-2">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">
              Losers
            </div>
            <div className="text-xs font-bold text-red-400 flex items-center gap-0.5">
              <TrendingDown className="w-2.5 h-2.5" /> {losers}
            </div>
          </div>
        </div>
      )}

      {/* Entries list */}
      <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <Star className="w-8 h-8 text-muted-foreground/20" />
            <div>
              <p className="text-sm text-muted-foreground font-medium">
                No stocks watched
              </p>
              <p className="text-[11px] text-muted-foreground/60 mt-1">
                Click the ★ next to any ticker in the table to add it here
              </p>
            </div>
          </div>
        ) : (
          entries
            .sort((a, b) => b.addedAt - a.addedAt)
            .map((entry) => <WatchlistRow key={entry.ticker} entry={entry} />)
        )}
      </div>
    </div>
  );
}
