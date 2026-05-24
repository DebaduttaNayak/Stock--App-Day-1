import path from "path";
import { Router, type IRouter } from "express";
import healthRouter from "./health";
import stocksRouter from "./stocks";
import marketRouter from "./market";

const router: IRouter = Router();

router.use(healthRouter);
router.use(stocksRouter);
router.use(marketRouter);

router.get("/download/source", (_req, res) => {
  const file = path.resolve("/home/runner/workspace/stock-screener.tar.gz");
  res.download(file, "stock-screener.tar.gz");
});

export default router;
