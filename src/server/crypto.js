import crypto from "crypto";

// AES-256-GCM encryption for vault credentials.
// Key material comes from VAULT_ENCRYPTION_KEY (falls back to a dev key).

function getKey() {
  const material = process.env.VAULT_ENCRYPTION_KEY || "rbg-delivery-os-dev-vault-key";
  return crypto.createHash("sha256").update(material).digest();
}

export function encryptSecret(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const ct = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${ct.toString("hex")}`;
}

export function decryptSecret(token) {
  const [ivHex, tagHex, ctHex] = String(token).split(":");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(ctHex, "hex")), decipher.final()]).toString("utf8");
}
