import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface FilterState {
  search: string;
  sector: string;
  exchange: string;
  minPrice: string;
  maxPrice: string;
  minMarketCap: string;
  maxMarketCap: string;
  minPe: string;
  maxPe: string;
  minVolume: string;
  maxVolume: string;
  minChangePercent: string;
  maxChangePercent: string;
  minRsi: string;
  maxRsi: string;
}

export interface SortState {
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface LivePrice {
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

export interface WatchlistEntry {
  ticker: string;
  name: string;
  exchange: string;
  sector: string;
  addedPrice: number;
  addedAt: number;
}

export interface ScreenerState {
  filters: FilterState;
  sort: SortState;
  livePrices: Record<string, LivePrice>;
  selectedTicker: string | null;
  wsConnected: boolean;
  activeFilterCount: number;
  watchlist: Record<string, WatchlistEntry>;
  watchlistOpen: boolean;

  setFilter: (key: keyof FilterState, value: string) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;
  setSort: (sortBy: string, sortOrder?: "asc" | "desc") => void;
  toggleSort: (column: string) => void;
  updateLivePrices: (updates: Record<string, LivePrice>) => void;
  setSelectedTicker: (ticker: string | null) => void;
  setWsConnected: (connected: boolean) => void;
  addToWatchlist: (entry: WatchlistEntry) => void;
  removeFromWatchlist: (ticker: string) => void;
  toggleWatchlist: (entry: WatchlistEntry) => void;
  setWatchlistOpen: (open: boolean) => void;
  clearWatchlist: () => void;
}

const defaultFilters: FilterState = {
  search: "",
  sector: "",
  exchange: "",
  minPrice: "",
  maxPrice: "",
  minMarketCap: "",
  maxMarketCap: "",
  minPe: "",
  maxPe: "",
  minVolume: "",
  maxVolume: "",
  minChangePercent: "",
  maxChangePercent: "",
  minRsi: "",
  maxRsi: "",
};

function countActiveFilters(f: FilterState): number {
  return Object.values(f).filter((v) => v !== "").length;
}

export const useScreenerStore = create<ScreenerState>()(
  persist(
    (set) => ({
      filters: defaultFilters,
      sort: { sortBy: "marketCap", sortOrder: "desc" },
      livePrices: {},
      selectedTicker: null,
      wsConnected: false,
      activeFilterCount: 0,
      watchlist: {},
      watchlistOpen: false,

      setFilter: (key: keyof FilterState, value: string) =>
        set((state) => {
          const filters = { ...state.filters, [key]: value };
          return { filters, activeFilterCount: countActiveFilters(filters) };
        }),

      setFilters: (partial: Partial<FilterState>) =>
        set((state) => {
          const filters = { ...state.filters, ...partial };
          return { filters, activeFilterCount: countActiveFilters(filters) };
        }),

      clearFilters: () =>
        set({ filters: defaultFilters, activeFilterCount: 0 }),

      setSort: (sortBy: string, sortOrder: "asc" | "desc" = "desc") =>
        set({ sort: { sortBy, sortOrder } }),

      toggleSort: (column: string) =>
        set((state) => {
          if (state.sort.sortBy === column) {
            return {
              sort: {
                sortBy: column,
                sortOrder: state.sort.sortOrder === "asc" ? "desc" : "asc",
              },
            };
          }
          return { sort: { sortBy: column, sortOrder: "desc" } };
        }),

      updateLivePrices: (updates: Record<string, LivePrice>) =>
        set((state) => ({
          livePrices: { ...state.livePrices, ...updates },
        })),

      setSelectedTicker: (ticker: string | null) =>
        set({ selectedTicker: ticker }),

      setWsConnected: (connected: boolean) =>
        set({ wsConnected: connected }),

      addToWatchlist: (entry: WatchlistEntry) =>
        set((state) => ({
          watchlist: { ...state.watchlist, [entry.ticker]: entry },
          watchlistOpen: true,
        })),

      removeFromWatchlist: (ticker: string) =>
        set((state) => {
          const next = { ...state.watchlist };
          delete next[ticker];
          return { watchlist: next };
        }),

      toggleWatchlist: (entry: WatchlistEntry) =>
        set((state) => {
          if (state.watchlist[entry.ticker]) {
            const next = { ...state.watchlist };
            delete next[entry.ticker];
            return { watchlist: next };
          }
          return {
            watchlist: { ...state.watchlist, [entry.ticker]: entry },
            watchlistOpen: true,
          };
        }),

      setWatchlistOpen: (open: boolean) => set({ watchlistOpen: open }),

      clearWatchlist: () => set({ watchlist: {} }),
    }),
    {
      name: "stock-screener-watchlist",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ watchlist: state.watchlist }),
    }
  )
);
