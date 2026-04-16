const crypto = require("node:crypto");

import { env } from "../config/env";

const TOKEN_SEPARATOR = ".";

function getAppKey(): Buffer {
  return crypto.createHash("sha256").update(env.appSecret).digest();
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, existingHash] = storedHash.split(":");

  if (!salt || !existingHash) {
    return false;
  }

  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(existingHash, "hex"), Buffer.from(derivedKey, "hex"));
}

export function encryptSecret(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getAppKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

export function decryptSecret(payload: string): string {
  const [ivHex, tagHex, encryptedHex] = payload.split(":");

  if (!ivHex || !tagHex || !encryptedHex) {
    throw new Error("Invalid encrypted secret payload.");
  }

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getAppKey(),
    Buffer.from(ivHex, "hex"),
  );

  decipher.setAuthTag(Buffer.from(tagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function createAuthToken(userId: string): string {
  const issuedAt = Date.now().toString();
  const payload = Buffer.from(`${userId}:${issuedAt}`).toString("base64url");
  const signature = crypto
    .createHmac("sha256", env.appSecret)
    .update(payload)
    .digest("base64url");
  return `${payload}${TOKEN_SEPARATOR}${signature}`;
}

export function verifyAuthToken(token: string): { userId: string } | null {
  const [payload, signature] = token.split(TOKEN_SEPARATOR);

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", env.appSecret)
    .update(payload)
    .digest("base64url");

  if (signature.length !== expectedSignature.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  const decoded = Buffer.from(payload, "base64url").toString("utf8");
  const [userId] = decoded.split(":");

  if (!userId) {
    return null;
  }

  return { userId };
}
