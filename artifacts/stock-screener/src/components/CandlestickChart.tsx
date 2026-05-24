import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  LineStyle,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  SeriesType,
  Time,
} from "lightweight-charts";
import { useGetStockCandles, getGetStockCandlesQueryKey } from "@workspace/api-client-react";

const PERIODS = [
  { label: "1D", value: "1d" },
  { label: "5D", value: "5d" },
  { label: "1M", value: "1m" },
  { label: "3M", value: "3m" },
  { label: "6M", value: "6m" },
  { label: "1Y", value: "1y" },
  { label: "2Y", value: "2y" },
  { label: "5Y", value: "5y" },
] as const;

type Period = (typeof PERIODS)[number]["value"];

interface IndicatorConfig {
  id: string;
  label: string;
  color: string;
  enabled: boolean;
}

const DEFAULT_INDICATORS: IndicatorConfig[] = [
  { id: "sma20", label: "SMA 20", color: "#60a5fa", enabled: true },
  { id: "sma50", label: "SMA 50", color: "#f59e0b", enabled: true },
  { id: "ema20", label: "EMA 20", color: "#a78bfa", enabled: false },
  { id: "bb", label: "Bollinger", color: "#6ee7b7", enabled: false },
  { id: "rsi", label: "RSI", color: "#f87171", enabled: false },
  { id: "macd", label: "MACD", color: "#34d399", enabled: false },
];

const CHART_OPTIONS = {
  layout: {
    background: { type: ColorType.Solid, color: "#080e1a" },
    textColor: "#94a3b8",
    fontSize: 10,
    fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
  },
  grid: {
    vertLines: { color: "#1a2540", style: LineStyle.Dotted },
    horzLines: { color: "#1a2540", style: LineStyle.Dotted },
  },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: { color: "#3b82f6", width: 1 as const, style: LineStyle.Dashed },
    horzLine: { color: "#3b82f6", width: 1 as const, style: LineStyle.Dashed },
  },
  rightPriceScale: {
    borderColor: "#1e3a5f",
  },
  timeScale: {
    borderColor: "#1e3a5f",
    timeVisible: true,
    secondsVisible: false,
  },
  handleScroll: true,
  handleScale: true,
};

interface CandlestickChartProps {
  ticker: string;
}

