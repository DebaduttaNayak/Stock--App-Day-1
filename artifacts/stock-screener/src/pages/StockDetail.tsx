import { useRoute, useLocation } from "wouter";
import { useGetStock, getGetStockQueryKey } from "@workspace/api-client-react";
import { useScreenerStore } from "@/store/useScreenerStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { CandlestickChart } from "@/components/CandlestickChart";
import {
  formatPrice,
  formatPercent,
  formatLargeNumber,
  formatVolume,
  formatPe,
  changeColor,
  rsiColor,
} from "@/lib/format";
import { ArrowLeft, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";

function MetricCard({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="bg-card border border-border rounded p-2.5">
      <div className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">
        {label}
      </div>
      <div className={`text-sm font-semibold tabular-nums ${className}`}>{value}</div>
    </div>
  );
}

export default function StockDetail() {
  const [, params] = useRoute("/stocks/:ticker");
  const [, navigate] = useLocation();
  const ticker = params?.ticker?.toUpperCase() ?? "";

  // Subscribe this ticker to WebSocket
  useWebSocket([ticker]);

  const { data: stock, isLoading } = useGetStock(ticker, {
    query: { queryKey: getGetStockQueryKey(ticker), enabled: !!ticker },
  });

  const livePrice = useScreenerStore((s) => s.livePrices[ticker]);
  const wsConnected = useScreenerStore((s) => s.wsConnected);

  const price = livePrice?.price ?? stock?.price;
  const change = livePrice?.change ?? stock?.change;
  const changePercent = livePrice?.changePercent ?? stock?.changePercent;
  const volume = livePrice?.volume ?? stock?.volume;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-muted-foreground text-sm animate-pulse">Loading {ticker}...</div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background gap-4">
        <div className="text-foreground text-lg font-semibold">Stock not found: {ticker}</div>
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm text-primary hover:text-blue-300"
        >
          <ArrowLeft className="w-4 h-4" /> Back to screener
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card shrink-0">
        <button
          data-testid="button-back"
          onClick={() => navigate("/")}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-baseline gap-2">
          <span
            data-testid="text-ticker"
            className="text-xl font-bold text-primary font-mono tracking-wider"
          >
            {ticker}
          </span>
          <span className="text-sm text-muted-foreground">{stock.name}</span>
          <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">
            {stock.exchange}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-4">
          {/* Live indicator */}
          {wsConnected && (
            <div className="flex items-center gap-1">
              <span className="live-pulse w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <span className="text-[10px] text-emerald-400 font-semibold">LIVE</span>
            </div>
          )}

          <div className="text-right">
            <div
              data-testid="text-price"
              className="text-2xl font-bold text-foreground font-mono tabular-nums"
            >
              ${formatPrice(price)}
            </div>
            <div className={`text-sm font-semibold tabular-nums ${changeColor(changePercent)}`}>
              {change !== undefined && change >= 0 ? "+" : ""}
              {formatPrice(change)} ({formatPercent(changePercent)})
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Chart — left side */}
        <div className="flex-1 min-w-0 p-3 overflow-hidden">
          <CandlestickChart ticker={ticker} />
        </div>

        {/* Metrics sidebar — right */}
        <div className="w-72 shrink-0 border-l border-border bg-sidebar overflow-y-auto p-3 flex flex-col gap-3">
          {/* Sector/Industry */}
          <div className="bg-card border border-border rounded p-2.5">
            <div className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">
              Sector / Industry
            </div>
            <div className="text-xs text-foreground font-semibold">{stock.sector}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{stock.industry}</div>
          </div>

          {/* Price metrics */}
          <div>
            <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-1.5">
              Price
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <MetricCard label="Price" value={`$${formatPrice(price)}`} className="text-foreground" />
              <MetricCard
                label="Change"
                value={formatPercent(changePercent)}
                className={changeColor(changePercent)}
              />
              <MetricCard
                label="52W High"
                value={`$${formatPrice(stock.high52w)}`}
                className="text-emerald-400"
              />
              <MetricCard
                label="52W Low"
                value={`$${formatPrice(stock.low52w)}`}
                className="text-red-400"
              />
            </div>
          </div>

          {/* Fundamentals */}
          <div>
            <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-1.5">
              Fundamentals
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <MetricCard label="Market Cap" value={formatLargeNumber(stock.marketCap)} />
              <MetricCard label="P/E Ratio" value={formatPe(stock.pe)} />
              <MetricCard label="EPS" value={stock.eps != null ? `$${formatPrice(stock.eps)}` : "—"} />
              <MetricCard
                label="Dividend"
                value={
                  stock.dividendYield != null ? `${stock.dividendYield.toFixed(2)}%` : "—"
                }
              />
              {stock.revenueGrowth != null && (
                <MetricCard
                  label="Rev Growth"
                  value={formatPercent(stock.revenueGrowth)}
                  className={changeColor(stock.revenueGrowth)}
                />
              )}
              {stock.grossMargin != null && (
                <MetricCard
                  label="Gross Margin"
                  value={`${stock.grossMargin.toFixed(1)}%`}
                />
              )}
            </div>
          </div>

          {/* Technical */}
          <div>
            <div className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase mb-1.5">
              Technical
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <MetricCard
                label="RSI(14)"
                value={stock.rsi.toFixed(1)}
                className={rsiColor(stock.rsi)}
              />
              <MetricCard
                label="Beta"
                value={stock.beta.toFixed(2)}
              />
              <MetricCard
                label="Volume"
                value={formatVolume(volume)}
              />
              <MetricCard
                label="Avg Volume"
                value={formatVolume(stock.avgVolume)}
              />
            </div>
          </div>

          {/* Company info */}
          <div className="bg-card border border-border rounded p-2.5 flex flex-col gap-1.5">
            <div className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">
              Company
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {stock.description}
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] mt-1">
              <div>
                <span className="text-muted-foreground">CEO: </span>
                <span className="text-foreground">{stock.ceo}</span>
              </div>
              {stock.founded && (
                <div>
                  <span className="text-muted-foreground">Founded: </span>
                  <span className="text-foreground">{stock.founded}</span>
                </div>
              )}
              {stock.employees && (
                <div>
                  <span className="text-muted-foreground">Employees: </span>
                  <span className="text-foreground">{stock.employees.toLocaleString()}</span>
                </div>
              )}
              {stock.debtToEquity != null && (
                <div>
                  <span className="text-muted-foreground">D/E Ratio: </span>
                  <span className="text-foreground">{stock.debtToEquity.toFixed(2)}</span>
                </div>
              )}
            </div>
            {stock.website && (
              <a
                href={stock.website}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="link-website"
                className="flex items-center gap-1 text-[10px] text-primary hover:text-blue-300 transition-colors mt-0.5"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                {stock.website.replace("https://", "")}
              </a>
            )}
          </div>

          {/* Trend visual */}
          <div className="bg-card border border-border rounded p-2.5">
            <div className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase mb-2">
              Price Range (52W)
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full ${
                  (changePercent ?? 0) >= 0 ? "bg-emerald-400" : "bg-red-400"
                }`}
                style={{
                  width: `${Math.max(
                    5,
                    Math.min(
                      95,
                      ((price ?? stock.price) - stock.low52w) /
                        (stock.high52w - stock.low52w) *
                        100
                    )
                  )}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground mt-1 tabular-nums">
              <span>${formatPrice(stock.low52w)}</span>
              <span>${formatPrice(stock.high52w)}</span>
            </div>
          </div>

          {/* Movers context */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {(changePercent ?? 0) >= 5 ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : (changePercent ?? 0) <= -5 ? (
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            ) : null}
            <span>
              {stock.exchange} &middot; {stock.sector}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
