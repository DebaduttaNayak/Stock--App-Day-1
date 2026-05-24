import { useEffect, useRef, useCallback } from "react";
import { useScreenerStore } from "@/store/useScreenerStore";

interface PriceUpdateMessage {
  type: "price_update";
  updates: Record<
    string,
    { price: number; change: number; changePercent: number; volume: number }
  >;
}

interface ConnectedMessage {
  type: "connected";
  stockCount: number;
}

type WsMessage = PriceUpdateMessage | ConnectedMessage;

export function useWebSocket(tickers?: string[]) {
  const wsRef = useRef<WebSocket | null>(null);
  const updateLivePrices = useScreenerStore((s) => s.updateLivePrices);
  const setWsConnected = useScreenerStore((s) => s.setWsConnected);

  const subscribe = useCallback(
    (ws: WebSocket, t?: string[]) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "subscribe", tickers: t ?? [] }));
      }
    },
    []
  );

  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
    const wsUrl = apiBaseUrl
      ? new URL("/ws", apiBaseUrl).toString()
      : `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      subscribe(ws, tickers);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as WsMessage;
        if (msg.type === "price_update") {
          updateLivePrices(msg.updates);
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => setWsConnected(false);
    ws.onerror = () => setWsConnected(false);

    return () => {
      ws.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-subscribe when tickers change
  useEffect(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      subscribe(ws, tickers);
    }
  }, [tickers, subscribe]);
}
