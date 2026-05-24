import { useGetMarketSummary, useGetTopMovers } from "@workspace/api-client-react";
import { useScreenerStore } from "@/store/useScreenerStore";
import { formatPercent, formatLargeNumber, formatVolume, changeColor } from "@/lib/format";
import { TrendingUp, TrendingDown, Activity, Wifi, WifiOff } from "lucide-react";

export function MarketSummaryBar() {
  const { data: summary } = useGetMarketSummary();
  const { data: movers } = useGetTopMovers();
  const wsConnected = useScreenerStore((s) => s.wsConnected);

  return (
    <div className="h-10 bg-card border-b border-border flex items-center gap-0 text-xs font-mono overflow-hidden shrink-0">
      {/* Live indicator */}
      <div className="flex items-center gap-1.5 px-3 border-r border-border shrink-0">
        {wsConnected ? (
          <>
            <span className="live-pulse w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span className="text-emerald-400 font-semibold tracking-wider">LIVE</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground">OFFLINE</span>
          </>
        )}
      </div>

      {/* Universe count */}
      <div className="px-3 border-r border-border shrink-0">
        <span className="text-muted-foreground">UNIVERSE </span>
        <span className="text-foreground font-semibold">
          {summary?.totalStocks?.toLocaleString() ?? "—"}
        </span>
      </div>

      {/* Breadth */}
      {summary && (
        <div className="flex items-center gap-3 px-3 border-r border-border shrink-0">
          <span className="text-emerald-400 font-semibold">
            ▲ {summary.advancers?.toLocaleString() ?? "—"}
          </span>
          <span className="text-red-400 font-semibold">
            ▼ {summary.decliners?.toLocaleString() ?? "—"}
          </span>
          <span className="text-muted-foreground">
            ● {summary.unchanged?.toLocaleString() ?? "—"}
          </span>
        </div>
      )}

      {/* Market Cap */}
      {summary && (
        <div className="px-3 border-r border-border shrink-0">
          <span className="text-muted-foreground">MCAP </span>
          <span className="text-foreground">{summary.marketCap != null ? formatLargeNumber(summary.marketCap) : "—"}</span>
        </div>
      )}

      {/* Volume */}
      {summary && (
        <div className="px-3 border-r border-border shrink-0">
          <span className="text-muted-foreground">VOL </span>
          <span className="text-foreground">{summary.totalVolume != null ? formatVolume(summary.totalVolume) : "—"}</span>
        </div>
      )}

      {/* Indices */}
      {summary && (
        <div className="flex items-center gap-4 px-3 border-r border-border shrink-0">
          {[
            { label: "SPY", val: summary.spyChange },
            { label: "QQQ", val: summary.qqqChange },
            { label: "DIA", val: summary.diaChange },
          ].map(({ label, val }) => (
            <div key={label} className="flex items-center gap-1">
              <span className="text-muted-foreground">{label}</span>
              <span className={changeColor(val)}>{val != null ? formatPercent(val) : "—"}</span>
            </div>
          ))}
        </div>
      )}

      {/* Top movers strip */}
      <div className="flex items-center gap-0 overflow-hidden flex-1 min-w-0">
        <div className="flex items-center gap-1 px-2 shrink-0">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
        </div>
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          {(movers?.gainers?.slice(0, 5) ?? []).map((s) => (
            <div key={s.ticker} className="flex items-center gap-1 shrink-0">
              <span className="text-foreground font-semibold">{s.ticker}</span>
              <span className="text-emerald-400">{formatPercent(s.changePercent)}</span>
            </div>
          ))}
          <span className="text-border shrink-0">|</span>
          <TrendingDown className="w-3 h-3 text-red-400 shrink-0" />
          {(movers?.losers?.slice(0, 5) ?? []).map((s) => (
            <div key={s.ticker} className="flex items-center gap-1 shrink-0">
              <span className="text-foreground font-semibold">{s.ticker}</span>
              <span className="text-red-400">{formatPercent(s.changePercent)}</span>
            </div>
          ))}
          <span className="text-border shrink-0">|</span>
          <Activity className="w-3 h-3 text-blue-400 shrink-0" />
          {(movers?.mostActive?.slice(0, 5) ?? []).map((s) => (
            <div key={s.ticker} className="flex items-center gap-1 shrink-0">
              <span className="text-foreground font-semibold">{s.ticker}</span>
              <span className="text-blue-400">{formatVolume(s.volume)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
