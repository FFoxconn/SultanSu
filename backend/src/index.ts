import "dotenv/config";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { authRouter } from "./routes/auth";
import { productsRouter } from "./routes/products";
import { stockRouter } from "./routes/stock";
import { couriersRouter } from "./routes/couriers";
import { assignmentsRouter } from "./routes/assignments";
import { reportsRouter } from "./routes/reports";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/stock", stockRouter);
  app.use("/api/couriers", couriersRouter);
  app.use("/api/assignments", assignmentsRouter);
  app.use("/api/reports", reportsRouter);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Sunucu hatası" });
  });

  return app;
}

if (require.main === module) {
  const app = createApp();
  const port = Number(process.env.PORT) || 4000;
  app.listen(port, () => {
    console.log(`SultanSu backend http://localhost:${port}`);
  });
}
