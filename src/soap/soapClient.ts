import https from "https";
import axios from "axios";
import zlib from "zlib";
import { XMLParser } from "fast-xml-parser";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { buildSoapEnvelope } from "./soapEnvelope";
import { CertificateBundle, extractHolderId, loadCertificate } from "./certificate";
import { signXml } from "./signature";

export type ConsGtinResponse = {
  cStat: string;
  xMotivo: string;
  dhResp?: string;
  GTIN?: string;
  tpGTIN?: string;
  xProd?: string;
  NCM?: string;
  CEST?: string[];
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  removeNSPrefix: true,
});

const buildAgent = (bundle?: CertificateBundle | null) => {
  if (!bundle) {
    return new https.Agent({ rejectUnauthorized: true, minVersion: "TLSv1.2" });
  }

  return new https.Agent({
    rejectUnauthorized: true,
    minVersion: "TLSv1.2",
    pfx: bundle.pfx,
    cert: bundle.pfx ? undefined : bundle.cert,
    key: bundle.pfx ? undefined : bundle.key,
    passphrase: bundle.passphrase,
  });
};

const validateHolder = (bundle?: CertificateBundle | null) => {
  if (!bundle) {
    return;
  }
  const holderId = extractHolderId(bundle.cert);
  if (!holderId) {
    logger.warn("CPF/CNPJ do certificado não encontrado");
    return;
  }

  if (env.expectedHolderId && holderId !== env.expectedHolderId) {
    throw new Error("CPF/CNPJ do certificado não autorizado");
  }
};

export const sendConsGtin = async (payloadXml: string): Promise<ConsGtinResponse> => {
  const certificate = loadCertificate();
  validateHolder(certificate);

  const signedXml = env.signXml && certificate ? signXml(payloadXml, certificate.cert, certificate.key) : payloadXml;
  const envelope = buildSoapEnvelope(signedXml);
  const agent = buildAgent(certificate);

  const response = await axios.post(env.sefazUrl, envelope, {
    httpsAgent: agent,
    headers: {
      "Content-Type": "application/soap+xml; charset=utf-8",
      "Accept-Encoding": env.enableGzip ? "gzip" : "identity",
    },
    responseType: "arraybuffer",
    timeout: env.timeoutMs,
    decompress: false,
  });

  const encoding = response.headers["content-encoding"];
  const buffer = Buffer.from(response.data);
  const xml = encoding === "gzip" ? zlib.gunzipSync(buffer).toString("utf8") : buffer.toString("utf8");

  logger.debug("Resposta SOAP recebida", { length: xml.length });

  const parsed = parser.parse(xml) as any;
  const body = parsed?.Envelope?.Body ?? parsed?.Envelope?.Fault?.detail;
  const retConsGtin = body?.retConsGTIN ?? body?.ccgConsGTINResponse?.retConsGTIN ?? body?.retConsGTIN;

  if (!retConsGtin) {
    throw new Error("Resposta SOAP inválida ou inesperada");
  }

  const cestRaw = retConsGtin.CEST;
  const cest = Array.isArray(cestRaw) ? cestRaw : cestRaw ? [cestRaw] : [];

  return {
    cStat: retConsGtin.cStat,
    xMotivo: retConsGtin.xMotivo,
    dhResp: retConsGtin.dhResp,
    GTIN: retConsGtin.GTIN,
    tpGTIN: retConsGtin.tpGTIN,
    xProd: retConsGtin.xProd,
    NCM: retConsGtin.NCM,
    CEST: cest,
  };
};
