import fs from "fs";
import forge from "node-forge";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export type CertificateBundle = {
  cert: string;
  key: string;
  pfx?: Buffer;
  passphrase?: string;
};

const readFileIfExists = (path?: string) => {
  if (!path) {
    return undefined;
  }
  return fs.readFileSync(path);
};

const loadFromPfx = (pfxBuffer: Buffer, passphrase?: string): CertificateBundle => {
  const p12Der = forge.util.createBuffer(pfxBuffer.toString("binary"));
  const p12Asn1 = forge.asn1.fromDer(p12Der);
  const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, passphrase ?? "");

  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });

  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
  const certBag = certBags[forge.pki.oids.certBag]?.[0];

  if (!keyBag?.key || !certBag?.cert) {
    throw new Error("PFX inválido: chave ou certificado não encontrados");
  }

  const keyPem = forge.pki.privateKeyToPem(keyBag.key);
  const certPem = forge.pki.certificateToPem(certBag.cert);

  return {
    cert: certPem,
    key: keyPem,
    pfx: pfxBuffer,
    passphrase,
  };
};

export const loadCertificate = (): CertificateBundle | null => {
  if (env.certPfxBase64) {
    logger.info("Carregando certificado PFX via Base64");
    const buffer = Buffer.from(env.certPfxBase64, "base64");
    return loadFromPfx(buffer, env.certPassphrase);
  }

  if (env.certPfxPath) {
    logger.info("Carregando certificado PFX via arquivo");
    const buffer = readFileIfExists(env.certPfxPath);
    if (!buffer) {
      throw new Error("CERT_PFX_PATH informado, mas arquivo não encontrado");
    }
    return loadFromPfx(buffer, env.certPassphrase);
  }

  if (env.certPemPath && env.certKeyPath) {
    logger.info("Carregando certificado PEM via arquivos");
    const cert = fs.readFileSync(env.certPemPath, "utf8");
    const key = fs.readFileSync(env.certKeyPath, "utf8");
    return { cert, key, passphrase: env.certPassphrase };
  }

  if (env.requireCert) {
    throw new Error("Nenhum certificado configurado");
  }

  return null;
};

export const extractHolderId = (certPem: string): string | null => {
  try {
    const cert = forge.pki.certificateFromPem(certPem);
    const extensions = cert.extensions ?? [];
    const subjectAltName = extensions.find((ext) => ext.name === "subjectAltName");
    if (!subjectAltName || !(subjectAltName as any).altNames) {
      return null;
    }

    const altNames = (subjectAltName as any).altNames as Array<{
      type: number;
      oid?: string;
      value?: string;
      valueHex?: string;
    }>;

    const holder = altNames.find(
      (alt) => alt.oid === "2.16.76.1.3.3" || alt.oid === "2.16.76.1.3.1"
    );

    if (!holder?.value) {
      return null;
    }

    return holder.value.replace(/\D/g, "") || null;
  } catch (error) {
    logger.warn("Não foi possível extrair CPF/CNPJ do certificado", {
      error: (error as Error).message,
    });
    return null;
  }
};
