import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEYLEN).toString("hex");

  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, hashHex] = storedHash.split(":");

  if (!salt || !hashHex) {
    return false;
  }

  const calculated = scryptSync(password, salt, KEYLEN);
  const expected = Buffer.from(hashHex, "hex");

  return calculated.length === expected.length && timingSafeEqual(calculated, expected);
}
