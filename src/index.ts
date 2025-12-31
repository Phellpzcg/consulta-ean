import express from "express";
import { env } from "./config/env";
import { consultarGtin } from "./api/gtinController";
import { logger } from "./utils/logger";

const app = express();

app.use(express.json({ limit: "1mb" }));

app.post("/api/gtin/consultar", consultarGtin);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(env.port, () => {
  logger.info(`Servidor GTIN iniciado na porta ${env.port}`);
});