export function CandlestickChart({ ticker }: CandlestickChartProps) {
  const [period, setPeriod] = useState<Period>("3m");
  const [indicators, setIndicators] =
    useState<IndicatorConfig[]>(DEFAULT_INDICATORS);

  const chartRef = useRef<HTMLDivElement>(null);
  const chartApi = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<SeriesType> | null>(null);

  const { data } = useGetStockCandles(ticker, period, {
    query: { queryKey: getGetStockCandlesQueryKey(ticker, period) },
  });

  const toggleIndicator = (id: string) => {
    setIndicators((prev) =>
      prev.map((ind) =>
        ind.id === id ? { ...ind, enabled: !ind.enabled } : ind
      )
    );
  };

  // Create chart on mount
  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, CHART_OPTIONS);

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#16a34a",
      wickDownColor: "#dc2626",
    });

    chartApi.current = chart;
    candleSeriesRef.current = candleSeries;

    const resizeObserver = new ResizeObserver(() => {
      if (chartRef.current) {
        chart.applyOptions({
          width: chartRef.current.clientWidth,
          height: chartRef.current.clientHeight,
        });
      }
    });
    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartApi.current = null;
      candleSeriesRef.current = null;
    };
  }, []);

  // Update data when fetched
  useEffect(() => {
    if (!data || !chartApi.current || !candleSeriesRef.current) return;

    const chart = chartApi.current;
    const candleSeries = candleSeriesRef.current;

    const candleData = data.candles.map((c) => ({
      time: c.timestamp.split("T")[0] as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleSeries.setData(candleData);

    const ind = data.indicators;
    const times = data.candles.map((c) => c.timestamp.split("T")[0] as Time);

    const enabledMap = new Map(indicators.map((i) => [i.id, i.enabled]));
    const seriesToRemove: ISeriesApi<SeriesType>[] = [];

    function addLineSeries(
      values: (number | null)[],
      color: string,
      lineWidth: 1 | 2 | 3 | 4 = 1,
      dashed = false
    ): ISeriesApi<SeriesType> {
      const s = chart.addSeries(LineSeries, {
        color,
        lineWidth,
        lineStyle: dashed ? LineStyle.Dashed : LineStyle.Solid,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      const lineData = values
        .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
        .filter(Boolean) as { time: Time; value: number }[];
      s.setData(lineData);
      seriesToRemove.push(s);
      return s;
    }

    if (enabledMap.get("sma20") && ind.sma20) {
      addLineSeries(ind.sma20, "#60a5fa", 1);
    }
    if (enabledMap.get("sma50") && ind.sma50) {
      addLineSeries(ind.sma50, "#f59e0b", 1);
    }
    if (enabledMap.get("ema20") && ind.ema20) {
      addLineSeries(ind.ema20, "#a78bfa", 1, true);
    }
    if (enabledMap.get("bb")) {
      if (ind.bbUpper) addLineSeries(ind.bbUpper, "#6ee7b780", 1, true);
      if (ind.bbMiddle) addLineSeries(ind.bbMiddle, "#6ee7b7", 1, true);
      if (ind.bbLower) addLineSeries(ind.bbLower, "#6ee7b780", 1, true);
    }

    chart.timeScale().fitContent();

    return () => {
      for (const s of seriesToRemove) {
        try { chart.removeSeries(s); } catch { /* ignore */ }
      }
    };
  }, [data, indicators]);

  const rsiIndicator = indicators.find((i) => i.id === "rsi");
  const macdIndicator = indicators.find((i) => i.id === "macd");

  return (
    <div className="flex flex-col h-full bg-[#080e1a] rounded border border-border overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-card shrink-0 flex-wrap gap-1">
        {/* Period selector */}
        <div className="flex items-center gap-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              data-testid={`button-period-${p.value}`}
              onClick={() => setPeriod(p.value)}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-colors ${
                period === p.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Indicator toggles */}
        <div className="flex items-center gap-1 flex-wrap">
          {indicators.map((ind) => (
            <button
              key={ind.id}
              data-testid={`button-indicator-${ind.id}`}
              onClick={() => toggleIndicator(ind.id)}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded border transition-colors ${
                ind.enabled
                  ? "border-transparent text-background"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
              style={ind.enabled ? { backgroundColor: ind.color } : {}}
            >
              {ind.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main chart */}
      <div ref={chartRef} className="flex-1 min-h-0" />

      {/* RSI sub-pane */}
      {rsiIndicator?.enabled && data?.indicators.rsi && (
        <RsiSubPane
          rsi={data.indicators.rsi}
          times={data.candles.map((c) => c.timestamp.split("T")[0])}
        />
      )}

      {/* MACD sub-pane */}
      {macdIndicator?.enabled && data?.indicators.macd && (
        <MacdSubPane
          macd={data.indicators.macd}
          signal={data.indicators.macdSignal ?? []}
          histogram={data.indicators.macdHistogram ?? []}
          times={data.candles.map((c) => c.timestamp.split("T")[0])}
        />
      )}
    </div>
  );
}

const SUB_PANE_OPTIONS = {
  layout: {
    background: { type: ColorType.Solid, color: "#080e1a" },
    textColor: "#94a3b8",
    fontSize: 9,
    fontFamily: "'JetBrains Mono', Menlo, monospace",
  },
  grid: {
    vertLines: { color: "#1a2540", style: LineStyle.Dotted },
    horzLines: { color: "#1a2540", style: LineStyle.Dotted },
  },
  rightPriceScale: { borderColor: "#1e3a5f" },
  timeScale: { borderColor: "#1e3a5f", visible: false },
  handleScroll: false,
  handleScale: false,
};

interface RsiSubPaneProps {
  rsi: (number | null)[];
  times: string[];
}

function RsiSubPane({ rsi, times }: RsiSubPaneProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const chart = createChart(ref.current, SUB_PANE_OPTIONS);
    const rsiSeries = chart.addSeries(LineSeries, {
      color: "#f87171",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    const rsiData = rsi
      .map((v, i) => v !== null ? { time: times[i] as Time, value: v } : null)
      .filter(Boolean) as { time: Time; value: number }[];

    rsiSeries.setData(rsiData);

    if (rsiData.length > 0) {
      const obLine = chart.addSeries(LineSeries, { color: "#ef444440", lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false });
      const osLine = chart.addSeries(LineSeries, { color: "#22c55e40", lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false });
      obLine.setData([{ time: rsiData[0].time, value: 70 }, { time: rsiData[rsiData.length - 1].time, value: 70 }]);
      osLine.setData([{ time: rsiData[0].time, value: 30 }, { time: rsiData[rsiData.length - 1].time, value: 30 }]);
    }

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (ref.current) chart.applyOptions({ width: ref.current.clientWidth });
    });
    ro.observe(ref.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, [rsi, times]);

  return (
    <div className="border-t border-border shrink-0">
      <div className="px-2 py-0.5 text-[9px] text-muted-foreground font-semibold tracking-wider">RSI(14)</div>
      <div ref={ref} style={{ height: 80 }} />
    </div>
  );
}

interface MacdSubPaneProps {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
  times: string[];
}

function MacdSubPane({ macd, signal, histogram, times }: MacdSubPaneProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const chart = createChart(ref.current, SUB_PANE_OPTIONS);

    const macdSeries = chart.addSeries(LineSeries, { color: "#34d399", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    const signalSeries = chart.addSeries(LineSeries, { color: "#f59e0b", lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false });
    const histSeries = chart.addSeries(HistogramSeries, { color: "#3b82f6", priceLineVisible: false, lastValueVisible: false });

    const toData = (arr: (number | null)[]) =>
      arr.map((v, i) => v !== null ? { time: times[i] as Time, value: v } : null)
        .filter(Boolean) as { time: Time; value: number }[];

    macdSeries.setData(toData(macd));
    signalSeries.setData(toData(signal));
    histSeries.setData(
      histogram.map((v, i) =>
        v !== null ? { time: times[i] as Time, value: v, color: v >= 0 ? "#22c55e50" : "#ef444450" } : null
      ).filter(Boolean) as { time: Time; value: number; color: string }[]
    );

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (ref.current) chart.applyOptions({ width: ref.current.clientWidth });
    });
    ro.observe(ref.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, [macd, signal, histogram, times]);

  return (
    <div className="border-t border-border shrink-0">
      <div className="px-2 py-0.5 text-[9px] text-muted-foreground font-semibold tracking-wider">MACD(12,26,9)</div>
      <div ref={ref} style={{ height: 80 }} />
    </div>
  );
}
