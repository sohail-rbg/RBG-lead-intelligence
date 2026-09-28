// Encrypt SMTP passwords at rest with a locally generated key (AES-256-GCM).
// The key lives in server/data/.key and is never committed.
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const KEY_FILE = path.join(DATA_DIR, ".key");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function getKey() {
  if (fs.existsSync(KEY_FILE)) {
    return Buffer.from(fs.readFileSync(KEY_FILE, "utf8").trim(), "hex");
  }
  const key = crypto.randomBytes(32);
  fs.writeFileSync(KEY_FILE, key.toString("hex"), { mode: 0o600 });
  return key;
}

// Returns a compact string: iv:tag:ciphertext (all base64).
function encrypt(plain) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(":");
}

function decrypt(payload) {
  const key = getKey();
  const [ivB64, tagB64, dataB64] = String(payload).split(":");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return dec.toString("utf8");
}

module.exports = { encrypt, decrypt };
