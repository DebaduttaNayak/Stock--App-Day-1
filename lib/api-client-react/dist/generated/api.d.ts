import type { QueryKey, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { CandleResponse, ErrorResponse, HealthStatus, ListStocksParams, MarketSummary, SectorPerformance, StockDetail, StockListResponse, TopMovers } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * Returns server health status
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListStocksUrl: (params?: ListStocksParams) => string;
/**
 * Returns paginated, filtered, and sorted stock records
 * @summary List and filter stocks
 */
export declare const listStocks: (params?: ListStocksParams, options?: RequestInit) => Promise<StockListResponse>;
export declare const getListStocksQueryKey: (params?: ListStocksParams) => readonly ["/api/stocks", ...ListStocksParams[]];
export declare const getListStocksQueryOptions: <TData = Awaited<ReturnType<typeof listStocks>>, TError = ErrorType<unknown>>(params?: ListStocksParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listStocks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listStocks>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListStocksQueryResult = NonNullable<Awaited<ReturnType<typeof listStocks>>>;
export type ListStocksQueryError = ErrorType<unknown>;
/**
 * @summary List and filter stocks
 */
export declare function useListStocks<TData = Awaited<ReturnType<typeof listStocks>>, TError = ErrorType<unknown>>(params?: ListStocksParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listStocks>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetStockUrl: (ticker: string) => string;
/**
 * @summary Get single stock detail
 */
export declare const getStock: (ticker: string, options?: RequestInit) => Promise<StockDetail>;
export declare const getGetStockQueryKey: (ticker: string) => readonly [`/api/stocks/${string}`];
export declare const getGetStockQueryOptions: <TData = Awaited<ReturnType<typeof getStock>>, TError = ErrorType<ErrorResponse>>(ticker: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStock>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getStock>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetStockQueryResult = NonNullable<Awaited<ReturnType<typeof getStock>>>;
export type GetStockQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get single stock detail
 */
export declare function useGetStock<TData = Awaited<ReturnType<typeof getStock>>, TError = ErrorType<ErrorResponse>>(ticker: string, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStock>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetStockCandlesUrl: (ticker: string, period: "1d" | "5d" | "1m" | "3m" | "6m" | "1y" | "2y" | "5y") => string;
/**
 * @summary Get OHLCV candlestick data with technical indicators
 */
export declare const getStockCandles: (ticker: string, period: "1d" | "5d" | "1m" | "3m" | "6m" | "1y" | "2y" | "5y", options?: RequestInit) => Promise<CandleResponse>;
export declare const getGetStockCandlesQueryKey: (ticker: string, period: "1d" | "5d" | "1m" | "3m" | "6m" | "1y" | "2y" | "5y") => readonly [`/api/stocks/${string}/candles/1d` | `/api/stocks/${string}/candles/5d` | `/api/stocks/${string}/candles/1m` | `/api/stocks/${string}/candles/3m` | `/api/stocks/${string}/candles/6m` | `/api/stocks/${string}/candles/1y` | `/api/stocks/${string}/candles/2y` | `/api/stocks/${string}/candles/5y`];
export declare const getGetStockCandlesQueryOptions: <TData = Awaited<ReturnType<typeof getStockCandles>>, TError = ErrorType<ErrorResponse>>(ticker: string, period: "1d" | "5d" | "1m" | "3m" | "6m" | "1y" | "2y" | "5y", options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStockCandles>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getStockCandles>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetStockCandlesQueryResult = NonNullable<Awaited<ReturnType<typeof getStockCandles>>>;
export type GetStockCandlesQueryError = ErrorType<ErrorResponse>;
/**
 * @summary Get OHLCV candlestick data with technical indicators
 */
export declare function useGetStockCandles<TData = Awaited<ReturnType<typeof getStockCandles>>, TError = ErrorType<ErrorResponse>>(ticker: string, period: '1d' | '5d' | '1m' | '3m' | '6m' | '1y' | '2y' | '5y', options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStockCandles>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetMarketSummaryUrl: () => string;
/**
 * @summary Get market-wide summary stats
 */
export declare const getMarketSummary: (options?: RequestInit) => Promise<MarketSummary>;
export declare const getGetMarketSummaryQueryKey: () => readonly ["/api/market/summary"];
export declare const getGetMarketSummaryQueryOptions: <TData = Awaited<ReturnType<typeof getMarketSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMarketSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMarketSummary>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMarketSummaryQueryResult = NonNullable<Awaited<ReturnType<typeof getMarketSummary>>>;
export type GetMarketSummaryQueryError = ErrorType<unknown>;
/**
 * @summary Get market-wide summary stats
 */
export declare function useGetMarketSummary<TData = Awaited<ReturnType<typeof getMarketSummary>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMarketSummary>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetMarketSectorsUrl: () => string;
/**
 * @summary Get sector performance breakdown
 */
export declare const getMarketSectors: (options?: RequestInit) => Promise<SectorPerformance[]>;
export declare const getGetMarketSectorsQueryKey: () => readonly ["/api/market/sectors"];
export declare const getGetMarketSectorsQueryOptions: <TData = Awaited<ReturnType<typeof getMarketSectors>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMarketSectors>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMarketSectors>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMarketSectorsQueryResult = NonNullable<Awaited<ReturnType<typeof getMarketSectors>>>;
export type GetMarketSectorsQueryError = ErrorType<unknown>;
/**
 * @summary Get sector performance breakdown
 */
export declare function useGetMarketSectors<TData = Awaited<ReturnType<typeof getMarketSectors>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMarketSectors>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetTopMoversUrl: () => string;
/**
 * @summary Get top gainers, losers, and most active
 */
export declare const getTopMovers: (options?: RequestInit) => Promise<TopMovers>;
export declare const getGetTopMoversQueryKey: () => readonly ["/api/market/top-movers"];
export declare const getGetTopMoversQueryOptions: <TData = Awaited<ReturnType<typeof getTopMovers>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTopMovers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTopMovers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTopMoversQueryResult = NonNullable<Awaited<ReturnType<typeof getTopMovers>>>;
export type GetTopMoversQueryError = ErrorType<unknown>;
/**
 * @summary Get top gainers, losers, and most active
 */
export declare function useGetTopMovers<TData = Awaited<ReturnType<typeof getTopMovers>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTopMovers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map