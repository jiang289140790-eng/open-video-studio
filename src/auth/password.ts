import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [algorithm, salt, expectedHash] = storedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !expectedHash) {
    return false;
  }

  const actual = Buffer.from(scryptSync(password, salt, KEY_LENGTH).toString("hex"), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
