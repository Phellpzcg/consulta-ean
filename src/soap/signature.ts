import { SignedXml } from "xml-crypto";
import { DOMParser } from "xmldom";

export const signXml = (xml: string, cert: string, key: string) => {
  const sig = new SignedXml({
    privateKey: key,
    publicCert: cert,
  });

  sig.addReference({
    xpath: "//*[local-name()='consGTIN']",
    transforms: ["http://www.w3.org/2000/09/xmldsig#enveloped-signature"],
    digestAlgorithm: "http://www.w3.org/2001/04/xmlenc#sha256",
  });

  sig.canonicalizationAlgorithm = "http://www.w3.org/2001/10/xml-exc-c14n#";
  sig.signatureAlgorithm = "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256";

  const doc = new DOMParser().parseFromString(xml, "text/xml");
  sig.computeSignature(doc.toString());

  return sig.getSignedXml();
};
