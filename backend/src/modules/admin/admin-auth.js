import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const SESSION_SECONDS = 8 * 60 * 60;

export async function hashAdminPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

function safeEqual(first, second) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);
  return firstBuffer.length === secondBuffer.length && timingSafeEqual(firstBuffer, secondBuffer);
}

export async function verifyAdminPassword(password, encodedHash) {
  const [algorithm, salt, expectedHex, extra] = String(encodedHash || "").split("$");
  if (algorithm !== "scrypt" || !/^[a-f0-9]{32,128}$/i.test(salt || "")
    || !/^[a-f0-9]{128}$/i.test(expectedHex || "") || extra !== undefined) {
    throw Object.assign(new Error("ADMIN_PASSWORD_HASH must use the configured scrypt format."), {
      statusCode: 503,
      code: "ADMIN_NOT_CONFIGURED",
    });
  }
  const actual = await scrypt(password, Buffer.from(salt, "hex"), 64);
  return safeEqual(actual, Buffer.from(expectedHex, "hex"));
}

export function createAdminSession(username, secret, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({
    username,
    exp: Math.floor(now / 1000) + SESSION_SECONDS,
  })).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return { token: `${payload}.${signature}`, expiresIn: SESSION_SECONDS };
}

export function verifyAdminSession(token, secret, now = Date.now()) {
  const [payload, signature, extra] = String(token || "").split(".");
  if (!payload || !signature || extra !== undefined) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  if (!safeEqual(signature, expected)) return false;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return typeof claims.username === "string"
      && Number.isFinite(claims.exp)
      && claims.exp > Math.floor(now / 1000);
  } catch {
    return false;
  }
}
