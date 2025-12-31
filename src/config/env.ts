import dotenv from "dotenv";

dotenv.config();

const required = (name: string, value?: string) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const env = {
  port: Number(process.env.PORT ?? 3000),
  sefazUrl:
    process.env.SEFAZ_GTIN_URL ??
    "https://dfe-servico.svrs.rs.gov.br/ws/ccgConsGTIN/ccgConsGTIN.asmx",
  timeoutMs: Number(process.env.SEFAZ_TIMEOUT_MS ?? 15000),
  enableGzip: process.env.SEFAZ_GZIP === "true",
  signXml: process.env.SEFAZ_SIGN_XML === "true",
  certPfxPath: process.env.CERT_PFX_PATH,
  certPfxBase64: process.env.CERT_PFX_BASE64,
  certPemPath: process.env.CERT_PEM_PATH,
  certKeyPath: process.env.CERT_KEY_PATH,
  certPassphrase: process.env.CERT_PASSPHRASE,
  expectedHolderId: process.env.CERT_HOLDER_ID,
  logLevel: process.env.LOG_LEVEL ?? "info",
  requireCert: process.env.REQUIRE_CERT !== "false",
  getRequiredValue: required,
};
