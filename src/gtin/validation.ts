export type GtinValidationResult = {
  normalized: string;
  isValid: boolean;
  errorCode?: "9491" | "9492";
  message?: string;
};

const VALID_LENGTHS = [8, 12, 13, 14];

const calculateCheckDigit = (value: string) => {
  const digits = value.split("").map((d) => Number(d));
  const sum = digits
    .reverse()
    .map((digit, index) => (index % 2 === 0 ? digit * 3 : digit))
    .reduce((acc, curr) => acc + curr, 0);
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
};

export const normalizeGtin = (gtin: string): GtinValidationResult => {
  const trimmed = gtin.replace(/\D/g, "");
  if (!VALID_LENGTHS.includes(trimmed.length)) {
    return {
      normalized: trimmed,
      isValid: false,
      errorCode: "9491",
      message: "GTIN com dígito verificador inválido",
    };
  }

  const padded = trimmed.padStart(14, "0");
  const body = padded.slice(0, -1);
  const digit = Number(padded.slice(-1));
  const expected = calculateCheckDigit(body);

  if (digit !== expected) {
    return {
      normalized: padded,
      isValid: false,
      errorCode: "9491",
      message: "GTIN com dígito verificador inválido",
    };
  }

  const prefix = padded.slice(0, 3);
  if (prefix !== "789" && prefix !== "790") {
    return {
      normalized: padded,
      isValid: false,
      errorCode: "9492",
      message: "Prefixo GS1 diferente de 789 ou 790",
    };
  }

  return { normalized: padded, isValid: true };
};
