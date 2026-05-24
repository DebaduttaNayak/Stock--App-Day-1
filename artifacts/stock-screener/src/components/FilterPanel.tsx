import { useEffect, useState, useCallback, useRef } from "react";
import { useScreenerStore, FilterState } from "@/store/useScreenerStore";
import { useGetMarketSectors } from "@workspace/api-client-react";
import { X, SlidersHorizontal, ChevronDown } from "lucide-react";

const EXCHANGES = ["NYSE", "NASDAQ", "AMEX", "CBOE"];

const QUICK_FILTERS: { label: string; filters: Partial<FilterState> }[] = [
  { label: "Gainers >5%", filters: { minChangePercent: "5" } },
  { label: "Losers <-5%", filters: { maxChangePercent: "-5" } },
  { label: "Oversold RSI", filters: { maxRsi: "30" } },
  { label: "Overbought RSI", filters: { minRsi: "70" } },
  { label: "Mega Cap", filters: { minMarketCap: "200000000000" } },
  { label: "Small Cap", filters: { minMarketCap: "300000000", maxMarketCap: "2000000000" } },
  { label: "Low P/E", filters: { maxPe: "15" } },
];

interface RangeRowProps {
  label: string;
  minKey: keyof FilterState;
  maxKey: keyof FilterState;
  placeholder?: string;
}

function RangeRow({ label, minKey, maxKey, placeholder = "" }: RangeRowProps) {
  const minVal = useScreenerStore((s) => s.filters[minKey]);
  const maxVal = useScreenerStore((s) => s.filters[maxKey]);
  const setFilter = useScreenerStore((s) => s.setFilter);

  return (
    <div>
      <label className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase block mb-1">
        {label}
      </label>
      <div className="flex gap-1">
        <input
          data-testid={`input-${minKey}`}
          type="number"
          placeholder={`Min${placeholder}`}
          value={minVal}
          onChange={(e) => setFilter(minKey, e.target.value)}
          className="w-full bg-muted border border-border rounded text-xs px-2 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 tabular-nums"
        />
        <input
          data-testid={`input-${maxKey}`}
          type="number"
          placeholder={`Max${placeholder}`}
          value={maxVal}
          onChange={(e) => setFilter(maxKey, e.target.value)}
          className="w-full bg-muted border border-border rounded text-xs px-2 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 tabular-nums"
        />
      </div>
    </div>
  );
}

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FilterPanel({ isOpen, onClose }: FilterPanelProps) {
  const filters = useScreenerStore((s) => s.filters);
  const setFilter = useScreenerStore((s) => s.setFilter);
  const setFilters = useScreenerStore((s) => s.setFilters);
  const clearFilters = useScreenerStore((s) => s.clearFilters);
  const activeFilterCount = useScreenerStore((s) => s.activeFilterCount);

  const { data: sectors } = useGetMarketSectors();
  const [searchInput, setSearchInput] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback(
    (val: string) => {
      setSearchInput(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setFilter("search", val);
      }, 300);
    },
    [setFilter]
  );

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  if (!isOpen) return null;

  return (
    <div className="w-64 shrink-0 bg-sidebar border-r border-border flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              data-testid="button-clear-filters"
              onClick={clearFilters}
              className="text-[10px] text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear all
            </button>
          )}
          <button
            data-testid="button-close-filters"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-3">
        {/* Search */}
        <div>
          <label className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase block mb-1">
            Search
          </label>
          <input
            data-testid="input-search"
            type="search"
            placeholder="Ticker or company name..."
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-muted border border-border rounded text-xs px-2 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>

        {/* Quick Filters */}
        <div>
          <label className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase block mb-1.5">
            Quick Filters
          </label>
          <div className="flex flex-wrap gap-1">
            {QUICK_FILTERS.map((qf) => (
              <button
                key={qf.label}
                data-testid={`button-qf-${qf.label}`}
                onClick={() => setFilters(qf.filters)}
                className="text-[10px] px-2 py-1 rounded border border-border bg-muted hover:border-primary/50 hover:text-primary text-muted-foreground transition-colors"
              >
                {qf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sector */}
        <div>
          <label className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase block mb-1">
            Sector
          </label>
          <div className="relative">
            <select
              data-testid="select-sector"
              value={filters.sector}
              onChange={(e) => setFilter("sector", e.target.value)}
              className="w-full appearance-none bg-muted border border-border rounded text-xs px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 pr-7"
            >
              <option value="">All Sectors</option>
              {Array.isArray(sectors)
                ? sectors.map((s) => (
                    <option key={s.sector} value={s.sector}>
                      {s.sector}
                    </option>
                  ))
                : null}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Exchange */}
        <div>
          <label className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase block mb-1">
            Exchange
          </label>
          <div className="relative">
            <select
              data-testid="select-exchange"
              value={filters.exchange}
              onChange={(e) => setFilter("exchange", e.target.value)}
              className="w-full appearance-none bg-muted border border-border rounded text-xs px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 pr-7"
            >
              <option value="">All Exchanges</option>
              {EXCHANGES.map((ex) => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Price */}
        <RangeRow label="Price ($)" minKey="minPrice" maxKey="maxPrice" />

        {/* Market Cap */}
        <RangeRow label="Market Cap ($)" minKey="minMarketCap" maxKey="maxMarketCap" />

        {/* P/E */}
        <RangeRow label="P/E Ratio" minKey="minPe" maxKey="maxPe" />

        {/* Volume */}
        <RangeRow label="Volume" minKey="minVolume" maxKey="maxVolume" />

        {/* Change % */}
        <RangeRow label="Change (%)" minKey="minChangePercent" maxKey="maxChangePercent" placeholder="%" />

        {/* RSI */}
        <RangeRow label="RSI" minKey="minRsi" maxKey="maxRsi" />
      </div>
    </div>
  );
}
