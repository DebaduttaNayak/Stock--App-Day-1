import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import app from "./app";
import { logger } from "./lib/logger";
import { generateStockUniverse } from "./lib/stockGenerator";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = http.createServer(app);

// WebSocket server for live price streaming
const wss = new WebSocketServer({ server, path: "/ws" });

// Pre-warm the stock universe
const stocks = generateStockUniverse();

interface SubscribeMessage {
  type: "subscribe";
  tickers?: string[];
}

wss.on("connection", (ws) => {
  logger.info("WebSocket client connected");

  let subscribedTickers: Set<string> = new Set();
  let intervalId: ReturnType<typeof setInterval> | null = null;

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as SubscribeMessage;
      if (msg.type === "subscribe") {
        subscribedTickers = new Set(msg.tickers ?? []);

        if (intervalId) clearInterval(intervalId);

        // Stream price updates every 1.5 seconds
        intervalId = setInterval(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            if (intervalId) clearInterval(intervalId);
            return;
          }

          const updates: Record<string, { price: number; change: number; changePercent: number; volume: number }> = {};
          const targets = subscribedTickers.size > 0
            ? stocks.filter((s) => subscribedTickers.has(s.ticker))
            : stocks.slice(0, 50);

          for (const stock of targets) {
            const drift = (Math.random() - 0.499) * 0.003;
            const newPrice = Math.round(stock.price * (1 + drift) * 100) / 100;
            const changePercent = Math.round(((newPrice - stock.price) / stock.price) * 10000) / 100;
            const volumeSpike = Math.round(stock.volume * (0.95 + Math.random() * 0.1));

            updates[stock.ticker] = {
              price: newPrice,
              change: Math.round((newPrice - stock.price) * 100) / 100,
              changePercent,
              volume: volumeSpike,
            };

            // Mutate in-place so next tick continues from new price
            stock.price = newPrice;
          }

          ws.send(JSON.stringify({ type: "price_update", updates }));
        }, 1500);
      }
    } catch (err) {
      logger.warn({ err }, "Failed to parse WebSocket message");
    }
  });

  ws.on("close", () => {
    if (intervalId) clearInterval(intervalId);
    logger.info("WebSocket client disconnected");
  });

  ws.on("error", (err) => {
    logger.warn({ err }, "WebSocket error");
    if (intervalId) clearInterval(intervalId);
  });

  // Send initial snapshot immediately
  ws.send(JSON.stringify({
    type: "connected",
    stockCount: stocks.length,
  }));
});

server.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port, wsPath: "/ws" }, "Server listening");
});
