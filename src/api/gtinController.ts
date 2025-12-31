import { Request, Response } from "express";
import { normalizeGtin } from "../gtin/validation";
import { sendConsGtin } from "../soap/soapClient";
import { buildConsGtinXml } from "../soap/soapEnvelope";
import { logger } from "../utils/logger";

const infraErrorCodes = new Set([
  "5001",
  "5002",
  "5003",
  "5004",
  "5005",
  "5006",
  "5007",
  "5008",
  "5009",
  "5010",
  "5201",
  "5202",
  "5203",
  "5204",
  "5205",
  "5206",
]);

const rejectionCodes = new Set([
  "9491",
  "9492",
  "9493",
  "9494",
  "9495",
  "9496",
  "9497",
  "9498",
]);

const mapStatus = (code: string) => {
  if (code === "9490") {
    return "sucesso";
  }
  if (rejectionCodes.has(code)) {
    return "rejeicao";
  }
  if (infraErrorCodes.has(code)) {
    return "erro";
  }
  return "erro";
};

export const consultarGtin = async (req: Request, res: Response) => {
  const { gtin } = req.body as { gtin?: string };
  if (!gtin) {
    return res.status(400).json({
      status: "erro",
      codigo: "400",
      mensagem: "GTIN é obrigatório",
      produto: null,
    });
  }

  const validation = normalizeGtin(gtin);
  if (!validation.isValid) {
    return res.status(422).json({
      status: "rejeicao",
      codigo: validation.errorCode,
      mensagem: validation.message,
      produto: null,
    });
  }

  try {
    const xml = buildConsGtinXml(validation.normalized);
    const response = await sendConsGtin(xml);
    const status = mapStatus(response.cStat);

    return res.status(200).json({
      status,
      codigo: response.cStat,
      mensagem: response.xMotivo,
      produto:
        status === "sucesso"
          ? {
              gtin: response.GTIN ?? validation.normalized,
              descricao: response.xProd ?? "",
              ncm: response.NCM ?? "",
              tpGTIN: response.tpGTIN ?? "",
              cest: response.CEST ?? [],
            }
          : null,
    });
  } catch (error) {
    logger.error("Falha ao consultar GTIN", { error: (error as Error).message });
    return res.status(500).json({
      status: "erro",
      codigo: "500",
      mensagem: "Erro interno ao consultar GTIN",
      produto: null,
    });
  }
};
